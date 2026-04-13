// Shared mock data for proto pages — realistic Russian names, cities, services

export const MOCK_USERS = [
  { id: '1', name: 'Елена Васильева', email: 'elena@mail.ru', role: 'CLIENT' as const, city: 'Москва', avatar: null },
  { id: '2', name: 'Алексей Петров', email: 'apetrov@yandex.ru', role: 'SPECIALIST' as const, city: 'Санкт-Петербург', avatar: null },
  { id: '3', name: 'Ольга Смирнова', email: 'olga.s@gmail.com', role: 'SPECIALIST' as const, city: 'Новосибирск', avatar: null },
  { id: '4', name: 'Дмитрий Козлов', email: 'dkozlov@mail.ru', role: 'CLIENT' as const, city: 'Екатеринбург', avatar: null },
  { id: '5', name: 'Анна Морозова', email: 'anna.m@yandex.ru', role: 'SPECIALIST' as const, city: 'Казань', avatar: null },
  { id: '6', name: 'Игорь Новиков', email: 'inovikov@mail.ru', role: 'SPECIALIST' as const, city: 'Москва', avatar: null },
  { id: '7', name: 'Татьяна Фёдорова', email: 'tfedorova@gmail.com', role: 'CLIENT' as const, city: 'Ростов-на-Дону', avatar: null },
];

export const MOCK_CITIES = [
  'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург',
  'Казань', 'Ростов-на-Дону', 'Нижний Новгород', 'Краснодар',
  'Самара', 'Воронеж', 'Уфа', 'Челябинск',
];

export const MOCK_SERVICES = [
  { id: '1', name: 'Декларация 3-НДФЛ', category: 'Декларации' },
  { id: '2', name: 'Регистрация ИП', category: 'Регистрация' },
  { id: '3', name: 'Консультация по налогам', category: 'Консультации' },
  { id: '4', name: 'Бухгалтерский учёт', category: 'Бухгалтерия' },
  { id: '5', name: 'Оптимизация налогов', category: 'Консультации' },
  { id: '6', name: 'Закрытие ИП', category: 'Регистрация' },
  { id: '7', name: 'Налоговый вычет', category: 'Вычеты' },
  { id: '8', name: 'Представление в ФНС', category: 'Представительство' },
  { id: '9', name: 'Проверка контрагентов', category: 'Проверки' },
  { id: '10', name: 'Декларация по УСН', category: 'Декларации' },
];

export type RequestStatus = 'NEW' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MockRequest {
  id: string;
  title: string;
  description: string;
  city: string;
  service: string;
  status: RequestStatus;
  budget: string;
  createdAt: string;
  clientName: string;
  responseCount: number;
}

export const MOCK_REQUESTS: MockRequest[] = [
  {
    id: '1',
    title: 'Заполнить декларацию 3-НДФЛ за 2025 год',
    description: 'Нужно заполнить и подать декларацию 3-НДФЛ для получения налогового вычета за покупку квартиры. Документы готовы.',
    city: 'Москва',
    service: 'Декларация 3-НДФЛ',
    status: 'NEW',
    budget: '3 000 — 5 000 ₽',
    createdAt: '2026-04-08',
    clientName: 'Елена Васильева',
    responseCount: 0,
  },
  {
    id: '2',
    title: 'Регистрация ИП на УСН',
    description: 'Планирую открыть ИП для фриланса (IT-услуги). Нужна помощь с выбором ОКВЭД и системы налогообложения.',
    city: 'Санкт-Петербург',
    service: 'Регистрация ИП',
    status: 'ACTIVE',
    budget: '5 000 — 8 000 ₽',
    createdAt: '2026-04-07',
    clientName: 'Дмитрий Козлов',
    responseCount: 3,
  },
  {
    id: '3',
    title: 'Оптимизация налогов для ООО',
    description: 'Нужна консультация по оптимизации налоговой нагрузки для небольшого ООО (торговля). Оборот ~5 млн в год.',
    city: 'Казань',
    service: 'Оптимизация налогов',
    status: 'IN_PROGRESS',
    budget: '10 000 — 15 000 ₽',
    createdAt: '2026-04-05',
    clientName: 'Татьяна Фёдорова',
    responseCount: 5,
  },
  {
    id: '4',
    title: 'Представление в налоговой при камеральной проверке',
    description: 'Получил требование о предоставлении документов. Нужен специалист, который поможет подготовить ответ и представит мои интересы.',
    city: 'Екатеринбург',
    service: 'Представление в ФНС',
    status: 'COMPLETED',
    budget: '15 000 — 25 000 ₽',
    createdAt: '2026-03-20',
    clientName: 'Елена Васильева',
    responseCount: 2,
  },
  {
    id: '5',
    title: 'Закрытие ИП с долгами по налогам',
    description: 'Нужно закрыть ИП, есть задолженность по взносам. Помогите разобраться с долгами и правильно закрыть.',
    city: 'Ростов-на-Дону',
    service: 'Закрытие ИП',
    status: 'CANCELLED',
    budget: '7 000 — 12 000 ₽',
    createdAt: '2026-03-15',
    clientName: 'Дмитрий Козлов',
    responseCount: 1,
  },
];

