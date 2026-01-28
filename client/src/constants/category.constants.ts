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
