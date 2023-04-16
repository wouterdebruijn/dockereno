import DockerEntity from "../DockerEntity.ts";
import DockerContainer, { Container } from "./DockerContainer.ts";

type ContainerFilter = {
  [key in keyof Container]?: Container[key];
};

export default class DockerRuntime extends DockerEntity {
  public async getContainers(
    filter: ContainerFilter = {},
  ): Promise<DockerContainer[]> {
    const url = new URL("http://_/containers/json");

    url.searchParams.append("all", "true");
    url.searchParams.append("filters", JSON.stringify(filter));

    const response = await this.dockerClient.get(url);

    console.log(response.body);
    const mapped = this.dockerResponseMapper(
      JSON.parse(response.body),
    ) as Container[];
    return mapped.map((container: Container) =>
      new DockerContainer(this.dockerClient, container)
    );
  }
}