export interface MockResponse {
  id: string;
  specialistName: string;
  specialistCity: string;
  rating: number;
  reviewCount: number;
  price: string;
  message: string;
  createdAt: string;
}

export const MOCK_RESPONSES: MockResponse[] = [
  {
    id: '1',
    specialistName: 'Алексей Петров',
    specialistCity: 'Санкт-Петербург',
    rating: 4.8,
    reviewCount: 42,
    price: '4 500 ₽',
    message: 'Здравствуйте! Готов помочь с декларацией. Опыт работы — 8 лет, более 200 успешных деклараций. Срок выполнения — 2 рабочих дня.',
    createdAt: '2026-04-08',
  },
  {
    id: '2',
    specialistName: 'Ольга Смирнова',
    specialistCity: 'Новосибирск',
    rating: 4.9,
    reviewCount: 67,
    price: '3 800 ₽',
    message: 'Добрый день! Специализируюсь на налоговых вычетах. Помогу заполнить декларацию и проконтролирую возврат.',
    createdAt: '2026-04-08',
  },
  {
    id: '3',
    specialistName: 'Анна Морозова',
    specialistCity: 'Казань',
    rating: 4.6,
    reviewCount: 28,
    price: '5 000 ₽',
    message: 'Работаю с физлицами и ИП. Полное сопровождение от подготовки до подачи.',
    createdAt: '2026-04-09',
  },
];

export interface MockMessage {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
}

export const MOCK_MESSAGES: MockMessage[] = [
  { id: '1', text: 'Здравствуйте! Интересует ваше предложение по декларации 3-НДФЛ.', fromMe: true, time: '10:30' },
  { id: '2', text: 'Добрый день! Да, готов помочь. Какие документы у вас на руках?', fromMe: false, time: '10:32' },
  { id: '3', text: 'Есть справка 2-НДФЛ, договор купли-продажи квартиры и акт приёма-передачи.', fromMe: true, time: '10:35' },
  { id: '4', text: 'Отлично, этого достаточно. Ещё понадобится копия паспорта и реквизиты для возврата.', fromMe: false, time: '10:37' },
  { id: '5', text: 'Хорошо, подготовлю всё. Когда можно начать?', fromMe: true, time: '10:40' },
  { id: '6', text: 'Можем начать завтра. Пришлите сканы документов, и я приступлю.', fromMe: false, time: '10:42' },
  { id: '7', text: 'Договорились! Отправлю сегодня вечером.', fromMe: true, time: '10:45' },
  { id: '8', text: 'Жду. Если возникнут вопросы по документам — пишите.', fromMe: false, time: '10:46' },
  { id: '9', text: 'Скажите, а сколько обычно занимает возврат после подачи?', fromMe: true, time: '11:00' },
  { id: '10', text: 'Обычно 3-4 месяца с момента подачи. Но бывает и быстрее, если всё оформлено корректно.', fromMe: false, time: '11:03' },
];

