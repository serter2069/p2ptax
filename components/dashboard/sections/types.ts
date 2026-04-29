/**
 * Shared types for the unified user dashboard.
 * Used by app/(tabs)/dashboard.tsx and section components.
 */

export interface DashboardStats {
  requestsUsed: number;
  requestsLimit: number;
  unreadMessages: number;
}

export interface ClientDashboardExtra {
  activeRequests: number;
  threadsToday: number;
  awaitingReplies: number;
  specialistsWorkingWithYou: number;
  weeklyNewRequests: number;
}

export interface SpecialistExtra {
  newRequestsWeek: number;
  awaitingMyReply: number;
  activeThreads: number;
  disputedAmountMonth: number;
}

export interface RequestItem {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  createdAt: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  threadsCount: number;
}

export interface MatchingRequest {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  createdAt: string;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  service?: string;
  isMyRegion: boolean;
  hasThread?: boolean;
  threadId?: string | null;
  existingThreadId?: string | null;
}

export interface SpecialistDashboardData {
  isAvailable: boolean;
  activeThreads: number;
  matchingRequests: MatchingRequest[];
  stats: { threadsTotal: number; newMessages: number };
}
