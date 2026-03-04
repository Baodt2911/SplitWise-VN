import express, { Application, Request, Response } from "express";
import http from "http";
import morgan from "morgan";
import dotenv from "dotenv";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import { configSocket } from "./configs";
import { StatusCodes } from "http-status-codes";
import { errorHandler } from "./middlewares";
import routers from "./routes";
dotenv.config();
const app: Application = express();
const server = http.createServer(app);
export const io = new Server(server);
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json());
app.use(cookieParser());
app.use(
  morgan("combined", {
    // stream: {
    //   write: (message) => {
    //     logger.info(message.trim());
    //   },
    // },
  }),
);
app.use("/api/v1/health", (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    message: "OK",
    timestamp: new Date().toISOString(),
  });
});
app.use("/api/v1", routers);

app.use((req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: StatusCodes.NOT_FOUND,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});
app.use(errorHandler);

server.listen(PORT, "0.0.0.0", () => {
  configSocket(io);
  console.log(`🚀API running on port http://localhost:${PORT}`);
});
