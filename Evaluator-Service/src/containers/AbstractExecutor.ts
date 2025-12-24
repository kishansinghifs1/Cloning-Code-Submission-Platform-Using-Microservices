import Docker from 'dockerode';

import { CodeExecutorStrategy, ExecutionResponse } from '../types/types';
import createContainer from './containerFactory';
import { fetchDecodedStream } from './dockerHelper';
import pullImage from './pullImage';

export abstract class AbstractExecutor implements CodeExecutorStrategy {
    protected abstract imageName: string;
    private imageAlreadyPulled = false;

    async execute(code: string, inputTestCase: string, outputTestCase: string): Promise<ExecutionResponse> {
        const rawLogBuffer: Buffer[] = [];
        let container: Docker.Container | null = null;

        try {
            // Pull image only once per executor instance
            if (!this.imageAlreadyPulled) {
                await pullImage(this.imageName);
                this.imageAlreadyPulled = true;
            }
        } catch (error) {
            console.error("Failed to pull image:", error);
            return { output: "Failed to pull image", status: "ERROR" };
        }

        const runCommand = this.fetchCommand(code, inputTestCase);

        try {
            container = await createContainer(this.imageName, [
                '/bin/sh',
                '-c',
                runCommand
            ]);

            await container.start();

            const loggerStream = await container.logs({
                stdout: true,
                stderr: true,
                timestamps: false,
                follow: true
            });

            loggerStream.on('data', (chunk) => {
                rawLogBuffer.push(chunk);
            });

            try {
                // Extended timeout for execution (10 seconds per test case)
                const codeResponse: string = await fetchDecodedStream(loggerStream, rawLogBuffer, 10000);
                if (codeResponse.trim() === outputTestCase.trim()) {
                    return { output: codeResponse, status: "SUCCESS" };
                } else {
                    return { output: codeResponse, status: "WA" };
                }
            } catch (error) {
                if (error === "TLE") {
                    try {
                        // Check if container is still running before killing
                        const containerState = await container.inspect();
                        if (containerState.State.Running) {
                            await container.kill();
                        }
                    } catch (killError) {
                        console.error("Error killing container on timeout:", killError);
                    }
                }
                return { output: error as string, status: "ERROR" };
            }
        } catch (error) {
            console.error("Error during code execution:", error);
            return { output: error instanceof Error ? error.message : String(error), status: "ERROR" };
        } finally {
            // Cleanup container
            if (container) {
                try {
                    const containerState = await container.inspect().catch(() => null);
                    if (containerState) {
                        // Stop if running
                        if (containerState.State.Running) {
                            await container.stop({ t: 2 }).catch(() => null);
                        }
                        // Remove container
                        await container.remove().catch((error) => {
                            console.warn("Warning: Could not remove container:", error.message);
                        });
                    }
                } catch (error) {
                    console.warn("Warning during container cleanup:", error);
                }
            }
        }
    }

    protected abstract fetchCommand(code: string, inputTestCase: string): string;
}
