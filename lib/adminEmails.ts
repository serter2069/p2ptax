// Admin emails are loaded from EXPO_PUBLIC_ADMIN_EMAILS env var (comma-separated).
// If the env var is not set (e.g. local dev without Doppler), falls back to dev email.
// Never hardcode production emails here.
const raw = process.env.EXPO_PUBLIC_ADMIN_EMAILS ?? 'admin@p2ptax.ru,dev@p2ptax.ru';

export const ADMIN_EMAILS: string[] = raw
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
