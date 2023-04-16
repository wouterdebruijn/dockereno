import DockerClient from "./docker/DockerClient.ts";
import DockerRuntime from "./docker/entities/DockerRuntime.ts";
import UnixSocketClient from "./socket/UnixSocketConnection.ts";

const dockerClient = new DockerClient(
  new UnixSocketClient("/var/run/docker.sock"),
);

const dockerRuntime = new DockerRuntime(dockerClient);

// Create container that runs forever saying "Hello World" every 5 seconds
const alpineContainer = await dockerRuntime.createContainer({
  image: "alpine",
  cmd: [
    "sh",
    "-c",
    "while true; do echo 'Hello World'; sleep 5; done",
  ],
  networkDisabled: true,
});

// Start container
alpineContainer.start();

for await (const line of alpineContainer.attach()) {
  console.log(line);
}