export interface MockThread {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export const MOCK_THREADS: MockThread[] = [
  { id: '1', name: 'Алексей Петров', lastMessage: 'Обычно 3-4 месяца с момента подачи.', time: '11:03', unread: 1 },
  { id: '2', name: 'Ольга Смирнова', lastMessage: 'Документы получила, начну завтра.', time: 'Вчера', unread: 0 },
  { id: '3', name: 'Анна Морозова', lastMessage: 'Здравствуйте! Готова обсудить детали.', time: 'Вчера', unread: 2 },
  { id: '4', name: 'Игорь Новиков', lastMessage: 'Спасибо за обращение!', time: '05.04', unread: 0 },
  { id: '5', name: 'Техподдержка', lastMessage: 'Ваш вопрос решён. Обращайтесь!', time: '01.04', unread: 0 },
];

export interface MockSpecialist {
  id: string;
  name: string;
  city: string;
  services: string[];
  rating: number;
  reviewCount: number;
  experience: string;
  description: string;
  completedOrders: number;
}

export const MOCK_SPECIALISTS: MockSpecialist[] = [
  {
    id: '1',
    name: 'Алексей Петров',
    city: 'Санкт-Петербург',
    services: ['Декларация 3-НДФЛ', 'Налоговый вычет', 'Консультация по налогам'],
    rating: 4.8,
    reviewCount: 42,
    experience: '8 лет',
    description: 'Налоговый консультант с опытом работы в ФНС. Специализация — НДФЛ и имущественные вычеты.',
    completedOrders: 215,
  },
  {
    id: '2',
    name: 'Ольга Смирнова',
    city: 'Новосибирск',
    services: ['Бухгалтерский учёт', 'Регистрация ИП', 'Декларация по УСН'],
    rating: 4.9,
    reviewCount: 67,
    experience: '12 лет',
    description: 'Главный бухгалтер с опытом в малом и среднем бизнесе. Веду ИП и ООО под ключ.',
    completedOrders: 340,
  },
  {
    id: '3',
    name: 'Анна Морозова',
    city: 'Казань',
    services: ['Оптимизация налогов', 'Представление в ФНС', 'Проверка контрагентов'],
    rating: 4.6,
    reviewCount: 28,
    experience: '5 лет',
    description: 'Юрист по налоговому праву. Защита интересов в налоговых спорах и при проверках.',
    completedOrders: 89,
  },
  {
    id: '4',
    name: 'Игорь Новиков',
    city: 'Москва',
    services: ['Декларация 3-НДФЛ', 'Регистрация ИП', 'Закрытие ИП'],
    rating: 4.7,
    reviewCount: 35,
    experience: '6 лет',
    description: 'Практикующий бухгалтер. Быстро и качественно — от регистрации до ликвидации.',
    completedOrders: 156,
  },
  {
    id: '5',
    name: 'Марина Соколова',
    city: 'Краснодар',
    services: ['Бухгалтерский учёт', 'Декларация по УСН', 'Консультация по налогам'],
    rating: 5.0,
    reviewCount: 12,
    experience: '3 года',
    description: 'Молодой специалист с современным подходом. Работаю удалённо по всей России.',
    completedOrders: 45,
  },
];

export interface MockReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  specialistName: string;
}

export const MOCK_REVIEWS: MockReview[] = [
  { id: '1', author: 'Елена В.', rating: 5, text: 'Отличный специалист! Всё сделал быстро и профессионально. Вычет получила за 2 месяца.', date: '05.04.2026', specialistName: 'Алексей Петров' },
  { id: '2', author: 'Дмитрий К.', rating: 4, text: 'Хорошая работа, но немного затянулись сроки. В целом доволен результатом.', date: '01.04.2026', specialistName: 'Алексей Петров' },
  { id: '3', author: 'Татьяна Ф.', rating: 5, text: 'Рекомендую! Помогла разобраться с оптимизацией налогов, сэкономили значительную сумму.', date: '28.03.2026', specialistName: 'Анна Морозова' },
  { id: '4', author: 'Игорь Н.', rating: 3, text: 'Работа выполнена, но коммуникация могла быть лучше. Долго отвечала на сообщения.', date: '20.03.2026', specialistName: 'Ольга Смирнова' },
  { id: '5', author: 'Анна М.', rating: 5, text: 'Супер! Закрыл ИП за 3 дня, всё чётко и по делу.', date: '15.03.2026', specialistName: 'Игорь Новиков' },
];

