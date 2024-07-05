import express from "express";
import http from "http";
import router from "./routes";
import io from "./socket-connection";

const PORT = 4000;
const app = express();

export const server = http.createServer(app);
app.use(express.json());

app.use("/api", router);
io.attach(server);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
