export const CATEGORY_ICONS: Record<string, string> = {
  // FOOD
  street_food: "silverware-fork-knife",
  coffee: "coffee",
  alcohol: "beer",
  snacks: "cookie",
  groceries: "cart",
  restaurant: "silverware-fork-knife",

  // TRANSPORT
  ride_hailing: "taxi",
  fuel: "gas-station",
  parking: "parking",
  bike_repair: "wrench",
  public_transport: "bus",
  car_rental: "car",

  // ENTERTAINMENT
  movies: "movie",
  karaoke: "microphone",
  board_games: "dice-5",
  sports_gym: "dumbbell",
  events: "calendar-heart",

  // HOUSING
  rent: "home",
  electricity: "lightning-bolt",
  water: "water",
  internet: "wifi",
  cleaning: "shimmer",
  household_supplies: "sofa",
  maintenance: "hammer",

  // TRAVEL
  hotel: "bed-double",
  homestay: "home-account",
  attraction_tickets: "ticket",
  travel_fuel: "gas-station",
  flights: "airplane",
  tours: "map",

  // SHOPPING
  clothes: "tshirt-crew",
  cosmetics: "lipstick",
  accessories: "diamond-stone",
  electronics: "monitor-cellphone",
  online_shopping: "shopping-outline",

  // HEALTH
  medicine: "pill",
  hospital: "stethoscope",
  health_insurance: "heart-pulse",

  // EDUCATION
  books: "book-open-page-variant",
  tuition: "school",
  office_supplies: "briefcase",
  online_courses: "monitor-screenshot",

  // PETS
  pet_food: "bone",
  veterinary: "needle",
  pet_grooming: "content-cut",

  // GIFTS
  gifts: "gift",
  celebration: "party-popper",
  donation: "hand-coin",

  // OTHER
  fees: "receipt",
  other_expenses: "help-circle",

  // Parent Categories
  FOOD: "silverware-fork-knife",
  TRANSPORT: "car",
  ENTERTAINMENT: "movie",
  HOUSING: "home",
  TRAVEL: "airplane",
  SHOPPING: "shoppingBag",
  HEALTH: "heart-pulse",
  EDUCATION: "school",
  PETS: "bone",
  GIFTS: "gift",
  OTHER: "help-circle",

  // Default
  default: "circle-outline",
};

export const getCategoryIcon = (iconKey: string): string => {
  return CATEGORY_ICONS[iconKey] || CATEGORY_ICONS.default;
};

export const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Ăn uống",
  TRANSPORT: "Di chuyển",
  ENTERTAINMENT: "Giải trí",
  HOUSING: "Nhà ở",
  TRAVEL: "Du lịch",
  SHOPPING: "Mua sắm",
  HEALTH: "Sức khỏe",
  EDUCATION: "Giáo dục",
  PETS: "Thú cưng",
  GIFTS: "Quà tặng",
  OTHER: "Khác",
};

export const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "#FF6B35",
  TRANSPORT: "#FFB800",
  ENTERTAINMENT: "#41AE8F",
  HOUSING: "#506EF7",
  TRAVEL: "#E53935",
  SHOPPING: "#9C27B0",
  HEALTH: "#00BCD4",
  EDUCATION: "#795548",
  PETS: "#FF9800",
  GIFTS: "#E91E63",
  OTHER: "#607D8B",
};

export const getCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category] || category;
};
