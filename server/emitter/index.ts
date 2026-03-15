import { prisma } from "../lib/prisma";
import { GroupMemberStatus } from "../generated/prisma/client";
import { ackError, ackSuccess } from "../helper/ack";
import { Socket } from "socket.io";

export const USER_ROOM = (userId: string) => `user:${userId}`;
export const GROUP_ROOM = (groupId: string) => `group:${groupId}`;

const socketEvents = (socket: Socket) => {
  const { userId } = socket.data.user;
  socket.join(USER_ROOM(userId));

  socket.on("join-group", async (groupId: string, ack?: (res: any) => void) => {
    const exists = await prisma.groupMember.findFirst({
      where: { userId, groupId, status: GroupMemberStatus.ACTIVE },
    });

    if (!exists) {
      return ackError(
        ack,
        "FORBIDDEN",
        "Bạn không phải là thành viên của nhóm này",
      );
    }
    socket.join(GROUP_ROOM(groupId));
    ackSuccess(ack);
  });

  socket.on("leave-group", (groupId: string) => {
    socket.leave(GROUP_ROOM(groupId));
  });
};
export default socketEvents;
