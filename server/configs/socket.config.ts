import { Socket } from "socket.io";
import socketEvents from "../events";

export const configSocket = (io: any) => {
  io.on("connection", (socket: Socket) => {
    console.log("<<<<<Connected to socket>>>>> : ", socket.id);

    socketEvents(socket);

    socket.on("disconnect", () => {
      console.log("<<<<<Disconnected to socket>>>>>");
    });
  });
};
