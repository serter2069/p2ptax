// Formatting experience years for specialist display
export function formatExperience(years: number): string {
  if (years === 1) return '1 год опыта';
  if (years >= 2 && years <= 4) return `${years} года опыта`;
  return `${years} лет опыта`;
}

// Short label for an FNS office (used in chips and dropdowns)
export function shortFnsLabel(name: string, city: string): string {
  const match = name.match(/№\s*(\d+)/);
  return match ? `ИФНС №${match[1]} · ${city}` : city;
}
