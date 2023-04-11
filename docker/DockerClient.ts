import {
  DockerConnection,
  DockerResponse,
} from "../socket/DockerConnection.ts";

export class DockerClient {
  private connection: DockerConnection;

  constructor(connection: DockerConnection) {
    this.connection = connection;
  }

  public async get(
    endpoint: string,
  ): Promise<DockerResponse> {
    return await this.connection.get(endpoint);
  }

  public async post(
    endpoint: string,
    body?: string,
  ): Promise<DockerResponse> {
    return await this.connection.post(endpoint, body);
  }

  public async delete(
    endpoint: string,
  ): Promise<DockerResponse> {
    return await this.connection.delete(endpoint);
  }
}
