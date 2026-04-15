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

export const MOCK_SERVICES = ['Выездная проверка', 'Отдел оперативного контроля', 'Камеральная проверка', 'Не знаю'];

export const MOCK_FNS: Record<string, string[]> = {
  'Москва': ['ФНС №15 по г. Москве', 'ФНС №46 по г. Москве', 'ФНС №7 по г. Москве'],
  'Санкт-Петербург': ['ФНС №1 по г. Санкт-Петербургу', 'ФНС №25 по г. Санкт-Петербургу'],
  'Казань': ['ФНС №3 по г. Казани', 'ФНС №14 по г. Казани'],
  'Новосибирск': ['ФНС №12 по г. Новосибирску'],
  'Екатеринбург': ['ФНС №8 по г. Екатеринбургу'],
  'Ростов-на-Дону': ['ФНС №5 по г. Ростову-на-Дону'],
};

export type RequestStatus = 'NEW' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MockRequest {
  id: string;
  title: string;
  description: string;
  city: string;
  fns: string;
  service: string;
  status: RequestStatus;
  createdAt: string;
  clientName: string;
  messageCount: number;
}

export const MOCK_REQUESTS: MockRequest[] = [
  {
    id: '1',
    title: 'Выездная проверка ООО "Ромашка"',
    description: 'Предстоит выездная налоговая проверка. Нужен специалист для сопровождения и подготовки документов.',
    city: 'Москва',
    fns: 'ФНС №46 по г. Москве',
    service: 'Выездная проверка',
    status: 'NEW',
    createdAt: '2026-04-08',
    clientName: 'Елена Васильева',
    messageCount: 0,
  },
  {
    id: '2',
    title: 'Камеральная проверка декларации',
    description: 'Получил требование о предоставлении документов при камеральной проверке. Нужна помощь с ответом.',
    city: 'Санкт-Петербург',
    fns: 'ФНС №1 по г. Санкт-Петербургу',
    service: 'Камеральная проверка',
    status: 'ACTIVE',
    createdAt: '2026-04-07',
    clientName: 'Дмитрий Козлов',
    messageCount: 3,
  },
  {
    id: '3',
    title: 'Оперативный контроль — помощь с документами',
    description: 'Пришло уведомление от отдела оперативного контроля. Нужна консультация специалиста.',
    city: 'Казань',
    fns: 'ФНС №3 по г. Казани',
    service: 'Отдел оперативного контроля',
    status: 'IN_PROGRESS',
    createdAt: '2026-04-05',
    clientName: 'Татьяна Фёдорова',
    messageCount: 5,
  },
  {
    id: '4',
    title: 'Камеральная проверка по НДС',
    description: 'Камеральная проверка по НДС за 3 квартал. Нужен специалист для подготовки пояснений.',
    city: 'Екатеринбург',
    fns: 'ФНС №8 по г. Екатеринбургу',
    service: 'Камеральная проверка',
    status: 'COMPLETED',
    createdAt: '2026-03-20',
    clientName: 'Елена Васильева',
    messageCount: 2,
  },
  {
    id: '5',
    title: 'Не знаю какая услуга нужна — помогите разобраться',
    description: 'Получил письмо от налоговой, не понимаю что от меня хотят. Нужна консультация.',
    city: 'Ростов-на-Дону',
    fns: 'ФНС №5 по г. Ростову-на-Дону',
    service: 'Не знаю',
    status: 'CANCELLED',
    createdAt: '2026-03-15',
    clientName: 'Дмитрий Козлов',
    messageCount: 1,
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

export interface MockMessageAttachment {
  name: string;
  size: string;
  type: 'pdf' | 'image';
}

export interface MockMessage {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
  read?: boolean;
  attachment?: MockMessageAttachment;
}

export const MOCK_MESSAGES: MockMessage[] = [
  { id: '1', text: 'Здравствуйте! Мне нужна помощь с декларацией 3-НДФЛ за 2025 год.', fromMe: true, time: '10:30', read: true },
  { id: '2', text: 'Добрый день! Подскажите, пожалуйста, какие доходы нужно отразить?', fromMe: false, time: '10:32', read: true },
  { id: '3', text: 'Продажа квартиры и зарплата. Вот документы:', fromMe: true, time: '10:35', read: true, attachment: { name: 'Договор_купли_продажи.pdf', size: '1.2 МБ', type: 'pdf' } },
  { id: '4', text: 'Спасибо, получил. Подготовлю декларацию в течение 2 дней.', fromMe: false, time: '10:37', read: true, attachment: { name: 'Чек-лист_документов.pdf', size: '89 КБ', type: 'pdf' } },
  { id: '5', text: '', fromMe: true, time: '10:40', read: false, attachment: { name: 'Справка_2НДФЛ.jpg', size: '340 КБ', type: 'image' } },
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
