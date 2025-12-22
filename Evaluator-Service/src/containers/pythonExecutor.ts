import { CodeExecutorStrategy, ExecutionResponse } from '../types/types';
import { PYTHON_IMAGE } from '../utils/constants';
import createContainer from './containerFactory';
import { fetchDecodedStream } from './dockerHelper';
import pullImage from './pullImage';


class PythonExecutor implements CodeExecutorStrategy {

    async execute(code: string, inputTestCase: string, outputTestCase: string): Promise<ExecutionResponse> {
        console.log(code, inputTestCase, outputTestCase);
        const rawLogBuffer: Buffer[] = [];

        await pullImage(PYTHON_IMAGE);


        console.log("Initialising a new python docker container");
        const runCommand = `echo '${code.replace(/'/g, "'\\''")}' > test.py && echo '${inputTestCase.replace(/'/g, "'\\''")}' | python3 test.py`;
        console.log(runCommand);
        const pythonDockerContainer = await createContainer(PYTHON_IMAGE, [
            '/bin/sh',
            '-c',
            runCommand
        ]);
        await pythonDockerContainer.start();

        console.log("Started the docker container");

        const loggerStream = await pythonDockerContainer.logs({
            stdout: true,
            stderr: true,
            timestamps: false,
            follow: true
        })
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
            return { output: error as string, status: "ERROR" }
        } finally {
            await pythonDockerContainer.remove();

        }
    }



}

export default PythonExecutor;