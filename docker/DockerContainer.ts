import { DockerClient } from "./DockerClient.ts";

export class DockerContainer {
  private client: DockerClient;
  private id: string;

  constructor(client: DockerClient, id: string) {
    this.client = client;
    this.id = id;
  }

  public async get(): Promise<Container> {
    const response = await this.client.get(`/containers/${this.id}/json`);

    if (response.status !== 200) {
      throw new Error(`Failed to get container ${this.id}`);
    }

    return JSON.parse(response.body);
  }

  public async start(): Promise<void> {
    const res = await this.client.post(`/containers/${this.id}/start`);
    if (res.status !== 204) {
      throw new Error(`Failed to start container ${this.id}`);
    }
  }

  public async stop(): Promise<void> {
    await this.client.post(`/containers/${this.id}/stop`);
  }

  public async remove(): Promise<void> {
    const res = await this.client.delete(`/containers/${this.id}`);
    if (res.status !== 204) {
      throw new Error(`Failed to remove container ${this.id}`);
    }
  }
}
