export const CATEGORIES = [
  { id: "traffic", label: "Traffic", emoji: "🚗", color: "traffic" },
  { id: "supermarket", label: "Supermarket", emoji: "🛒", color: "supermarket" },
  { id: "beach", label: "Beach", emoji: "🏖️", color: "beach" },
  { id: "parking", label: "Parking", emoji: "🅿️", color: "parking" },
  { id: "public_place", label: "Public Place", emoji: "🏛️", color: "public" },
  { id: "restaurant", label: "Restaurant", emoji: "🍽️", color: "restaurant" },
  { id: "clinic", label: "Clinic", emoji: "🏥", color: "clinic" },
  { id: "other", label: "Other", emoji: "📍", color: "other" },
];

export const getCategoryConfig = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

export const getFreshnessLabel = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const isStale = (dateStr, thresholdMinutes = 120) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff > thresholdMinutes * 60000;
};