import { GroupMemberRole } from "../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";

export async function seedDevGroups(users: { id: string; email: string }[]) {
  const alice = users.find((u) => u.email.startsWith("alice"))!;
  const bob = users.find((u) => u.email.startsWith("bob"))!;
  const charlie = users.find((u) => u.email.startsWith("charlie"))!;

  // 1️⃣ Create groups
  const tripGroup = await prisma.group.create({
    data: {
      name: "Trip Da Nang",
      createdBy: alice.id,
      members: {
        create: {
          userId: alice.id,
          role: GroupMemberRole.ADMIN,
        },
      },
    },
  });

  const houseGroup = await prisma.group.create({
    data: {
      name: "House Expenses",
      createdBy: bob.id,
      members: {
        create: {
          userId: bob.id,
          role: GroupMemberRole.ADMIN,
        },
      },
    },
  });

  // 2️⃣ Add members (idempotent via unique constraint)
  await prisma.groupMember.createMany({
    data: [
      {
        groupId: tripGroup.id,
        userId: bob.id,
        role: GroupMemberRole.MEMBER,
      },
      {
        groupId: tripGroup.id,
        userId: charlie.id,
        role: GroupMemberRole.MEMBER,
      },

      {
        groupId: houseGroup.id,
        userId: alice.id,
        role: GroupMemberRole.MEMBER,
      },
      {
        groupId: houseGroup.id,
        userId: charlie.id,
        role: GroupMemberRole.MEMBER,
      },
    ],
    skipDuplicates: true,
  });

  return [tripGroup, houseGroup];
}
