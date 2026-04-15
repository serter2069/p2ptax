export type PageGroup = 'Overview' | 'Brand' | 'Auth' | 'Onboarding' | 'Dashboard' | 'Specialist' | 'Public' | 'Admin';
export type NavVariant = 'none' | 'public' | 'auth' | 'client' | 'specialist' | 'admin';

export interface PageNote {
  date: string;
  state?: string;
  text: string;
}

export interface TestScenario {
  name: string;
  steps: string[];
}

export interface PageEntry {
  id: string;
  title: string;
  group: PageGroup;
  route: string;
  stateCount: number;
  nav: NavVariant;
  activeTab?: string;
  notes?: PageNote[];
  api?: string[];
  /** IDs of pages this page can navigate TO (outbound transitions) */
  navTo?: string[];
  /** IDs of pages that can navigate to this page (inbound transitions) */
  navFrom?: string[];
  /** Last QC score (0–22), updated after each proto-check pass */
  qaScore?: number;
  /** How many proto+proto-check cycles completed (target: 5 before review) */
  qaCycles?: number;
  /** Test scenarios for QA validation (min 2 per page) */
  testScenarios?: TestScenario[];
}

export const PAGE_GROUPS: PageGroup[] = [
  'Overview',
  'Brand',
  'Auth',
  'Onboarding',
  'Dashboard',
  'Specialist',
  'Public',
  'Admin',
];

export const pageRegistry: PageEntry[] = [
  // Brand
  { id: 'brand', title: 'Бренд и стили', group: 'Brand', route: '/brand', stateCount: 1, nav: 'none' },
  // Auth
  { id: 'auth-email', title: 'Вход — Email', group: 'Auth', route: '/auth-email', stateCount: 1, nav: 'auth' },
  { id: 'auth-otp', title: 'Вход — Код', group: 'Auth', route: '/auth-otp', stateCount: 1, nav: 'auth' },
  // Onboarding
  { id: 'onboarding-username', title: 'Онбординг — Имя', group: 'Onboarding', route: '/onboarding-username', stateCount: 1, nav: 'auth' },
  { id: 'onboarding-profile', title: 'Онбординг — Профиль', group: 'Onboarding', route: '/onboarding-profile', stateCount: 1, nav: 'auth' },
  { id: 'work-area', title: 'Онбординг — Город/ФНС', group: 'Onboarding', route: '/work-area', stateCount: 1, nav: 'auth' },
  // Public
  { id: 'landing', title: 'Главная', group: 'Public', route: '/landing', stateCount: 1, nav: 'public' },
  { id: 'specialists-catalog', title: 'Каталог специалистов', group: 'Public', route: '/specialists-catalog', stateCount: 4, nav: 'public' },
  { id: 'specialist-public-profile', title: 'Профиль специалиста', group: 'Public', route: '/specialist-public-profile', stateCount: 2, nav: 'public' },
  { id: 'public-requests-feed', title: 'Лента заявок', group: 'Public', route: '/public-requests-feed', stateCount: 1, nav: 'public' },
  { id: 'public-request-detail', title: 'Заявка (публичная)', group: 'Public', route: '/public-request-detail', stateCount: 3, nav: 'public' },
  { id: 'terms', title: 'Условия', group: 'Public', route: '/terms', stateCount: 2, nav: 'public' },
  // Dashboard (Client)
  { id: 'dashboard', title: 'Главная клиента', group: 'Dashboard', route: '/dashboard', stateCount: 5, nav: 'client', activeTab: 'home' },
  { id: 'my-requests', title: 'Мои заявки', group: 'Dashboard', route: '/my-requests', stateCount: 4, nav: 'client', activeTab: 'requests' },
  { id: 'new-request', title: 'Новая заявка', group: 'Dashboard', route: '/new-request', stateCount: 2, nav: 'client' },
  { id: 'request-detail', title: 'Детали заявки', group: 'Dashboard', route: '/request-detail', stateCount: 6, nav: 'client' },
  { id: 'messages', title: 'Сообщения', group: 'Dashboard', route: '/messages', stateCount: 4, nav: 'client', activeTab: 'messages' },
  { id: 'chat-thread', title: 'Чат', group: 'Dashboard', route: '/chat-thread', stateCount: 3, nav: 'client' },
  { id: 'client-settings', title: 'Настройки клиента', group: 'Dashboard', route: '/client-settings', stateCount: 1, nav: 'client', activeTab: 'profile' },
  // Specialist
  { id: 'specialist-dashboard', title: 'Главная специалиста', group: 'Specialist', route: '/specialist-dashboard', stateCount: 4, nav: 'specialist' },
  { id: 'specialist-settings', title: 'Настройки специалиста', group: 'Specialist', route: '/specialist-settings', stateCount: 1, nav: 'specialist' },
  // Other
  { id: 'not-found', title: '404', group: 'Public', route: '/not-found', stateCount: 1, nav: 'none' },
];

