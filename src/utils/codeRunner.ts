import { pistonRateLimiter } from './rateLimiter';

declare global {
    interface Window {
        loadPyodide: any;
        pyodide: any;
    }
}

let pyodideReadyPromise: Promise<any> | null = null;

const loadPyodideScript = async () => {
    if (pyodideReadyPromise) return pyodideReadyPromise;

    pyodideReadyPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js';
        script.onload = async () => {
            try {
                const pyodide = await window.loadPyodide();
                window.pyodide = pyodide;
                resolve(pyodide);
            } catch (err) {
                reject(err);
            }
        };
        script.onerror = (err) => reject(err);
        document.body.appendChild(script);
    });

    return pyodideReadyPromise;
};

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
 * Helper for local JavaScript execution (browser)
 */
const runLocalJs = (code: string, input: any) => {
    try {
        const wrappedCode = `
            ${code}
            return solution(input);
        `;
        const userFn = new Function('input', wrappedCode);

        // Parse input if it's a stringified JSON
        let parsedInput = input;
        try {
            parsedInput = JSON.parse(input);
        } catch (e) {
            // use as string
        }

        return userFn(parsedInput);
    } catch (e: any) {
        throw new Error(e.message);
    }
};

/**
 * Helper for local Python execution (Pyodide - WASM)
 */
const runLocalPython = async (code: string, input: any) => {
    try {
        const pyodide = await loadPyodideScript();

        // Prepare input - escape safely for Python
        const escapedInput = input.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

        const pythonCode = `
import json
import sys
from js import console

${code}

# Driver code
try:
    input_val = json.loads('${escapedInput}')
except:
    input_val = '${escapedInput}'

# Check if solution function exists
if 'solution' not in globals() and 'solution' not in locals():
    raise Exception("Function 'solution' is not defined. Please define 'def solution(input):' in your code.")

try:
    result = solution(input_val)
    # Return result as string
    print(json.dumps(result))
except Exception as e:
    raise e
`;
        const output = await pyodide.runPythonAsync(pythonCode);
        return JSON.parse(output);
    } catch (e: any) {
        throw new Error(e.message);
    }
};

/**
 * Execute code using Piston API with rate limiting
 */
const runPistonApi = async (code: string, input: any, language: string) => {
    const PISTON_API_URL = import.meta.env.VITE_PISTON_API_URL || 'https://emkc.org/api/v2/piston';

    // Map language to Piston identifier
    const pistonLanguage = PISTON_LANGUAGE_MAP[language.toLowerCase()] || language.toLowerCase();

    // Execute with rate limiting
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
                    stdin: String(input),
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
 * Uses hybrid execution strategy:
 * 1. JavaScript → Browser (unlimited, fastest)
 * 2. Python → Pyodide (unlimited, fast)
 * 3. Other languages → Piston API (rate-limited to 5 req/sec)
 */
export const runTests = async (code: string, testCases: any[], language: string = 'javascript') => {
    const results = [];
    const normalizedLanguage = language.toLowerCase();

    console.log(`🚀 DEBUG: executing code. Lang: "${language}" (norm: "${normalizedLanguage}")`);
    console.log(`📝 Code snippet: ${code.substring(0, 50)}...`);

    for (const testCase of testCases) {
        try {
            let output: any;
            let passed: boolean;

            // STRATEGY 1: Local JavaScript (Browser)
            if (normalizedLanguage === 'javascript') {
                console.log('👉 Using Browser JS Engine');
                try {
                    output = runLocalJs(code, testCase.input);
                    passed = checkResult(output, testCase.output);
                    results.push({
                        passed,
                        input: testCase.input,
                        expected: testCase.output,
                        output
                    });
                    continue;
                } catch (err: any) {
                    results.push({
                        passed: false,
                        input: testCase.input,
                        expected: testCase.output,
                        output: `Error: ${err.message}`
                    });
                    continue;
                }
            }

            // STRATEGY 2: Local Python (Pyodide - WASM)
            if (normalizedLanguage === 'python') {
                try {
                    output = await runLocalPython(code, testCase.input);
                    passed = checkResult(output, testCase.output);
                    results.push({
                        passed,
                        input: testCase.input,
                        expected: testCase.output,
                        output
                    });
                    continue;
                } catch (err: any) {
                    results.push({
                        passed: false,
                        input: testCase.input,
                        expected: testCase.output,
                        output: `Error: ${err.message}`
                    });
                    continue;
                }
            }

            // STRATEGY 3: Piston API (C++, Java, and other languages)
            try {
                output = await runPistonApi(code, testCase.input, normalizedLanguage);
                const cleanOutput = output.replace(/\n$/, '');
                passed = checkResult(cleanOutput, testCase.output);

                results.push({
                    passed,
                    input: testCase.input,
                    expected: testCase.output,
                    output: cleanOutput
                });
            } catch (err: any) {
                let errorMessage = err.message;

                // Provide helpful error messages
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
    if (typeof output === 'object') {
        return JSON.stringify(output) === expected || JSON.stringify(output) === JSON.stringify(JSON.parse(expected));
    } else {
        return String(output) === String(expected);
    }
};
