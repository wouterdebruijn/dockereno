import DockerClient from "./docker/DockerClient.ts";
import DockerRuntime from "./docker/entities/DockerRuntime.ts";
import UnixSocketClient from "./socket/UnixSocketConnection.ts";

import * as Color from "https://deno.land/std@0.183.0/fmt/colors.ts";

const dockerClient = new DockerClient(
  new UnixSocketClient("/var/run/docker.sock"),
);

const dockerRuntime = new DockerRuntime(dockerClient);

// Delete all containers
console.log(`${Color.green("Deleting all containers")}`);
const containers = await dockerRuntime.getContainers();
for (const container of containers) {
  await container.remove({ force: true });
}

console.log(
  `${Color.green("Creating new container:")} ${Color.cyan("alpine")}`,
);

// Create container that sends "Hello World" to stdout every second
const alpineContainer = await dockerRuntime.createContainer({
  image: "alpine",
  networkDisabled: true,
  cmd: [
    "sh",
    "-c",
    "while true; do echo Hello World; sleep 1; done",
  ],
});

console.log(
  `${Color.green("Created container:")} ${Color.gray(alpineContainer.id)}`,
);

console.log(
  `${Color.green("Starting container:")} ${Color.gray(alpineContainer.id)}`,
);
// Start container
alpineContainer.start();

console.log(
  `${Color.green("Attaching to container:")} ${Color.gray(alpineContainer.id)}`,
);
for await (const line of alpineContainer.attach()) {
  console.log(
    `${Color.green("Container output:")} ${Color.gray(line.payload)}`,
  );
}
