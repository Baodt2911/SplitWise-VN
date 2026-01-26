import { prisma } from "../lib/prisma";
import { seedDevGroups } from "./seed/dev/groups.seed";
import { seedDevUsers } from "./seed/dev/users.seed";
import { seedExpenseSubCategories } from "./seed/systems/expenseSubCategory.seed";
const isDev = process.env.NODE_ENV !== "production";
async function main() {
  console.log(
    "🌱 Seeding database in " + (isDev ? "development" : "production") + "...",
  );

  await seedExpenseSubCategories();

  if (isDev) {
    const users = await seedDevUsers();
    const groups = await seedDevGroups(users);
  }

  console.log("✅ Seed completed");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
