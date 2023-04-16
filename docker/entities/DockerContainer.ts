import { DockerClient } from "../DockerClient.ts";
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
}

export interface HostConfig {
  networkMode: string;
}

export interface NetworkSettings {
  networks: Networks;
}

export type Networks = Record<string, Network>;

export interface Network {
  iPAMConfig: unknown;
  links: unknown;
  aliases: unknown;
  networkID: string;
  endpointID: string;
  gateway: string;
  iPAddress: string;
  iPPrefixLen: number;
  iPv6Gateway: string;
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
  }
}
