import express from "express";
import docker from "../docker";

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
    const { image, name, cmd } = req.body;
    const container = await docker.createContainer({
      Image: image,
      name: name,
      Cmd: cmd.split(" "),
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
    });

    await container.start();

    res.json({
      msg: "Container created successfully",
      containerId: container.id,
    });
  } catch (error) {
    res.status(400).json({ error: error });
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
    res.json({ msg: "All containers stopped and removed" });
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

export default router;
