/**
 * Token Bucket Rate Limiter for Piston API
 * Limits requests to 5 per second with intelligent queueing
 */

interface QueuedRequest {
    execute: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timestamp: number;
}

class RateLimiter {
    private tokens: number;
    private maxTokens: number;
    private refillRate: number; // tokens per second
    private queue: QueuedRequest[] = [];
    private lastRefill: number;
    private processing: boolean = false;
    private maxQueueSize: number;
    private requestTimeout: number; // milliseconds

    constructor(
        maxTokens: number = 5,
        refillRate: number = 5,
        maxQueueSize: number = 100,
        requestTimeout: number = 30000
    ) {
        this.tokens = maxTokens;
        this.maxTokens = maxTokens;
        this.refillRate = refillRate;
        this.maxQueueSize = maxQueueSize;
        this.requestTimeout = requestTimeout;
        this.lastRefill = Date.now();

        // Start token refill interval
        setInterval(() => this.refillTokens(), 1000);
    }

    /**
     * Refill tokens based on time elapsed
     */
    private refillTokens(): void {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000; // seconds
        const tokensToAdd = Math.floor(timePassed * this.refillRate);

        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
            this.lastRefill = now;
        }

        // Process queue if we have tokens
        if (this.tokens > 0 && this.queue.length > 0) {
            this.processQueue();
        }
    }

    /**
     * Process queued requests
     */
    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0 || this.tokens <= 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0 && this.tokens > 0) {
            const request = this.queue.shift();
            if (!request) break;

            // Check if request has timed out
            const now = Date.now();
            if (now - request.timestamp > this.requestTimeout) {
                request.reject(new Error('Request timeout: exceeded maximum wait time'));
                continue;
            }

            // Consume a token
            this.tokens--;

            // Execute the request
            try {
                const result = await request.execute();
                request.resolve(result);
            } catch (error) {
                request.reject(error);
            }
        }

        this.processing = false;
    }

    /**
     * Execute a function with rate limiting
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            // Check if we have tokens available
            if (this.tokens > 0) {
                this.tokens--;
                fn().then(resolve).catch(reject);
                return;
            }

            // Check queue size
            if (this.queue.length >= this.maxQueueSize) {
                reject(new Error('Rate limit queue full. Please try again later.'));
                return;
            }

            // Add to queue
            this.queue.push({
                execute: fn,
                resolve,
                reject,
                timestamp: Date.now()
            });

            // Try to process queue
            this.processQueue();
        });
    }

    /**
     * Get current status
     */
    getStatus(): { tokens: number; queueLength: number } {
        return {
            tokens: this.tokens,
            queueLength: this.queue.length
        };
    }
}

// Export singleton instance
export const pistonRateLimiter = new RateLimiter(
    5,      // 5 tokens max
    5,      // 5 tokens per second
    100,    // max 100 queued requests
    30000   // 30 second timeout
);
