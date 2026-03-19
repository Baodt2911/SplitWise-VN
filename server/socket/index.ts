import { Server, Socket } from "socket.io";
import { verifyAccessTokenSocket } from "../middlewares";
import groupHandler from "./handlers/group.handler";

// UserID ↔ Set of GroupRooms mapping for auto-rejoin logic
const userActiveRooms = new Map<string, Set<string>>();

export const USER_ROOM = (userId: string) => `user:${userId}`;
export const GROUP_ROOM = (groupId: string) => `group:${groupId}`;

export let io: Server;

export const configSocket = (_io: Server) => {
  io = _io;
  io.use(verifyAccessTokenSocket);

  io.on("connection", (socket: Socket) => {
    const { userId } = socket.data.user;
    console.log(`[SOCKET] User ${userId} connected : ${socket.id}`);

    // Join personal room
    socket.join(USER_ROOM(userId));

    // Auto-rejoin active group rooms on reconnect
    const activeRooms = userActiveRooms.get(userId);
    if (activeRooms) {
      activeRooms.forEach((roomId) => {
        socket.join(GROUP_ROOM(roomId));
        console.log(`[SOCKET] Auto-rejoined room: ${GROUP_ROOM(roomId)} for user ${userId}`);
      });
    } else {
      userActiveRooms.set(userId, new Set());
    }

// Register Handlers
    groupHandler(io, socket, userActiveRooms);

    socket.on("disconnect", () => {
      console.log(`[SOCKET] User ${userId} disconnected`);
    });
  });
};
