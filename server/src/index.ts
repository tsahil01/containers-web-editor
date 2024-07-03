import express from "express";
import Docker from "dockerode";
import http from "http";
import { Server } from "socket.io";

const PORT = 4000;
const docker = new Docker();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

io.attach(server);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    msg : "Hello World from Docker World!!"
    });
});

app.get("/containers", async (req, res) => {
  const containers = await docker.listContainers();
  res.json(containers);
});

app.post("/new-container", async (req, res) => {
    try {
        const { image, name, cmd } = req.body;
        const container = await docker.createContainer({
            Image: image,
            name: name,
            Cmd: cmd.split(" "),
            Tty: true,
        });

        await container.start();

        res.json({ 
            msg: "Container created successfully",
            containerId: container.id
        });
        
    } catch (error) {
        res.status(400).json({ error: error });
    }
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
            Cmd: ['/bin/bash'],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true
        });

        const stream: any = await new Promise((resolve, reject) => {
            exec.start({ hijack: true, stdin: true }, (err: any, stream: any) => {
                if (err) return reject(err);
                resolve(stream);
            });
        });

        socket.on('message', (msg) => {
            stream.write(msg);
        });

        stream.on('data', (chunk: any) => {
            socket.send(chunk.toString());
        });

        stream.on('end', () => {
            socket.disconnect();
        });
    } catch (error) {
        console.log('Error:', error);

        if (container) {
            try {
                await container.stop();
                await container.remove();
            } catch (cleanupErr) {
                console.error('Error cleaning up container:', cleanupErr);
            }
        }
    }

    socket.on("disconnect", async () => {
        console.log("user disconnected: ", socket.id);
        if(container) {
            try {
                await container.stop();
                await container.remove();
            } catch (error) {
                console.error('Error cleaning up container:', error);
            }
        }
    });
});




server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

