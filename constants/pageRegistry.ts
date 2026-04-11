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
  // Overview
  { id: 'overview', title: 'Project Overview', group: 'Overview', route: '/', stateCount: 1, nav: 'none', qaCycles: 3, qaScore: 9, testScenarios: [
    { name: 'View project overview', steps: ['open /proto/states/overview', 'verify project title visible', 'verify roles listed'] },
  ] },

  // Brand
  { id: 'nav-components', title: 'Navigation Components', group: 'Brand', route: '/proto/nav', stateCount: 11, nav: 'none', qaCycles: 3, qaScore: 9, testScenarios: [
    { name: 'View nav components', steps: ['open /proto/states/nav-components', 'verify navigation variants displayed'] },
  ] },
  { id: 'brand', title: 'Бренд и стили', group: 'Brand', route: '/brand', stateCount: 1, nav: 'none', qaCycles: 3, qaScore: 10,
      notes: [
        { date: '2026-04-10', text: '(empty)' },
      ], testScenarios: [
    { name: 'View brand colors', steps: ['open /proto/states/brand', 'verify color palette visible', 'verify background color block shown first'] },
  ] },
  { id: 'components', title: 'UI Components', group: 'Brand', route: '/components', stateCount: 1, nav: 'none', qaCycles: 3, qaScore: 9, testScenarios: [
    { name: 'View UI components', steps: ['open /proto/states/components', 'verify button variants shown', 'verify input fields shown'] },
  ] },

  // Auth
  { id: 'auth-email', title: 'Вход — Email', group: 'Auth', route: '/(auth)/login', stateCount: 3, nav: 'auth', qaCycles: 3, qaScore: 10, api: [
    'POST /api/auth/request-otp',
  ] ,
      notes: [
        { date: '2026-04-10', text: 'asfasf' },
      ], testScenarios: [
    { name: 'Guest enters email', steps: ['open /proto/states/auth-email', 'verify email input visible', 'type email', 'tap "Получить код"', 'verify loading state'] },
    { name: 'Invalid email error', steps: ['open /proto/states/auth-email', 'type invalid text', 'verify error message shown'] },
  ] },
  { id: 'auth-otp', title: 'Вход — OTP код', group: 'Auth', route: '/(auth)/otp', stateCount: 4, nav: 'auth', qaCycles: 3, qaScore: 10, api: [
    'POST /api/auth/verify-otp',
    'POST /api/auth/request-otp',
  ], testScenarios: [
    { name: 'Enter OTP code', steps: ['open /proto/states/auth-otp', 'verify 6 digit inputs visible', 'type code', 'verify auto-submit'] },
    { name: 'Wrong OTP code', steps: ['open /proto/states/auth-otp', 'type wrong code', 'verify error state: attempt counter'] },
    { name: 'Resend OTP', steps: ['open /proto/states/auth-otp', 'wait for countdown', 'tap resend button'] },
  ] },

  // Onboarding (specialist)
  { id: 'onboarding-username', title: 'Имя пользователя', group: 'Onboarding', route: '/(onboarding)/username', stateCount: 2, nav: 'auth', qaCycles: 3, qaScore: 9, api: [
    'PUT /api/onboarding/username',
    'GET /api/onboarding/check-username/:nick',
  ], testScenarios: [
    { name: 'Specialist enters username', steps: ['open /proto/states/onboarding-username', 'verify username input visible', 'type username', 'verify validation feedback'] },
    { name: 'Username already taken', steps: ['open /proto/states/onboarding-username', 'type taken username', 'verify error message'] },
  ] },
  { id: 'onboarding-work-area', title: 'Город, ФНС, услуги', group: 'Onboarding', route: '/(onboarding)/work-area', stateCount: 2, nav: 'auth', qaCycles: 3, qaScore: 9, api: [
    'GET /api/cities',
    'GET /api/fns?city=:city',
    'GET /api/services',
    'PUT /api/onboarding/work-area',
  ], notes: [
    { date: '2026-04-09', text: 'Один экран: город -> ФНС -> услуги при ФНС. Услуги: Выездная проверка, Отдел оперативного контроля, Камеральная проверка. ИНН не нужен.' },
  ], testScenarios: [
    { name: 'Select city and FNS', steps: ['open /proto/states/onboarding-work-area', 'verify city selector visible', 'select city', 'verify FNS dropdown populated'] },
    { name: 'Select services', steps: ['open /proto/states/onboarding-work-area', 'select city', 'select FNS', 'verify services chips visible', 'tap service chips'] },
  ] },
  { id: 'onboarding-profile', title: 'Заполнение профиля', group: 'Onboarding', route: '/(onboarding)/profile', stateCount: 2, nav: 'auth', qaCycles: 3, qaScore: 9, api: [
    'PUT /api/onboarding/profile',
    'POST /api/upload/avatar',
  ], notes: [
    { date: '2026-04-09', state: 'DEFAULT', text: 'Иконка профиля вместо фото если нет фото. Убрать Опыт работы.' },
  ], testScenarios: [
    { name: 'Fill specialist profile', steps: ['open /proto/states/onboarding-profile', 'verify avatar placeholder visible', 'type description', 'verify submit button'] },
    { name: 'Upload avatar', steps: ['open /proto/states/onboarding-profile', 'tap avatar area', 'verify upload trigger'] },
  ] },

  // Dashboard (Client)
  { id: 'dashboard', title: 'Главная', group: 'Dashboard', route: '/(dashboard)', stateCount: 3, nav: 'client', activeTab: 'home', qaCycles: 3, qaScore: 9, api: [
    'GET /api/dashboard/stats',
    'GET /api/requests?limit=3&status=active',
    'GET /api/responses?limit=3&unread=true',
  ], testScenarios: [
    { name: 'Client views dashboard', steps: ['open /proto/states/dashboard', 'verify greeting visible', 'verify stats cards shown', 'verify recent requests listed'] },
    { name: 'Client creates new request', steps: ['open /proto/states/dashboard', 'tap "Создать заявку"', 'verify navigation to my-requests-new'] },
  ] },
  { id: 'my-requests', title: 'Мои заявки', group: 'Dashboard', route: '/(dashboard)/my-requests', stateCount: 3, nav: 'client', activeTab: 'requests', qaCycles: 3, qaScore: 9, api: [
    'GET /api/requests?status=:status&page=:page',
    'DELETE /api/requests/:id',
  ], testScenarios: [
    { name: 'Client views requests list', steps: ['open /proto/states/my-requests', 'verify request cards shown', 'verify status filter tabs'] },
    { name: 'Empty state', steps: ['open /proto/states/my-requests', 'verify EMPTY state with message'] },
    { name: 'Scroll to bottom', steps: ['open /proto/states/my-requests', 'scroll down', 'verify all requests loaded'] },
  ] },
  { id: 'my-requests-new', title: 'Новая заявка', group: 'Dashboard', route: '/(dashboard)/new-request', stateCount: 4, nav: 'client', activeTab: 'requests', qaCycles: 3, qaScore: 9, api: [
    'POST /api/requests',
    'GET /api/cities',
    'GET /api/fns?city=:city',
    'GET /api/services',
  ] ,
      notes: [
        { date: '2026-04-10', text: 'test' },
      ], testScenarios: [
    { name: 'Client fills request form', steps: ['open /proto/states/my-requests-new', 'verify form fields visible', 'type description', 'select city', 'select FNS', 'select service'] },
    { name: 'Submit request', steps: ['open /proto/states/my-requests-new', 'fill all fields', 'tap submit', 'verify success state'] },
  ] },
  { id: 'my-request-detail', title: 'Детали заявки', group: 'Dashboard', route: '/(dashboard)/request/1', stateCount: 3, nav: 'client', activeTab: 'requests', qaCycles: 3, qaScore: 9, api: [
    'GET /api/requests/:id',
    'GET /api/requests/:id/responses',
    'PUT /api/requests/:id',
    'DELETE /api/requests/:id',
  ], testScenarios: [
    { name: 'View request details', steps: ['open /proto/states/my-request-detail', 'verify request title visible', 'verify status badge', 'verify response list'] },
    { name: 'View responses', steps: ['open /proto/states/my-request-detail', 'tap "Отклики"', 'verify navigation to responses'] },
  ] },
  { id: 'responses', title: 'Отклики', group: 'Dashboard', route: '/(dashboard)/responses', stateCount: 4, nav: 'client', activeTab: 'requests', qaCycles: 3, qaScore: 9, api: [
    'GET /api/responses?requestId=:id',
    'PUT /api/responses/:id/accept',
    'PUT /api/responses/:id/reject',
  ], testScenarios: [
    { name: 'View specialist responses', steps: ['open /proto/states/responses', 'verify response cards shown', 'verify specialist info visible'] },
    { name: 'Accept response', steps: ['open /proto/states/responses', 'tap "Принять"', 'verify confirmation popup'] },
    { name: 'Reject response', steps: ['open /proto/states/responses', 'tap "Отклонить"', 'verify rejection popup'] },
  ] },
  { id: 'messages', title: 'Сообщения', group: 'Dashboard', route: '/(dashboard)/messages', stateCount: 2, nav: 'client', activeTab: 'messages', qaCycles: 3, qaScore: 9, api: [
    'GET /api/threads',
  ], testScenarios: [
    { name: 'View message threads', steps: ['open /proto/states/messages', 'verify thread list shown', 'verify unread indicators'] },
    { name: 'Open thread', steps: ['open /proto/states/messages', 'tap thread', 'verify navigation to message-thread'] },
  ] },
  { id: 'message-thread', title: 'Чат', group: 'Dashboard', route: '/(dashboard)/messages/1', stateCount: 3, nav: 'client', activeTab: 'messages', qaCycles: 3, qaScore: 9, api: [
    'GET /api/threads/:id/messages?page=:page',
    'POST /api/threads/:id/messages',
    'PUT /api/threads/:id/read',
  ], testScenarios: [
    { name: 'View chat messages', steps: ['open /proto/states/message-thread', 'verify messages shown', 'verify message input visible'] },
    { name: 'Send message', steps: ['open /proto/states/message-thread', 'type message', 'tap send', 'verify message sent'] },
  ] },
  { id: 'profile', title: 'Профиль', group: 'Dashboard', route: '/(dashboard)/profile', stateCount: 2, nav: 'client', activeTab: 'profile', qaCycles: 3, qaScore: 9, api: [
    'GET /api/profile',
    'PUT /api/profile',
    'POST /api/upload/avatar',
  ], testScenarios: [
    { name: 'View profile', steps: ['open /proto/states/profile', 'verify user info shown', 'verify edit fields visible'] },
    { name: 'Edit profile', steps: ['open /proto/states/profile', 'modify name', 'tap save', 'verify success'] },
  ] },
  { id: 'settings', title: 'Настройки', group: 'Dashboard', route: '/(dashboard)/settings', stateCount: 1, nav: 'client', activeTab: 'profile', qaCycles: 3, qaScore: 10, api: [
    'GET /api/settings',
    'PUT /api/settings',
    'POST /api/auth/logout',
    'DELETE /api/account',
  ], testScenarios: [
    { name: 'View settings', steps: ['open /proto/states/settings', 'verify settings options listed', 'verify logout button visible'] },
    { name: 'Logout', steps: ['open /proto/states/settings', 'tap "Выйти"', 'verify confirmation'] },
  ] },

  // Specialist
  { id: 'specialist-dashboard', title: 'Кабинет специалиста', group: 'Specialist', route: '/specialist', stateCount: 2, nav: 'specialist', activeTab: 'dashboard', qaCycles: 3, qaScore: 20, navTo: ['public-requests', 'messages', 'profile', 'specialist-respond', 'public-request-detail'], navFrom: ['auth-otp', 'onboarding-profile', 'specialist-respond'], api: [
    'GET /api/specialist/stats',
    'GET /api/specialist/requests?status=new&limit=5',
  ], testScenarios: [
    { name: 'Специалист видит дашборд', steps: ['open /proto/states/specialist-dashboard', 'verify greeting visible', 'verify stats cards: Новые, В работе, Завершены', 'verify request cards visible'] },
    { name: 'Специалист переключает табы', steps: ['open /proto/states/specialist-dashboard', 'tap tab "В работе"', 'verify filtered requests shown', 'tap tab "Завершены"', 'verify completed/cancelled requests'] },
    { name: 'Специалист откликается на заявку', steps: ['open /proto/states/specialist-dashboard', 'tap "Откликнуться" on request card', 'verify navigation to specialist-respond'] },
  ] },
  { id: 'specialist-respond', title: 'Отклик специалиста', group: 'Specialist', route: '/specialist/respond', stateCount: 3, nav: 'specialist', activeTab: 'dashboard', qaCycles: 3, qaScore: 20, navTo: ['specialist-dashboard', 'public-requests', 'messages', 'profile'], navFrom: ['specialist-dashboard'], api: [
    'GET /api/requests/:id',
    'POST /api/responses',
  ], testScenarios: [
    { name: 'Специалист заполняет отклик', steps: ['open /proto/states/specialist-respond', 'verify request info visible', 'verify price input editable', 'verify message input editable', 'tap "Отправить отклик"', 'verify popup shown'] },
    { name: 'Успешная отправка отклика', steps: ['open /proto/states/specialist-respond', 'verify SUBMITTED state shows success', 'tap "К моим откликам"', 'verify navigation to specialist-dashboard'] },
    { name: 'Ошибка отправки отклика', steps: ['open /proto/states/specialist-respond', 'verify ERROR state visible', 'verify error message shown', 'tap "Попробовать снова"'] },
  ] },
  { id: 'specialist-profile-public', title: 'Публичный профиль', group: 'Specialist', route: '/specialists/1', stateCount: 2, nav: 'public', qaCycles: 3, qaScore: 9, api: [
    'GET /api/specialists/:id',
    'GET /api/specialists/:id/reviews?page=:page',
  ], testScenarios: [
    { name: 'View specialist profile', steps: ['open /proto/states/specialist-profile-public', 'verify specialist name visible', 'verify services listed', 'verify rating shown'] },
    { name: 'View reviews', steps: ['open /proto/states/specialist-profile-public', 'scroll to reviews', 'verify review cards shown'] },
  ] },

  // Public
  { id: 'landing', title: 'Лендинг', group: 'Public', route: '/', stateCount: 4, nav: 'public', qaCycles: 3, qaScore: 10, api: [
    'GET /api/specialists/featured',
    'GET /api/cities',
    'GET /api/fns?city=:city',
    'POST /api/requests/public',
    'POST /api/auth/request-otp',
    'POST /api/auth/verify-otp',
  ], notes: [
    { date: '2026-04-09', text: 'Карусель специалистов. Форма заявки: город -> ФНС -> описание + email/имя -> OTP верификация -> отправка.' },
  ], testScenarios: [
    { name: 'Guest views landing', steps: ['open /proto/states/landing', 'verify hero section visible', 'verify specialist carousel', 'verify request form visible'] },
    { name: 'Guest submits quick request', steps: ['open /proto/states/landing', 'fill request form', 'verify OTP verification step'] },
    { name: 'Scroll to bottom', steps: ['open /proto/states/landing', 'scroll down', 'verify footer visible'] },
  ] },
  { id: 'public-requests', title: 'Лента заявок', group: 'Public', route: '/requests', stateCount: 3, nav: 'public', qaCycles: 3, qaScore: 10, api: [
    'GET /api/requests/public?city=:city&service=:service&page=:page',
  ], testScenarios: [
    { name: 'View public requests feed', steps: ['open /proto/states/public-requests', 'verify request cards shown', 'verify filter controls'] },
    { name: 'Empty state', steps: ['open /proto/states/public-requests', 'verify empty state message when no requests'] },
    { name: 'Scroll to bottom', steps: ['open /proto/states/public-requests', 'scroll down', 'verify pagination'] },
  ] },
  { id: 'public-request-detail', title: 'Детали заявки (публ.)', group: 'Public', route: '/requests/1', stateCount: 2, nav: 'public', qaCycles: 3, qaScore: 10, api: [
    'GET /api/requests/:id/public',
  ], testScenarios: [
    { name: 'View public request detail', steps: ['open /proto/states/public-request-detail', 'verify request title visible', 'verify respond button'] },
    { name: 'Respond to request', steps: ['open /proto/states/public-request-detail', 'tap respond', 'verify popup or navigation'] },
  ] },
  { id: 'specialists-catalog', title: 'Каталог специалистов', group: 'Public', route: '/specialists', stateCount: 3, nav: 'public', qaCycles: 3, qaScore: 9, api: [
    'GET /api/specialists?city=:city&service=:service&page=:page',
  ], testScenarios: [
    { name: 'Browse specialists', steps: ['open /proto/states/specialists-catalog', 'verify specialist cards shown', 'verify filter controls'] },
    { name: 'Open specialist profile', steps: ['open /proto/states/specialists-catalog', 'tap specialist card', 'verify navigation to specialist-profile-public'] },
    { name: 'Empty state', steps: ['open /proto/states/specialists-catalog', 'verify empty state when no results'] },
  ] },
  { id: 'pricing', title: 'Тарифы', group: 'Public', route: '/pricing', stateCount: 1, nav: 'public', qaCycles: 3, qaScore: 10, api: [
    'GET /api/pricing/plans',
  ], testScenarios: [
    { name: 'View pricing plans', steps: ['open /proto/states/pricing', 'verify plan cards shown', 'verify highlighted plan'] },
    { name: 'Select plan', steps: ['open /proto/states/pricing', 'tap "Начать" on plan', 'verify CTA action'] },
  ] },

  // Admin
  { id: 'admin-dashboard', title: 'Админ — Главная', group: 'Admin', route: '/(admin)', stateCount: 1, nav: 'admin', activeTab: 'dashboard', qaCycles: 3, qaScore: 9, api: [
    'GET /api/admin/stats',
  ], testScenarios: [
    { name: 'Admin views dashboard', steps: ['open /proto/states/admin-dashboard', 'verify stats cards shown', 'verify navigation tabs'] },
  ] },
  { id: 'admin-users', title: 'Админ — Пользователи', group: 'Admin', route: '/(admin)/users', stateCount: 2, nav: 'admin', activeTab: 'users', qaCycles: 3, qaScore: 10, api: [
    'GET /api/admin/users?role=:role&page=:page',
    'PUT /api/admin/users/:id/block',
  ], testScenarios: [
    { name: 'Admin views users', steps: ['open /proto/states/admin-users', 'verify user table shown', 'verify role filter'] },
    { name: 'Block user', steps: ['open /proto/states/admin-users', 'tap block on user', 'verify confirmation'] },
  ] },
  { id: 'admin-requests', title: 'Админ — Заявки', group: 'Admin', route: '/(admin)/requests', stateCount: 2, nav: 'admin', activeTab: 'requests', qaCycles: 3, qaScore: 10, api: [
    'GET /api/admin/requests?page=:page',
    'PUT /api/admin/requests/:id/moderate',
  ], testScenarios: [
    { name: 'Admin views requests', steps: ['open /proto/states/admin-requests', 'verify request list shown', 'verify status filters'] },
    { name: 'Moderate request', steps: ['open /proto/states/admin-requests', 'tap request row', 'verify moderation action'] },
  ] },
  { id: 'admin-moderation', title: 'Админ — Модерация', group: 'Admin', route: '/(admin)/moderation', stateCount: 3, nav: 'admin', activeTab: 'moderation', qaCycles: 3, qaScore: 9, api: [
    'GET /api/admin/moderation/queue',
    'PUT /api/admin/moderation/:id/approve',
    'PUT /api/admin/moderation/:id/reject',
  ], testScenarios: [
    { name: 'Admin views moderation queue', steps: ['open /proto/states/admin-moderation', 'verify queue items shown', 'verify specialist data'] },
    { name: 'Approve specialist', steps: ['open /proto/states/admin-moderation', 'tap approve', 'verify approval popup'] },
    { name: 'Reject specialist', steps: ['open /proto/states/admin-moderation', 'tap reject', 'verify rejection with comment'] },
  ] },
  { id: 'admin-reviews', title: 'Админ — Отзывы', group: 'Admin', route: '/(admin)/reviews', stateCount: 1, nav: 'admin', activeTab: 'reviews', qaCycles: 3, qaScore: 10, api: [
    'GET /api/admin/reviews?page=:page',
    'DELETE /api/admin/reviews/:id',
  ], testScenarios: [
    { name: 'Admin views reviews', steps: ['open /proto/states/admin-reviews', 'verify review list shown', 'verify delete action'] },
    { name: 'Delete review', steps: ['open /proto/states/admin-reviews', 'tap delete on review', 'verify confirmation'] },
  ] },
  { id: 'admin-promotions', title: 'Админ — Промо', group: 'Admin', route: '/(admin)/promotions', stateCount: 1, nav: 'admin', activeTab: 'promotions', qaCycles: 3, qaScore: 10, api: [
    'GET /api/admin/promotions',
    'POST /api/admin/promotions',
    'PUT /api/admin/promotions/:id',
    'DELETE /api/admin/promotions/:id',
  ], testScenarios: [
    { name: 'Admin views promotions', steps: ['open /proto/states/admin-promotions', 'verify promotion list shown', 'verify create button'] },
    { name: 'Create promotion', steps: ['open /proto/states/admin-promotions', 'tap create', 'verify form shown'] },
  ] },
];

