export type ProtoGroup = 'Auth' | 'Onboarding' | 'Dashboard' | 'Specialist' | 'Public' | 'Admin';

export interface ProtoPage {
  id: string;
  title: string;
  group: ProtoGroup;
  route: string;
  stateCount: number;
}

export const PROTO_GROUPS: ProtoGroup[] = [
  'Auth',
  'Onboarding',
  'Dashboard',
  'Specialist',
  'Public',
  'Admin',
];

export const protoRegistry: ProtoPage[] = [
  // Auth
  { id: 'auth-email', title: 'Вход — Email', group: 'Auth', route: '/(auth)/login', stateCount: 3 },
  { id: 'auth-otp', title: 'Вход — OTP код', group: 'Auth', route: '/(auth)/otp', stateCount: 4 },

  // Onboarding
  { id: 'onboarding-username', title: 'Имя пользователя', group: 'Onboarding', route: '/(onboarding)/username', stateCount: 2 },
  { id: 'onboarding-cities', title: 'Выбор городов', group: 'Onboarding', route: '/(onboarding)/cities', stateCount: 3 },
  { id: 'onboarding-services', title: 'Выбор услуг', group: 'Onboarding', route: '/(onboarding)/services', stateCount: 2 },
  { id: 'onboarding-fns', title: 'Привязка ФНС', group: 'Onboarding', route: '/(onboarding)/fns', stateCount: 3 },
  { id: 'onboarding-profile', title: 'Заполнение профиля', group: 'Onboarding', route: '/(onboarding)/profile', stateCount: 2 },

  // Dashboard (Client)
  { id: 'dashboard', title: 'Главная', group: 'Dashboard', route: '/(dashboard)', stateCount: 3 },
  { id: 'my-requests', title: 'Мои заявки', group: 'Dashboard', route: '/(dashboard)/my-requests', stateCount: 3 },
  { id: 'my-requests-new', title: 'Новая заявка', group: 'Dashboard', route: '/(dashboard)/new-request', stateCount: 4 },
  { id: 'my-request-detail', title: 'Детали заявки', group: 'Dashboard', route: '/(dashboard)/request/1', stateCount: 3 },
  { id: 'responses', title: 'Отклики', group: 'Dashboard', route: '/(dashboard)/responses', stateCount: 4 },
  { id: 'messages', title: 'Сообщения', group: 'Dashboard', route: '/(dashboard)/messages', stateCount: 2 },
  { id: 'message-thread', title: 'Чат', group: 'Dashboard', route: '/(dashboard)/messages/1', stateCount: 3 },
  { id: 'profile', title: 'Профиль', group: 'Dashboard', route: '/(dashboard)/profile', stateCount: 2 },
  { id: 'settings', title: 'Настройки', group: 'Dashboard', route: '/(dashboard)/settings', stateCount: 1 },

  // Specialist
  { id: 'specialist-dashboard', title: 'Кабинет специалиста', group: 'Specialist', route: '/specialist', stateCount: 2 },
  { id: 'specialist-respond', title: 'Отклик специалиста', group: 'Specialist', route: '/specialist/respond', stateCount: 3 },
  { id: 'specialist-profile-public', title: 'Публичный профиль', group: 'Specialist', route: '/specialists/1', stateCount: 2 },

  // Public
  { id: 'landing', title: 'Лендинг', group: 'Public', route: '/', stateCount: 4 },
  { id: 'public-requests', title: 'Лента заявок', group: 'Public', route: '/requests', stateCount: 3 },
  { id: 'public-request-detail', title: 'Детали заявки (публ.)', group: 'Public', route: '/requests/1', stateCount: 2 },
  { id: 'specialists-catalog', title: 'Каталог специалистов', group: 'Public', route: '/specialists', stateCount: 3 },
  { id: 'pricing', title: 'Тарифы', group: 'Public', route: '/pricing', stateCount: 1 },

  // Admin
  { id: 'admin-dashboard', title: 'Админ — Главная', group: 'Admin', route: '/(admin)', stateCount: 1 },
  { id: 'admin-users', title: 'Админ — Пользователи', group: 'Admin', route: '/(admin)/users', stateCount: 2 },
  { id: 'admin-requests', title: 'Админ — Заявки', group: 'Admin', route: '/(admin)/requests', stateCount: 2 },
  { id: 'admin-moderation', title: 'Админ — Модерация', group: 'Admin', route: '/(admin)/moderation', stateCount: 3 },
  { id: 'admin-reviews', title: 'Админ — Отзывы', group: 'Admin', route: '/(admin)/reviews', stateCount: 1 },
  { id: 'admin-promotions', title: 'Админ — Промо', group: 'Admin', route: '/(admin)/promotions', stateCount: 1 },
];

export function getPageById(id: string): ProtoPage | undefined {
  return protoRegistry.find((p) => p.id === id);
}

export function getPagesByGroup(group: ProtoGroup): ProtoPage[] {
  return protoRegistry.filter((p) => p.group === group);
}
