import { server, io } from "./app";
import { configSocket } from "./configs";

const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, "0.0.0.0", () => {
  configSocket(io);
  console.log(`🚀API running on port http://localhost:${PORT}`);
});
