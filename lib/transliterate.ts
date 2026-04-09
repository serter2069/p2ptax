/**
 * Transliterate Russian text to Latin (GOST 7.79-2000 scheme B).
 * Used to auto-generate username from firstName + lastName.
 */

const MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  // Ukrainian / common extras
  'ї': 'yi', 'і': 'i', 'є': 'ye', 'ґ': 'g',
};

export function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => MAP[ch] ?? ch)
    .join('');
}

/**
 * Generate a username suggestion from firstName and lastName.
 * Examples: "Иван Иванов" → "ivan_ivanov", "Пётр Щербаков" → "pyotr_shcherbakov"
 */
export function generateUsername(firstName: string, lastName: string): string {
  const first = transliterate(firstName.trim()).replace(/[^a-z0-9]/g, '');
  const last = transliterate(lastName.trim()).replace(/[^a-z0-9]/g, '');
  if (!first && !last) return '';
  if (!first) return last;
  if (!last) return first;
  return `${first}_${last}`;
}
