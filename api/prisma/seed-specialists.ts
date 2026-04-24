/**
 * Specialists + requests + threads + messages + complaints + notifications.
 *
 * Runs AFTER `prisma/seed.ts` (which seeds cities / FNS / services).
 * Idempotent: safe to re-run — upserts by email / deterministic keys.
 *
 * Pro Flash critique 20260423 flagged empty dashboards (no seed). This
 * fills the DB with realistic tax-service data so screens render like
 * production instead of showing "0 заявок / 0 специалистов".
 *
 * Dev test account MUST stay first:
 *   serter2069@gmail.com / Сергей Тертышный — role=USER, isSpecialist=false
 *   (post-Iter11 unification: no more CLIENT/SPECIALIST roles).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── SPECIALISTS (18 total) ─────────────────────────────────────────

type CaseSeed = {
  title: string;
  category: string;
  amount: number | null;
  resolvedAmount: number | null;
  days: number | null;
  status: "resolved" | "in_progress";
  description: string;
  year: number | null;
};

const SPECIALISTS: Array<{
  email: string;
  firstName: string;
  lastName: string;
  description: string;
  fnsCodes: string[];
  serviceNames: string[];
  phone?: string;
  telegram?: string;
  officeAddress?: string;
  workingHours?: string;
  // Iteration 5 — credibility stack
  exFnsStartYear?: number;
  exFnsEndYear?: number;
  yearsOfExperience?: number;
  specializations?: string[];
  certifications?: string[];
  cases?: CaseSeed[];
}> = [
  {
    email: "aleksey.voronov@p2ptax-seed.ru",
    firstName: "Алексей",
    lastName: "Воронов",
    description: "Налоговый консультант с 8-летним опытом. Специализируюсь на P2P-операциях, криптовалюте и налоговых проверках. Помог более 300 клиентам.",
    fnsCodes: ["7701", "7702"],
    serviceNames: ["Выездная проверка", "Камеральная проверка"],
    phone: "+7 (495) 120-10-10",
    telegram: "@voronov_tax",
    officeAddress: "Москва, Хохловский пер., 9, офис 312",
    workingHours: "Пн-Пт, 10:00-19:00",
    yearsOfExperience: 8,
    specializations: ["Камеральные проверки по крипте", "P2P-операции Binance/Bybit", "Ответы на требования ИФНС"],
    certifications: ["Сертификат ИПБ", "Член Палаты налоговых консультантов", "3 публикации в «Налоговед»"],
  },
  {
    email: "marina.sokolova@p2ptax-seed.ru",
    firstName: "Марина",
    lastName: "Соколова",
    description: "Эксперт по налоговому праву. Работаю с ИП и физлицами по вопросам операций с криптовалютой и P2P. Опыт 6 лет.",
    fnsCodes: ["7703", "7704"],
    serviceNames: ["Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (495) 120-20-20",
    telegram: "@sokolova_msk",
    workingHours: "Пн-Пт, 9:00-18:00",
  },
  {
    email: "dmitry.petrov@p2ptax-seed.ru",
    firstName: "Дмитрий",
    lastName: "Петров",
    description: "Бывший сотрудник ФНС, 10 лет в налоговых органах. Досконально знаю процедуры проверок. Помогу урегулировать любую ситуацию.",
    fnsCodes: ["7801", "7802"],
    serviceNames: ["Выездная проверка", "Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (812) 240-30-30",
    telegram: "@petrov_spb",
    officeAddress: "Санкт-Петербург, Красного Текстильщика ул., 10-12",
    workingHours: "Пн-Сб, 10:00-20:00",
    exFnsStartYear: 2013,
    exFnsEndYear: 2023,
    yearsOfExperience: 11,
    specializations: ["Выездные проверки ИП", "Камеральные проверки", "Сопровождение на допросах в ИФНС"],
    certifications: ["Советник государственной гражданской службы 2 класса", "Диплом СПбГЭУ", "5 публикаций"],
  },
  {
    email: "elena.kuznetsova@p2ptax-seed.ru",
    firstName: "Елена",
    lastName: "Кузнецова",
    description: "Специалист по налоговому планированию. Помогаю минимизировать налоговые риски при работе с цифровыми активами. Онлайн-консультации по всей России.",
    fnsCodes: ["5401", "5402"],
    serviceNames: ["Камеральная проверка"],
    phone: "+7 (383) 200-40-40",
    telegram: "@kuznetsova_tax",
    workingHours: "Пн-Пт, 10:00-18:00",
  },
  {
    email: "sergey.morozov@p2ptax-seed.ru",
    firstName: "Сергей",
    lastName: "Морозов",
    description: "Юрист-налоговик, специализация — оспаривание решений ФНС. Представляю интересы клиентов в налоговых органах и судах. Опыт 12 лет.",
    fnsCodes: ["6601", "6602"],
    serviceNames: ["Выездная проверка", "Отдел оперативного контроля"],
    phone: "+7 (343) 200-50-50",
    telegram: "@morozov_legal",
    officeAddress: "Екатеринбург, Ленина пр., 38, офис 504",
    workingHours: "Пн-Пт, 9:00-19:00",
  },
  {
    email: "irina.fedorova@p2ptax-seed.ru",
    firstName: "Ирина",
    lastName: "Фёдорова",
    description: "Налоговый консультант, специализируюсь на помощи трейдерам и инвесторам в крипту. Составление деклараций, сопровождение проверок.",
    fnsCodes: ["1601", "1602"],
    serviceNames: ["Камеральная проверка", "Выездная проверка"],
    phone: "+7 (843) 200-60-60",
    telegram: "@fedorova_kzn",
    workingHours: "Пн-Пт, 10:00-18:00",
  },
  {
    email: "andrey.nikitin@p2ptax-seed.ru",
    firstName: "Андрей",
    lastName: "Никитин",
    description: "Практикующий налоговый адвокат. Более 200 успешно закрытых дел по налоговым спорам. Бесплатная первичная консультация.",
    fnsCodes: ["7705", "7707"],
    serviceNames: ["Выездная проверка", "Камеральная проверка"],
    phone: "+7 (495) 120-70-70",
    telegram: "@nikitin_advocate",
    officeAddress: "Москва, Большая Тульская ул., 15",
    workingHours: "Ежедневно, 10:00-20:00",
  },
  {
    email: "olga.stepanova@p2ptax-seed.ru",
    firstName: "Ольга",
    lastName: "Степанова",
    description: "Сертифицированный налоговый консультант. Работаю с фрилансерами, самозанятыми и ИП. Специализация — доходы от P2P и DeFi.",
    fnsCodes: ["7803", "7807"],
    serviceNames: ["Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (812) 240-80-80",
    telegram: "@stepanova_spb",
    workingHours: "Пн-Пт, 9:00-19:00",
    exFnsStartYear: 2015,
    exFnsEndYear: 2023,
    yearsOfExperience: 8,
    specializations: ["Камеральные проверки", "Выездные проверки ИП", "115-ФЗ блокировки"],
    certifications: ["Диплом ВАК", "3 публикации в «Налоговая политика»", "Налоговый монитор"],
  },
  // Iteration 4 — additional 10 specialists for richer catalog
  {
    email: "vladimir.lebedev@p2ptax-seed.ru",
    firstName: "Владимир",
    lastName: "Лебедев",
    description: "Налоговый консультант с экономическим образованием. 15 лет практики, работаю с физлицами по сложным ситуациям с банковской блокировкой по 115-ФЗ.",
    fnsCodes: ["7708", "7709"],
    serviceNames: ["Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (495) 120-11-12",
    telegram: "@lebedev_finlaw",
    officeAddress: "Москва, Мурманский пр., 6",
    workingHours: "Пн-Пт, 10:00-19:00",
  },
  {
    email: "natalia.popova@p2ptax-seed.ru",
    firstName: "Наталья",
    lastName: "Попова",
    description: "Специалист по налогообложению зарубежных счетов, КИК и отчётности по Закону о валютном контроле. Помогу с декларацией уведомлений и движения средств.",
    fnsCodes: ["7713", "7714"],
    serviceNames: ["Камеральная проверка"],
    phone: "+7 (495) 120-13-14",
    telegram: "@popova_foreign",
    workingHours: "Пн-Пт, 9:00-18:00",
  },
  {
    email: "roman.ivanov@p2ptax-seed.ru",
    firstName: "Роман",
    lastName: "Иванов",
    description: "Бухгалтер-консультант. Сопровождение проверок ИФНС, ответы на требования, подготовка возражений. Работаю удалённо по всей России.",
    fnsCodes: ["7810", "7811"],
    serviceNames: ["Камеральная проверка", "Выездная проверка"],
    phone: "+7 (812) 240-15-16",
    telegram: "@ivanov_taxpro",
    workingHours: "Ежедневно, 9:00-21:00",
  },
  {
    email: "anna.smirnova@p2ptax-seed.ru",
    firstName: "Анна",
    lastName: "Смирнова",
    description: "Юрист по налоговым спорам. Опыт представительства в арбитражных судах — 40+ выигранных дел. Специализация: оспаривание актов камеральных проверок.",
    fnsCodes: ["6603", "6604"],
    serviceNames: ["Выездная проверка", "Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (343) 200-17-18",
    telegram: "@smirnova_law",
    officeAddress: "Екатеринбург, Стачек ул., 2а",
    workingHours: "Пн-Пт, 10:00-19:00",
  },
  {
    email: "pavel.volkov@p2ptax-seed.ru",
    firstName: "Павел",
    lastName: "Волков",
    description: "Налоговый аналитик. Специализируюсь на оптимизации НДФЛ с операций на зарубежных биржах. Работаю только с физлицами.",
    fnsCodes: ["5403", "5404"],
    serviceNames: ["Камеральная проверка"],
    phone: "+7 (383) 200-19-20",
    telegram: "@volkov_tax",
    workingHours: "Пн-Пт, 10:00-18:00",
  },
  {
    email: "yulia.zaitseva@p2ptax-seed.ru",
    firstName: "Юлия",
    lastName: "Зайцева",
    description: "Налоговый юрист, 9 лет опыта в консультировании по операциям с криптовалютой. Помогу грамотно ответить на требование ИФНС и минимизировать риски.",
    fnsCodes: ["1603", "1604"],
    serviceNames: ["Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (843) 200-21-22",
    telegram: "@zaitseva_kzn",
    officeAddress: "Казань, Ершова ул., 1б",
    workingHours: "Пн-Пт, 9:00-18:00",
  },
  {
    email: "maxim.solovyov@p2ptax-seed.ru",
    firstName: "Максим",
    lastName: "Соловьёв",
    description: "Бывший инспектор ОКК (Отдел оперативного контроля). Знаю процедуры изнутри. Помогу подготовиться к проверке и пройти её без доначислений.",
    fnsCodes: ["5260", "5261"],
    serviceNames: ["Отдел оперативного контроля", "Выездная проверка"],
    phone: "+7 (831) 200-23-24",
    telegram: "@solovyov_nn",
    officeAddress: "Нижний Новгород, Тимирязева ул., 30",
    workingHours: "Пн-Пт, 9:00-19:00",
  },
  {
    email: "svetlana.orlova@p2ptax-seed.ru",
    firstName: "Светлана",
    lastName: "Орлова",
    description: "Сертифицированный налоговый консультант Палаты налоговых консультантов. 7 лет практики, специализация — самозанятые и ИП на УСН.",
    fnsCodes: ["7451", "7452"],
    serviceNames: ["Камеральная проверка"],
    phone: "+7 (351) 200-25-26",
    telegram: "@orlova_chel",
    workingHours: "Пн-Пт, 10:00-18:00",
  },
  {
    email: "kirill.makarov@p2ptax-seed.ru",
    firstName: "Кирилл",
    lastName: "Макаров",
    description: "Магистр налогового права МГУ. Консультирую по сложным вопросам налогообложения доходов от цифровых активов, NFT и DeFi-протоколов.",
    fnsCodes: ["6311", "6312"],
    serviceNames: ["Камеральная проверка", "Выездная проверка"],
    phone: "+7 (846) 200-27-28",
    telegram: "@makarov_samara",
    officeAddress: "Самара, Садовая ул., 127",
    workingHours: "Пн-Пт, 9:00-18:00",
  },
  {
    email: "galina.belova@p2ptax-seed.ru",
    firstName: "Галина",
    lastName: "Белова",
    description: "Практикующий налоговый аудитор. 20 лет опыта. Сопровождение выездных налоговых проверок, подготовка возражений на акт, обжалование в УФНС.",
    fnsCodes: ["0201", "0202"],
    serviceNames: ["Выездная проверка", "Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (347) 200-29-30",
    telegram: "@belova_audit",
    officeAddress: "Уфа, Цюрупы ул., 2",
    workingHours: "Пн-Пт, 10:00-19:00",
  },
];

// ─── Helpers for generating realistic cases ──────────────

function generateCasesForSpecialist(
  firstName: string,
  cities: string[],
  fnsCodes: string[],
  serviceNames: string[],
  seedIdx: number,
): CaseSeed[] {
  // 3-5 cases per specialist, realistic amounts and outcomes based on category
  const city = cities[0] ?? "Москва";
  const fnsCode = fnsCodes[0] ?? "7716";
  const baseYear = 2024;

  const templates: Record<string, CaseSeed[]> = {
    "Выездная проверка": [
      {
        title: `Выездная проверка ИП на УСН в ${city}`,
        category: "Выездная проверка",
        amount: 3_200_000 + (seedIdx % 5) * 400_000,
        resolvedAmount: 2_800_000 + (seedIdx % 5) * 300_000,
        days: 45 + (seedIdx % 10),
        status: "resolved",
        description: `Выездная налоговая проверка по УСН «Доходы» за 2021-2023. Доначислено ${(3_200_000 + (seedIdx % 5) * 400_000).toLocaleString("ru-RU")} ₽. Подготовлены возражения, доказана реальность хозяйственных операций с подрядчиками. В УФНС отменено 87% доначислений.`,
        year: baseYear,
      },
      {
        title: `Выездная проверка ООО — ИФНС №${fnsCode}`,
        category: "Выездная проверка",
        amount: 5_400_000 + (seedIdx % 3) * 800_000,
        resolvedAmount: 4_100_000 + (seedIdx % 3) * 500_000,
        days: 62,
        status: "resolved",
        description: "Доначисления по НДС и налогу на прибыль из-за операций с «техническими» контрагентами. Подготовили пакет первичных документов, показания свидетелей, техническое обоснование. В арбитраже отстояли 76%.",
        year: baseYear - 1,
      },
    ],
    "Камеральная проверка": [
      {
        title: `Оспаривание камеральной проверки ИФНС №${fnsCode}`,
        category: "Камеральная проверка",
        amount: 2_400_000 + (seedIdx % 4) * 200_000,
        resolvedAmount: 2_100_000 + (seedIdx % 4) * 180_000,
        days: 23 + (seedIdx % 7),
        status: "resolved",
        description: "Клиент-ИП получил акт камеральной проверки по декларации 3-НДФЛ за 2023 год. Доначислено 2.4 млн ₽ по операциям с криптовалютой. Подготовили возражения с подтверждением расходной части (скриншоты из Bybit + банковские выписки), ФНС сняла 87% суммы.",
        year: baseYear,
      },
      {
        title: "Камеральная по 3-НДФЛ — зарубежный брокер",
        category: "Камеральная проверка",
        amount: 780_000,
        resolvedAmount: 780_000,
        days: 18,
        status: "resolved",
        description: "Клиент декларировал доходы от Interactive Brokers, ФНС запросила пояснения и документы. Подготовили расчёт курсовых разниц по каждой сделке, переводы договоров. Акт пересмотрен — доначислений нет.",
        year: baseYear,
      },
    ],
    "Отдел оперативного контроля": [
      {
        title: "Оспаривание решения ОКК — штраф за ККТ",
        category: "Отдел оперативного контроля",
        amount: 450_000,
        resolvedAmount: 450_000,
        days: 28,
        status: "resolved",
        description: "Сетевой магазин получил решение ОКК о применении ККТ с нарушениями — штраф 450 тыс ₽. Составили жалобу в вышестоящий налоговый орган, указали на процессуальные нарушения. Решение отменено полностью.",
        year: baseYear,
      },
    ],
  };

  const cases: CaseSeed[] = [];
  for (const svc of serviceNames) {
    const pool = templates[svc];
    if (pool) cases.push(...pool);
  }

  // Add a "в работе" case
  if (cases.length >= 2) {
    cases.push({
      title: `Сопровождение камеральной проверки — ${city}`,
      category: "Камеральная проверка",
      amount: 1_200_000,
      resolvedAmount: null,
      days: null,
      status: "in_progress",
      description: "Клиент получил требование о пояснениях в рамках камеральной проверки 3-НДФЛ. Готовим ответ, собираем первичные документы. Ожидается завершение в следующем месяце.",
      year: baseYear,
    });
  }

  return cases.slice(0, 4); // cap at 4 per specialist
}

// ─── REQUESTS (15 total) ────────────────────────────────────────────

const REQUEST_SCENARIOS: Array<{
  title: string;
  description: string;
  fnsCode: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  daysAgo: number;
  threadCount: number;
}> = [
  {
    title: "Разблокировка счёта по 115-ФЗ в Тинькофф",
    description: "Тинькофф заблокировал счёт ИП 3 дня назад с требованием предоставить документы по операциям за 2024 год. Сумма оборотов за квартал — около 2,5 млн. Нужна помощь в подготовке пояснений и восстановлении доступа.",
    fnsCode: "7701",
    status: "ACTIVE",
    daysAgo: 2,
    threadCount: 3,
  },
  {
    title: "Оспаривание акта камеральной проверки ИФНС №16",
    description: "Получил акт камеральной проверки по декларации 3-НДФЛ за 2023 г. Доначислено 185 000 руб. по операциям с криптовалютой. Требуется составить возражения и подать в УФНС.",
    fnsCode: "7716",
    status: "ACTIVE",
    daysAgo: 5,
    threadCount: 2,
  },
  {
    title: "Консультация по зарубежным счетам и КИК",
    description: "Открыл счёт в зарубежном банке (Kazakhstan) в начале 2024 г. Нужна помощь с уведомлением ФНС и декларированием движения денежных средств. Также вопросы по КИК на панамской компании.",
    fnsCode: "7713",
    status: "ACTIVE",
    daysAgo: 1,
    threadCount: 1,
  },
  {
    title: "Вызов в ФНС по операциям P2P на Binance",
    description: "ИФНС прислала уведомление с требованием явиться на опрос. За 2023-2024 прошло P2P-операций примерно на 8 млн. Нужна помощь: подготовка документов, стратегия на опросе.",
    fnsCode: "7701",
    status: "ACTIVE",
    daysAgo: 3,
    threadCount: 2,
  },
  {
    title: "Декларация 3-НДФЛ по крипте за 2024 год",
    description: "Нужна помощь в заполнении декларации 3-НДФЛ по доходам от продажи криптовалюты за 2024 год. Объём операций — около 350 транзакций на биржах Bybit, OKX, Binance. Есть выгрузки в CSV.",
    fnsCode: "7702",
    status: "ACTIVE",
    daysAgo: 7,
    threadCount: 2,
  },
  {
    title: "Подготовка к выездной проверке — ИП на УСН",
    description: "ИП на УСН Доходы, оборот около 45 млн в год. Через 2 месяца плановая выездная проверка. Нужен консультант для аудита документов, подготовки к проверке и сопровождения.",
    fnsCode: "7801",
    status: "CLOSING_SOON",
    daysAgo: 12,
    threadCount: 4,
  },
  {
    title: "Ответ на требование ИФНС о пояснениях",
    description: "Пришло требование о пояснениях по операциям за 2023 год в рамках камеральной проверки по НДФЛ. Срок ответа — 5 рабочих дней. Операции по зарубежным брокерам (IBKR, Tinkoff глобальный).",
    fnsCode: "7803",
    status: "ACTIVE",
    daysAgo: 1,
    threadCount: 1,
  },
  {
    title: "Оптимизация НДФЛ трейдера",
    description: "Активный трейдер, годовой оборот на бирже MOEX около 120 млн. Хочу легально оптимизировать налоговую нагрузку (ИИС-Б, перенос убытков). Нужна разовая консультация.",
    fnsCode: "5401",
    status: "ACTIVE",
    daysAgo: 4,
    threadCount: 2,
  },
  {
    title: "Обжалование решения по ОКК — сетевой магазин",
    description: "Получили решение от отдела оперативного контроля о применении ККТ с нарушениями (штраф 450 000 руб.). Не согласны с доводами. Нужен юрист для составления жалобы в вышестоящий налоговый орган.",
    fnsCode: "6601",
    status: "ACTIVE",
    daysAgo: 6,
    threadCount: 3,
  },
  {
    title: "Консультация по налогам самозанятого на Etsy",
    description: "Самозанятая, продаю ручные изделия через Etsy (США). Поступления в долларах через Payoneer. Не понимаю как правильно учитывать курсовые разницы и считать НПД. Оборот ~600 тыс/год.",
    fnsCode: "7717",
    status: "ACTIVE",
    daysAgo: 8,
    threadCount: 2,
  },
  {
    title: "Закрыли ИП — пришло требование спустя год",
    description: "Закрыл ИП на УСН в марте 2024. В феврале 2025 пришло требование о предоставлении документов за 2022-2023. Как правильно отвечать, есть ли сроки давности?",
    fnsCode: "1601",
    status: "CLOSED",
    daysAgo: 35,
    threadCount: 3,
  },
  {
    title: "Блокировка в Альфа-Банке — фриланс-поступления",
    description: "Альфа-Банк запросил документы по поступлениям от иностранных заказчиков (дизайн, Upwork). Сумма 1,8 млн за 6 мес. Я самозанятый, чеки формирую. Как правильно отвечать банку?",
    fnsCode: "7705",
    status: "ACTIVE",
    daysAgo: 2,
    threadCount: 2,
  },
  {
    title: "НДФЛ с продажи апартаментов — нюансы 2024",
    description: "Продал апартаменты в Москве, в собственности были 4 года, кадастровая стоимость выше цены продажи. Нужна помощь с расчётом НДФЛ и декларацией.",
    fnsCode: "7725",
    status: "CLOSING_SOON",
    daysAgo: 18,
    threadCount: 1,
  },
  {
    title: "Разъяснение по налоговому резидентству",
    description: "Уехал из РФ в августе 2023, в 2024 провёл в России менее 90 дней. Часть дохода — удалённая работа на российскую компанию, часть — зарубежный работодатель. Как платить налоги?",
    fnsCode: "7804",
    status: "ACTIVE",
    daysAgo: 4,
    threadCount: 3,
  },
  {
    title: "Возврат НДФЛ по ИИС-А — отказ ИФНС",
    description: "ИФНС отказала в вычете по ИИС-А за 2023 г. (75 000 руб.) — считают, что были частичные выводы. Не согласен, выводов не было. Нужно составить возражение и жалобу.",
    fnsCode: "7716",
    status: "ACTIVE",
    daysAgo: 10,
    threadCount: 2,
  },
];

// ─── Message scripts — realistic 2-4 message back-and-forth ─────────

const MESSAGE_SCRIPTS: string[][] = [
  // Scenario A — specialist responds, client details
  [
    "Здравствуйте! Увидел вашу заявку. Я работаю с такими ситуациями, у меня есть опыт аналогичных кейсов с Тинькофф. Давайте я посмотрю детали: какой код ОКВЭД у вас, и какие пояснения уже готовили?",
    "Здравствуйте! ОКВЭД 62.01 — разработка ПО. Пояснения ещё не готовил, только получил запрос в личном кабинете банка. Контрагентами были в основном зарубежные компании через Payoneer.",
    "Понятно. Тогда первым делом нужно выгрузить все инвойсы и акты за квартал, плюс скриншоты из личного кабинета Payoneer с поступлениями. По телефону обсудим подробнее — удобно завтра в 11:00?",
    "Да, завтра в 11 удобно. Наберу вас сам по указанному номеру.",
  ],
  // Scenario B — quick intake
  [
    "Здравствуйте, возьмусь за ваш кейс. Для начала — акт на руках? Прислать можете?",
    "Да, акт получил сегодня. Сейчас пришлю.",
  ],
  // Scenario C — diagnostic
  [
    "Добрый день! По КИК на панамской компании — там важны сроки. Компания зарегистрирована в каком году и какие обороты?",
    "Компания с января 2024, обороты небольшие — около $40k в год. Дивиденды не выплачивались.",
    "ОК, тогда угрозы нет. Уведомление о КИК подадим до 20 марта 2025, расчёт прибыли — без доначислений. По зарубежному счёту дополнительно уведомим, подготовлю документы.",
  ],
  // Scenario D — longer
  [
    "Здравствуйте. По выездной проверке — чем можем помочь? Какие документы у вас есть?",
    "Здравствуйте! Пришло решение о проверке, период 2021-2023. Документы в порядке, но волнуюсь по поводу договоров с контрагентом, который сейчас в ликвидации.",
    "Это типичная точка риска. Нужно до проверки собрать весь комплект: договор, акты, платёжки, скриншоты переписки. Если контрагент в ликвидации — тем более важно подтвердить реальность сделок. Встретимся?",
    "Да, давайте встретимся. Когда вам удобно?",
  ],
  // Scenario E — consultation
  [
    "Здравствуйте! По вашей ситуации — срочно нужно подготовить ответ, 5 дней это жёсткий срок. Можете сегодня прислать: 1) текст требования, 2) выгрузку операций за период?",
    "Конечно, пришлю через час.",
  ],
  // Scenario F — resolved
  [
    "По оптимизации — уже давно работаю с трейдерами. Пришлите выгрузку сделок за год, посмотрю что можно сделать.",
    "Выгрузку отправил в Telegram. Там около 340 сделок.",
    "Посмотрел — убытки 2022 можно перенести, это минус 180к НДФЛ. Плюс есть смысл открыть ИИС-Б. Подготовлю план, созвонимся во вторник.",
  ],
  // Scenario G — short
  [
    "Здравствуйте. Возьмусь за жалобу на решение ОКК. Фиксированная стоимость — 25 000. Согласны?",
    "Согласен. Как оплатить?",
  ],
  // Scenario H — consultation details
  [
    "По Etsy + Payoneer: НПД считается по факту получения в рублях по курсу ЦБ на дату поступления. Курсовые разницы учитывать не нужно. Чеки формируйте в «Мой налог» по каждому поступлению.",
    "А если поступило сразу за несколько заказов общей суммой?",
    "Можно одним чеком на общую сумму, в описании укажите «реализация товаров (Etsy)». Главное — чтобы все поступления были задекларированы.",
  ],
];

// ─── Complaint text samples ─────────────────────────────────────────

const COMPLAINT_SAMPLES = [
  "Специалист не отвечал на сообщения 4 дня, хотя обещал консультацию в тот же день.",
  "Некорректное поведение в переписке, повышенный тон.",
  "Предоставил неверную информацию по срокам подачи декларации.",
  "Запросил предоплату 50% и перестал отвечать.",
];

// ─── Notification samples ───────────────────────────────────────────

const NOTIFICATION_SAMPLES = [
  {
    type: "new_message",
    title: "Новое сообщение по вашей заявке",
    body: "Налоговый консультант написал по вашей заявке о разблокировке счёта",
  },
  {
    type: "new_message",
    title: "Новое сообщение",
    body: "У вас новое сообщение от специалиста",
  },
  {
    type: "new_request_in_city",
    title: "Новая заявка в вашем городе",
    body: "Клиент ищет специалиста по камеральной проверке в Москве",
  },
  {
    type: "promo_expiring",
    title: "Срок заявки истекает",
    body: "Ваша заявка закроется через 3 дня — продлить?",
  },
];

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  // FNS / service lookups
  const allFns = await prisma.fnsOffice.findMany({ select: { id: true, code: true, cityId: true } });
  const fnsMap: Record<string, { id: string; cityId: string }> = {};
  for (const f of allFns) fnsMap[f.code] = { id: f.id, cityId: f.cityId };

  const allServices = await prisma.service.findMany({ select: { id: true, name: true } });
  const serviceMap: Record<string, string> = {};
  for (const s of allServices) serviceMap[s.name] = s.id;

  // ─── Dev test account (must be first user) ────────────────────────
  // Iter11: no more CLIENT role. Dev account = USER, non-specialist.
  const sergeiClient = await prisma.user.upsert({
    where: { email: "serter2069@gmail.com" },
    update: {
      firstName: "Сергей",
      lastName: "Тертышный",
      role: "USER",
      isSpecialist: false,
      specialistProfileCompletedAt: null,
    },
    create: {
      email: "serter2069@gmail.com",
      firstName: "Сергей",
      lastName: "Тертышный",
      role: "USER",
      isSpecialist: false,
    },
  });
  console.log(`  [dev] ${sergeiClient.email} (USER, non-specialist)`);

  // ─── Specialists ──────────────────────────────────────────────────
  // Iter11: seeded specialists are USER+isSpecialist=true with completed
  // profile timestamp, so they pass the catalog's gate immediately.
  const nowSeed = new Date();
  const specialistUsers: Array<{ id: string; email: string }> = [];
  let specialistCount = 0;
  for (const spec of SPECIALISTS) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: "USER",
        isSpecialist: true,
        specialistProfileCompletedAt: nowSeed,
        isAvailable: true,
      },
      create: {
        email: spec.email,
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: "USER",
        isSpecialist: true,
        specialistProfileCompletedAt: nowSeed,
        isAvailable: true,
      },
    });

    await prisma.specialistProfile.upsert({
      where: { userId: user.id },
      update: {
        description: spec.description,
        phone: spec.phone,
        telegram: spec.telegram,
        officeAddress: spec.officeAddress,
        workingHours: spec.workingHours,
        exFnsStartYear: spec.exFnsStartYear ?? null,
        exFnsEndYear: spec.exFnsEndYear ?? null,
        yearsOfExperience: spec.yearsOfExperience ?? null,
        specializations: spec.specializations ?? undefined,
        certifications: spec.certifications ?? undefined,
      },
      create: {
        userId: user.id,
        description: spec.description,
        phone: spec.phone,
        telegram: spec.telegram,
        officeAddress: spec.officeAddress,
        workingHours: spec.workingHours,
        exFnsStartYear: spec.exFnsStartYear ?? null,
        exFnsEndYear: spec.exFnsEndYear ?? null,
        yearsOfExperience: spec.yearsOfExperience ?? null,
        specializations: spec.specializations ?? undefined,
        certifications: spec.certifications ?? undefined,
      },
    });

    for (const fnsCode of spec.fnsCodes) {
      const fns = fnsMap[fnsCode];
      if (!fns) continue;

      const sfns = await prisma.specialistFns.upsert({
        where: { specialistId_fnsId: { specialistId: user.id, fnsId: fns.id } },
        update: {},
        create: { specialistId: user.id, fnsId: fns.id },
      });

      for (const serviceName of spec.serviceNames) {
        const serviceId = serviceMap[serviceName];
        if (!serviceId) continue;

        await prisma.specialistService.upsert({
          where: {
            specialistId_fnsId_serviceId: {
              specialistId: user.id,
              fnsId: fns.id,
              serviceId,
            },
          },
          update: {},
          create: {
            specialistId: user.id,
            fnsId: fns.id,
            serviceId,
            specialistFnsId: sfns.id,
          },
        });
      }
    }

    specialistUsers.push({ id: user.id, email: user.email });
    specialistCount++;
  }
  console.log(`\n  Specialists: ${specialistCount}`);

  // ─── Specialist Cases (Iteration 5) ──────────────────────────────
  // Wipe + regenerate deterministically per run.
  // Social-proof table is cleared in this seed (UI was removed in the SA cleanup).
  await prisma.specialistCase.deleteMany({});

  let caseCount = 0;

  for (let sIdx = 0; sIdx < SPECIALISTS.length; sIdx++) {
    const spec = SPECIALISTS[sIdx];
    const user = specialistUsers[sIdx];
    if (!user) continue;

    // Derive cities + fnsCodes for this specialist from the seed entry
    const cities = new Set<string>();
    for (const code of spec.fnsCodes) {
      const f = fnsMap[code];
      if (!f) continue;
      // cityId → city name via a secondary lookup (skipped — use explicit officeAddress city if available)
    }
    const cityHint =
      spec.officeAddress?.split(",")[0]?.trim() ??
      null;
    const cityList = cityHint ? [cityHint] : [];

    // Explicit cases (hand-authored for the spec) or generated
    const cases =
      spec.cases ??
      generateCasesForSpecialist(
        spec.firstName,
        cityList,
        spec.fnsCodes,
        spec.serviceNames,
        sIdx,
      );

    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      await prisma.specialistCase.create({
        data: {
          specialistId: user.id,
          title: c.title,
          category: c.category,
          amount: c.amount,
          resolvedAmount: c.resolvedAmount,
          days: c.days,
          status: c.status,
          description: c.description,
          year: c.year,
          order: i,
        },
      });
      caseCount++;
    }
  }
  console.log(`  Cases:       ${caseCount}`);

  // ─── Client pool (5 extra clients beyond Сергей) ─────────────────
  const EXTRA_CLIENTS = [
    { email: "ivan.tretyakov@p2ptax-seed.ru", firstName: "Иван", lastName: "Третьяков" },
    { email: "anastasia.belyaeva@p2ptax-seed.ru", firstName: "Анастасия", lastName: "Беляева" },
    { email: "nikolay.chernov@p2ptax-seed.ru", firstName: "Николай", lastName: "Чернов" },
    { email: "elena.komarova@p2ptax-seed.ru", firstName: "Елена", lastName: "Комарова" },
    { email: "artyom.ryabov@p2ptax-seed.ru", firstName: "Артём", lastName: "Рябов" },
  ];
  const clientUsers: Array<{ id: string; email: string }> = [{ id: sergeiClient.id, email: sergeiClient.email }];
  for (const c of EXTRA_CLIENTS) {
    // Iter11: clients are USER non-specialists in the unified schema.
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        firstName: c.firstName,
        lastName: c.lastName,
        role: "USER",
        isSpecialist: false,
      },
      create: {
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        role: "USER",
        isSpecialist: false,
      },
    });
    clientUsers.push({ id: u.id, email: u.email });
  }
  console.log(`  Clients:     ${clientUsers.length}`);

  // Clear existing seed-created requests so re-runs stay deterministic.
  // (We identify seed requests by the set of titles.)
  const seedTitles = REQUEST_SCENARIOS.map((r) => r.title);
  await prisma.request.deleteMany({
    where: { title: { in: seedTitles } },
  });

  // ─── Requests + Threads + Messages ────────────────────────────────
  let requestCount = 0;
  let threadCount = 0;
  let messageCount = 0;
  const createdRequests: Array<{ id: string; userId: string }> = [];

  for (let idx = 0; idx < REQUEST_SCENARIOS.length; idx++) {
    const scenario = REQUEST_SCENARIOS[idx];
    const fns = fnsMap[scenario.fnsCode];
    if (!fns) {
      console.warn(`  [skip] FNS ${scenario.fnsCode} not found`);
      continue;
    }

    const client = clientUsers[idx % clientUsers.length];
    const createdAt = new Date(Date.now() - scenario.daysAgo * 24 * 60 * 60 * 1000);

    const request = await prisma.request.create({
      data: {
        userId: client.id,
        cityId: fns.cityId,
        fnsId: fns.id,
        title: scenario.title,
        description: scenario.description,
        status: scenario.status,
        createdAt,
        lastActivityAt: createdAt,
      },
    });
    createdRequests.push({ id: request.id, userId: client.id });
    requestCount++;

    // Threads: pick N specialists who work this FNS (fall back to first N)
    const eligibleSpecs = await prisma.specialistFns.findMany({
      where: { fnsId: fns.id },
      select: { specialistId: true },
      take: Math.max(scenario.threadCount, 1),
    });
    const specialistIds = eligibleSpecs.map((s) => s.specialistId);
    // Pad with random seeded specialists if not enough matched this FNS
    while (specialistIds.length < scenario.threadCount && specialistUsers.length > specialistIds.length) {
      const fallback = specialistUsers.find((s) => !specialistIds.includes(s.id));
      if (!fallback) break;
      specialistIds.push(fallback.id);
    }

    for (let t = 0; t < scenario.threadCount && t < specialistIds.length; t++) {
      const specialistId = specialistIds[t];
      const script = MESSAGE_SCRIPTS[(idx + t) % MESSAGE_SCRIPTS.length];
      const threadCreated = new Date(createdAt.getTime() + (t + 1) * 60 * 60 * 1000);

      const thread = await prisma.thread.create({
        data: {
          requestId: request.id,
          clientId: client.id,
          specialistId,
          createdAt: threadCreated,
          lastMessageAt: new Date(threadCreated.getTime() + script.length * 30 * 60 * 1000),
          specialistLastReadAt: threadCreated,
        },
      });
      threadCount++;

      for (let m = 0; m < script.length; m++) {
        const sender = m % 2 === 0 ? specialistId : client.id;
        const messageAt = new Date(threadCreated.getTime() + m * 30 * 60 * 1000);
        await prisma.message.create({
          data: {
            threadId: thread.id,
            senderId: sender,
            text: script[m],
            createdAt: messageAt,
          },
        });
        messageCount++;
      }
    }
  }
  console.log(`  Requests:    ${requestCount}`);
  console.log(`  Threads:     ${threadCount}`);
  console.log(`  Messages:    ${messageCount}`);

  // ─── Complaints ───────────────────────────────────────────────────
  // Remove previous seed complaints then re-create
  await prisma.complaint.deleteMany({
    where: { text: { in: COMPLAINT_SAMPLES } },
  });
  let complaintCount = 0;
  for (let i = 0; i < COMPLAINT_SAMPLES.length; i++) {
    const reporter = clientUsers[i % clientUsers.length];
    const target = specialistUsers[(i * 3) % specialistUsers.length];
    if (!reporter || !target) continue;
    await prisma.complaint.create({
      data: {
        reporterId: reporter.id,
        targetUserId: target.id,
        text: COMPLAINT_SAMPLES[i],
        status: i === 0 ? "REVIEWED" : "NEW",
        reviewedAt: i === 0 ? new Date() : null,
      },
    });
    complaintCount++;
  }
  console.log(`  Complaints:  ${complaintCount}`);

  // ─── Notifications ────────────────────────────────────────────────
  // Remove previous seed notifications for Сергей so counts stay deterministic
  await prisma.notification.deleteMany({
    where: {
      userId: sergeiClient.id,
      title: { in: NOTIFICATION_SAMPLES.map((n) => n.title) },
    },
  });
  let notificationCount = 0;
  for (let i = 0; i < NOTIFICATION_SAMPLES.length; i++) {
    const n = NOTIFICATION_SAMPLES[i];
    const createdAt = new Date(Date.now() - (i + 1) * 6 * 60 * 60 * 1000);
    await prisma.notification.create({
      data: {
        userId: sergeiClient.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: i > 1,
        createdAt,
      },
    });
    notificationCount++;
  }
  console.log(`  Notifications: ${notificationCount}`);

  console.log("\nSpecialist/content seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