// ---------------------------------------------------------------------------
// Navigation shared by nav variants (links available in header/tab bar)
// ---------------------------------------------------------------------------
// nav: 'public'  → landing, public-requests, specialists-catalog, pricing, auth-email
// nav: 'auth'    → (minimal, logo only — no nav links)
// nav: 'client'  → tabs: home(dashboard), requests(my-requests), messages, profile
// nav: 'specialist' → tabs: dashboard(specialist-dashboard), requests(public-requests), messages, profile
// nav: 'admin'   → tabs: dashboard, users, requests, moderation, reviews, promotions

// ---------------------------------------------------------------------------
// User flow transitions: from page -> to pages (actions a user can take)
// ---------------------------------------------------------------------------
export const PAGE_TRANSITIONS: Record<string, { to: string; action: string }[]> = {
  // === Brand ===
  'nav-components': [],
  'brand': [],
  'components': [],

  // === Public pages (nav: 'public') ===
  'landing': [
    { to: 'auth-email', action: 'Click "Войти"' },
    { to: 'public-requests', action: 'Nav: "Заявки"' },
    { to: 'specialists-catalog', action: 'Nav: "Специалисты"' },
    { to: 'pricing', action: 'Nav: "Тарифы"' },
    { to: 'specialist-profile-public', action: 'Click specialist card in carousel' },
    { to: 'auth-otp', action: 'Submit request form with email (inline OTP)' },
  ],
  'public-requests': [
    { to: 'landing', action: 'Nav: logo / "Главная"' },
    { to: 'auth-email', action: 'Click "Войти"' },
    { to: 'specialists-catalog', action: 'Nav: "Специалисты"' },
    { to: 'pricing', action: 'Nav: "Тарифы"' },
    { to: 'public-request-detail', action: 'Click request card' },
  ],
  'public-request-detail': [
    { to: 'landing', action: 'Nav: logo / "Главная"' },
    { to: 'auth-email', action: 'Click "Войти"' },
    { to: 'public-requests', action: 'Nav: "Заявки" / Back' },
    { to: 'specialists-catalog', action: 'Nav: "Специалисты"' },
    { to: 'pricing', action: 'Nav: "Тарифы"' },
    { to: 'specialist-profile-public', action: 'Click specialist who responded' },
  ],
  'specialists-catalog': [
    { to: 'landing', action: 'Nav: logo / "Главная"' },
    { to: 'auth-email', action: 'Click "Войти"' },
    { to: 'public-requests', action: 'Nav: "Заявки"' },
    { to: 'pricing', action: 'Nav: "Тарифы"' },
    { to: 'specialist-profile-public', action: 'Click specialist card' },
  ],
  'specialist-profile-public': [
    { to: 'landing', action: 'Nav: logo / "Главная"' },
    { to: 'auth-email', action: 'Click "Войти" / "Оставить заявку"' },
    { to: 'public-requests', action: 'Nav: "Заявки"' },
    { to: 'specialists-catalog', action: 'Nav: "Специалисты" / Back' },
    { to: 'pricing', action: 'Nav: "Тарифы"' },
  ],
  'pricing': [
    { to: 'landing', action: 'Nav: logo / "Главная"' },
    { to: 'auth-email', action: 'Click "Войти" / "Начать"' },
    { to: 'public-requests', action: 'Nav: "Заявки"' },
    { to: 'specialists-catalog', action: 'Nav: "Специалисты"' },
  ],

  // === Auth ===
  'auth-email': [
    { to: 'auth-otp', action: 'Submit email → OTP sent' },
    { to: 'landing', action: 'Click logo / Back' },
  ],
  'auth-otp': [
    { to: 'auth-email', action: 'Click "Изменить email" / Back' },
    { to: 'dashboard', action: 'Verify OTP → existing client' },
    { to: 'specialist-dashboard', action: 'Verify OTP → existing specialist' },
    { to: 'admin-dashboard', action: 'Verify OTP → admin' },
    { to: 'onboarding-username', action: 'Verify OTP → new specialist (onboarding)' },
    { to: 'my-requests-new', action: 'Verify OTP → new client (first request)' },
  ],

  // === Onboarding (specialist) ===
  'onboarding-username': [
    { to: 'onboarding-work-area', action: 'Submit username → Next' },
  ],
  'onboarding-work-area': [
    { to: 'onboarding-username', action: 'Back' },
    { to: 'onboarding-profile', action: 'Submit city/FNS/services → Next' },
  ],
  'onboarding-profile': [
    { to: 'onboarding-work-area', action: 'Back' },
    { to: 'specialist-dashboard', action: 'Submit profile → Complete onboarding' },
  ],

  // === Dashboard / Client ===
  'dashboard': [
    { to: 'my-requests', action: 'Tab: "Заявки"' },
    { to: 'messages', action: 'Tab: "Сообщения"' },
    { to: 'profile', action: 'Tab: "Профиль"' },
    { to: 'my-requests-new', action: 'Click "Создать заявку"' },
    { to: 'my-request-detail', action: 'Click active request card' },
    { to: 'responses', action: 'Click unread response notification' },
    { to: 'message-thread', action: 'Click recent message' },
  ],
  'my-requests': [
    { to: 'dashboard', action: 'Tab: "Главная"' },
    { to: 'messages', action: 'Tab: "Сообщения"' },
    { to: 'profile', action: 'Tab: "Профиль"' },
    { to: 'my-requests-new', action: 'Click "Создать заявку"' },
    { to: 'my-request-detail', action: 'Click request card' },
  ],
  'my-requests-new': [
    { to: 'my-requests', action: 'Back / Cancel' },
    { to: 'my-request-detail', action: 'Submit form → request created' },
    { to: 'dashboard', action: 'Tab: "Главная"' },
    { to: 'messages', action: 'Tab: "Сообщения"' },
    { to: 'profile', action: 'Tab: "Профиль"' },
  ],
  'my-request-detail': [
    { to: 'my-requests', action: 'Back' },
    { to: 'responses', action: 'Click "Отклики" / responses count' },
    { to: 'specialist-profile-public', action: 'Click specialist in response' },
    { to: 'message-thread', action: 'Click "Написать" on accepted response' },
    { to: 'dashboard', action: 'Tab: "Главная"' },
    { to: 'messages', action: 'Tab: "Сообщения"' },
    { to: 'profile', action: 'Tab: "Профиль"' },
    { to: 'my-requests', action: 'Delete request → back to list' },
  ],
  'responses': [
    { to: 'my-request-detail', action: 'Back' },
    { to: 'specialist-profile-public', action: 'Click specialist avatar/name' },
    { to: 'message-thread', action: 'Accept response → open chat' },
    { to: 'dashboard', action: 'Tab: "Главная"' },
    { to: 'my-requests', action: 'Tab: "Заявки"' },
    { to: 'messages', action: 'Tab: "Сообщения"' },
    { to: 'profile', action: 'Tab: "Профиль"' },
  ],
  'messages': [
    { to: 'dashboard', action: 'Tab: "Главная"' },
    { to: 'my-requests', action: 'Tab: "Заявки"' },
    { to: 'profile', action: 'Tab: "Профиль"' },
    { to: 'message-thread', action: 'Click thread' },
  ],
  'message-thread': [
    { to: 'messages', action: 'Back' },
    { to: 'specialist-profile-public', action: 'Click specialist avatar/header' },
    { to: 'my-request-detail', action: 'Click linked request' },
    { to: 'dashboard', action: 'Tab: "Главная"' },
    { to: 'my-requests', action: 'Tab: "Заявки"' },
    { to: 'profile', action: 'Tab: "Профиль"' },
  ],
  'profile': [
    { to: 'dashboard', action: 'Tab: "Главная"' },
    { to: 'my-requests', action: 'Tab: "Заявки"' },
    { to: 'messages', action: 'Tab: "Сообщения"' },
    { to: 'settings', action: 'Click "Настройки" / gear icon' },
  ],
  'settings': [
    { to: 'profile', action: 'Back' },
    { to: 'auth-email', action: 'Logout → redirect to login' },
    { to: 'landing', action: 'Delete account → redirect to landing' },
    { to: 'dashboard', action: 'Tab: "Главная"' },
    { to: 'my-requests', action: 'Tab: "Заявки"' },
    { to: 'messages', action: 'Tab: "Сообщения"' },
  ],

  // === Specialist ===
  'specialist-dashboard': [
    { to: 'public-requests', action: 'Tab: "Заявки" (public feed)' },
    { to: 'messages', action: 'Tab: "Сообщения"' },
    { to: 'profile', action: 'Tab: "Профиль"' },
    { to: 'specialist-respond', action: 'Click "Откликнуться" on request card' },
    { to: 'public-request-detail', action: 'Click request card' },
  ],
  'specialist-respond': [
    { to: 'specialist-dashboard', action: 'Back / Cancel' },
    { to: 'specialist-dashboard', action: 'Submit response → success → dashboard' },
    { to: 'public-requests', action: 'Tab: "Заявки"' },
    { to: 'messages', action: 'Tab: "Сообщения"' },
    { to: 'profile', action: 'Tab: "Профиль"' },
  ],

  // === Admin ===
  'admin-dashboard': [
    { to: 'admin-users', action: 'Tab: "Пользователи"' },
    { to: 'admin-requests', action: 'Tab: "Заявки"' },
    { to: 'admin-moderation', action: 'Tab: "Модерация"' },
    { to: 'admin-reviews', action: 'Tab: "Отзывы"' },
    { to: 'admin-promotions', action: 'Tab: "Промо"' },
  ],
  'admin-users': [
    { to: 'admin-dashboard', action: 'Tab: "Главная"' },
    { to: 'admin-requests', action: 'Tab: "Заявки"' },
    { to: 'admin-moderation', action: 'Tab: "Модерация"' },
    { to: 'admin-reviews', action: 'Tab: "Отзывы"' },
    { to: 'admin-promotions', action: 'Tab: "Промо"' },
    { to: 'specialist-profile-public', action: 'Click user row (specialist)' },
  ],
  'admin-requests': [
    { to: 'admin-dashboard', action: 'Tab: "Главная"' },
    { to: 'admin-users', action: 'Tab: "Пользователи"' },
    { to: 'admin-moderation', action: 'Tab: "Модерация"' },
    { to: 'admin-reviews', action: 'Tab: "Отзывы"' },
    { to: 'admin-promotions', action: 'Tab: "Промо"' },
    { to: 'public-request-detail', action: 'Click request row' },
  ],
  'admin-moderation': [
    { to: 'admin-dashboard', action: 'Tab: "Главная"' },
    { to: 'admin-users', action: 'Tab: "Пользователи"' },
    { to: 'admin-requests', action: 'Tab: "Заявки"' },
    { to: 'admin-reviews', action: 'Tab: "Отзывы"' },
    { to: 'admin-promotions', action: 'Tab: "Промо"' },
    { to: 'specialist-profile-public', action: 'Click specialist in queue item' },
  ],
  'admin-reviews': [
    { to: 'admin-dashboard', action: 'Tab: "Главная"' },
    { to: 'admin-users', action: 'Tab: "Пользователи"' },
    { to: 'admin-requests', action: 'Tab: "Заявки"' },
    { to: 'admin-moderation', action: 'Tab: "Модерация"' },
    { to: 'admin-promotions', action: 'Tab: "Промо"' },
  ],
  'admin-promotions': [
    { to: 'admin-dashboard', action: 'Tab: "Главная"' },
    { to: 'admin-users', action: 'Tab: "Пользователи"' },
    { to: 'admin-requests', action: 'Tab: "Заявки"' },
    { to: 'admin-moderation', action: 'Tab: "Модерация"' },
    { to: 'admin-reviews', action: 'Tab: "Отзывы"' },
  ],
};

