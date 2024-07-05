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

export default router;