export const MOCK_ADMIN_STATS = {
  totalUsers: 1247,
  totalSpecialists: 189,
  totalRequests: 3456,
  activeRequests: 127,
  completedRequests: 2890,
  revenue: '1 245 000 ₽',
  newUsersToday: 23,
  newRequestsToday: 15,
  pendingModeration: 8,
  avgRating: 4.7,
};

export type SpecialistResponseStatus = 'sent' | 'viewed' | 'accepted' | 'deactivated';

export interface MockSpecialistResponse {
  id: string;
  requestId: string;
  requestTitle: string;
  requestCity: string;
  requestService: string;
  requestDeadline: string;
  price: string;
  status: SpecialistResponseStatus;
  createdAt: string;
  threadId?: string;
}

export const MOCK_SPECIALIST_RESPONSES: MockSpecialistResponse[] = [
  {
    id: 'sr1',
    requestId: '1',
    requestTitle: 'Заполнить декларацию 3-НДФЛ за 2025 год',
    requestCity: 'Москва',
    requestService: 'Декларация 3-НДФЛ',
    requestDeadline: '2026-04-30',
    price: '4 500 ₽',
    status: 'sent',
    createdAt: '2026-04-08',
  },
  {
    id: 'sr2',
    requestId: '2',
    requestTitle: 'Регистрация ИП на УСН',
    requestCity: 'Санкт-Петербург',
    requestService: 'Регистрация ИП',
    requestDeadline: '2026-04-20',
    price: '6 000 ₽',
    status: 'viewed',
    createdAt: '2026-04-07',
  },
  {
    id: 'sr3',
    requestId: '3',
    requestTitle: 'Оптимизация налогов для ООО',
    requestCity: 'Казань',
    requestService: 'Оптимизация налогов',
    requestDeadline: '2026-05-15',
    price: '12 000 ₽',
    status: 'accepted',
    threadId: '1',
    createdAt: '2026-04-05',
  },
  {
    id: 'sr4',
    requestId: '4',
    requestTitle: 'Представление в налоговой при камеральной проверке',
    requestCity: 'Екатеринбург',
    requestService: 'Представление в ФНС',
    requestDeadline: '2026-04-10',
    price: '18 000 ₽',
    status: 'deactivated',
    createdAt: '2026-03-20',
  },
  {
    id: 'sr5',
    requestId: '5',
    requestTitle: 'Закрытие ИП с долгами по налогам',
    requestCity: 'Ростов-на-Дону',
    requestService: 'Закрытие ИП',
    requestDeadline: '2026-04-25',
    price: '8 000 ₽',
    status: 'sent',
    createdAt: '2026-04-10',
  },
];

export const MOCK_PRICING_PLANS = [
  {
    id: 'free',
    name: 'Бесплатный',
    price: '0 ₽',
    period: 'навсегда',
    features: ['До 3 заявок в месяц', 'Базовый поиск специалистов', 'Чат с исполнителями'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Профессионал',
    price: '990 ₽',
    period: 'в месяц',
    features: ['Безлимитные заявки', 'Приоритет в выдаче', 'Расширенный профиль', 'Аналитика', 'Верификация ФНС'],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Бизнес',
    price: '2 490 ₽',
    period: 'в месяц',
    features: ['Всё из Профессионала', 'Команда до 5 человек', 'API доступ', 'Персональный менеджер', 'Приоритетная поддержка'],
    highlighted: false,
  },
];
