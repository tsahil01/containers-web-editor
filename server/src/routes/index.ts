import express from "express";
import docker, { CONTAINER_TO_PORT, PORT_TO_CONTAINER } from "../docker";

const router = express.Router();


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

    // Find an available host port
    const availableHostPort = (() => {
      for (let i = 8001; i < 8004; i++) {
        if (PORT_TO_CONTAINER[i]) {
          continue;
        }
        return `${i}`;
      }
    })();

    if (!availableHostPort) throw new Error("No Host Port Available");

    // Find an available internal port
    const availableInternalPort = (() => {
      for (let i = 3000; i < 3004 ; i++) {
        if (
          Object.values(CONTAINER_TO_PORT).some(
            (ports) => ports.internal === `${i}`
          )
        ) {
          continue;
        }
        return `${i}`;
      }
    })();

    if (!availableInternalPort) throw new Error("No Internal Port Available");

    const container = await docker.createContainer({
      Image: image,
      name: name,
      Cmd: cmd.split(" "),
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      ExposedPorts: {
        [`${availableInternalPort}/tcp`]: {},
      },
      HostConfig: {
        PortBindings: {
          [`${availableInternalPort}/tcp`]: [
            {
              HostPort: availableHostPort,
            },
          ],
        },
      },
    });

    await container.start();

    // Update the maps with the new container and ports
    PORT_TO_CONTAINER[availableHostPort] = container.id;
    CONTAINER_TO_PORT[container.id] = {
      internal: availableInternalPort,
      external: availableHostPort,
    };

    res.json({
      msg: "Container created successfully",
      containerId: container.id,
      internalPort: availableInternalPort,
      externalPort: availableHostPort,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
    console.error("Error creating container:", error);
  }
});

router.delete("/containers", async (req, res) => {
  // console.log("Stopping and removing all containers");
  try {
    const containers = await docker.listContainers();
    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      await container.stop();
      await container.remove();

      // Remove the container and ports from the maps
      const ports = CONTAINER_TO_PORT[containerInfo.Id];
      if (ports) {
        delete PORT_TO_CONTAINER[ports.external];
        delete CONTAINER_TO_PORT[containerInfo.Id];
      }

      // Remove the port from the PORT_TO_CONTAINER map
      for (const [port, containerId] of Object.entries(PORT_TO_CONTAINER)) {
        if (containerId === containerInfo.Id) {
          delete PORT_TO_CONTAINER[port];
        }
      }
    }
    res.json({
      msg: `All containers stopped and removed: ${containers.length}`,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
