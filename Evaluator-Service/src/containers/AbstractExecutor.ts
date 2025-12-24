import { CodeExecutorStrategy, ExecutionResponse } from '../types/types';
import createContainer from './containerFactory';
import { fetchDecodedStream } from './dockerHelper';
import pullImage from './pullImage';

export abstract class AbstractExecutor implements CodeExecutorStrategy {
    protected abstract imageName: string;

    async execute(code: string, inputTestCase: string, outputTestCase: string): Promise<ExecutionResponse> {
        const rawLogBuffer: Buffer[] = [];

        try {
            await pullImage(this.imageName);
        } catch (error) {
            return { output: "Failed to pull image", status: "ERROR" };
        }

        const runCommand = this.fetchCommand(code, inputTestCase);

        const container = await createContainer(this.imageName, [
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
            const codeResponse: string = await fetchDecodedStream(loggerStream, rawLogBuffer);
            if (codeResponse.trim() === outputTestCase.trim()) {
                return { output: codeResponse, status: "SUCCESS" };
            } else {
                return { output: codeResponse, status: "WA" };
            }
        } catch (error) {
            if (error === "TLE") {
                await container.kill();
            }
            return { output: error as string, status: "ERROR" };
        } finally {
            await container.remove();
        }
    }

    protected abstract fetchCommand(code: string, inputTestCase: string): string;
}
