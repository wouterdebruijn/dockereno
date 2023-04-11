import { readAll } from "https://deno.land/std@0.182.0/streams/read_all.ts";
import {
  DockerConnection,
  DockerResponse,
  RequestType,
  Socket,
} from "./DockerConnection.ts";

/**
 * Adapter for Unix Socket and DockerClient using Deno.connect with custom packet encoder/decoder
 */
export class UnixSocketClient implements DockerConnection {
  private socket: Socket;
  private connection: Deno.UnixConn | null = null;

  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor(socket: Socket) {
    this.socket = socket;
  }

  private async connect(socket: Socket) {
    this.connection = await Deno.connect({ path: socket, transport: "unix" });
  }

  private async close() {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  private async request(
    type: RequestType,
    endpoint: string,
    headers: Record<string, string> = {},
    body = "",
  ): Promise<DockerResponse> {
    if (!this.connection || !this.connection.writable) {
      await this.connect(this.socket);
    }

    // Generate HTTP request
    const header = [
      `${type} ${endpoint} HTTP/1.0`,
      `Content-Length: ${body.length}`,
      ...Object.entries(headers).map(([key, value]) => `${key}: ${value}`),
      "",
      body,
    ].join("\n");

    // Send request to unix socket
    const request = this.encoder.encode(header);
    await this.connection.write(request);

    // Read response from unix socket
    const response = this.decoder.decode(await readAll(this.connection));

    // Split headers and body
    const [responseHeaders, responseBody] = response.split("\r\n\r\n");

    // Parse headers
    const [statusLine, ...headerLines] = responseHeaders.split("\r\n");

    const status = parseInt(statusLine.split(" ")[1]);
    const headersMap = headerLines.reduce((acc, line) => {
      const [key, value] = line.split(": ");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    await this.close();

    return {
      status: status,
      body: responseBody,
      headers: headersMap,
    };
  }

  /**
   * Generic GET request
   * @param path endpoint path
   * @returns Docker response containing status, headers and body
   */
  get(path: string): Promise<DockerResponse> {
    return this.request(RequestType.GET, path);
  }

  /**
   * Generic POST request
   * @param path endpoint path
   * @param body request body
   * @returns Docker response containing status, headers and body
   */
  post(path: string, body?: string): Promise<DockerResponse> {
    return this.request(RequestType.POST, path, {
      "Content-Type": "application/json",
    }, body);
  }

  /**
   * Generic DELETE request
   * @param path endpoint path
   * @returns Docker response containing status, headers and body
   */
  delete(path: string): Promise<DockerResponse> {
    return this.request(RequestType.DELETE, path);
  }
}
