export type Socket = string;

export interface DockerConnection {
  get(path: string): Promise<DockerResponse>;
  post(path: string, body?: string): Promise<DockerResponse>;
  delete(path: string): Promise<DockerResponse>;
}

export interface DockerResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export enum RequestType {
  GET = "GET",
  POST = "POST",
  DELETE = "DELETE",
}
