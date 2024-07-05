import express from "express";
import docker from "../docker";

const router = express.Router();

const PORT_TO_CONTAINER: any = {} // { "8000": "containerId" }
const CONTAINER_TO_PORT: any = {} // { "containerId": "8000" }


router.get("/", (req, res) => {
  res.json({
    msg: "Hello World from Docker World!!",
  });
});

router.get("/containers", async (req, res) => {
  const containers = await docker.listContainers();
  res.json(containers);
});

router.post("/new-container", async (req, res) => {
  try {
    await docker.pull(req.body.image);
    const { image, name, cmd } = req.body;

    const availablePort = ( () => {
      for(let i=8000; i<=9000; i++){
          if (PORT_TO_CONTAINER[i]) {
              continue;
          }
          return `${i}`;
      }
    })();

    if (!availablePort) throw new Error("No Port Available");

    const container = await docker.createContainer({
      Image: image,
      name: name,
      Cmd: cmd.split(" "),
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      ExposedPorts: {
        "8000/tcp": {},
      },
      HostConfig: {
        PortBindings: {
          "8000/tcp": [
            {
              HostPort: availablePort,
            },
          ],
        },
      }
    });

    await container.start();

    res.json({
      msg: "Container created successfully",
      containerId: container.id,
      dockerPort: "8000/tcp",
      exposedPort: availablePort,
    });
  } catch (error) {
    res.status(400).json({ error: error });
    console.error("Error creating container:", error);
  }
});

router.delete("/containers", async (req, res) => {
  console.log("Stopping and removing all containers");
  try {
    const containers = await docker.listContainers();
    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      await container.stop();
      await container.remove();
    }
    res.json({ msg: `All containers stopped and removed: ${containers.length}`,  });
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

export default router;
