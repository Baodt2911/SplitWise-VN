import bcrypt from "bcrypt";
import { prisma } from "../../../lib/prisma";
import { UserRole } from "../../../generated/prisma/enums";

const DEV_PASSWORD = "dev123456";

export const devUsers = [
  {
    email: "bao.dev@test.com",
    fullName: "Bao Dev",
    role: UserRole.SYSTEM_ADMIN,
  },
  { email: "alice.dev@test.com", fullName: "Alice Dev" },
  { email: "bob.dev@test.com", fullName: "Bob Dev" },
  { email: "charlie.dev@test.com", fullName: "Charlie Dev" },
];

export async function seedDevUsers() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  await prisma.user.createMany({
    data: devUsers.map((u) => ({
      ...u,
      password: passwordHash,
    })),
    skipDuplicates: true, // 🔑 idempotent
  });

  return prisma.user.findMany({
    where: {
      email: { in: devUsers.map((u) => u.email) },
    },
  });
}
