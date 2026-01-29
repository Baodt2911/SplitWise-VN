import { ExpenseCategory } from "../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";

export const expenseSubCategories = [
  // ====================== FOOD ======================
  {
    parent: ExpenseCategory.FOOD,
    key: "street_food",
    name: "Street food",
    icon: "street_food",
  },
  {
    parent: ExpenseCategory.FOOD,
    key: "coffee",
    name: "Coffee",
    icon: "coffee",
  },
  {
    parent: ExpenseCategory.FOOD,
    key: "alcohol",
    name: "Alcohol",
    icon: "beer",
  },
  {
    parent: ExpenseCategory.FOOD,
    key: "snacks",
    name: "Snacks",
    icon: "snacks",
  },
  {
    parent: ExpenseCategory.FOOD,
    key: "groceries",
    name: "Groceries",
    icon: "groceries",
  },
  {
    parent: ExpenseCategory.FOOD,
    key: "restaurant",
    name: "Restaurant",
    icon: "restaurant",
  },

  // ====================== TRANSPORT ======================
  {
    parent: ExpenseCategory.TRANSPORT,
    key: "ride_hailing",
    name: "Taxi / Ride-hailing",
    icon: "taxi",
  },
  {
    parent: ExpenseCategory.TRANSPORT,
    key: "fuel",
    name: "Fuel",
    icon: "fuel",
  },
  {
    parent: ExpenseCategory.TRANSPORT,
    key: "parking",
    name: "Parking",
    icon: "parking",
  },
  {
    parent: ExpenseCategory.TRANSPORT,
    key: "bike_repair",
    name: "Bike repair",
    icon: "bike_repair",
  },
  {
    parent: ExpenseCategory.TRANSPORT,
    key: "public_transport",
    name: "Public transport",
    icon: "bus",
  },
  {
    parent: ExpenseCategory.TRANSPORT,
    key: "car_rental",
    name: "Car rental",
    icon: "car_rental",
  },

  // ====================== ENTERTAINMENT ======================
  {
    parent: ExpenseCategory.ENTERTAINMENT,
    key: "movies",
    name: "Movies",
    icon: "movie",
  },
  {
    parent: ExpenseCategory.ENTERTAINMENT,
    key: "karaoke",
    name: "Karaoke",
    icon: "karaoke",
  },
  {
    parent: ExpenseCategory.ENTERTAINMENT,
    key: "board_games",
    name: "Board games",
    icon: "boardgame",
  },
  {
    parent: ExpenseCategory.ENTERTAINMENT,
    key: "sports_gym",
    name: "Sports / Gym",
    icon: "sports",
  },
  {
    parent: ExpenseCategory.ENTERTAINMENT,
    key: "events",
    name: "Events",
    icon: "event",
  },

  // ====================== HOUSING ======================
  { parent: ExpenseCategory.HOUSING, key: "rent", name: "Rent", icon: "rent" },
  {
    parent: ExpenseCategory.HOUSING,
    key: "electricity",
    name: "Electricity",
    icon: "electricity",
  },
  {
    parent: ExpenseCategory.HOUSING,
    key: "water",
    name: "Water",
    icon: "water",
  },
  {
    parent: ExpenseCategory.HOUSING,
    key: "internet",
    name: "Internet",
    icon: "wifi",
  },
  {
    parent: ExpenseCategory.HOUSING,
    key: "cleaning",
    name: "Cleaning service",
    icon: "cleaning",
  },
  {
    parent: ExpenseCategory.HOUSING,
    key: "household_supplies",
    name: "Household supplies",
    icon: "household",
  },
  {
    parent: ExpenseCategory.HOUSING,
    key: "maintenance",
    name: "Maintenance",
    icon: "maintenance",
  },

  // ====================== TRAVEL ======================
  {
    parent: ExpenseCategory.TRAVEL,
    key: "hotel",
    name: "Hotel",
    icon: "hotel",
  },
  {
    parent: ExpenseCategory.TRAVEL,
    key: "homestay",
    name: "Homestay",
    icon: "homestay",
  },
  {
    parent: ExpenseCategory.TRAVEL,
    key: "attraction_tickets",
    name: "Attraction tickets",
    icon: "ticket",
  },
  {
    parent: ExpenseCategory.TRAVEL,
    key: "travel_fuel",
    name: "Travel fuel",
    icon: "fuel_trip",
  },
  {
    parent: ExpenseCategory.TRAVEL,
    key: "flights",
    name: "Flights",
    icon: "flight",
  },
  { parent: ExpenseCategory.TRAVEL, key: "tours", name: "Tours", icon: "tour" },

  // ====================== SHOPPING ======================
  {
    parent: ExpenseCategory.SHOPPING,
    key: "clothes",
    name: "Clothes",
    icon: "clothes",
  },
  {
    parent: ExpenseCategory.SHOPPING,
    key: "cosmetics",
    name: "Cosmetics",
    icon: "cosmetics",
  },
  {
    parent: ExpenseCategory.SHOPPING,
    key: "accessories",
    name: "Accessories",
    icon: "accessories",
  },
  {
    parent: ExpenseCategory.SHOPPING,
    key: "electronics",
    name: "Electronics",
    icon: "electronics",
  },
  {
    parent: ExpenseCategory.SHOPPING,
    key: "online_shopping",
    name: "Online shopping",
    icon: "online_shopping",
  },

  // ====================== HEALTH ======================
  {
    parent: ExpenseCategory.HEALTH,
    key: "medicine",
    name: "Medicine",
    icon: "medicine",
  },
  {
    parent: ExpenseCategory.HEALTH,
    key: "hospital",
    name: "Hospital",
    icon: "hospital",
  },
  {
    parent: ExpenseCategory.HEALTH,
    key: "health_insurance",
    name: "Health insurance",
    icon: "insurance",
  },

  // ====================== EDUCATION ======================
  {
    parent: ExpenseCategory.EDUCATION,
    key: "books",
    name: "Books",
    icon: "books",
  },
  {
    parent: ExpenseCategory.EDUCATION,
    key: "tuition",
    name: "Tuition",
    icon: "tuition",
  },
  {
    parent: ExpenseCategory.EDUCATION,
    key: "office_supplies",
    name: "Office supplies",
    icon: "office",
  },
  {
    parent: ExpenseCategory.EDUCATION,
    key: "online_courses",
    name: "Online courses",
    icon: "online_course",
  },

  // ====================== PETS ======================
  {
    parent: ExpenseCategory.PETS,
    key: "pet_food",
    name: "Pet food",
    icon: "pet_food",
  },
  {
    parent: ExpenseCategory.PETS,
    key: "veterinary",
    name: "Veterinary",
    icon: "vet",
  },
  {
    parent: ExpenseCategory.PETS,
    key: "pet_grooming",
    name: "Pet grooming",
    icon: "pet_grooming",
  },

  // ====================== GIFTS ======================
  { parent: ExpenseCategory.GIFTS, key: "gifts", name: "Gifts", icon: "gift" },
  {
    parent: ExpenseCategory.GIFTS,
    key: "celebration",
    name: "Celebration",
    icon: "celebration",
  },
  {
    parent: ExpenseCategory.GIFTS,
    key: "donation",
    name: "Donation",
    icon: "donation",
  },

  // ====================== OTHER ======================
  { parent: ExpenseCategory.OTHER, key: "fees", name: "Fees", icon: "fees" },
  {
    parent: ExpenseCategory.OTHER,
    key: "other_expenses",
    name: "Other expenses",
    icon: "other",
  },
];

export async function seedExpenseSubCategories() {
  await prisma.expenseSubCategory.createMany({
    data: expenseSubCategories,
    skipDuplicates: true,
  });
}
