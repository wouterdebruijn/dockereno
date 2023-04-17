import { RequestType } from "../../socket/DockerConnection.ts";
import DockerEntity from "../DockerEntity.ts";
import DockerContainer, {
  ContainerCreateOptions,
  ContainerFilter,
} from "./DockerContainer.ts";

export type DockerEvent = unknown;

export default class DockerRuntime extends DockerEntity {
  public getContainers(
    filter: ContainerFilter = {},
  ): Promise<DockerContainer[]> {
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
      yield DockerRuntime.dockerResponseMapper(
        JSON.parse(decoder.decode(chunk).trim()),
      );
    }
  }
}
