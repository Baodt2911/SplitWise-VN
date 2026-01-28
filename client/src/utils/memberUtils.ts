/**
 * Get member initials from full name
 * Currently returns the first letter of the first word
 */
export const getMemberInitials = (name: string) => {
  const trimmedName = name.trim();
  if (!trimmedName) return "?";
  const words = trimmedName.split(/\s+/).filter(word => word.length > 0);
  if (words.length === 0) return "?";
  // Get first letter of first word (as per original implementation)
  const firstWord = words[0];
  return firstWord[0].toUpperCase();
};

/**
 * Get consistent avatar background color based on user ID
 */
export const getMemberAvatarColor = (id: string) => {
  const colors = [
    "#E1BEE7", "#C8E6C9", "#BBDEFB", "#FFE0B2",
    "#F8BBD0", "#B2DFDB", "#D1C4E9", "#FFCCBC",
  ];
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

/**
 * Get consistent text color based on user ID
 */
export const getMemberTextColor = (id: string) => {
  const colors = [
    "#7B1FA2", "#388E3C", "#1976D2", "#F57C00",
    "#C2185B", "#00796B", "#512DA8", "#E64A19",
  ];
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};
