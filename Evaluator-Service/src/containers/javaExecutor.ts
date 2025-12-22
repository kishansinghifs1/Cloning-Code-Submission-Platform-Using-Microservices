import { CodeExecutorStrategy, ExecutionResponse } from '../types/types';
import { JAVA_IMAGE } from '../utils/constants';
import createContainer from './containerFactory';
import { fetchDecodedStream } from './dockerHelper';
import pullImage from './pullImage';

class JavaExecutor implements CodeExecutorStrategy {
    async execute(code: string, inputTestCase: string, outputCase: string): Promise<ExecutionResponse> {
        const rawLogBuffer: Buffer[] = [];
        try {
            console.log(`Attempting to pull image: ${JAVA_IMAGE}`);
            await pullImage(JAVA_IMAGE);
            console.log(`Image pull completed for: ${JAVA_IMAGE}`);
        } catch (error) {
            console.error(`Image pull failed: ${error}`);
            return { output: "Failed to pull image", status: "ERROR" };
        }

        console.log("Initialising a new java docker container");
        const runCommand = `echo '${code.replace(/'/g, "'\\''")}' > Main.java && javac Main.java && echo '${inputTestCase.replace(/'/g, "'\\''")}' | java Main`;
        const javaDockerContainer = await createContainer(JAVA_IMAGE, [
            '/bin/sh',
            '-c',
            runCommand
        ]);

        await javaDockerContainer.start();

        console.log("Started the docker container");

        const loggerStream = await javaDockerContainer.logs({
            stdout: true,
            stderr: true,
            timestamps: false,
            follow: true // whether the logs are streamed or returned as a string
        });

        // Attach events on the stream objects to start and stop reading
        loggerStream.on('data', (chunk) => {
            rawLogBuffer.push(chunk);
        });

        try {
            const codeResponse: string = await fetchDecodedStream(loggerStream, rawLogBuffer);

            if (codeResponse.trim() === outputCase.trim()) {
                return { output: codeResponse, status: "SUCCESS" };
            } else {
                return { output: codeResponse, status: "WA" };
            }

        } catch (error) {
            console.log("Error occurred", error);
            if (error === "TLE") {
                await javaDockerContainer.kill();
            }
            return { output: error as string, status: "ERROR" }
        } finally {

            await javaDockerContainer.remove();

        }
    }



}

export default JavaExecutor;