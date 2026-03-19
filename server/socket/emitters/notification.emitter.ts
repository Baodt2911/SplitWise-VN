import { Server } from "socket.io";
import { USER_ROOM, GROUP_ROOM } from "../index";

/**
 * Emits a signal for a new notification to a specific user.
 */
export const emitNotificationToUser = (io: Server, userId: string, payload: any) => {
  io.to(USER_ROOM(userId)).emit("notification:new", payload);
};

/**
 * Emits a signal for a new notification to all users in a group except the sender.
 */
export const emitNotificationToUserInGroup = (
  io: Server,
  groupId: string,
  userId: string,
  payload: any
) => {
  io.to(GROUP_ROOM(groupId))
    .except(USER_ROOM(userId))
    .emit("notification:new", payload);
};

/**
 * Generic signal for a new notification (alias for ToUser).
 */
export const emitNotificationNew = emitNotificationToUser;