// ---------------------------------------------------------------------------
// Which pages each role can access
// ---------------------------------------------------------------------------
const PUBLIC_PAGES = [
  'landing',
  'public-requests',
  'public-request-detail',
  'specialists-catalog',
  'specialist-profile-public',
  'pricing',
  'auth-email',
  'auth-otp',
] as const;

const CLIENT_ONLY_PAGES = [
  'dashboard',
  'my-requests',
  'my-requests-new',
  'my-request-detail',
  'responses',
  'messages',
  'message-thread',
  'profile',
  'settings',
] as const;

const SPECIALIST_ONLY_PAGES = [
  'onboarding-username',
  'onboarding-work-area',
  'onboarding-profile',
  'specialist-dashboard',
  'specialist-respond',
  'messages',
  'message-thread',
  'profile',
  'settings',
] as const;

const ADMIN_ONLY_PAGES = [
  'admin-dashboard',
  'admin-users',
  'admin-requests',
  'admin-moderation',
  'admin-reviews',
  'admin-promotions',
] as const;

export const ROLE_PAGES: Record<string, string[]> = {
  public: [...PUBLIC_PAGES],
  client: [...PUBLIC_PAGES, ...CLIENT_ONLY_PAGES],
  specialist: [...PUBLIC_PAGES, ...SPECIALIST_ONLY_PAGES],
  admin: [...PUBLIC_PAGES, ...ADMIN_ONLY_PAGES],
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
