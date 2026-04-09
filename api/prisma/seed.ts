import { PrismaClient, Role, PromotionTier } from '@prisma/client';

const prisma = new PrismaClient();

interface SpecialistSeedData {
  email: string;
  nick: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  headline: string;
  experience: number;
  cities: string[];
  fnsOffices?: string[];
  services: string[];
  badges: string[];
  contacts: string;
  reviews: { rating: number; comment: string }[];
}

const specialists: SpecialistSeedData[] = [
  {
    email: 'ivan.petrov@seed.local',
    nick: 'ivan-petrov',
    displayName: 'Иван Петров',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
    bio: 'Специализируюсь на разрешении налоговых споров с ФНС. Успешно представлял клиентов в арбитражных судах по делам о доначислениях, штрафах и пенях. Помогаю минимизировать налоговые риски для бизнеса.',
    headline: 'Представительство в ФНС — быстро и с результатом',
    experience: 12,
    cities: ['Москва'],
    fnsOffices: ['Инспекция ФНС России № 1 по г.Москве', 'Инспекция ФНС России № 9 по г.Москве', 'Инспекция ФНС России № 15 по г. Москве'],
    services: ['Выездная проверка', 'Камеральная проверка', 'Отдел оперативного контроля'],
    badges: ['verified'],
    contacts: 'Telegram: @ivan_petrov_tax',
    reviews: [
      { rating: 5, comment: 'Блестяще провёл дело в арбитраже. Доначисление в 2.5 млн отменено полностью.' },
      { rating: 5, comment: 'Профессионал высокого уровня. Решил спор с ФНС за 3 месяца.' },
      { rating: 5, comment: 'Очень грамотный юрист, рекомендую всем кто столкнулся с налоговой.' },
      { rating: 4, comment: 'Хороший специалист, помог разобраться с требованиями инспекции.' },
      { rating: 5, comment: 'Спасибо за оперативную работу! Штраф отменён.' },
    ],
  },
  {
    email: 'elena.sokolova@seed.local',
    nick: 'elena-sokolova',
    displayName: 'Елена Соколова',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
    bio: 'Помогаю физическим лицам с декларациями 3-НДФЛ: налоговые вычеты при покупке жилья, лечении, обучении. Заполню и подам декларацию за вас, проконтролирую получение возврата.',
    headline: 'Решу вопрос с камеральной проверкой',
    experience: 8,
    cities: ['Санкт-Петербург'],
    fnsOffices: ['Межрайонная ИФНС России № 16 по Санкт-Петербургу', 'Межрайонная ИФНС России № 20 по Санкт-Петербургу'],
    services: ['Камеральная проверка', 'Выездная проверка'],
    badges: ['verified'],
    contacts: 'WhatsApp: +7 (921) 555-00-01',
    reviews: [
      { rating: 5, comment: 'Елена помогла получить вычет за квартиру. Всё сделала быстро и чётко.' },
      { rating: 5, comment: 'Подала 3-НДФЛ за меня — вернули 260 тысяч. Спасибо!' },
      { rating: 4, comment: 'Хорошая работа, но пришлось немного подождать.' },
      { rating: 5, comment: 'Рекомендую! Очень внимательная и ответственная.' },
    ],
  },
  {
    email: 'dmitry.volkov@seed.local',
    nick: 'dmitry-volkov',
    displayName: 'Дмитрий Волков',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    bio: 'Налоговый консультант для бизнеса. 15 лет опыта в оптимизации налогообложения для ООО и ИП. Помогаю выбрать оптимальную систему налогообложения и легально снизить налоговую нагрузку.',
    headline: '15 лет работы с выездными проверками',
    experience: 15,
    cities: ['Екатеринбург'],
    fnsOffices: ['Межрайонная ИФНС России № 25 по Свердловской области', 'Межрайонная ИФНС России № 32 по Свердловской области'],
    services: ['Выездная проверка', 'Камеральная проверка', 'Отдел оперативного контроля'],
    badges: ['verified'],
    contacts: 'Email: volkov.tax@mail.ru',
    reviews: [
      { rating: 5, comment: 'Дмитрий сэкономил нашей компании более 3 млн рублей в год. Гений оптимизации.' },
      { rating: 5, comment: 'Перевёл нас на УСН и настроил учёт — налоги снизились вдвое.' },
      { rating: 5, comment: 'Лучший налоговый консультант в Екатеринбурге!' },
      { rating: 4, comment: 'Знает своё дело. Немного дороговат, но результат того стоит.' },
      { rating: 5, comment: 'Работаем уже 5 лет — ни одной проблемы с налоговой.' },
    ],
  },
  {
    email: 'maria.novikova@seed.local',
    nick: 'maria-novikova',
    displayName: 'Мария Новикова',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    bio: 'Помогу зарегистрировать ИП или ООО под ключ: подготовка документов, подача в ФНС, выбор ОКВЭД и системы налогообложения. Также консультирую по реорганизации и ликвидации.',
    headline: 'Сопровождение в отделе оперативного контроля ФНС',
    experience: 5,
    cities: ['Казань'],
    services: ['Отдел оперативного контроля', 'Камеральная проверка'],
    badges: ['verified'],
    contacts: 'Telegram: @maria_novikova_biz',
    reviews: [
      { rating: 5, comment: 'Зарегистрировала ООО за 3 дня. Всё чётко и без лишних вопросов.' },
      { rating: 5, comment: 'Помогла выбрать правильные ОКВЭД. Очень благодарна!' },
      { rating: 4, comment: 'Хороший специалист, быстро работает.' },
    ],
  },
  {
    email: 'alexey.kuznetsov@seed.local',
    nick: 'alexey-kuznetsov',
    displayName: 'Алексей Кузнецов',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    bio: 'Эксперт по налоговым вычетам для физических лиц. Помогу вернуть НДФЛ за покупку жилья, лечение, обучение, инвестиции (ИИС). Работаю дистанционно по всей России.',
    headline: 'Камеральные проверки без доначислений — мой результат',
    experience: 10,
    cities: ['Москва'],
    fnsOffices: ['Инспекция ФНС России № 20 по г.Москве', 'Инспекция ФНС России № 21 по г.Москве', 'Инспекция ФНС России № 22 по г. Москве'],
    services: ['Камеральная проверка', 'Выездная проверка', 'Отдел оперативного контроля'],
    badges: ['verified'],
    contacts: 'Email: kuznetsov.tax@gmail.com',
    reviews: [
      { rating: 5, comment: 'Вернул мне 520 тысяч за квартиру + ИИС. Профессионал!' },
      { rating: 5, comment: 'Работает дистанционно — очень удобно. Всё объясняет понятно.' },
      { rating: 4, comment: 'Хороший специалист, но долго отвечал на сообщения.' },
      { rating: 5, comment: 'Помог с вычетом за обучение ребёнка. Спасибо!' },
    ],
  },
  {
    email: 'olga.morozova@seed.local',
    nick: 'olga-morozova',
    displayName: 'Ольга Морозова',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    bio: 'Юрист-налоговик с опытом работы в ФНС. Знаю систему изнутри и помогаю клиентам защищать свои права при проверках и доначислениях. Специализируюсь на спорах с налоговой.',
    headline: 'Бывший сотрудник ФНС — знаю систему изнутри',
    experience: 7,
    cities: ['Новосибирск'],
    services: ['Выездная проверка', 'Камеральная проверка'],
    badges: [],
    contacts: 'Telegram: @morozova_tax',
    reviews: [
      { rating: 5, comment: 'Ольга бывший сотрудник ФНС — знает все нюансы. Помогла снять доначисление.' },
      { rating: 4, comment: 'Грамотный юрист, хорошо представляла в суде.' },
      { rating: 5, comment: 'Спасибо за помощь с камеральной проверкой!' },
    ],
  },
  {
    email: 'sergey.lebedev@seed.local',
    nick: 'sergey-lebedev',
    displayName: 'Сергей Лебедев',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    bio: 'Бухгалтер-консультант с фокусом на НДС. Помогаю компаниям правильно вести учёт НДС, готовить декларации и проходить камеральные проверки без доначислений.',
    headline: 'Камеральные проверки по НДС — прохожу без замечаний',
    experience: 9,
    cities: ['Краснодар'],
    services: ['Камеральная проверка', 'Выездная проверка'],
    badges: ['verified'],
    contacts: 'WhatsApp: +7 (861) 200-00-01',
    reviews: [
      { rating: 5, comment: 'Сергей настроил учёт НДС — прошли проверку без единого замечания.' },
      { rating: 4, comment: 'Хороший бухгалтер, знает тему НДС отлично.' },
      { rating: 5, comment: 'Работаем уже 3 года. Никаких проблем с декларациями.' },
      { rating: 5, comment: 'Рекомендую! Всегда на связи и всё делает в срок.' },
    ],
  },
  {
    email: 'anna.kozlova@seed.local',
    nick: 'anna-kozlova',
    displayName: 'Анна Козлова',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    bio: 'Консультирую самозанятых по налогам и регистрации. Помогу разобраться с приложением "Мой налог", оптимизировать доход и избежать ошибок при работе с платформами.',
    headline: 'Оперативный контроль и самозанятость без штрафов',
    experience: 4,
    cities: ['Санкт-Петербург'],
    services: ['Отдел оперативного контроля', 'Камеральная проверка'],
    badges: ['verified'],
    contacts: 'Telegram: @anna_samozanyatye',
    reviews: [
      { rating: 5, comment: 'Анна помогла мне стать самозанятым и настроить всё за один день!' },
      { rating: 5, comment: 'Отличный консультант! Объяснила все нюансы работы с маркетплейсами.' },
      { rating: 5, comment: 'Быстро, понятно, недорого. Рекомендую!' },
      { rating: 5, comment: 'Помогла разобраться с налогами при работе на Wildberries.' },
      { rating: 4, comment: 'Хороший специалист для начинающих самозанятых.' },
    ],
  },
  {
    email: 'victor.smirnov@seed.local',
    nick: 'victor-smirnov',
    displayName: 'Виктор Смирнов',
    avatarUrl: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face',
    bio: 'Специалист по международному налогообложению. Консультирую по вопросам ВЭД, двойного налогообложения, валютного контроля и работы с иностранными контрагентами.',
    headline: 'Выездные проверки при ВЭД — защищу интересы бизнеса',
    experience: 11,
    cities: ['Ростов-на-Дону'],
    services: ['Выездная проверка', 'Камеральная проверка', 'Отдел оперативного контроля'],
    badges: ['verified'],
    contacts: 'Email: smirnov.international@tax.ru',
    reviews: [
      { rating: 5, comment: 'Виктор помог структурировать ВЭД-операции. Экономия на налогах — существенная.' },
      { rating: 5, comment: 'Разобрался с двойным налогообложением за неделю. Профи!' },
      { rating: 4, comment: 'Знает тему международных налогов как никто другой.' },
      { rating: 5, comment: 'Помог с валютным контролем — всё прошло гладко.' },
    ],
  },
  {
    email: 'tatiana.ivanova@seed.local',
    nick: 'tatiana-ivanova',
    displayName: 'Татьяна Иванова',
    avatarUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=200&fit=crop&crop=face',
    bio: 'Аудитор с 14-летним стажем. Провожу налоговый аудит для компаний любого масштаба: от ИП до крупного бизнеса. Выявляю риски до того, как их найдёт налоговая.',
    headline: 'Подготовлю к выездной проверке — без сюрпризов',
    experience: 14,
    cities: ['Москва'],
    fnsOffices: ['Инспекция ФНС России № 28 по г. Москве', 'Инспекция ФНС России № 29 по г. Москве', 'Инспекция ФНС России № 30 по г. Москве'],
    services: ['Выездная проверка', 'Камеральная проверка', 'Отдел оперативного контроля'],
    badges: ['verified'],
    contacts: 'Telegram: @ivanova_audit',
    reviews: [
      { rating: 5, comment: 'Татьяна нашла ошибки в учёте, которые могли бы стоить нам миллионы.' },
      { rating: 5, comment: 'Провела аудит за 2 недели — очень оперативно для нашего объёма.' },
      { rating: 5, comment: 'Профессионал экстра-класса. Работаем уже 4 года.' },
      { rating: 4, comment: 'Отличный аудитор, помогла подготовиться к выездной проверке.' },
      { rating: 5, comment: 'Рекомендую всем кому нужен качественный налоговый аудит.' },
    ],
  },
];

