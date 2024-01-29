import { RequestType } from "../../socket/DockerConnection.ts";
import DockerEntity from "../DockerEntity.ts";
import DockerContainer, {
  ContainerCreateOptions,
  ContainerFilter,
} from "./DockerContainer.ts";

export type DockerEvent = {
  status: "create" | "start" | "stop" | "die" | "destroy"
  id: string;
  from: string;
  type: "container" | string;
  action: string;
  time: number;
  timeNano: number;
  actor: {
    id: string;
    attributes: Record<string, string>;
  }
}

export default class DockerRuntime extends DockerEntity {
  // TODO: Create custom container interface for list containers. (Which include less information than an fully inspected container)
  public getContainers(
    filter: ContainerFilter = {},
  ): Promise<Partial<DockerContainer>[]> {
    return DockerContainer.list(this.dockerClient, filter);
  }

  public getContainer(id: string): Promise<DockerContainer> {
    return DockerContainer.inspect(this.dockerClient, id);
  }

  public async createContainer(options: ContainerCreateOptions) {
    const id = await DockerContainer.create(this.dockerClient, options);
    return DockerContainer.inspect(this.dockerClient, id);
  }

  private safeParseJson(json: string) {
    try {
      return JSON.parse(json);
    } catch {
      return false;
    }
  }

  public async *events(): AsyncIterable<DockerEvent> {
    const { stream } = await this.dockerClient.stream(
      "/events",
      RequestType.GET,
    );

    const decoder = new TextDecoder();
    let buffer = ""

    for await (const chunk of stream) {
      // Add new data to buffer
      buffer += decoder.decode(chunk).trim();

      // Split buffer into chunks that might be valid JSON
      const jsonChunks = buffer.split("\n");
      buffer = "";

      for (const chunk of jsonChunks) {
        const json = this.safeParseJson(chunk);

        // If the object is not valid JSON, we assume it will be completed in the next chunk
        if (!json) {
          buffer = chunk;
          continue;
        }

        yield DockerRuntime.dockerResponseMapper(json) as DockerEvent;
      }
    }
  }
}
