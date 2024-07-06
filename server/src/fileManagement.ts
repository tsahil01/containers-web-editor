import docker from "./docker";

const execCommand = async (container: any, Cmd: string[]) => {
  const exec = await container.exec({
    Cmd,
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
  });
  const execStream = await exec.start();
  const output = await streamToString(execStream);
  return output;
};

const streamToString = async (stream: any) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk.toString());
  }
  return chunks.join("");
};

export async function getFilesTree(container: any, path: string) {
    const output = await execCommand(container, ['ls', path]);
    return output.split('\n').filter(Boolean);
}

export async function readFile(container: any, path: string) {
    const output = await execCommand(container, ['cat', path]);
    return output;
}

export const writeFile = async (container: any, filePath: any, content: any) => {
    const script = `echo "${content.replace(/"/g, '\\"')}" > ${filePath}`;
    await execCommand(container, ['sh', '-c', script]);
  };
  
  export const deleteFile = async (container: any, filePath: any) => {
    await execCommand(container, ['rm', '-f', filePath]);
  };