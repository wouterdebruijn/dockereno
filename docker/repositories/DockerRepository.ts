import { DockerClient } from "../DockerClient.ts";

export class DockerRepository {
    private client: DockerClient;

    constructor(client: DockerClient) {
        this.client = client;
    }

    protected getClient(): DockerClient {
        return this.client;
    }
}