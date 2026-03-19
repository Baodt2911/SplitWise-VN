import { Server, Socket } from "socket.io";
import { prisma } from "../../lib/prisma";
import { GroupMemberStatus } from "../../generated/prisma/client";
import { ackError, ackSuccess } from "../../helper/ack";
import { GROUP_ROOM } from "../index";

export default (io: Server, socket: Socket, userActiveRooms: Map<string, Set<string>>) => {
  const { userId } = socket.data.user;

  socket.on("group:join", async (groupId: string, ack?: (res: any) => void) => {
    try {
      const member = await prisma.groupMember.findFirst({
        where: { userId, groupId, status: GroupMemberStatus.ACTIVE },
      });

      if (!member) {
        return ackError(ack, "FORBIDDEN", "Bạn không phải là thành viên của nhóm này hoặc nhóm đã bị xóa");
      }

      socket.join(GROUP_ROOM(groupId));
      
      // Update session map for auto-rejoin
      const activeRooms = userActiveRooms.get(userId) || new Set();
      activeRooms.add(groupId);
      userActiveRooms.set(userId, activeRooms);

      console.log(`[SOCKET] User ${userId} joined room ${GROUP_ROOM(groupId)}`);
      ackSuccess(ack);
    } catch (error) {
      console.error(`[SOCKET] Error joining group ${groupId}:`, error);
      ackError(ack, "INTERNAL_ERROR", "Lỗi khi tham gia phòng nhóm");
    }
  });

  socket.on("group:leave", (groupId: string, ack?: (res: any) => void) => {
    socket.leave(GROUP_ROOM(groupId));
    
    // Update session map
    const activeRooms = userActiveRooms.get(userId);
    if (activeRooms) {
      activeRooms.delete(groupId);
    }

    console.log(`[SOCKET] User ${userId} left room ${GROUP_ROOM(groupId)}`);
    ackSuccess(ack);
  });
};
