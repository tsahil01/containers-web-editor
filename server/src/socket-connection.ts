import { Server } from "socket.io";
import docker, { CONTAINER_TO_PORT, PORT_TO_CONTAINER } from "./docker";
import { server } from ".";

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

          // Remove the container and ports from the maps
          const ports = PORT_TO_CONTAINER[containerId];
          if (ports) {
            delete PORT_TO_CONTAINER[ports];
          }

          // Remove ports from the container
          const containerPorts = CONTAINER_TO_PORT[containerId];
          if (containerPorts) {
            delete CONTAINER_TO_PORT[containerId];
          }

        } catch (error) {
          console.error("Error cleaning up container:", error);
        }
      }
    });
  });
});

export default io;
