import { RequestType } from "../../socket/DockerConnection.ts";
import DockerEntity from "../DockerEntity.ts";
import DockerContainer, {
  ContainerCreateOptions,
  ContainerFilter,
} from "./DockerContainer.ts";

export type DockerEvent = unknown;

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

  public async *events(): AsyncIterable<DockerEvent> {
    const { stream } = await this.dockerClient.stream(
      "/events",
      RequestType.GET,
    );

    const decoder = new TextDecoder();

    for await (const chunk of stream) {
      const safeChunks = decoder.decode(chunk).trim().split("\n");

      for (const chunk of safeChunks) {
        yield DockerRuntime.dockerResponseMapper(
          JSON.parse(chunk),
        );
      }
    }
  }
}
