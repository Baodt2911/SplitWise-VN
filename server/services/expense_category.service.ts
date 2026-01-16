import { prisma } from "../lib/prisma";
import { ExpenseCategory } from "../generated/prisma/enums";

export const getExpenseSubCategoriesService = async (
  parent?: ExpenseCategory
) => {
  const categories = await prisma.expenseSubCategory.findMany({
    where: {
      isActive: true,
      ...(parent && { parent }),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      parent: true,
      key: true,
      name: true,
      icon: true,
    },
  });
  const grouped = categories.reduce<Record<ExpenseCategory | string, any[]>>(
    (acc, item) => {
      if (!acc[item.parent]) {
        acc[item.parent] = [];
      }
      acc[item.parent].push({
        id: item.id,
        name: item.name,
        key: item.key,
        icon: item.icon,
      });
      return acc;
    },
    {}
  );

  return grouped;
};