export const PAGE_TRANSITIONS: Record<string, { to: string; action: string }[]> = {
  'brand': [],
  'landing': [{ to: 'auth-email', action: 'Войти' }, { to: 'specialists-catalog', action: 'Каталог' }, { to: 'public-requests-feed', action: 'Заявки' }],
  'auth-email': [{ to: 'auth-otp', action: 'Отправить код' }],
  'auth-otp': [{ to: 'onboarding-username', action: 'Первый вход' }, { to: 'dashboard', action: 'Вход' }],
  'onboarding-username': [{ to: 'onboarding-profile', action: 'Далее' }],
  'onboarding-profile': [{ to: 'work-area', action: 'Далее' }],
  'work-area': [{ to: 'dashboard', action: 'Завершить' }],
  'dashboard': [{ to: 'new-request', action: 'Новая заявка' }, { to: 'request-detail', action: 'Открыть заявку' }],
  'my-requests': [{ to: 'request-detail', action: 'Открыть заявку' }, { to: 'new-request', action: 'Новая заявка' }],
  'request-detail': [{ to: 'chat-thread', action: 'Написать специалисту' }],
  'messages': [{ to: 'chat-thread', action: 'Открыть чат' }],
  'specialists-catalog': [{ to: 'specialist-public-profile', action: 'Открыть профиль' }],
  'specialist-dashboard': [],
};

export const ROLE_PAGES: Record<string, string[]> = {
  public: ['brand', 'landing', 'specialists-catalog', 'specialist-public-profile', 'public-requests-feed', 'public-request-detail', 'terms', 'not-found'],
  auth: ['auth-email', 'auth-otp'],
  onboarding: ['onboarding-username', 'onboarding-profile', 'work-area'],
  client: ['dashboard', 'my-requests', 'new-request', 'request-detail', 'messages', 'chat-thread', 'client-settings'],
  specialist: ['specialist-dashboard', 'specialist-settings'],
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getPageById(id: string): PageEntry | undefined {
  return pageRegistry.find((p) => p.id === id);
}

export function getPagesByGroup(group: PageGroup): PageEntry[] {
  return pageRegistry.filter((p) => p.group === group);
}

export function getPageNotes(id: string): PageNote[] {
  return getPageById(id)?.notes || [];
}

export function getNotesForState(id: string, state: string): PageNote[] {
  return getPageNotes(id).filter((n) => n.state === state);
}

/** Pages this page can navigate TO (computed from PAGE_TRANSITIONS) */
export function getNavTo(id: string): string[] {
  return (PAGE_TRANSITIONS[id] || []).map((t) => t.to);
}

/** Pages that can navigate TO this page (computed from PAGE_TRANSITIONS) */
export function getNavFrom(id: string): string[] {
  return Object.entries(PAGE_TRANSITIONS)
    .filter(([, transitions]) => transitions.some((t) => t.to === id))
    .map(([fromId]) => fromId);
}

/** pageRegistry enriched with computed navTo/navFrom fields */
export const pageRegistryWithNav: PageEntry[] = pageRegistry.map((p) => ({
  ...p,
  navTo: getNavTo(p.id),
  navFrom: getNavFrom(p.id),
}));
// ci-speed-test Fri Apr 10 22:51:33 PDT 2026