// --- Seed clients ---
interface ClientSeedData {
  email: string;
  username: string;
}

const seedClients: ClientSeedData[] = [
  { email: 'anna.client@seed.local', username: 'anna-client' },
  { email: 'boris.client@seed.local', username: 'boris-client' },
  { email: 'vera.client@seed.local', username: 'vera-client' },
];

// --- Seed open requests ---
interface RequestSeedData {
  clientEmail: string;
  description: string;
  city: string;
  budget?: number;
  category?: string;
}

const seedRequests: RequestSeedData[] = [
  {
    clientEmail: 'anna.client@seed.local',
    description: 'Нужна помощь с декларацией 3-НДФЛ за 2025 год, имущественный вычет',
    city: 'Москва',
    budget: 5000,
    category: 'Декларации 3-НДФЛ',
  },
  {
    clientEmail: 'anna.client@seed.local',
    description: 'Консультация по налогам при продаже квартиры, владение менее 5 лет',
    city: 'Москва',
    budget: 3000,
    category: 'Налоговые консультации',
  },
  {
    clientEmail: 'boris.client@seed.local',
    description: 'Регистрация ООО под ключ с выбором системы налогообложения',
    city: 'Казань',
    budget: 15000,
    category: 'Регистрация бизнеса',
  },
  {
    clientEmail: 'boris.client@seed.local',
    description: 'Спор с ФНС по доначислению НДС за 2024 год, нужен представитель в суде',
    city: 'Екатеринбург',
    budget: 50000,
    category: 'Налоговые споры',
  },
  {
    clientEmail: 'vera.client@seed.local',
    description: 'Оптимизация налогообложения для ИП на УСН, годовой оборот 10 млн',
    city: 'Краснодар',
    budget: 20000,
    category: 'Оптимизация налогов',
  },
];

