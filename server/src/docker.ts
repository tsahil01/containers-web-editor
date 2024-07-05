import Docker from "dockerode";

const docker = new Docker();

export default docker;

export const PORT_TO_CONTAINER: Record<string, string> = {}; // { "8000": "containerId" }
export const CONTAINER_TO_PORT: Record<
  string,
  { internal: string; external: string }
> = {}; // { "containerId": { internal: "8000", external: "8000" } }
