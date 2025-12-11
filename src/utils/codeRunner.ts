import { pistonRateLimiter } from './rateLimiter';

/**
 * Map language names to Piston API language identifiers
 * See: https://emkc.org/api/v2/piston/runtimes
 */
const PISTON_LANGUAGE_MAP: { [key: string]: string } = {
    'javascript': 'javascript',
    'python': 'python',
    'cpp': 'c++',
    'c++': 'c++',
    'java': 'java',
    'c': 'c',
    'go': 'go',
    'rust': 'rust',
    'typescript': 'typescript',
    'ruby': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kotlin': 'kotlin',
    'csharp': 'csharp',
    'c#': 'csharp',
};

/**
 * Execute code using Piston API with rate limiting
 */
const runPistonApi = async (code: string, input: any, language: string) => {
    const PISTON_API_URL = import.meta.env.VITE_PISTON_API_URL || 'https://emkc.org/api/v2/piston';

    // Map language to Piston identifier
    const pistonLanguage = PISTON_LANGUAGE_MAP[language.toLowerCase()] || language.toLowerCase();

    // Prepare code for Python/JS if needed, or just send raw code
    // Piston executes files. For simple input/output matching, we assume standard stdin/stdout
    // The user's code should use input() to read inputs and print() for output

    // HOWEVER, for backward compatibility with our existing problem definitions which might rely on signature 'solution(input)'
    // we might need to wrap them OR tell the user to write script code.
    // The user specifically asked for "simple python syntax like print('welcome')" which implies SCRIPT mode.
    // So we invoke Piston with stdin = testCase input.

    // For Python, if the input is a complex object (like a list), JSON parsing might be needed inside the user code
    // OR we just pass it as string and they parse it.

    return pistonRateLimiter.execute(async () => {
        try {
            const response = await fetch(`${PISTON_API_URL}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: pistonLanguage,
                    version: '*', // Use latest version
                    files: [
                        {
                            content: code
                        }
                    ],
                    stdin: typeof input === 'object' ? JSON.stringify(input) : String(input),
                    args: [],
                    compile_timeout: 10000, // 10 seconds
                    run_timeout: 5000, // 5 seconds
                    compile_memory_limit: -1,
                    run_memory_limit: -1
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Piston API Error (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            // Check for compilation errors
            if (data.compile && data.compile.code !== 0) {
                throw new Error(`Compilation Error:\n${data.compile.stderr || data.compile.output}`);
            }

            // Check for runtime errors
            if (data.run && data.run.code !== 0 && data.run.stderr) {
                throw new Error(`Runtime Error:\n${data.run.stderr}`);
            }

            // Return stdout
            if (data.run && data.run.stdout) {
                return data.run.stdout.trim();
            }

            // If no output, return empty string
            return '';

        } catch (error: any) {
            // Enhance error messages
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Cannot connect to Piston API. Please check your internet connection.');
            }
            throw error;
        }
    });
};

/**
 * Main function to run test cases
 * Uses Piston API for ALL languages (Execution Strategy: Cloud Runner)
 */
export const runTests = async (code: string, testCases: any[], language: string = 'javascript') => {
    const results = [];
    const normalizedLanguage = language.toLowerCase();

    console.log(`🚀 DEBUG: executing code via Piston. Lang: "${language}"`);

    for (const testCase of testCases) {
        try {
            let output: any;
            let passed: boolean;

            // Strategy: Route EVERYTHING to Piston
            try {
                output = await runPistonApi(code, testCase.input, normalizedLanguage);
                // Clean output (remove trailing newlines common in stdout)
                const cleanOutput = output.replace(/\n$/, '');

                // Compare result
                passed = checkResult(cleanOutput, testCase.output);

                results.push({
                    passed,
                    input: testCase.input,
                    expected: testCase.output,
                    output: cleanOutput
                });
            } catch (err: any) {
                let errorMessage = err.message;

                if (errorMessage.includes('Rate limit queue full')) {
                    errorMessage = 'Too many submissions at once. Please wait a moment and try again.';
                } else if (errorMessage.includes('Request timeout')) {
                    errorMessage = 'Request took too long. Please try again.';
                }

                results.push({
                    passed: false,
                    input: testCase.input,
                    expected: testCase.output,
                    output: errorMessage
                });
            }

        } catch (error: any) {
            results.push({
                passed: false,
                input: testCase.input,
                expected: testCase.output,
                output: `Unexpected Error: ${error.message}`
            });
        }
    }

    return results;
};

/**
 * Helper to compare results
 */
const checkResult = (output: any, expected: any) => {
    // Try relaxed comparison for numbers/strings
    if (String(output).trim() === String(expected).trim()) {
        return true;
    }

    // Try JSON comparison if applicable
    try {
        if (typeof output === 'object' || (typeof output === 'string' && (output.startsWith('{') || output.startsWith('[')))) {
            return JSON.stringify(JSON.parse(output)) === JSON.stringify(expected) ||
                JSON.stringify(JSON.parse(output)) === JSON.stringify(JSON.parse(expected));
        }
    } catch (e) {
        // ignore json parse errors
    }

    return String(output) === String(expected);
};
