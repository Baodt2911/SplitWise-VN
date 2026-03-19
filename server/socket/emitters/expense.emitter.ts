import { Server } from "socket.io";
import { GROUP_ROOM } from "../index";

/**
 * Emits full expense data to a group room.
 */
export const emitExpenseCreate = (io: Server, groupId: string, expense: any) => {
  io.to(GROUP_ROOM(groupId)).emit("expense:create", expense);
};

export const emitExpenseUpdate = (io: Server, groupId: string, expense: any) => {
  io.to(GROUP_ROOM(groupId)).emit("expense:update", expense);
};

export const emitExpenseDelete = (io: Server, groupId: string, expenseId: string) => {
  io.to(GROUP_ROOM(groupId)).emit("expense:delete", { id: expenseId });
};
