// Mock for expo-server-sdk (uses ESM import.meta.url which Jest cannot parse)
export class Expo {
  static isExpoPushToken(_token: string): boolean {
    return true;
  }
  async sendPushNotificationsAsync(_messages: any[]): Promise<any[]> {
    return [];
  }
}

export type ExpoPushMessage = {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
};

export type ExpoPushTicket = {
  status: string;
  id?: string;
};

export default Expo;
