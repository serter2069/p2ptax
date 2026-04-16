/**
 * Demo seed: realistic staging data for ad launch.
 *
 * CRITICAL RULES:
 *  - IDEMPOTENT. Runs on every deploy. Never blanket-delete.
 *  - Upsert by unique keys (email, nick, idempotencyKey).
 *  - All demo emails use `.demo` TLD (`demo.<slug>@p2ptax.demo`) so they cannot
 *    collide with real onboarding users.
 *  - Fills only demo-owned rows. Does not touch real users' data.
 *
 * Runs via `npm run demo:seed` (see api/package.json) → `doppler run -- ts-node prisma/demo-seed.ts`.
 */
import { PrismaClient, Role, RequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Static demo data
// ─────────────────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  'Выездная проверка',
  'Камеральная проверка',
  'Отдел оперативного контроля',
];

interface DemoSpecialist {
  slug: string; // used for email/nick — stable key for upsert
  firstName: string;
  lastName: string;
  displayName: string;
  city: string;
  extraCities?: string[];
  bio: string;
  headline: string;
  experience: number;
  hourlyRate: number;
  services: string[];
  avatarUrl: string | null;
}

// Unsplash image IDs — stable public URLs, no auth.
const av = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&crop=faces`;

const SPECIALISTS: DemoSpecialist[] = [
  {
    slug: 'ivanov-mikhail',
    firstName: 'Михаил',
    lastName: 'Иванов',
    displayName: 'Михаил Иванов',
    city: 'Москва',
    bio: 'Налоговый консультант с 12-летним стажем. Специализация — выездные и камеральные проверки ФНС. Сопровождаю бизнес от первого запроса до закрытия акта.',
    headline: 'Опытный налоговый консультант, 12 лет в ФНС',
    experience: 12,
    hourlyRate: 4500,
    services: ['Выездная проверка', 'Камеральная проверка'],
    avatarUrl: av('1472099645785-5658abf4ff4e'),
  },
  {
    slug: 'petrova-elena',
    firstName: 'Елена',
    lastName: 'Петрова',
    displayName: 'Елена Петрова',
    city: 'Москва',
    extraCities: ['Санкт-Петербург'],
    bio: 'Эксперт по камеральным проверкам. Помогаю снимать претензии инспекции, готовлю возражения на акты, сопровождаю на комиссиях.',
    headline: 'Камералки и возражения — главная специализация',
    experience: 9,
    hourlyRate: 3800,
    services: ['Камеральная проверка', 'Отдел оперативного контроля'],
    avatarUrl: av('1494790108377-be9c29b29330'),
  },
  {
    slug: 'sidorov-aleksey',
    firstName: 'Алексей',
    lastName: 'Сидоров',
    displayName: 'Алексей Сидоров',
    city: 'Санкт-Петербург',
    bio: 'Юрист по налоговым спорам. Веду дела от досудебного обжалования до арбитража. 40+ выигранных процессов за последние 3 года.',
    headline: 'Налоговые споры, арбитраж — более 40 побед',
    experience: 15,
    hourlyRate: 5500,
    services: ['Выездная проверка', 'Камеральная проверка'],
    avatarUrl: av('1507003211169-0a1dd7228f2d'),
  },
  {
    slug: 'kozlova-anna',
    firstName: 'Анна',
    lastName: 'Козлова',
    displayName: 'Анна Козлова',
    city: 'Казань',
    bio: 'Работаю с малым и средним бизнесом. Налоговые вычеты, декларации 3-НДФЛ, разблокировка счетов, досудебное обжалование.',
    headline: 'Налоговый вычет и разблокировка счёта — под ключ',
    experience: 7,
    hourlyRate: 3000,
    services: ['Камеральная проверка', 'Отдел оперативного контроля'],
    avatarUrl: av('1438761681033-6461ffad8d80'),
  },
  {
    slug: 'volkov-dmitriy',
    firstName: 'Дмитрий',
    lastName: 'Волков',
    displayName: 'Дмитрий Волков',
    city: 'Новосибирск',
    bio: 'Бывший сотрудник ФНС, 8 лет в службе. Знаю внутреннюю кухню проверок, помогаю готовить документы так, чтобы инспекция не цеплялась.',
    headline: 'Экс-инспектор ФНС. Знаю, как смотрят внутри',
    experience: 14,
    hourlyRate: 4200,
    services: ['Выездная проверка'],
    avatarUrl: av('1500648767791-00dcc994a43e'),
  },
  {
    slug: 'smirnova-olga',
    firstName: 'Ольга',
    lastName: 'Смирнова',
    displayName: 'Ольга Смирнова',
    city: 'Екатеринбург',
    bio: 'Аудитор, налоговый консультант, 10 лет практики. Сопровождаю выездные проверки, помогаю с возражениями и судебным обжалованием.',
    headline: 'Аудит + налоговое сопровождение. Уральский регион.',
    experience: 10,
    hourlyRate: 3600,
    services: ['Выездная проверка', 'Камеральная проверка'],
    avatarUrl: av('1580489944761-15a19d654956'),
  },
  {
    slug: 'morozov-sergey',
    firstName: 'Сергей',
    lastName: 'Морозов',
    displayName: 'Сергей Морозов',
    city: 'Санкт-Петербург',
    bio: 'Специалист по оперативному контролю — ККТ, маркировка, 54-ФЗ. Помогаю отбиться от штрафов, оспорить протоколы.',
    headline: 'Оперативный контроль, ККТ, маркировка',
    experience: 6,
    hourlyRate: 2800,
    services: ['Отдел оперативного контроля'],
    avatarUrl: av('1519085360753-af0119f7cbe7'),
  },
  {
    slug: 'novikova-maria',
    firstName: 'Мария',
    lastName: 'Новикова',
    displayName: 'Мария Новикова',
    city: 'Москва',
    extraCities: ['Казань'],
    bio: 'Налоговый консультант, специализация — ИП и самозанятые. НПД, УСН, переход между режимами, работа с уведомлениями ЕНС.',
    headline: 'ИП и самозанятые: все режимы + ЕНС',
    experience: 5,
    hourlyRate: 2500,
    services: ['Камеральная проверка'],
    avatarUrl: av('1534528741775-53994a69daeb'),
  },
  {
    slug: 'fedorov-pavel',
    firstName: 'Павел',
    lastName: 'Фёдоров',
    displayName: 'Павел Фёдоров',
    city: 'Новосибирск',
    bio: 'Юрист-налоговик. Сопровождение выездных и встречных проверок, работа с доказательной базой, подготовка к допросам.',
    headline: 'Выездные проверки и допросы свидетелей',
    experience: 11,
    hourlyRate: 4000,
    services: ['Выездная проверка', 'Отдел оперативного контроля'],
    avatarUrl: av('1506794778202-cad84cf45f1d'),
  },
  {
    slug: 'belyaeva-irina',
    firstName: 'Ирина',
    lastName: 'Беляева',
    displayName: 'Ирина Беляева',
    city: 'Екатеринбург',
    bio: 'Консультирую по НДС, налогу на прибыль и трансфертному ценообразованию. Сопровождаю группы компаний на проверках.',
    headline: 'НДС, прибыль, ТЦО — для групп компаний',
    experience: 13,
    hourlyRate: 4800,
    services: ['Выездная проверка', 'Камеральная проверка'],
    avatarUrl: av('1489424731084-a5d8b219a5bb'),
  },
];

interface DemoRequestTpl {
  slug: string;
  title: string;
  description: string;
  city: string;
  serviceType: string;
  budget: number | null;
  status: RequestStatus;
}

const REQUESTS: DemoRequestTpl[] = [
  {
    slug: 'req-decl-3ndfl-2024',
    title: 'Декларация 3-НДФЛ за 2024 год',
    description: 'Продал квартиру, которая была в собственности меньше 3 лет. Нужна помощь с подачей 3-НДФЛ и расчётом налога к уплате.',
    city: 'Москва',
    serviceType: 'Камеральная проверка',
    budget: 5000,
    status: RequestStatus.ACTIVE,
  },
  {
    slug: 'req-vychet-lechenie',
    title: 'Помощь с налоговым вычетом за лечение',
    description: 'Оплачивал дорогостоящее лечение в 2023 и 2024 годах. Есть все чеки и договоры. Прошу помочь оформить и подать документы на вычет.',
    city: 'Санкт-Петербург',
    serviceType: 'Камеральная проверка',
    budget: 3500,
    status: RequestStatus.ACTIVE,
  },
  {
    slug: 'req-vyezdnaya-ooo',
    title: 'Сопровождение выездной проверки ООО',
    description: 'Пришло решение о назначении выездной проверки за 3 года. ООО на УСН. Нужен специалист для полного сопровождения: запросы, ответы, акты, возражения.',
    city: 'Москва',
    serviceType: 'Выездная проверка',
    budget: 120000,
    status: RequestStatus.ACTIVE,
  },
  {
    slug: 'req-blokirovka-scheta',
    title: 'Разблокировка расчётного счёта',
    description: 'ФНС заблокировала счёт по ст. 76 НК РФ. Уверены, что все отчёты сданы. Нужно срочно разобраться и снять блокировку.',
    city: 'Казань',
    serviceType: 'Отдел оперативного контроля',
    budget: 8000,
    status: RequestStatus.ACTIVE,
  },
  {
    slug: 'req-kameralka-nds',
    title: 'Возражения на акт камеральной проверки по НДС',
    description: 'Пришёл акт камералки, доначислили НДС 800 тыс. Считаем доначисление необоснованным. Нужно подготовить возражения и сопровождать на комиссии.',
    city: 'Санкт-Петербург',
    serviceType: 'Камеральная проверка',
    budget: 45000,
    status: RequestStatus.CLOSED,
  },
  {
    slug: 'req-vychet-kvartira',
    title: 'Имущественный вычет за покупку квартиры',
    description: 'Купил первую квартиру в ипотеку в 2024. Нужна помощь с оформлением и подачей документов на имущественный вычет и вычет по процентам.',
    city: 'Новосибирск',
    serviceType: 'Камеральная проверка',
    budget: 4000,
    status: RequestStatus.CLOSED,
  },
  {
    slug: 'req-kkt-shtraf',
    title: 'Оспорить штраф за ККТ',
    description: 'Получили протокол за непробитый чек на 30 тыс. Считаем, что ситуация спорная. Нужно подготовить обжалование и защиту.',
    city: 'Москва',
    serviceType: 'Отдел оперативного контроля',
    budget: 12000,
    status: RequestStatus.ACTIVE,
  },
  {
    slug: 'req-samozan-perehod',
    title: 'Переход с самозанятости на ИП',
    description: 'Доход приближается к лимиту НПД. Хочу заранее перейти на ИП УСН. Нужна консультация по выбору режима и порядку перехода.',
    city: 'Екатеринбург',
    serviceType: 'Камеральная проверка',
    budget: 2500,
    status: RequestStatus.CLOSED,
  },
  {
    slug: 'req-vstrechka',
    title: 'Встречная проверка по контрагенту',
    description: 'ФНС прислала требование о представлении документов в рамках встречной проверки. Контрагент крупный, запросов много. Нужна помощь.',
    city: 'Казань',
    serviceType: 'Выездная проверка',
    budget: 25000,
    status: RequestStatus.ACTIVE,
  },
  {
    slug: 'req-ens-razbor',
    title: 'Разобраться с сальдо ЕНС',
    description: 'В личном кабинете ФНС висит непонятная задолженность по ЕНС. Платежи проходили, но сальдо не сходится. Нужно разобраться и привести в порядок.',
    city: 'Москва',
    serviceType: 'Камеральная проверка',
    budget: 5000,
    status: RequestStatus.ACTIVE,
  },
  {
    slug: 'req-markirovka',
    title: 'Нарушение по маркировке — помощь с ответом',
    description: 'Пришёл запрос от ФНС по маркировке обуви. Часть кодов не прошла, есть риски штрафов. Нужно подготовить ответ и обоснование.',
    city: 'Санкт-Петербург',
    serviceType: 'Отдел оперативного контроля',
    budget: 15000,
    status: RequestStatus.ACTIVE,
  },
  {
    slug: 'req-vychet-obuchenie',
    title: 'Социальный вычет за обучение ребёнка',
    description: 'Плачу за обучение сына в вузе, есть договор и платёжки за 2023–2024. Нужно оформить социальный вычет и подать в ИФНС.',
    city: 'Новосибирск',
    serviceType: 'Камеральная проверка',
    budget: 2500,
    status: RequestStatus.CLOSED,
  },
  {
    slug: 'req-vyezdka-ip',
    title: 'Выездная проверка у ИП, первый раз',
    description: 'Как ИП на ОСНО получил решение о выездной проверке. Опыта нет, нужен полный пэкинг — от подготовки документов до представления интересов.',
    city: 'Екатеринбург',
    serviceType: 'Выездная проверка',
    budget: 80000,
    status: RequestStatus.ACTIVE,
  },
  {
    slug: 'req-dopros-svid',
    title: 'Подготовка к допросу в ФНС',
    description: 'Вызывают на допрос в качестве свидетеля по деятельности контрагента. Не знаю, что говорить, нужна подготовка и, возможно, присутствие.',
    city: 'Москва',
    serviceType: 'Выездная проверка',
    budget: 15000,
    status: RequestStatus.ACTIVE,
  },
  {
    slug: 'req-uproschenka',
    title: 'Выбор между УСН 6% и 15%',
    description: 'Открываю бизнес в сфере услуг. Оборот около 15 млн в год, расходы ~60%. Нужно посчитать и выбрать оптимальный вариант УСН.',
    city: 'Казань',
    serviceType: 'Камеральная проверка',
    budget: 2000,
    status: RequestStatus.CLOSED,
  },
];

interface DemoReviewTpl {
  clientSlug: string; // which client (demo client) wrote it
  requestSlug: string;
  specialistSlug: string;
  rating: number;
  comment: string;
}

// 20 reviews, spread across specialists with CLOSED requests
const REVIEWS: DemoReviewTpl[] = [
  { clientSlug: 'client-petr', requestSlug: 'req-kameralka-nds', specialistSlug: 'sidorov-aleksey', rating: 5, comment: 'Доначисление сняли полностью. Алексей провёл через возражения, комиссию и апелляцию. Очень грамотный подход.' },
  { clientSlug: 'client-natalya', requestSlug: 'req-kameralka-nds', specialistSlug: 'petrova-elena', rating: 5, comment: 'Елена разобралась с камералкой очень быстро. Все документы подготовила сама, мне оставалось только подписать.' },
  { clientSlug: 'client-anna', requestSlug: 'req-vychet-kvartira', specialistSlug: 'volkov-dmitriy', rating: 5, comment: 'Оформили вычет за 3 недели, включая проценты по ипотеке. Дмитрий очень подробно всё объяснил.' },
  { clientSlug: 'client-sergey', requestSlug: 'req-vychet-kvartira', specialistSlug: 'morozov-sergey', rating: 4, comment: 'В целом хорошо, вычет получил. По срокам немного затянули, но не критично.' },
  { clientSlug: 'client-maxim', requestSlug: 'req-samozan-perehod', specialistSlug: 'smirnova-olga', rating: 5, comment: 'Ольга подобрала оптимальный режим, помогла с заявлением. Консультация окупилась за первый же квартал.' },
  { clientSlug: 'client-olga', requestSlug: 'req-samozan-perehod', specialistSlug: 'belyaeva-irina', rating: 5, comment: 'Всё сделали чётко и без лишних вопросов. Рекомендую.' },
  { clientSlug: 'client-petr', requestSlug: 'req-vychet-obuchenie', specialistSlug: 'kozlova-anna', rating: 5, comment: 'Анна оформила вычет за обучение сына, включая прошлые годы. Теперь знаю, к кому обращаться.' },
  { clientSlug: 'client-natalya', requestSlug: 'req-vychet-obuchenie', specialistSlug: 'fedorov-pavel', rating: 4, comment: 'Всё прошло нормально, документы приняли с первого раза.' },
  { clientSlug: 'client-anna', requestSlug: 'req-uproschenka', specialistSlug: 'novikova-maria', rating: 5, comment: 'Мария просчитала оба варианта, сравнила и дала чёткую рекомендацию. Выбрали УСН 15%, экономия ощутимая.' },
  { clientSlug: 'client-sergey', requestSlug: 'req-uproschenka', specialistSlug: 'ivanov-mikhail', rating: 5, comment: 'Михаил — профи. Быстро сориентировался, предложил оптимальный вариант и помог с переходом.' },
  { clientSlug: 'client-maxim', requestSlug: 'req-kameralka-nds', specialistSlug: 'ivanov-mikhail', rating: 4, comment: 'С возражениями помог, но пришлось немного подождать ответа. Итог хороший.' },
  { clientSlug: 'client-olga', requestSlug: 'req-vychet-kvartira', specialistSlug: 'petrova-elena', rating: 5, comment: 'Елена — супер. Вычет за квартиру и проценты оформили без запинки.' },
  { clientSlug: 'client-petr', requestSlug: 'req-samozan-perehod', specialistSlug: 'sidorov-aleksey', rating: 5, comment: 'Алексей разложил всё по полочкам: риски, сроки, документы. Перешли спокойно, без потерь.' },
  { clientSlug: 'client-natalya', requestSlug: 'req-vychet-obuchenie', specialistSlug: 'kozlova-anna', rating: 5, comment: 'Анна помогла разобраться с вычетом за обучение за 2 года сразу. Получили всё, что положено.' },
  { clientSlug: 'client-anna', requestSlug: 'req-uproschenka', specialistSlug: 'volkov-dmitriy', rating: 4, comment: 'Дмитрий дал развёрнутую консультацию, выбор стал очевиден. Небольшая задержка по времени, но не страшно.' },
  { clientSlug: 'client-sergey', requestSlug: 'req-kameralka-nds', specialistSlug: 'belyaeva-irina', rating: 5, comment: 'Ирина — мастер камералок. Все доначисления оспорили, процесс прошёл спокойно и уверенно.' },
  { clientSlug: 'client-maxim', requestSlug: 'req-vychet-kvartira', specialistSlug: 'smirnova-olga', rating: 3, comment: 'Вычет получил, но пришлось несколько раз уточнять и напоминать. Работа сделана, но без изюминки.' },
  { clientSlug: 'client-olga', requestSlug: 'req-vychet-obuchenie', specialistSlug: 'morozov-sergey', rating: 4, comment: 'Сергей помог с вычетом, объяснил нюансы. Всё корректно.' },
  { clientSlug: 'client-petr', requestSlug: 'req-uproschenka', specialistSlug: 'novikova-maria', rating: 5, comment: 'Мария — молодец. Чётко, по делу, без воды.' },
  { clientSlug: 'client-natalya', requestSlug: 'req-samozan-perehod', specialistSlug: 'fedorov-pavel', rating: 5, comment: 'Павел помог с переходом на ИП и заодно разобрался с налоговыми режимами на будущее.' },
];

interface DemoClient {
  slug: string;
  firstName: string;
  lastName: string;
  city: string;
}

// Demo clients — both for owning requests and writing reviews
const CLIENTS: DemoClient[] = [
  { slug: 'client-petr', firstName: 'Пётр', lastName: 'Васильев', city: 'Москва' },
  { slug: 'client-natalya', firstName: 'Наталья', lastName: 'Григорьева', city: 'Санкт-Петербург' },
  { slug: 'client-anna', firstName: 'Анна', lastName: 'Захарова', city: 'Казань' },
  { slug: 'client-sergey', firstName: 'Сергей', lastName: 'Лебедев', city: 'Новосибирск' },
  { slug: 'client-maxim', firstName: 'Максим', lastName: 'Попов', city: 'Екатеринбург' },
  { slug: 'client-olga', firstName: 'Ольга', lastName: 'Соколова', city: 'Москва' },
];

// Each request is owned by a rotating client
const REQUEST_OWNERS: Record<string, string> = {
  'req-decl-3ndfl-2024': 'client-petr',
  'req-vychet-lechenie': 'client-natalya',
  'req-vyezdnaya-ooo': 'client-olga',
  'req-blokirovka-scheta': 'client-anna',
  'req-kameralka-nds': 'client-natalya', // CLOSED, reviewed
  'req-vychet-kvartira': 'client-anna',  // CLOSED, reviewed
  'req-kkt-shtraf': 'client-petr',
  'req-samozan-perehod': 'client-maxim',  // CLOSED, reviewed
  'req-vstrechka': 'client-sergey',
  'req-ens-razbor': 'client-olga',
  'req-markirovka': 'client-natalya',
  'req-vychet-obuchenie': 'client-petr',  // CLOSED, reviewed
  'req-vyezdka-ip': 'client-maxim',
  'req-dopros-svid': 'client-sergey',
  'req-uproschenka': 'client-anna',       // CLOSED, reviewed
};

// Threads: pair (requestSlug → specialistSlug) with a few messages
interface DemoThreadTpl {
  requestSlug: string;
  specialistSlug: string;
  messages: { fromSpecialist: boolean; content: string }[];
}

const THREADS: DemoThreadTpl[] = [
  {
    requestSlug: 'req-decl-3ndfl-2024',
    specialistSlug: 'ivanov-mikhail',
    messages: [
      { fromSpecialist: true, content: 'Здравствуйте! Готов помочь с декларацией. Уточните, пожалуйста, сумму продажи и есть ли документы на первоначальную покупку.' },
      { fromSpecialist: false, content: 'Здравствуйте! Сумма продажи 6.5 млн. Договор покупки и ДКП продажи есть.' },
      { fromSpecialist: true, content: 'Отлично, с такими документами уменьшим налоговую базу на расходы. За декларацию 3-НДФЛ плюс сопровождение — 5 000 ₽.' },
    ],
  },
  {
    requestSlug: 'req-vyezdnaya-ooo',
    specialistSlug: 'sidorov-aleksey',
    messages: [
      { fromSpecialist: true, content: 'Добрый день! Вижу решение о ВНП. Пришлите, пожалуйста, его скан и перечень запрошенных документов — оценю объём работ.' },
      { fromSpecialist: false, content: 'Решение приложил, запросы пока нет, только первый лист с датой начала.' },
      { fromSpecialist: true, content: 'Понял. Стартуем с анализа баз и подготовки сводного пакета. Работаю по фикс-пакету + почасовая за выездные заседания. Подробности в коммерческом.' },
      { fromSpecialist: false, content: 'Хорошо, жду коммерческое.' },
    ],
  },
  {
    requestSlug: 'req-vychet-lechenie',
    specialistSlug: 'petrova-elena',
    messages: [
      { fromSpecialist: true, content: 'Здравствуйте. По лечению есть лимит на обычное (120 тыс. в сумме со всеми соцвычетами) и отдельно на дорогостоящее — без лимита. Пришлите справки по форме, посмотрим, что куда отнести.' },
      { fromSpecialist: false, content: 'Справки есть, код 2 — дорогостоящее, код 1 — обычное. Сумма суммарно ~480 тыс.' },
      { fromSpecialist: true, content: 'Отлично. Готовлю 3-НДФЛ и опись документов. Подадим через ЛК ФНС, контроль по срокам беру на себя.' },
    ],
  },
  {
    requestSlug: 'req-blokirovka-scheta',
    specialistSlug: 'kozlova-anna',
    messages: [
      { fromSpecialist: true, content: 'Здравствуйте! По ст. 76 обычно блокировка за несданную отчётность или за долг по ЕНС. Пришлите решение о приостановлении — разберёмся, за что именно.' },
      { fromSpecialist: false, content: 'Решение прислали: «в связи с неисполнением требования». Но требования в ЛК я не вижу.' },
      { fromSpecialist: true, content: 'Значит либо не дошло, либо ушло по старым реквизитам. Сделаю запрос в инспекцию, после ответа снимем блокировку. Стандартный срок 1–3 рабочих дня.' },
    ],
  },
  {
    requestSlug: 'req-kkt-shtraf',
    specialistSlug: 'morozov-sergey',
    messages: [
      { fromSpecialist: true, content: 'Добрый день! По ч. 2 ст. 14.5 КоАП штраф от 1/4 до 1/2 суммы расчёта, но минимум 10 тыс. Если нарушение первое и добровольно признано — реально снизить. Пришлите протокол.' },
      { fromSpecialist: false, content: 'Протокол прислал. Это наш первый случай.' },
      { fromSpecialist: true, content: 'Тогда готовим ходатайство о замене штрафа на предупреждение — шансы высокие. Плюс отработаю возможность закрыть без штрафа через добровольное сообщение.' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const demoEmail = (slug: string) => `demo.${slug}@p2ptax.demo`;

async function upsertClient(c: DemoClient) {
  return prisma.user.upsert({
    where: { email: demoEmail(c.slug) },
    update: {
      firstName: c.firstName,
      lastName: c.lastName,
      city: c.city,
      role: Role.CLIENT,
    },
    create: {
      email: demoEmail(c.slug),
      firstName: c.firstName,
      lastName: c.lastName,
      city: c.city,
      role: Role.CLIENT,
    },
  });
}

async function upsertSpecialist(s: DemoSpecialist) {
  const user = await prisma.user.upsert({
    where: { email: demoEmail(s.slug) },
    update: {
      firstName: s.firstName,
      lastName: s.lastName,
      city: s.city,
      role: Role.SPECIALIST,
      avatarUrl: s.avatarUrl,
    },
    create: {
      email: demoEmail(s.slug),
      firstName: s.firstName,
      lastName: s.lastName,
      city: s.city,
      role: Role.SPECIALIST,
      avatarUrl: s.avatarUrl,
    },
  });

  const cities = [s.city, ...(s.extraCities ?? [])];
  await prisma.specialistProfile.upsert({
    where: { userId: user.id },
    update: {
      nick: s.slug,
      displayName: s.displayName,
      bio: s.bio,
      headline: s.headline,
      experience: s.experience,
      hourlyRate: s.hourlyRate,
      cities,
      services: s.services,
      avatarUrl: s.avatarUrl,
      profileComplete: true,
      isAvailable: true,
    },
    create: {
      userId: user.id,
      nick: s.slug,
      displayName: s.displayName,
      bio: s.bio,
      headline: s.headline,
      experience: s.experience,
      hourlyRate: s.hourlyRate,
      cities,
      services: s.services,
      badges: [],
      fnsOffices: [],
      avatarUrl: s.avatarUrl,
      profileComplete: true,
      isAvailable: true,
    },
  });

  return user;
}

/**
 * Upsert a request idempotently. Request has no unique business key in schema,
 * so we keep a stable identity via `description` prefix marker: `[demo:<slug>]`.
 * Find-first by that marker, then create or update.
 */
async function upsertRequest(r: DemoRequestTpl, clientId: string) {
  const marker = `[demo:${r.slug}]`;
  const descriptionWithMarker = `${marker}\n\n${r.description}`;

  const existing = await prisma.request.findFirst({
    where: { description: { startsWith: marker } },
    select: { id: true },
  });

  if (existing) {
    return prisma.request.update({
      where: { id: existing.id },
      data: {
        clientId,
        title: r.title,
        description: descriptionWithMarker,
        city: r.city,
        serviceType: r.serviceType,
        budget: r.budget,
        status: r.status,
      },
    });
  }

  return prisma.request.create({
    data: {
      clientId,
      title: r.title,
      description: descriptionWithMarker,
      city: r.city,
      serviceType: r.serviceType,
      budget: r.budget,
      status: r.status,
    },
  });
}

/**
 * Review is keyed by (clientId, specialistId, requestId) unique constraint.
 * Upsert directly.
 */
async function upsertReview(
  clientId: string,
  specialistId: string,
  requestId: string,
  rating: number,
  comment: string,
) {
  return prisma.review.upsert({
    where: {
      clientId_specialistId_requestId: { clientId, specialistId, requestId },
    },
    update: { rating, comment },
    create: { clientId, specialistId, requestId, rating, comment },
  });
}

/**
 * Thread has unique (requestId, specialistId) — upsert on that.
 * Ensure participant1Id < participant2Id invariant.
 */
async function upsertThreadWithMessages(
  clientId: string,
  specialistId: string,
  requestId: string,
  messages: { fromSpecialist: boolean; content: string }[],
) {
  const [p1, p2] = clientId < specialistId ? [clientId, specialistId] : [specialistId, clientId];

  let thread = await prisma.thread.findUnique({
    where: { requestId_specialistId: { requestId, specialistId } },
  });

  if (!thread) {
    thread = await prisma.thread.create({
      data: {
        participant1Id: p1,
        participant2Id: p2,
        requestId,
        specialistId,
        lastMessageAt: new Date(),
      },
    });
  }

  // Messages are idempotent via count check — if thread already has >= desired count, skip.
  const existingCount = await prisma.message.count({ where: { threadId: thread.id } });
  if (existingCount >= messages.length) return thread;

  // Insert only missing messages (by index position)
  const base = Date.now() - messages.length * 60_000;
  for (let i = existingCount; i < messages.length; i++) {
    const m = messages[i];
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: m.fromSpecialist ? specialistId : clientId,
        content: m.content,
        createdAt: new Date(base + i * 60_000),
      },
    });
  }
  await prisma.thread.update({
    where: { id: thread.id },
    data: { lastMessageAt: new Date() },
  });

  return thread;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[demo-seed] starting…');

  // 1) Service rows (required for any linked join rows later)
  for (const name of SERVICE_TYPES) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2) Demo clients
  const clientUsers = new Map<string, string>(); // slug → userId
  for (const c of CLIENTS) {
    const u = await upsertClient(c);
    clientUsers.set(c.slug, u.id);
  }
  console.log(`[demo-seed] ${clientUsers.size} demo clients upserted`);

  // 3) Demo specialists
  const specialistUsers = new Map<string, string>(); // slug → userId
  for (const s of SPECIALISTS) {
    const u = await upsertSpecialist(s);
    specialistUsers.set(s.slug, u.id);
  }
  console.log(`[demo-seed] ${specialistUsers.size} demo specialists upserted`);

  // 4) Requests
  const requestIds = new Map<string, string>(); // slug → requestId
  for (const r of REQUESTS) {
    const ownerSlug = REQUEST_OWNERS[r.slug];
    if (!ownerSlug) throw new Error(`No owner mapping for request ${r.slug}`);
    const clientId = clientUsers.get(ownerSlug);
    if (!clientId) throw new Error(`Missing demo client ${ownerSlug}`);
    const req = await upsertRequest(r, clientId);
    requestIds.set(r.slug, req.id);
  }
  console.log(`[demo-seed] ${requestIds.size} demo requests upserted`);

  // 5) Threads + messages (on a subset of active requests)
  let threadCount = 0;
  for (const t of THREADS) {
    const requestId = requestIds.get(t.requestSlug);
    const specialistId = specialistUsers.get(t.specialistSlug);
    if (!requestId || !specialistId) continue;
    const req = await prisma.request.findUnique({
      where: { id: requestId },
      select: { clientId: true },
    });
    if (!req) continue;
    await upsertThreadWithMessages(req.clientId, specialistId, requestId, t.messages);
    threadCount++;
  }
  console.log(`[demo-seed] ${threadCount} threads ensured`);

  // 6) Reviews — only on CLOSED requests (FK + business constraint)
  let reviewCount = 0;
  for (const rv of REVIEWS) {
    const requestId = requestIds.get(rv.requestSlug);
    const clientId = clientUsers.get(rv.clientSlug);
    const specialistId = specialistUsers.get(rv.specialistSlug);
    if (!requestId || !clientId || !specialistId) continue;

    // Safety: only leave review if request is CLOSED (matches real app constraint)
    const req = await prisma.request.findUnique({
      where: { id: requestId },
      select: { status: true },
    });
    if (!req || req.status !== RequestStatus.CLOSED) continue;

    await upsertReview(clientId, specialistId, requestId, rv.rating, rv.comment);
    reviewCount++;
  }
  console.log(`[demo-seed] ${reviewCount} reviews upserted`);

  console.log('[demo-seed] done.');
}

main()
  .catch((e) => {
    console.error('[demo-seed] FAILED', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
