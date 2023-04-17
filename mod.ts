import DockerClient from "./docker/DockerClient.ts";
import DockerRuntime from "./docker/entities/DockerRuntime.ts";
import UnixSocketClient from "./socket/UnixSocketConnection.ts";

const dockerClient = new DockerClient(
  new UnixSocketClient("/var/run/docker.sock"),
);

const dockerRuntime = new DockerRuntime(dockerClient);

// Create alpine container sending hello world to stdout every 5 seconds
// const container = await dockerRuntime.createContainer({
//   image: "alpine",
//   cmd: ["sh", "-c", "while true; do echo hello world; sleep 5; done"],
//   tty: true,
// });

// // Start the container
// await container.start();

const containers = await dockerRuntime.getContainers();

for await (const message of containers[0].attach()) {
  console.log(message)
}