// --- Seed promotions ---
interface PromotionSeedData {
  specialistEmail: string;
  city: string;
  tier: PromotionTier;
  daysFromNow: number;
}

const seedPromotions: PromotionSeedData[] = [
  { specialistEmail: 'ivan.petrov@seed.local', city: 'Москва', tier: 'TOP', daysFromNow: 30 },
  { specialistEmail: 'elena.sokolova@seed.local', city: 'Санкт-Петербург', tier: 'FEATURED', daysFromNow: 14 },
  { specialistEmail: 'dmitry.volkov@seed.local', city: 'Екатеринбург', tier: 'BASIC', daysFromNow: 7 },
];

// --- Seed chat threads with messages ---
interface ThreadSeedData {
  email1: string;
  email2: string;
  messages: { senderEmail: string; content: string }[];
}

const seedThreads: ThreadSeedData[] = [
  {
    email1: 'anna.client@seed.local',
    email2: 'ivan.petrov@seed.local',
    messages: [
      { senderEmail: 'anna.client@seed.local', content: 'Здравствуйте! Увидела ваш профиль, нужна помощь с налоговым спором.' },
      { senderEmail: 'ivan.petrov@seed.local', content: 'Добрый день! Расскажите подробнее о ситуации — какая инспекция, сумма доначисления?' },
      { senderEmail: 'anna.client@seed.local', content: 'ИФНС №9 по Москве, доначислили 1.2 млн за 2023 год. Считаю что незаконно.' },
      { senderEmail: 'ivan.petrov@seed.local', content: 'Понял, давайте запланируем встречу. Предварительно — шансы на отмену хорошие.' },
    ],
  },
  {
    email1: 'boris.client@seed.local',
    email2: 'maria.novikova@seed.local',
    messages: [
      { senderEmail: 'boris.client@seed.local', content: 'Мария, хочу зарегистрировать ООО в Казани. Сколько времени займёт?' },
      { senderEmail: 'maria.novikova@seed.local', content: 'Обычно 3-5 рабочих дней. Подготовлю все документы, вам нужно будет только подписать.' },
      { senderEmail: 'boris.client@seed.local', content: 'Отлично, давайте начнём. Какие документы от меня нужны?' },
    ],
  },
  {
    email1: 'vera.client@seed.local',
    email2: 'sergey.lebedev@seed.local',
    messages: [
      { senderEmail: 'vera.client@seed.local', content: 'Сергей, нужна консультация по НДС для моего ИП.' },
      { senderEmail: 'sergey.lebedev@seed.local', content: 'Конечно! ИП на общей системе или УСН? Какой оборот?' },
    ],
  },
];

