import Docker from 'dockerode';
import stream from 'stream';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const execCommand = async (container: any, Cmd: string[]): Promise<string> => {
  const exec = await container.exec({
    Cmd,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
  });
  const execStream = await exec.start();
  return new Promise<string>((resolve, reject) => {
    let output = '';
    execStream.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    execStream.on('end', () => {
      resolve(output.trim());
    });
    execStream.on('error', (err: any) => {
      reject(err);
    });
  });
};

const parseFileTree = (output: string): any => {
  const lines = output.split('\n').filter(Boolean);
  const fileTree: any = { type: 'directory', name: '/', children: {} };

  let currentDir = fileTree.children;

  lines.forEach(line => {
    const pathParts = line.split('/');
    let node = currentDir;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i].trim();
      if (!part) continue; // Skip empty parts

      if (!node[part]) {
        if (i === pathParts.length - 1) {
          node[part] = { type: 'file', name: part };
        } else {
          node[part] = { type: 'directory', name: part, children: {} };
        }
      }
      node = node[part].children;
    }
  });

  // Return children of the first level only
//   @ts-ignores
  return Object.values(fileTree.children)[0].children;
};

export const getFilesTree = async (container: any, path: string): Promise<any> => {
  try {
    const output = await execCommand(container, ['ls', '-R', path]);
    const cleanedOutput = output.replace(/[\u0000-\u001F]/g, ''); // Remove non-printable characters
    const fileTree = parseFileTree(cleanedOutput);
    return fileTree;
  } catch (error) {
    console.error('Error retrieving file tree:', error);
    throw error;
  }
};

export const readFile = async (container: any, filePath: string): Promise<string> => {
  try {
    const output = await execCommand(container, ['cat', filePath]);
    return output;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
};

export const writeFile = async (container: any, filePath: string, content: string): Promise<void> => {
  try {
    const script = `echo "${content.replace(/"/g, '\\"')}" > ${filePath}`;
    await execCommand(container, ['sh', '-c', script]);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
};

export const deleteFile = async (container: any, filePath: string): Promise<void> => {
  try {
    await execCommand(container, ['rm', '-f', filePath]);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    throw error;
  }
};
