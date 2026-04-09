export type PageGroup = 'Brand' | 'Auth' | 'Onboarding' | 'Dashboard' | 'Specialist' | 'Public' | 'Admin';
export type NavVariant = 'public' | 'auth' | 'client' | 'specialist' | 'admin';

export interface PageNote {
  date: string;
  state?: string;
  text: string;
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
}

export const PAGE_GROUPS: PageGroup[] = [
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
  { id: 'brand-style', title: 'Бренд и стили', group: 'Brand', route: '/brand', stateCount: 1, nav: 'public' },

  // Auth
  { id: 'auth-email', title: 'Вход — Email', group: 'Auth', route: '/(auth)/login', stateCount: 3, nav: 'auth' },
  { id: 'auth-otp', title: 'Вход — OTP код', group: 'Auth', route: '/(auth)/otp', stateCount: 4, nav: 'auth' },

  // Onboarding (specialist)
  { id: 'onboarding-username', title: 'Имя пользователя', group: 'Onboarding', route: '/(onboarding)/username', stateCount: 2, nav: 'auth' },
  { id: 'onboarding-cities', title: 'Выбор городов', group: 'Onboarding', route: '/(onboarding)/cities', stateCount: 3, nav: 'auth' },
  { id: 'onboarding-services', title: 'Выбор услуг', group: 'Onboarding', route: '/(onboarding)/services', stateCount: 2, nav: 'auth', notes: [
    { date: '2026-04-09', state: 'INTERACTIVE', text: 'Услуги: Выездная проверка, Отдел оперативного контроля, Камеральная проверка' },
  ] },
  { id: 'onboarding-fns', title: 'Привязка ФНС', group: 'Onboarding', route: '/(onboarding)/fns', stateCount: 3, nav: 'auth', notes: [
    { date: '2026-04-09', state: 'DEFAULT', text: 'Онбординг для специалиста. ИНН не нужен. Специалист выбирает ФНС по городу + категории услуг при каждой ФНС.' },
  ] },
  { id: 'onboarding-profile', title: 'Заполнение профиля', group: 'Onboarding', route: '/(onboarding)/profile', stateCount: 2, nav: 'auth', notes: [
    { date: '2026-04-09', state: 'DEFAULT', text: 'Иконка профиля вместо фото если нет фото. Убрать Опыт работы.' },
  ] },

  // Dashboard (Client)
  { id: 'dashboard', title: 'Главная', group: 'Dashboard', route: '/(dashboard)', stateCount: 3, nav: 'client', activeTab: 'home' },
  { id: 'my-requests', title: 'Мои заявки', group: 'Dashboard', route: '/(dashboard)/my-requests', stateCount: 3, nav: 'client', activeTab: 'requests' },
  { id: 'my-requests-new', title: 'Новая заявка', group: 'Dashboard', route: '/(dashboard)/new-request', stateCount: 4, nav: 'client', activeTab: 'requests' },
  { id: 'my-request-detail', title: 'Детали заявки', group: 'Dashboard', route: '/(dashboard)/request/1', stateCount: 3, nav: 'client', activeTab: 'requests' },
  { id: 'responses', title: 'Отклики', group: 'Dashboard', route: '/(dashboard)/responses', stateCount: 4, nav: 'client', activeTab: 'requests' },
  { id: 'messages', title: 'Сообщения', group: 'Dashboard', route: '/(dashboard)/messages', stateCount: 2, nav: 'client', activeTab: 'messages' },
  { id: 'message-thread', title: 'Чат', group: 'Dashboard', route: '/(dashboard)/messages/1', stateCount: 3, nav: 'client', activeTab: 'messages' },
  { id: 'profile', title: 'Профиль', group: 'Dashboard', route: '/(dashboard)/profile', stateCount: 2, nav: 'client', activeTab: 'profile' },
  { id: 'settings', title: 'Настройки', group: 'Dashboard', route: '/(dashboard)/settings', stateCount: 1, nav: 'client', activeTab: 'profile' },

  // Specialist
  { id: 'specialist-dashboard', title: 'Кабинет специалиста', group: 'Specialist', route: '/specialist', stateCount: 2, nav: 'specialist', activeTab: 'dashboard' },
  { id: 'specialist-respond', title: 'Отклик специалиста', group: 'Specialist', route: '/specialist/respond', stateCount: 3, nav: 'specialist', activeTab: 'dashboard' },
  { id: 'specialist-profile-public', title: 'Публичный профиль', group: 'Specialist', route: '/specialists/1', stateCount: 2, nav: 'public' },

  // Public
  { id: 'landing', title: 'Лендинг', group: 'Public', route: '/', stateCount: 4, nav: 'public', notes: [
    { date: '2026-04-09', text: 'Карусель специалистов. Форма заявки: город -> ФНС -> описание + email/имя -> OTP верификация -> отправка.' },
  ] },
  { id: 'public-requests', title: 'Лента заявок', group: 'Public', route: '/requests', stateCount: 3, nav: 'public' },
  { id: 'public-request-detail', title: 'Детали заявки (публ.)', group: 'Public', route: '/requests/1', stateCount: 2, nav: 'public' },
  { id: 'specialists-catalog', title: 'Каталог специалистов', group: 'Public', route: '/specialists', stateCount: 3, nav: 'public' },
  { id: 'pricing', title: 'Тарифы', group: 'Public', route: '/pricing', stateCount: 1, nav: 'public' },

  // Admin
  { id: 'admin-dashboard', title: 'Админ — Главная', group: 'Admin', route: '/(admin)', stateCount: 1, nav: 'admin', activeTab: 'dashboard' },
  { id: 'admin-users', title: 'Админ — Пользователи', group: 'Admin', route: '/(admin)/users', stateCount: 2, nav: 'admin', activeTab: 'users' },
  { id: 'admin-requests', title: 'Админ — Заявки', group: 'Admin', route: '/(admin)/requests', stateCount: 2, nav: 'admin', activeTab: 'requests' },
  { id: 'admin-moderation', title: 'Админ — Модерация', group: 'Admin', route: '/(admin)/moderation', stateCount: 3, nav: 'admin', activeTab: 'moderation' },
  { id: 'admin-reviews', title: 'Админ — Отзывы', group: 'Admin', route: '/(admin)/reviews', stateCount: 1, nav: 'admin', activeTab: 'reviews' },
  { id: 'admin-promotions', title: 'Админ — Промо', group: 'Admin', route: '/(admin)/promotions', stateCount: 1, nav: 'admin', activeTab: 'promotions' },
];

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
