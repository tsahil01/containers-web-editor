import { Server } from "socket.io";
import docker from "./docker";
import { server } from ".";

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", async (socket) => {
  console.log("a user connected: ", socket.id);
  // get container id from client
  let container: any;
  try {
    socket.on("containerId", (containerId) => {
      container = docker.getContainer(containerId);
    });

    // Execute a shell in the container
    const exec = await container.exec({
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

    socket.on("message", (msg) => {
      stream.write(msg);
    });

    stream.on("data", (chunk: any) => {
      socket.send(chunk.toString());
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
        await container.stop();
        await container.remove();
      } catch (error) {
        console.error("Error cleaning up container:", error);
      }
    }
  });
});

export default io;
