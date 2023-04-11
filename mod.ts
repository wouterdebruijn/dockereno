import { ContainerRepository } from "./docker/repositories/ContainerRepository.ts";

import { DockerClient } from "./docker/DockerClient.ts";
import { UnixSocketClient } from "./socket/UnixSocketConnection.ts";

const connection = new UnixSocketClient("/var/run/docker.sock");

const client = new DockerClient(connection);

const containerRepository = new ContainerRepository(client);

const container = await containerRepository.create("library/hello-world", ["echo", "hello"]);

console.log(await container.get());

await container.remove();