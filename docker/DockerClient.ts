import {
  DockerConnection,
  DockerResponse,
  DockerStreamResponse,
} from "../socket/DockerConnection.ts";

export class DockerError extends Error {
  public response: DockerResponse;

  constructor(response: DockerResponse) {
    super(response.body);
    this.response = response;
  }
}

export default class DockerClient {
  private connection: DockerConnection;

  constructor(connection: DockerConnection) {
    this.connection = connection;
  }

  public async get(
    endpoint: string,
  ): Promise<DockerResponse> {
    const response = await this.connection.get(endpoint);

    if (response.status < 200 || response.status > 299) {
      throw new DockerError(response);
    }

    return response;
  }

  public async post(
    endpoint: string,
    body?: string,
  ): Promise<DockerResponse> {
    const response = await this.connection.post(endpoint, body);

    if (response.status < 200 || response.status > 299) {
      throw new DockerError(response);
    }

    return response;
  }

  public async delete(
    endpoint: string,
  ): Promise<DockerResponse> {
    const response = await this.connection.delete(endpoint);

    if (response.status < 200 || response.status > 299) {
      throw new DockerError(response);
    }

    return response;
  }

  public stream(
    endpoint: string,
  ): Promise<DockerStreamResponse> {
    return this.connection.stream(endpoint);
  }
}
