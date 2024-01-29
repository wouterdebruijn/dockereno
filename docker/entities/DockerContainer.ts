import { RequestType } from "../../socket/DockerConnection.ts";
import DockerClient from "../DockerClient.ts";
import DockerEntity from "../DockerEntity.ts";

export type Port = unknown; // Unimplemented

export interface Container {
  id: string;
  names: string[];
  image: string;
  imageID: string;
  command: string;
  created: number;
  ports: Port[];
  labels: Record<string, string>;
  state:
    | "created"
    | "restarting"
    | "running"
    | "removing"
    | "paused"
    | "exited"
    | "dead";
  status:
    | "created"
    | "restarting"
    | "running"
    | "removing"
    | "paused"
    | "exited"
    | "dead";
  hostConfig: HostConfig;
  networkSettings: NetworkSettings;
  mounts: Mount[];
  config: ContainerConfig;
}

export interface HostConfig {
  networkMode: string;
  [key: string]: unknown;
}

export interface NetworkSettings {
  networks: Networks;
}

export type Networks = Record<string, Network>;

export interface Network {
  ipamConfig: unknown;
  links: unknown;
  aliases: unknown;
  networkID: string;
  endpointID: string;
  gateway: string;
  ipaddress: string;
  ipprefixLen: number;
  ipv6Gateway: string;
  globalIPv6Address: string;
  globalIPv6PrefixLen: number;
  macAddress: string;
  driverOpts: unknown;
}

export interface Mount {
  type: string;
  name?: string;
  source: string;
  destination: string;
  driver?: string;
  mode: string;
  rw: boolean;
  propagation: string;
}

export interface ContainerConfig {
  hostname: string;
  domainname: string;
  user: string;
  attachStdin: boolean;
  attachStdout: boolean;
  attachStderr: boolean;
  tty: boolean;
  openStdin: boolean;
  stdinOnce: boolean;
  env: string[];
  cmd: string[];
  image: string;
  volumes: Record<string, unknown>;
  workingDir: string;
  entrypoint: string[];
  onBuild: unknown;
  labels: Record<string, string>;
}

export interface ContainerCreateOptions {
  hostname?: string;
  domainname?: string;
  user?: string;
  attachStdin?: boolean;
  attachStdout?: boolean;
  attachStderr?: boolean;
  tty?: boolean;
  openStdin?: boolean;
  stdinOnce?: boolean;
  env?: string[];
  cmd?: string[];
  entrypoint?: string[];
  image: string;
  labels?: Record<string, string>;
  volumes?: Record<string, unknown>;
  workingDir?: string;
  networkDisabled?: boolean;
  macAddress?: string;
  exposedPorts?: Record<string, unknown>;
  stopSignal?: "SIGTERM" | "SIGKILL" | string;
  hostConfig?: HostConfig;
  networkingConfig?: {
    endpointsConfig: Networks;
  };
}

export type ContainerFilter = {
  [key in keyof Container]?: Container[key][];
};

export interface DockerStreamChunk {
  stdin: boolean;
  stdout: boolean;
  stderr: boolean;
  payload: string;
}

export default class DockerContainer extends DockerEntity implements Container {
  id: string;
  names: string[];
  image: string;
  imageID: string;
  command: string;
  created: number;
  ports: unknown[];
  labels: Record<string, string>;
  state:
    | "created"
    | "restarting"
    | "running"
    | "removing"
    | "paused"
    | "exited"
    | "dead";
  status:
    | "created"
    | "restarting"
    | "running"
    | "removing"
    | "paused"
    | "exited"
    | "dead";
  hostConfig: HostConfig;
  networkSettings: NetworkSettings;
  mounts: Mount[];
  config: ContainerConfig;

  constructor(dockerClient: DockerClient, container: Container) {
    super(dockerClient);

    this.id = container.id;
    this.names = container.names;
    this.image = container.image;
    this.imageID = container.imageID;
    this.command = container.command;
    this.created = container.created;
    this.ports = container.ports;
    this.labels = container.labels;
    this.state = container.state;
    this.status = container.status;
    this.hostConfig = container.hostConfig;
    this.networkSettings = container.networkSettings;
    this.mounts = container.mounts;
    this.config = container.config;
  }

  start() {
    return this.dockerClient.post(`/containers/${this.id}/start`);
  }

  stop() {
    return this.dockerClient.post(`/containers/${this.id}/stop`);
  }

  restart() {
    return this.dockerClient.post(`/containers/${this.id}/restart`);
  }

  kill() {
    return this.dockerClient.post(`/containers/${this.id}/kill`);
  }

  remove(params?: { force?: boolean; v?: boolean; link?: boolean }) {
    const url = new URL(`http://_/containers/${this.id}`);

    url.searchParams.append("force", params?.force?.toString() ?? "false");
    url.searchParams.append("v", params?.v?.toString() ?? "false");
    url.searchParams.append("link", params?.link?.toString() ?? "false");

    return this.dockerClient.delete(url.toString());
  }

  // Inspects container for all information. (TODO: Change DockerContainer class into a list and full version?)
  async inspect() {
    const { body } = await this.dockerClient.get(`/containers/${this.id}/json`);
    return DockerContainer.dockerResponseMapper(JSON.parse(body)) as Container;
  }

  async *attach(): AsyncIterable<DockerStreamChunk> {
    // Retrieve container config for its tty setting
    if (this.config?.tty === undefined) {
      this.config = (await this.inspect()).config;
    }

    const { stream } = await this.dockerClient.stream(
      `/containers/${this.id}/attach?stream=1&stdout=1&stderr=1`,
      RequestType.POST,
    );

    const decoder = new TextDecoder();

    for await (const chunk of stream) {
      // Skip parsing the header if the container is in tty mode
      // Corresponding to https://docs.docker.com/engine/api/v1.42/#tag/Container/operation/ContainerAttach
      if (this.config.tty) {
        yield {
          stdin: false,
          stdout: true,
          stderr: false,
          payload: decoder.decode(chunk).trim(),
        };
        continue;
      }

      // First byte stores the type of stream
      const stdin = chunk[0] === 0;
      const stdout = chunk[0] === 1;
      const stderr = chunk[0] === 2;

      // Last 4 bytes store the size of the payload
      const size = new DataView(chunk.buffer).getUint32(4, false);

      const payload = decoder.decode(chunk.slice(8, size + 8));

      yield { stdin, stdout, stderr, payload: payload.trim() };
    }
  }

  static async create(
    dockerClient: DockerClient,
    options: ContainerCreateOptions,
  ): Promise<string> {
    const response = await dockerClient.post(
      "/containers/create",
      JSON.stringify(options),
    );

    return JSON.parse(response.body).Id;
  }

  static async inspect(
    dockerClient: DockerClient,
    id: string,
  ) {
    // TODO: Inspects return more data then the list function, this needs different interfaces
    const response = await dockerClient.get(
      `/containers/${id}/json`,
    );

    return new DockerContainer(
      dockerClient,
      this.dockerResponseMapper(JSON.parse(response.body)) as Container,
    );
  }

  static async list(
    dockerClient: DockerClient,
    filter: ContainerFilter = {},
  ): Promise<DockerContainer[]> {
    const url = new URL("http://_/containers/json");

    url.searchParams.append("all", "true");
    url.searchParams.append("filters", JSON.stringify(filter));

    const response = await dockerClient.get(url.toString());

    const mapped = this.dockerResponseMapper(
      JSON.parse(response.body),
    ) as Container[];
    return mapped.map((container: Container) =>
      new DockerContainer(dockerClient, container)
    );
  }
}
