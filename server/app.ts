import express, { Application, Request, Response } from "express";
import http from "http";
import morgan from "morgan";
import dotenv from "dotenv";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
// import routes from "./routes";
import { configSocket } from "./configs";
import redis from "./configs/redis.config";
import { StatusCodes } from "http-status-codes";
import { errorHandler } from "./middlewares";
import { authRouter, groupRouter, otpRouter, userRouter } from "./routes";
const app: Application = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
dotenv.config();
app.use(express.json());
app.use(cookieParser());
app.use(
  morgan("combined", {
    // stream: {
    //   write: (message) => {
    //     logger.info(message.trim());
    //   },
    // },
  })
);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/otp", otpRouter);
app.use("/api/v1/group", groupRouter);

app.use((req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: StatusCodes.NOT_FOUND,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});
app.use(errorHandler);

configSocket(io);

server.listen(PORT, () =>
  console.log(`🚀API running on port http://localhost:${PORT}`)
);
