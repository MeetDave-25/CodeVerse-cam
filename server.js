import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import Queue from 'bull';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// CORS configuration - allow all origins for LAN access
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json({ limit: '10mb' }));

const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

// Create a compilation queue with better configuration
const compilationQueue = new Queue('compilation', 'redis://127.0.0.1:6379', {
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: true,
        removeOnFail: false,
        timeout: 30000 // 30 second timeout per job
    }
});

// Dynamic concurrency based on CPU cores
const cpuCount = os.cpus().length;
const concurrency = Math.max(cpuCount - 1, 5); // Leave 1 core free, minimum 5

console.log(`🚀 Server starting with ${concurrency} concurrent workers (${cpuCount} CPU cores detected)`);

// Rate limiting - simple in-memory implementation
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 15; // 15 requests per minute per IP

const checkRateLimit = (ip) => {
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

    if (recentRequests.length >= RATE_LIMIT_MAX) {
        return false; // Rate limit exceeded
    }

    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
    return true;
};

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, requests] of rateLimitMap.entries()) {
        const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
        if (recentRequests.length === 0) {
            rateLimitMap.delete(ip);
        } else {
            rateLimitMap.set(ip, recentRequests);
        }
    }
}, 5 * 60 * 1000);

// Process jobs with dynamic concurrency
compilationQueue.process(concurrency, async (job) => {
    const { code, language, input, jobId } = job.data;
    const jobDir = path.join(TEMP_DIR, jobId);

    // Create a unique directory for this job
    if (!fs.existsSync(jobDir)) {
        fs.mkdirSync(jobDir, { recursive: true });
    }

    let command = '';
    let sourceFile = '';
    let inputFile = path.join(jobDir, 'input.txt');
    let outputFile = ''; // For compiled binaries

    // Write input to file
    fs.writeFileSync(inputFile, input || '');

    try {
        if (language === 'java') {
            const classMatch = code.match(/public\s+class\s+(\w+)/);
            const className = classMatch ? classMatch[1] : 'Main';
            sourceFile = path.join(jobDir, `${className}.java`);
            fs.writeFileSync(sourceFile, code);
            // Compile then run
            command = `javac "${sourceFile}" && java -cp "${jobDir}" ${className} < "${inputFile}"`;

        } else if (language === 'cpp' || language === 'c') {
            const isCpp = language === 'cpp';
            sourceFile = path.join(jobDir, isCpp ? 'main.cpp' : 'main.c');
            outputFile = path.join(jobDir, isCpp ? 'main.exe' : 'main.out');

            // C/C++ Fixes: Inject code to disable buffering
            const bufferFix = `
#include <stdio.h>
#ifdef __cplusplus
extern "C" {
#endif
void __attribute__((constructor)) flush_buf() {
    setbuf(stdout, NULL);
}
#ifdef __cplusplus
}
#endif
`;
            const fixedCode = bufferFix + "\n" + code;
            fs.writeFileSync(sourceFile, fixedCode);

            const compiler = isCpp ? 'g++' : 'gcc';
            command = `${compiler} "${sourceFile}" -o "${outputFile}" && "${outputFile}" < "${inputFile}"`;
        } else {
            throw new Error('Unsupported language for local execution');
        }

        return new Promise((resolve, reject) => {
            // Set timeout to 5 seconds to prevent infinite loops
            exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
                // Cleanup temp directory
                try {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                } catch (e) {
                    console.error(`⚠️ Cleanup error for job ${jobId}:`, e.message);
                }

                if (error) {
                    if (error.killed) {
                        resolve({ output: 'Error: Time Limit Exceeded (5 seconds)' });
                    } else {
                        resolve({ output: stderr || error.message });
                    }
                } else {
                    resolve({ output: stdout || stderr });
                }
            });
        });

    } catch (e) {
        // Cleanup on error
        try {
            fs.rmSync(jobDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error(`⚠️ Cleanup error for job ${jobId}:`, cleanupError.message);
        }
        return { output: `Server Error: ${e.message}` };
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const queueCounts = await compilationQueue.getJobCounts();
        const isHealthy = await compilationQueue.isReady();

        res.json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            queue: {
                waiting: queueCounts.waiting || 0,
                active: queueCounts.active || 0,
                completed: queueCounts.completed || 0,
                failed: queueCounts.failed || 0
            },
            server: {
                concurrency: concurrency,
                cpuCores: cpuCount,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage()
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Compilation endpoint with rate limiting
app.post('/compile', async (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({
            output: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} requests per minute. Please try again later.`
        });
    }

    const { code, language, input } = req.body;

    // Validation
    if (!code || !language) {
        return res.status(400).json({
            output: 'Error: Missing required fields (code, language)'
        });
    }

    if (code.length > 100000) { // 100KB limit
        return res.status(400).json({
            output: 'Error: Code size exceeds maximum limit (100KB)'
        });
    }

    const jobId = uuidv4();

    try {
        const job = await compilationQueue.add({
            code,
            language,
            input,
            jobId
        });

        const result = await job.finished();
        res.json(result);

    } catch (e) {
        console.error(`❌ Queue Error for job ${jobId}:`, e.message);
        res.status(500).json({ output: `Queue Error: ${e.message}` });
    }
});

// Queue statistics endpoint (for monitoring)
app.get('/stats', async (req, res) => {
    try {
        const counts = await compilationQueue.getJobCounts();
        const waiting = await compilationQueue.getWaiting();
        const active = await compilationQueue.getActive();

        res.json({
            counts,
            waitingJobs: waiting.length,
            activeJobs: active.length,
            concurrency,
            rateLimitEntries: rateLimitMap.size
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Logic Ladder Pro - Local Compiler Server',
        version: '2.0.0',
        status: 'running',
        endpoints: {
            compile: 'POST /compile',
            health: 'GET /health',
            stats: 'GET /stats'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        output: `Server Error: ${err.message}`
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await compilationQueue.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    await compilationQueue.close();
    process.exit(0);
});

// Start server - bind to 0.0.0.0 for LAN access
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Local compiler server running at:`);
    console.log(`   - Local: http://localhost:${port}`);
    console.log(`   - Network: http://${getLocalIP()}:${port}`);
    console.log(`   - Concurrency: ${concurrency} workers`);
    console.log(`   - Rate Limit: ${RATE_LIMIT_MAX} requests/minute per IP`);
});

// Helper function to get local IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

