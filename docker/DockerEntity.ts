import DockerClient from "./DockerClient.ts";

export default class DockerEntity {
  protected dockerClient: DockerClient;

  constructor(dockerClient: DockerClient) {
    this.dockerClient = dockerClient;
  }

  /*
   * Function for mapping the responses from docker, doesn't account for custom naming of network interfaces and other items which are returned as keys of objects.
   */
  protected static dockerResponseMapper(unknownValue: unknown): unknown {
    // Check if we are dealing with an object
    if (typeof unknownValue !== "object" || unknownValue === null) {
      return unknownValue;
    }

    // Check if we are dealing with an array
    if (Array.isArray(unknownValue)) {
      return unknownValue.map((i) => this.dockerResponseMapper(i));
    }

    const newObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(unknownValue)) {
      const newKey = key.replace(/^[A-Z]{1,}/, (c) => c.toLowerCase());
      newObj[newKey] = this.dockerResponseMapper(value);
    }

    return newObj;
  }
}
