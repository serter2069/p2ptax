/**
 * Transliteration map: Cyrillic -> Latin
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
  я: "ya",
  // uppercase handled by lowercasing input first
};

/**
 * Normalize a city slug:
 * - Transliterate Cyrillic characters to Latin
 * - Lowercase
 * - Replace spaces and non-alphanumeric chars (except hyphen) with hyphens
 * - Collapse multiple hyphens
 * - Trim leading/trailing hyphens
 */
export function normalizeSlug(input: string): string {
  const lower = input.toLowerCase();
  const transliterated = lower
    .split("")
    .map((ch) => {
      if (ch in CYRILLIC_TO_LATIN) {
        return CYRILLIC_TO_LATIN[ch];
      }
      return ch;
    })
    .join("");

  return transliterated
    .replace(/[^a-z0-9-]/g, "-") // replace non-alphanumeric (except hyphen) with hyphen
    .replace(/-+/g, "-")          // collapse multiple hyphens
    .replace(/^-|-$/g, "");       // trim leading/trailing hyphens
}
