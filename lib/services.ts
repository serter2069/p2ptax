/**
 * Service name utilities for specialist cards.
 * Short names are used on desktop chip display; full names on mobile.
 */

export const SERVICE_SHORT_NAMES: Record<string, string> = {
  'выездная проверка': 'Выездная',
  'отдел оперативного контроля': 'Опер.контроль',
  'камеральная проверка': 'Камеральная',
  'анализ финансово-хозяйственной деятельности': 'АФХД',
  'проверка контрагентов': 'Контрагенты',
};

export function getShortServiceName(fullName: string): string {
  const key = fullName.trim().toLowerCase();
  return SERVICE_SHORT_NAMES[key] ?? fullName;
}

/** The three core FNS services that together represent full coverage. */
export const CORE_SERVICE_NAMES = [
  'выездная проверка',
  'отдел оперативного контроля',
  'камеральная проверка',
];

/**
 * Returns true when all three core services are present in the given list.
 * Used to collapse three chips into a single "Все" chip.
 */
export function isAllCoreServicesSelected(serviceNames: string[]): boolean {
  const lower = serviceNames.map((n) => n.trim().toLowerCase());
  return CORE_SERVICE_NAMES.every((n) => lower.includes(n));
}
