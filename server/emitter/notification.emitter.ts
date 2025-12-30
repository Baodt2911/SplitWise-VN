import { Server } from "socket.io";
import { NotificationType, RelatedType } from "../generated/prisma/enums";
import { GROUP_ROOM, USER_ROOM } from "./index";

export const emitNotificationToUser = (
  io: Server,
  userId: string,
  payload: {
    type: NotificationType;
    relatedType: RelatedType;
    relatedId: string;
  }
) => {
  io.to(USER_ROOM(userId)).emit("notification:new", payload);
};

export const emitNotificationToUserInGroup = (
  io: Server,
  groupId: string,
  userId: string,
  payload: {
    type: NotificationType;
    relatedType: RelatedType;
    relatedId: string;
  }
) => {
  io.to(GROUP_ROOM(groupId))
    .except(`user:${userId}`) // Không gửi cho bản thân
    .emit("notification:new", payload);
};
