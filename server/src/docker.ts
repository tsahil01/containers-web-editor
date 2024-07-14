import Docker from "dockerode";

const docker = new Docker();

export default docker;

export const PORT_TO_CONTAINER: Record<string, string> = {}; // { "8000": "containerId" }
export const CONTAINER_TO_PORT: Record<
  string,
  { internal: string; external: string }
> = {}; // { "containerId": { internal: "8000", external: "8000" } }


export function cmdCommand(image: string, availableInternalPort: number) {
  if (image === 'ubuntu-vscode' || image === 'ubuntu-vscode-node') {
    return ["code-server", "--bind-addr", `0.0.0.0:${availableInternalPort}`, "--auth", "none", "--disable-telemetry"];
  }
  if (image === 'ubuntu') {
    return ["bash"];
  }
  if (image === 'alpine') {
    return ["sh"];
  }
  if (image === 'node') {
    return ["node"];
  }
  if (image === 'python') {
    return ["python"];
  }
  return ["bash"];

}