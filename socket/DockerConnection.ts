export type Socket = string;

export interface DockerConnection {
  get(path: string): Promise<DockerResponse>;
  post(path: string, body?: string): Promise<DockerResponse>;
  delete(path: string): Promise<DockerResponse>;
  stream(
    path: string,
    body?: string,
  ): Promise<DockerStreamResponse>;
}

export interface DockerResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface DockerStreamResponse extends DockerResponse {
  stream: AsyncIterableIterator<Uint8Array>;
}

export enum RequestType {
  GET = "GET",
  POST = "POST",
  DELETE = "DELETE",
}
