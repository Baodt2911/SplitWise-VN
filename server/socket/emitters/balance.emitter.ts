import { Server } from "socket.io";
import { USER_ROOM, GROUP_ROOM } from "../index";
import { getBalancesStatsService } from "../../services/user_stats.service";
import { prisma } from "../../lib/prisma";
import { GroupMemberStatus } from "../../generated/prisma/client";

/**
 * Recalculates and emits updated balances to all relevant users in a group.
 * Also emits updated group-level statistics (counts).
 */
export const emitBalanceUpdate = async (io: Server, groupId: string) => {
  try {
    // 1. Fetch all active members in the group
    const members = await prisma.groupMember.findMany({
      where: { groupId, status: GroupMemberStatus.ACTIVE },
      select: { userId: true },
    });

    // 2. For each member, calculate THEIR specific personal balance view and push it
    // This adheres to the rule of not calculating on client.
    await Promise.all(
      members.map(async (member) => {
        const stats = await getBalancesStatsService(member.userId);
        io.to(USER_ROOM(member.userId)).emit("balance:update", {
          groupId,
          ...stats,
        });
      })
    );

    // 3. Emit Group-level data (requested by user: "Lấy thêm cả dữ liệu của group nữa")
    const groupStats = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        _count: {
          select: {
            members: { where: { status: GroupMemberStatus.ACTIVE } },
            expenses: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (groupStats) {
      io.to(GROUP_ROOM(groupId)).emit("group:update", {
        groupId: groupStats.id,
        memberCount: groupStats._count.members,
        expenseCount: groupStats._count.expenses,
      });
    }

  } catch (error) {
    console.error(`[SOCKET] Error emitting balance/group stats for ${groupId}:`, error);
  }
};
