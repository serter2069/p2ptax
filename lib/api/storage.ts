import { secureStorage } from '../../stores/storage';

const ACCESS_TOKEN_KEY = '@p2ptax_token';
const REFRESH_TOKEN_KEY = '@p2ptax_refresh_token';

export async function getAccessToken(): Promise<string | null> {
  try {
    return await secureStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  await secureStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await secureStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  await secureStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export async function clearTokens(): Promise<void> {
  await secureStorage.removeItem(ACCESS_TOKEN_KEY);
  await secureStorage.removeItem(REFRESH_TOKEN_KEY);
}
