import Docker from 'dockerode';

export default async function pullImage(imageName: string) {
    try {
        const docker = new Docker();
        return new Promise<void>((res, rej) => {
            docker.pull(imageName, (err: Error, stream: NodeJS.ReadableStream) => {
                if (err) return rej(err);
                docker.modem.followProgress(
                    stream,
                    (err) => {
                        if (err) {
                            console.error(`Failed to pull image ${imageName}:`, err);
                            rej(err);
                        } else {
                            console.log(`Successfully pulled image ${imageName}`);
                            res();
                        }
                    },
                    (event) => {
                        console.log(`[${imageName}] ${event.status}`);
                    }
                );
            });
        });
    } catch (error) {
        console.error(`Error pulling image ${imageName}:`, error);
        throw error;
    }
}