// --- Seed responses from specialists to requests ---
interface ResponseSeedData {
  specialistEmail: string;
  requestDescription: string;
  message: string;
}

const seedResponses: ResponseSeedData[] = [
  {
    specialistEmail: 'ivan.petrov@seed.local',
    requestDescription: 'Спор с ФНС по доначислению НДС за 2024 год, нужен представитель в суде',
    message: 'Имею большой опыт в подобных делах. Готов взяться, предварительно оцениваю шансы как высокие.',
  },
  {
    specialistEmail: 'elena.sokolova@seed.local',
    requestDescription: 'Нужна помощь с декларацией 3-НДФЛ за 2025 год, имущественный вычет',
    message: 'Специализируюсь именно на 3-НДФЛ и вычетах. Подготовлю и подам за вас в течение 2 дней.',
  },
  {
    specialistEmail: 'maria.novikova@seed.local',
    requestDescription: 'Регистрация ООО под ключ с выбором системы налогообложения',
    message: 'Регистрирую ООО под ключ за 3-5 дней. Помогу выбрать оптимальную систему налогообложения.',
  },
];

// Helper: find or create request by description match
async function findOrCreateRequest(
  clientId: string,
  description: string,
  city: string,
  budget?: number,
  category?: string,
) {
  const existing = await prisma.request.findMany({
    where: { clientId, description },
  });
  if (existing[0]) return existing[0];
  return prisma.request.create({
    data: { clientId, description, city, budget, category, status: 'OPEN' },
  });
}

