import { client } from './client';
import {
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
} from './storage';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const auth = {
  requestOtp(email: string) {
    return client.post<{ message: string }>('/auth/request-otp', { email });
  },

  async verifyOtp(email: string, code: string, role?: string) {
    const res = await client.post<AuthTokens & { isNewUser: boolean; user: { userId: string; email: string; role: string; username: string | null } }>('/auth/verify-otp', { email, code, ...(role ? { role } : {}) });
    await setAccessToken(res.data.accessToken);
    await setRefreshToken(res.data.refreshToken);
    return res;
  },

  async refresh() {
    const refreshToken = await getRefreshToken();
    const res = await client.post<AuthTokens>('/auth/refresh', { refreshToken });
    await setAccessToken(res.data.accessToken);
    if (res.data.refreshToken) {
      await setRefreshToken(res.data.refreshToken);
    }
    return res;
  },

  async logout() {
    const refreshToken = await getRefreshToken();
    try {
      await client.post('/auth/logout', { refreshToken });
    } finally {
      await clearTokens();
    }
  },
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const users = {
  getMe() {
    return client.get('/users/me');
  },

  updateMe(data: Record<string, unknown>) {
    return client.patch('/users/me', data);
  },

  updateProfile(data: { firstName?: string; lastName?: string; city?: string }) {
    return client.patch('/users/me/profile', data);
  },

  checkUsername(username: string) {
    return client.get<{ available: boolean }>('/users/check-username', {
      params: { username },
    });
  },

  setUsername(data: { username: string; firstName?: string; lastName?: string }) {
    return client.patch('/users/me/username', data);
  },

  getSettings() {
    return client.get('/users/me/settings');
  },

  updateSettings(data: Record<string, unknown>) {
    return client.patch('/users/me/settings', data);
  },

  getNotificationSettings() {
    return client.get<{ new_messages: boolean }>('/users/me/notification-settings');
  },

  updateNotificationSettings(data: { new_messages?: boolean }) {
    return client.patch<{ new_messages: boolean }>('/users/me/notification-settings', data);
  },

  /** Step 1: send OTP to the new email address */
  requestEmailChange(newEmail: string) {
    return client.post<{ message: string }>('/users/me/change-email/request', { newEmail });
  },

  /** Step 2: verify OTP, update email, return new tokens */
  confirmEmailChange(newEmail: string, code: string) {
    return client.post<{ accessToken: string; refreshToken: string; email: string }>(
      '/users/me/change-email/confirm',
      { newEmail, code },
    );
  },
};

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------
export const requests = {
  getMyRequests(params?: Record<string, unknown>) {
    return client.get('/requests/my', { params });
  },

  getPublicFeed(params?: Record<string, unknown>) {
    return client.get('/requests/public', { params });
  },

  createRequest(data: Record<string, unknown>) {
    return client.post('/requests', data);
  },

  getRequest(id: string) {
    return client.get(`/requests/${id}`);
  },

  updateRequest(id: string, data: Record<string, unknown>) {
    return client.patch(`/requests/${id}`, data);
  },

  extendRequest(id: string) {
    return client.post(`/requests/${id}/extend`);
  },

  closeRequest(id: string) {
    return client.patch(`/requests/${id}/close`);
  },
};

// ---------------------------------------------------------------------------
// Specialists
// ---------------------------------------------------------------------------
export const specialists = {
  getSpecialists(params?: Record<string, unknown>) {
    return client.get('/specialists', { params });
  },

  getSpecialist(nick: string) {
    return client.get(`/specialists/${nick}`);
  },

  getFeatured() {
    return client.get('/specialists/featured');
  },

  saveWorkAreas(workAreas: { fnsId: string; departments: string[] }[]) {
    return client.post('/specialists/work-areas', { workAreas });
  },
};

// ---------------------------------------------------------------------------
// Threads (Chat) — direct-chat flow (W-1/W-2)
// ---------------------------------------------------------------------------
export interface CreateThreadResponse {
  thread_id: string;
  created: boolean;
}

export const threads = {
  /** GET /threads — flat list of current user's threads */
  getThreads() {
    return client.get('/threads');
  },

  /** GET /threads?grouped_by=request — client-side grouped by request */
  getThreadsGroupedByRequest() {
    return client.get('/threads', { params: { grouped_by: 'request' } });
  },

  getMessages(threadId: string, params?: Record<string, unknown>) {
    return client.get(`/threads/${threadId}/messages`, { params });
  },

  sendMessage(threadId: string, data: { content?: string; attachmentUrl?: string; attachmentType?: string; attachmentName?: string }) {
    return client.post(`/threads/${threadId}/messages`, data);
  },

  /**
   * POST /threads — direct-chat flow (W-1). Specialist opens thread on a request.
   * Returns 201 when created, 200 when existing thread returned.
   * Errors: 409 CLOSED/CANCELLED request, 429 20 threads/24h limit.
   */
  createForRequest(data: { requestId: string; firstMessage: string }) {
    return client.post<CreateThreadResponse>('/threads', data);
  },

  /** PATCH /threads/:id/read — mark caller's side as read (204). */
  markRead(threadId: string) {
    return client.patch<void>(`/threads/${threadId}/read`);
  },
};

// ---------------------------------------------------------------------------
// Specialist portal (post-W-1: returns threads with request info)
// ---------------------------------------------------------------------------
export const specialistPortal = {
  /** GET /specialist/responses — specialist's own threads with request info */
  getMyThreads() {
    return client.get('/specialist/responses');
  },

  /** GET /specialist/feed — open requests matching specialist's cities */
  getFeed(params?: Record<string, unknown>) {
    return client.get('/specialist/feed', { params });
  },

  /** GET /specialist/profile — current specialist profile */
  getProfile() {
    return client.get('/specialist/profile');
  },
};

// ---------------------------------------------------------------------------
// IFNS
// ---------------------------------------------------------------------------
export const ifns = {
  getCities() {
    return client.get('/ifns/cities');
  },

  getIfns(params?: Record<string, unknown>) {
    return client.get('/ifns', { params });
  },

  searchIfns(query: string) {
    return client.get('/ifns/search', { params: { query } });
  },
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export const dashboard = {
  getStats() {
    return client.get('/dashboard/stats');
  },
};

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
export const stats = {
  getLandingStats() {
    return client.get('/stats/landing');
  },
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const reviews = {
  create(data: { specialistNick: string; requestId: string; rating: number; comment?: string }) {
    return client.post('/reviews', data);
  },

  getMyReviews() {
    return client.get('/reviews/my');
  },

  getBySpecialist(nick: string, page = 1) {
    return client.get(`/reviews/specialist/${nick}`, { params: { page } });
  },

  getPublic(limit = 6) {
    return client.get('/reviews/public', { params: { limit } });
  },

  checkEligibility(nick: string) {
    return client.get(`/reviews/eligibility/${nick}`);
  },
};

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------
export const complaints = {
  create(data: { targetId: string; reason: string; comment?: string }) {
    return client.post('/complaints', data);
  },
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export const admin = {
  getStats() {
    return client.get('/admin/stats');
  },

  getUsers(params?: { role?: string; page?: number; limit?: number }) {
    return client.get('/admin/users', { params });
  },

  blockUser(id: string, isBlocked: boolean) {
    return client.patch(`/admin/users/${id}`, { isBlocked });
  },

  getSpecialists(params?: { page?: number; limit?: number }) {
    return client.get('/admin/specialists', { params });
  },

  updateSpecialistBadges(id: string, badges: string[]) {
    return client.patch(`/admin/specialists/${id}/badges`, { badges });
  },

  getRequests(params?: { page?: number; limit?: number }) {
    return client.get('/admin/requests', { params });
  },

  getPromotions(params?: { page?: number; limit?: number }) {
    return client.get('/admin/promotions', { params });
  },

  getReviews(params?: { page?: number; limit?: number }) {
    return client.get('/admin/reviews', { params });
  },

  deleteReview(id: string) {
    return client.delete(`/admin/reviews/${id}`);
  },

  getSettings() {
    return client.get('/admin/settings');
  },

  updateSettings(settings: Record<string, string>) {
    return client.patch('/admin/settings', { settings });
  },

  // Complaints admin
  getComplaints(page = 1) {
    return client.get('/complaints/admin', { params: { page } });
  },

  updateComplaintStatus(id: string, status: string) {
    return client.patch(`/complaints/admin/${id}`, { status });
  },
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const notifications = {
  list(page = 1) {
    return client.get('/notifications', { params: { page } });
  },

  unreadCount() {
    return client.get<{ count: number }>('/notifications/unread-count');
  },

  markRead(id: string) {
    return client.patch(`/notifications/${id}/read`);
  },

  markAllRead() {
    return client.post('/notifications/read-all');
  },
};

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------
export const promotions = {
  /** Get available promotion prices (public, no auth) */
  getPrices(city?: string) {
    return client.get('/promotions/prices', { params: city ? { city } : undefined });
  },

  /** Purchase a promotion (specialist only) */
  purchase(data: { city: string; tier: string; periodMonths?: number; idempotencyKey?: string }) {
    return client.post('/promotions/purchase', data);
  },

  /** Get my promotions */
  getMyPromotions() {
    return client.get('/promotions/my');
  },
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
export const search = {
  query(params: { q: string; type?: 'all' | 'requests' | 'specialists'; page?: number }) {
    return client.get('/search', { params });
  },
};

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------
export const upload = {
  /** Upload avatar for current user. Returns updated user profile with avatarUrl. */
  avatar(formData: FormData) {
    return client.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Upload file attachment in a chat thread. Returns { url, signedUrl, type, name }. */
  chatAttachment(threadId: string, formData: FormData) {
    return client.post<{ url: string; signedUrl: string; type: string; name: string }>(
      `/threads/${threadId}/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  /** Upload documents to a request. Returns array of document records. */
  requestDocuments(requestId: string, formData: FormData) {
    return client.post(
      `/requests/${requestId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};
