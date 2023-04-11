import { DockerContainer } from "../DockerContainer.ts";
import { DockerRepository } from "./DockerRepository.ts";

export class ContainerRepository extends DockerRepository {
    public async create(image: string, command: string[]): Promise<DockerContainer> {
        const response = await this.client.post("/containers/create", JSON.stringify({
            Image: image,
            Cmd: command,
        }));
        const id = JSON.parse(response.body).Id;
        return new DockerContainer(this.getClient(), id);
    }

    public async list(): Promise<DockerContainer[]> {
        const response = await this.client.get("/containers/json?all=1");
        const containers = JSON.parse(response.body);
        return containers.map((container: any) => new DockerContainer(this.getClient(), container.Id));
    }
}