// Helper: create thread with correct participant ordering
async function findOrCreateThread(userId1: string, userId2: string) {
  // Enforce participant1Id < participant2Id (application-level constraint)
  const [p1, p2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
  const existing = await prisma.thread.findUnique({
    where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
  });
  if (existing) return existing;
  return prisma.thread.create({
    data: { participant1Id: p1, participant2Id: p2 },
  });
}

async function main() {
  console.log('Seeding specialists...');

  for (const spec of specialists) {
    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: { role: Role.SPECIALIST },
      create: {
        email: spec.email,
        username: spec.nick,
        role: Role.SPECIALIST,
      },
    });

    // Upsert specialist profile
    await prisma.specialistProfile.upsert({
      where: { userId: user.id },
      update: {
        nick: spec.nick,
        displayName: spec.displayName,
        bio: spec.bio,
        headline: spec.headline,
        experience: spec.experience,
        cities: spec.cities,
        fnsOffices: spec.fnsOffices ?? [],
        services: spec.services,
        badges: spec.badges,
        contacts: spec.contacts,
        avatarUrl: spec.avatarUrl,
      },
      create: {
        userId: user.id,
        nick: spec.nick,
        displayName: spec.displayName,
        bio: spec.bio,
        headline: spec.headline,
        experience: spec.experience,
        cities: spec.cities,
        fnsOffices: spec.fnsOffices ?? [],
        services: spec.services,
        badges: spec.badges,
        contacts: spec.contacts,
        avatarUrl: spec.avatarUrl,
      },
    });

    // Create a dummy request from a client to enable reviews
    // Find or create a dummy client
    const client = await prisma.user.upsert({
      where: { email: 'seed-client@seed.local' },
      update: {},
      create: {
        email: 'seed-client@seed.local',
        username: 'seed-client',
        role: Role.CLIENT,
      },
    });

    // Create a request if not exists
    const existingRequests = await prisma.request.findMany({
      where: { clientId: client.id, description: `Seed request for ${spec.nick}` },
    });
    let request = existingRequests[0];
    if (!request) {
      request = await prisma.request.create({
        data: {
          clientId: client.id,
          description: `Seed request for ${spec.nick}`,
          city: spec.cities[0],
          status: 'CLOSED',
        },
      });
    }

    // Create a response from the specialist for this request
    await prisma.response.upsert({
      where: {
        specialistId_requestId: {
          specialistId: user.id,
          requestId: request.id,
        },
      },
      update: {},
      create: {
        specialistId: user.id,
        requestId: request.id,
        message: 'Seed response',
      },
    });

    // Create reviews (delete existing seed reviews first to avoid duplicates)
    const existingReviews = await prisma.review.findMany({
      where: { specialistId: user.id, clientId: client.id },
    });
    if (existingReviews.length === 0 && spec.reviews.length > 0) {
      // We need separate clients for separate reviews since unique constraint is [clientId, specialistId, requestId]
      for (let i = 0; i < spec.reviews.length; i++) {
        const reviewerEmail = `seed-reviewer-${i}@seed.local`;
        const reviewer = await prisma.user.upsert({
          where: { email: reviewerEmail },
          update: {},
          create: {
            email: reviewerEmail,
            username: `reviewer-${i}`,
            role: Role.CLIENT,
          },
        });

        // Each reviewer needs their own request
        const reviewerRequests = await prisma.request.findMany({
          where: { clientId: reviewer.id, description: `Seed review request for ${spec.nick}` },
        });
        let reviewerRequest = reviewerRequests[0];
        if (!reviewerRequest) {
          reviewerRequest = await prisma.request.create({
            data: {
              clientId: reviewer.id,
              description: `Seed review request for ${spec.nick}`,
              city: spec.cities[0],
              status: 'CLOSED',
            },
          });
        }

        // Response from specialist
        await prisma.response.upsert({
          where: {
            specialistId_requestId: {
              specialistId: user.id,
              requestId: reviewerRequest.id,
            },
          },
          update: {},
          create: {
            specialistId: user.id,
            requestId: reviewerRequest.id,
            message: 'Seed response for review',
          },
        });

        // Create review
        const existing = await prisma.review.findUnique({
          where: {
            clientId_specialistId_requestId: {
              clientId: reviewer.id,
              specialistId: user.id,
              requestId: reviewerRequest.id,
            },
          },
        });
        if (!existing) {
          await prisma.review.create({
            data: {
              clientId: reviewer.id,
              specialistId: user.id,
              requestId: reviewerRequest.id,
              rating: spec.reviews[i].rating,
              comment: spec.reviews[i].comment,
            },
          });
        }
      }
    }

    console.log(`  Created specialist: ${spec.displayName} (@${spec.nick})`);
  }

  // --- Seed additional clients ---
  console.log('Seeding clients...');
  const clientMap: Record<string, { id: string }> = {};
  for (const c of seedClients) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { email: c.email, username: c.username, role: Role.CLIENT },
    });
    clientMap[c.email] = user;
    console.log(`  Created client: ${c.username}`);
  }

  // --- Seed open requests ---
  console.log('Seeding requests...');
  for (const r of seedRequests) {
    const client = clientMap[r.clientEmail];
    if (!client) continue;
    const req = await findOrCreateRequest(client.id, r.description, r.city, r.budget, r.category);
    console.log(`  Request: "${r.description.slice(0, 50)}..." (${req.id})`);
  }

  // --- Seed promotions ---
  console.log('Seeding promotions...');
  for (const p of seedPromotions) {
    const specialist = await prisma.user.findUnique({ where: { email: p.specialistEmail } });
    if (!specialist) continue;
    const expiresAt = new Date(Date.now() + p.daysFromNow * 24 * 60 * 60 * 1000);
    // Check if active promotion already exists for this specialist+city+tier
    const existing = await prisma.promotion.findFirst({
      where: { specialistId: specialist.id, city: p.city, tier: p.tier, expiresAt: { gt: new Date() } },
    });
    if (!existing) {
      await prisma.promotion.create({
        data: { specialistId: specialist.id, city: p.city, tier: p.tier, expiresAt },
      });
    }
    console.log(`  Promotion: ${p.specialistEmail} — ${p.tier} in ${p.city}`);
  }

  // --- Seed chat threads with messages ---
  console.log('Seeding chat threads...');
  for (const t of seedThreads) {
    const user1 = await prisma.user.findUnique({ where: { email: t.email1 } });
    const user2 = await prisma.user.findUnique({ where: { email: t.email2 } });
    if (!user1 || !user2) continue;

    const thread = await findOrCreateThread(user1.id, user2.id);

    // Check if messages already exist for this thread
    const msgCount = await prisma.message.count({ where: { threadId: thread.id } });
    if (msgCount === 0) {
      for (let i = 0; i < t.messages.length; i++) {
        const sender = t.messages[i].senderEmail === t.email1 ? user1 : user2;
        await prisma.message.create({
          data: {
            threadId: thread.id,
            senderId: sender.id,
            content: t.messages[i].content,
            createdAt: new Date(Date.now() - (t.messages.length - i) * 60000), // stagger by 1 min
          },
        });
      }
    }
    console.log(`  Thread: ${t.email1} <-> ${t.email2} (${t.messages.length} messages)`);
  }

  // --- Seed responses from specialists to open requests ---
  console.log('Seeding specialist responses...');
  for (const r of seedResponses) {
    const specialist = await prisma.user.findUnique({ where: { email: r.specialistEmail } });
    if (!specialist) continue;

    // Find the request by description
    const request = await prisma.request.findFirst({ where: { description: r.requestDescription } });
    if (!request) continue;

    await prisma.response.upsert({
      where: {
        specialistId_requestId: { specialistId: specialist.id, requestId: request.id },
      },
      update: {},
      create: { specialistId: specialist.id, requestId: request.id, message: r.message },
    });
    console.log(`  Response: ${r.specialistEmail} -> "${r.requestDescription.slice(0, 40)}..."`);
  }

  // --- Seed admin users ---
  // Emails must match ADMIN_EMAILS env var used by AdminGuard
  console.log('Seeding admin users...');
  for (const adminEntry of [
    { email: 'admin@p2ptax.ru', username: 'admin' },
    { email: 'dev@p2ptax.ru', username: 'dev_admin' },
  ]) {
    await prisma.user.upsert({
      where: { email: adminEntry.email },
      update: {},
      create: {
        email: adminEntry.email,
        username: adminEntry.username,
        role: Role.CLIENT,
      },
    });
    console.log(`  Created admin user: ${adminEntry.email} (OTP 000000 in dev mode)`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
