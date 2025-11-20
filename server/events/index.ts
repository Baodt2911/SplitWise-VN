import { Socket } from "socket.io";
const socketEvents = (socket: Socket) => {
  // Listen for a custom event from the client
  socket.on("custom-event", (data: any) => {
    console.log("Custom event received:", data);
  });
};
export default socketEvents;
