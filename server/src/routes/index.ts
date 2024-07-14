import express from "express";
import docker, { CONTAINER_TO_PORT, PORT_TO_CONTAINER, cmdCommand } from "../docker";

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
    // await docker.pull(req.body.image);
    const { image, name, cmd } = req.body;

    // Find an available port
    let availableHostPort = 8000;
    let availableInternalPort = 3000;
    
    while (PORT_TO_CONTAINER[availableHostPort] && availableHostPort < 9000 && availableInternalPort < 9000) {
      availableHostPort++;
      availableInternalPort++;
      if(availableHostPort > 8999 || availableInternalPort > 3999) {
        throw new Error("No available ports");
        return;
      }
    }

    const container = await docker.createContainer({
      Image: image,
      name: name,
      Cmd: cmdCommand(image, availableInternalPort),
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
              HostPort: (availableHostPort).toString(),
            },
          ],
        },
        NetworkMode: "my_network",
      },
    });

    await container.start();

    // Update the PORT_TO_CONTAINER and CONTAINER_TO_PORT maps
    PORT_TO_CONTAINER[availableHostPort] = container.id;
    CONTAINER_TO_PORT[container.id] = {
      internal: availableInternalPort.toString(),
      external: availableHostPort.toString(),
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
    }

    // Clear the maps
    for (const port in PORT_TO_CONTAINER) {
      delete PORT_TO_CONTAINER[port];
    }
    for (const containerId in CONTAINER_TO_PORT) {
      delete CONTAINER_TO_PORT[containerId];
    }
    
    res.json({
      msg: `All containers stopped and removed: ${containers.length}`,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
