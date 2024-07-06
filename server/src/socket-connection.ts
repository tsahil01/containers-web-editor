import { Server } from "socket.io";
import docker, { CONTAINER_TO_PORT, PORT_TO_CONTAINER } from "./docker";
import { server } from ".";
import { deleteFile, getFilesTree, readFile, writeFile } from "./fileManagement";

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("a user connected: ", socket.id);

  socket.on("containerId", async (containerId) => {
    console.log("Container ID received: ", containerId);
    let container: any;


    try {
      container = docker.getContainer(containerId);

      // Execute a shell in the container
      const exec: any = await container.exec({
        Cmd: ["/bin/bash"],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
      });

      const stream: any = await new Promise((resolve, reject) => {
        exec.start({ hijack: true, stdin: true }, (err: any, stream: any) => {
          if (err) return reject(err);
          resolve(stream);
        });
      });

      socket.on('getFileTree', async (path = '/') => {
        try {
          const files = await getFilesTree(containerId, path);
          socket.emit('fileTree', files);
        } catch (error) {
          console.error('Error getting file tree:', error);
          socket.emit('error', 'Failed to get file tree');
        }
      });
  
      // Handle read file request
      socket.on('readFile', async (filePath) => {
        try {
          const content = await readFile(container, filePath);
          socket.emit('fileContent', { filePath, content });
        } catch (error) {
          console.error('Error reading file:', error);
          socket.emit('error', 'Failed to read file');
        }
      });
  
      // Handle write file request
      socket.on('writeFile', async ({ filePath, content }) => {
        try {
          await writeFile(container, filePath, content);
          socket.emit('fileWritten', filePath);
        } catch (error) {
          console.error('Error writing file:', error);
          socket.emit('error', 'Failed to write file');
        }
      });
  
      // Handle delete file request
      socket.on('deleteFile', async (filePath) => {
        try {
          await deleteFile(container, filePath);
          socket.emit('fileDeleted', filePath);
        } catch (error) {
          console.error('Error deleting file:', error);
          socket.emit('error', 'Failed to delete file');
        }
      });
      

      socket.on("input", (data) => {
        // console.log("input received: ", data);
        stream.write(data);
      });

      stream.on("data", (data: any) => {
        // console.log("output received: ", data.toString());
        socket.emit("output", data.toString());
      });

      stream.on("end", () => {
        socket.disconnect();
      });
    } catch (error) {
      console.log("Error:", error);

      if (container) {
        try {
          await container.stop();
          await container.remove();
        } catch (cleanupErr) {
          console.error("Error cleaning up container:", cleanupErr);
        }
      }
    }

    socket.on("disconnect", async () => {
      console.log("user disconnected: ", socket.id);
      if (container) {
        try {
          console.log("Stopping and removing container: ", containerId);
          await container.stop();
          await container.remove();

          // Remove the container from the maps
          const { external } = CONTAINER_TO_PORT[containerId];
          delete PORT_TO_CONTAINER[external];
          delete CONTAINER_TO_PORT[containerId];


        } catch (error) {
          console.error("Error cleaning up container:", error);
        }
      }
    });
  });
});

export default io;
