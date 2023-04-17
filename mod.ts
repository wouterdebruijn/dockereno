import DockerClient from "./docker/DockerClient.ts";
import DockerRuntime from "./docker/entities/DockerRuntime.ts";
import UnixSocketClient from "./socket/UnixSocketConnection.ts";

const dockerClient = new DockerClient(
  new UnixSocketClient("/var/run/docker.sock"),
);

const dockerRuntime = new DockerRuntime(dockerClient);

const events = await dockerRuntime.events();

async function printEvents() {
  for await (const event of events) {
    console.log(event);
  }
}

const container = await dockerRuntime.createContainer({
  image: "alpine",
  cmd: ["sh", "-c", "while true; do echo hello; sleep 1; done"],
});

Promise.all([printEvents(), container.start()]);
