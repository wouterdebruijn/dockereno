import { DockerClient } from "./docker/DockerClient.ts";
import DockerRuntime from "./docker/entities/DockerServer.ts";
import { UnixSocketClient } from "./socket/UnixSocketConnection.ts";

const dockerClient = new DockerClient(
  new UnixSocketClient("/var/run/docker.sock"),
);

const dockerRuntime = new DockerRuntime(dockerClient);

const containers = await dockerRuntime.getContainers();

console.log(containers);
