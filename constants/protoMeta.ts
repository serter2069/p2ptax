/**
 * protoMeta.ts — Project metadata for the proto-viewer overview page.
 * Contains project description, roles, and key user scenarios from UC.
 */

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------
export const PROJECT = {
  name: 'Налоговик (P2PTax)',
  description: 'Налоговый информационный арбитраж. Маркетплейс для поиска налоговых специалистов (юристов, консультантов) в любом городе России.',
  version: '1.0.0',
  stack: 'Expo (React Native web-first) + NestJS API + PostgreSQL',
  protoViewerUrl: 'http://localhost:9081',
  appUrl: 'http://localhost:8081',
};

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------
export interface Role {
  id: string;
  title: string;
  description: string;
  color: string;
  entryPage: string;
  pages: string[];
}

export const ROLES: Role[] = [
  {
    id: 'client',
    title: 'Клиент',
    description: 'Ищет налогового специалиста. Публикует заявку, получает отклики, выбирает специалиста и общается в чате.',
    color: '#1A5BA8',
    entryPage: 'landing',
    pages: [
      'landing',
      'auth-email',
      'auth-otp',
      'dashboard',
      'my-requests',
      'my-requests-new',
      'my-request-detail',
      'responses',
      'messages',
      'message-thread',
      'profile',
      'settings',
    ],
  },
  {
    id: 'specialist',
    title: 'Специалист',
    description: 'Налоговый консультант или юрист. Проходит онбординг, видит ленту заявок, откликается, общается с клиентами.',
    color: '#059669',
    entryPage: 'auth-email',
    pages: [
      'auth-email',
      'auth-otp',
      'onboarding-username',
      'onboarding-work-area',
      'onboarding-profile',
      'specialist-dashboard',
      'specialist-respond',
      'public-requests',
      'public-request-detail',
      'messages',
      'message-thread',
      'profile',
      'settings',
    ],
  },
  {
    id: 'admin',
    title: 'Администратор',
    description: 'Модерирует специалистов, заявки и отзывы. Управляет пользователями и промо-тарифами.',
    color: '#DC2626',
    entryPage: 'admin-dashboard',
    pages: [
      'admin-dashboard',
      'admin-users',
      'admin-requests',
      'admin-moderation',
      'admin-reviews',
      'admin-promotions',
    ],
  },
  {
    id: 'guest',
    title: 'Гость',
    description: 'Незарегистрированный пользователь. Просматривает лендинг, каталог специалистов, ленту заявок. Может создать заявку без регистрации.',
    color: '#D97706',
    entryPage: 'landing',
    pages: [
      'landing',
      'public-requests',
      'public-request-detail',
      'specialists-catalog',
      'specialist-profile-public',
      'pricing',
      'auth-email',
    ],
  },
];

// ---------------------------------------------------------------------------
// Key User Scenarios (from UC)
// ---------------------------------------------------------------------------
export interface Scenario {
  id: string;
  title: string;
  role: string;
  description: string;
  steps: { page: string; action: string }[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'client-create-request',
    title: 'Клиент создаёт заявку',
    role: 'client',
    description: 'Авторизованный клиент публикует заявку и получает отклики от специалистов.',
    steps: [
      { page: 'dashboard', action: 'Открывает дашборд, нажимает "Создать заявку"' },
      { page: 'my-requests-new', action: 'Заполняет форму: описание, город, ФНС, тип услуги' },
      { page: 'my-request-detail', action: 'Заявка создана, ожидает откликов' },
      { page: 'responses', action: 'Просматривает отклики специалистов' },
      { page: 'message-thread', action: 'Начинает переписку с выбранным специалистом' },
    ],
  },
  {
    id: 'guest-quick-request',
    title: 'Гость — быстрая заявка с лендинга',
    role: 'guest',
    description: 'Незарегистрированный пользователь создаёт заявку прямо на лендинге, регистрируется через OTP.',
    steps: [
      { page: 'landing', action: 'Видит форму быстрой заявки, вводит описание + email' },
      { page: 'auth-otp', action: 'Вводит OTP-код из письма (dev: 000000)' },
      { page: 'my-request-detail', action: 'Аккаунт создан, заявка опубликована' },
    ],
  },
  {
    id: 'specialist-onboarding',
    title: 'Регистрация специалиста',
    role: 'specialist',
    description: 'Новый специалист регистрируется через email OTP и проходит онбординг.',
    steps: [
      { page: 'auth-email', action: 'Вводит email, выбирает роль "Специалист"' },
      { page: 'auth-otp', action: 'Вводит OTP-код' },
      { page: 'onboarding-username', action: 'Выбирает уникальное имя' },
      { page: 'onboarding-work-area', action: 'Указывает город, ФНС, виды услуг' },
      { page: 'onboarding-profile', action: 'Загружает фото, пишет о себе' },
      { page: 'specialist-dashboard', action: 'Онбординг завершён, кабинет открыт' },
    ],
  },
  {
    id: 'specialist-respond',
    title: 'Специалист откликается',
    role: 'specialist',
    description: 'Специалист находит подходящую заявку и отправляет отклик.',
    steps: [
      { page: 'specialist-dashboard', action: 'Видит новые заявки в дашборде' },
      { page: 'public-request-detail', action: 'Читает детали заявки' },
      { page: 'specialist-respond', action: 'Пишет сообщение клиенту, указывает цену и срок' },
      { page: 'specialist-dashboard', action: 'Отклик отправлен, ожидает ответа клиента' },
    ],
  },
  {
    id: 'admin-moderation',
    title: 'Модерация профиля специалиста',
    role: 'admin',
    description: 'Администратор проверяет новый профиль специалиста перед публикацией.',
    steps: [
      { page: 'admin-moderation', action: 'Видит профили в очереди модерации' },
      { page: 'admin-moderation', action: 'Проверяет документы и данные' },
      { page: 'admin-moderation', action: 'Одобряет или отклоняет профиль с комментарием' },
      { page: 'admin-users', action: 'Специалист становится видимым в каталоге' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Proto rules (for agents building new pages)
// ---------------------------------------------------------------------------
export const PROTO_RULES = [
  'Иконки только Feather (@expo/vector-icons). Emoji — блокер.',
  'Изображения: picsum.photos/seed/NAME/W/H для фото, не серые заглушки.',
  'Цвета только из Colors.ts. Никаких хардкодных hex кроме тех, у которых нет токена.',
  'Верстка резиновая: мобилка + десктоп в одном коде, без maxWidth: 430.',
  'Все кнопки навигации ведут на /proto/states/[id] (Pressable с window.open).',
  'После каждой страницы — proto-check, минимум 5 циклов.',
  'stateCount в pageRegistry должен точно соответствовать числу <StateSection> в файле.',
];
