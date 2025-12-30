import socketEvents from "../emitter";
import { verifyAccessTokenSocket } from "../middlewares";
import { Server, Socket } from "socket.io";
export const configSocket = (io: Server) => {
  io.use(verifyAccessTokenSocket);
  io.on("connection", (socket: Socket) => {
    console.log("<<<<<Connected to socket>>>>> : ", socket.id);
    socketEvents(socket);

    socket.on("disconnect", () => {
      console.log("<<<<<Disconnected to socket>>>>>");
    });
  });
};
