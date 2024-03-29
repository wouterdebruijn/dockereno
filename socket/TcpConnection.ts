import { readAll } from "https://deno.land/std@0.182.0/streams/read_all.ts";
import { iterateReader } from "https://deno.land/std@0.183.0/streams/iterate_reader.ts";
import {
  DockerConnection,
  DockerResponse,
  DockerStreamResponse,
  RequestType,
} from "./DockerConnection.ts";

/**
 * Adapter for Unix Socket and DockerClient using Deno.connect with custom packet encoder/decoder
 */
export default class TcpConnection implements DockerConnection {
  private hostname: string;
  private port: number;

  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor(hostname: string, port: number) {
    this.hostname = hostname;
    this.port = port;
  }

  private async connect(hostname: string, port: number) {
    return await Deno.connect({ hostname, port, transport: "tcp" });
  }

  private async createConnection(
    type: RequestType,
    endpoint: string,
    headers: Record<string, string> = {},
    body = "",
  ): Promise<Deno.Conn> {
    const connection = await this.connect(this.hostname, this.port);

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

    await connection.write(request);

    return connection;
  }

  private async request(
    type: RequestType,
    endpoint: string,
    headers: Record<string, string> = {},
    body = "",
  ): Promise<DockerResponse> {
    const connection = await this.createConnection(
      type,
      endpoint,
      headers,
      body,
    );

    // Read response from unix socket
    const response = this.decoder.decode(await readAll(connection));

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

    connection.close();

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

  /**
   * Stream request
   * @param path endpoint path
   * @param body request body
   * @returns Docker response containing status, headers and body and iterable stream
   */
  async stream(
    path: string,
    method: RequestType,
    body?: string,
  ): Promise<DockerStreamResponse> {
    const connection = await this.createConnection(
      method,
      path,
      {
        "Upgrade": "tcp",
        "Connection": "Upgrade",
      },
      body,
    );

    const buffer = new Uint8Array(1024); // 1kb buffer, should be enough for all headers
    await connection.read(buffer);
    const response = this.decoder.decode(buffer);

    // Split headers and body
    const [responseHeaders, ..._] = response.split("\r\n\r\n");

    // Parse headers
    const [statusLine, ...headerLines] = responseHeaders.split("\r\n");

    const status = parseInt(statusLine.split(" ")[1]);
    const headersMap = headerLines.reduce((acc, line) => {
      const [key, value] = line.split(": ");
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return {
      status: status,
      headers: headersMap,
      stream: iterateReader(connection),
      body: "",
    };
  }
}
