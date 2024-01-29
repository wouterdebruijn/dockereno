# Dockereno - Docker API for Deno

A Deno module for interacting with the Docker API, through TCP or a Unix socket.

## Example usage

```ts
import { DockerClient, DockerRuntime, TcpConnection } from "./mod.ts";

const client = new DockerClient(new TcpConnection("192.168.22.10", 2375));

const runtime = new DockerRuntime(client);

console.log("Containers:");
console.log(await runtime.getContainers());

console.log("Events:");

for await (const event of runtime.events()) {
  console.log(event);
}
```
