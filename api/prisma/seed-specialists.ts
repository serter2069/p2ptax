/**
 * Specialists + requests + threads + messages + complaints + notifications.
 *
 * Runs AFTER `prisma/seed.ts` (which seeds cities / FNS / services).
 * Idempotent: safe to re-run — upserts by email / deterministic keys.
 *
 * Pro Flash critique 20260423 flagged empty dashboards (no seed). This
 * fills the DB with realistic tax-service data so screens render like
 * production instead of showing "0 запросов / 0 специалистов".
 *
 * Issue #1625: expanded with +25 specialists, +20 requests, +15 threads,
 * +13 saved-specialists for serter2069@gmail.com.
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
  avatarUrl: string;
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
    avatarUrl: "https://i.pravatar.cc/150?u=AlekseyVoronov",
    description: "Налоговый консультант с 8-летним опытом работы в сфере налогового права и P2P-операций. Специализируюсь на защите клиентов при камеральных и выездных проверках, связанных с доходами от криптовалюты и операциями на биржах Binance, Bybit и OKX. Помог более 300 клиентам урегулировать требования ИФНС без лишних доначислений. Веду дела как в досудебном порядке, так и при обжаловании в УФНС.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=MarinaSokolova",
    description: "Эксперт по налоговому праву с 6-летним опытом консультирования ИП и физических лиц по вопросам работы с криптовалютой и P2P-платформами. Помогаю правильно задекларировать доходы, составить возражения на акты камеральных проверок и избежать доначислений. Работаю с клиентами по всей России в дистанционном формате. Бесплатная первичная оценка ситуации по телефону.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=DmitryPetrov",
    description: "Бывший сотрудник ФНС с 10-летним стажем в налоговых органах Санкт-Петербурга. Досконально знаю процедуры выездных и камеральных проверок изнутри — что именно ищут инспекторы и как правильно оформить документы. Представляю интересы клиентов на допросах в ИФНС, сопровождаю проверки от начала до обжалования акта. Успешно снизил доначисления более чем в 80% дел.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=ElenaKuznetsova",
    description: "Специалист по налоговому планированию для владельцев цифровых активов и частных инвесторов. Помогаю минимизировать налоговые риски при операциях с криптовалютой, NFT и зарубежными брокерскими счетами. Провожу онлайн-консультации по всей России — без привязки к городу или региону. За 7 лет практики разобрала более 500 нестандартных ситуаций с налогообложением доходов физлиц.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=SergeyMorozov",
    description: "Юрист-налоговик с 12-летним опытом оспаривания решений ФНС в досудебном и судебном порядке. Представляю интересы клиентов в УФНС, арбитражных судах и вышестоящих налоговых органах. Специализация — выездные проверки ИП и ООО, доначисления по НДС и налогу на прибыль, оспаривание штрафов. Статистика: 73% дел выиграно полностью, 21% — частично.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=IrinaFedorova",
    description: "Налоговый консультант, специализирующийся на помощи трейдерам, инвесторам и владельцам криптоактивов. Составляю декларации 3-НДФЛ с расчётом доходов от торговли на CEX и DEX биржах, помогаю пройти камеральные проверки без нервов. За 5 лет работы обслужила более 200 клиентов из Казани и регионов Татарстана. Первичная консультация — 30 минут бесплатно.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=AndreyNikitin",
    description: "Практикующий налоговый адвокат с опытом более 200 успешно закрытых дел. Веду дела от первичного требования ИФНС до арбитражного суда включительно. Специализация — камеральные проверки по 3-НДФЛ, выездные проверки ИП, оспаривание штрафов по статье 126 НК РФ. Бесплатная первичная консультация до 60 минут — оцениваю перспективы дела и предлагаю стратегию.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=OlgaStepanova",
    description: "Сертифицированный налоговый консультант Палаты налоговых консультантов, бывший инспектор ИФНС. Работаю с фрилансерами, самозанятыми и ИП на разных системах налогообложения. Специализация — доходы от P2P-торговли, DeFi-протоколов, работа с 115-ФЗ при банковских блокировках. Благодаря знанию процедур изнутри помогаю клиентам пройти проверки быстро и без лишних доначислений.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=VladimirLebedev",
    description: "Налоговый консультант с экономическим образованием и 15-летним стажем. Специализируюсь на сложных ситуациях с банковскими блокировками по 115-ФЗ — помогаю физлицам и ИП подготовить пакет документов для разблокировки счёта. Знаю внутренние регламенты крупных банков и типовые триггеры службы безопасности. Успешно разблокировал более 180 счетов за последние три года.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=NataliaPopova",
    description: "Специалист по налогообложению зарубежных счетов, контролируемых иностранных компаний (КИК) и валютному контролю. Помогаю подготовить уведомления об открытии/закрытии зарубежных счетов, отчёты о движении средств, декларации по КИК. Работаю с клиентами из разных стран — Казахстан, Грузия, ОАЭ, Кипр. За 8 лет практики закрыла более 300 дел без штрафов со стороны ФНС.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=RomanIvanov",
    description: "Бухгалтер-консультант с опытом сопровождения налоговых проверок ИФНС по всей России в дистанционном формате. Готовлю ответы на требования о пояснениях, подбираю и структурирую доказательную базу, составляю возражения на акты проверок. За 9 лет практики помог более чем 400 клиентам отстоять свою позицию. Работаю оперативно — ответ на требование с коротким сроком подготовлю за 1-2 дня.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=AnnaSmirnova",
    description: "Юрист по налоговым спорам с опытом представительства в арбитражных судах — 40+ выигранных дел по оспариванию решений ИФНС. Специализация: камеральные проверки 3-НДФЛ, выездные проверки ООО и ИП, обжалование актов в УФНС и суде. Веду дела комплексно: от первичного анализа ситуации до исполнения судебного решения. Работаю в Екатеринбурге и дистанционно по всему УрФО.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=PavelVolkov",
    description: "Налоговый аналитик, специализирующийся на оптимизации НДФЛ для частных инвесторов с операциями на зарубежных биржах. Работаю исключительно с физлицами — помогаю правильно рассчитать налоговую базу по сделкам на IBKR, Exante, Saxo Bank, учесть убытки прошлых лет и применить льготы. Составляю декларации 3-НДФЛ любой сложности, объясняю каждую строку отчёта.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=YuliaZaitseva",
    description: "Налоговый юрист с 9-летним опытом консультирования по операциям с криптовалютой и цифровыми активами. Помогаю грамотно ответить на требование ИФНС, подготовить документы для камеральной проверки и минимизировать риски доначислений. Работаю с клиентами из Казани и дистанционно — быстро, без лишней бюрократии. Специализация: 3-НДФЛ по крипте, P2P-платформы, стейкинг и DeFi.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=MaximSolovyov",
    description: "Бывший инспектор Отдела оперативного контроля (ОКК) ФНС — знаю процедуры изнутри. Помогаю предпринимателям подготовиться к проверке ОКК и пройти её без штрафов. Консультирую по применению ККТ, онлайн-кассам, маркировке и требованиям к чекам. За последние два года успешно оспорил более 60 решений ОКК в административном порядке.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=SvetlanaOrlova",
    description: "Сертифицированный налоговый консультант Палаты налоговых консультантов, 7 лет практики. Специализируюсь на налогообложении самозанятых и ИП на УСН — помогаю правильно вести учёт, подавать декларации и избегать ошибок, которые могут привести к доначислениям. Консультирую по вопросам перехода между режимами налогообложения и совмещения статусов. Работаю в Челябинске и дистанционно.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=KirillMakarov",
    description: "Магистр налогового права МГУ, специализирующийся на налогообложении доходов от цифровых активов, NFT и DeFi-протоколов. Консультирую по сложным и нестандартным ситуациям, где стандартные инструкции не работают. Провожу правовой анализ токен-операций, помогаю структурировать деятельность так, чтобы снизить налоговую нагрузку законными методами. Работаю с клиентами из Самары и дистанционно по всей России.",
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
    avatarUrl: "https://i.pravatar.cc/150?u=GalinaBelova",
    description: "Практикующий налоговый аудитор с 20-летним опытом — одна из самых опытных специалистов на платформе. Сопровождаю выездные налоговые проверки от выхода инспекторов до подписания акта, готовлю возражения и обжалую решения в УФНС и суде. За карьеру провела более 150 крупных проверок и знаю все типичные зоны риска. Работаю в Уфе и дистанционно с клиентами по всей России.",
    fnsCodes: ["0201", "0202"],
    serviceNames: ["Выездная проверка", "Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (347) 200-29-30",
    telegram: "@belova_audit",
    officeAddress: "Уфа, Цюрупы ул., 2",
    workingHours: "Пн-Пт, 10:00-19:00",
  },
];

// ─── EXTRA SPECIALISTS (Issue #1625, +25) ────────────────────────────
// These duplicate the structure of SPECIALISTS above but with new
// names / emails / cities so the catalog looks populated.

const EXTRA_SPECIALISTS: typeof SPECIALISTS = [
  {
    email: "boris.sergeev@p2ptax-seed.ru",
    firstName: "Борис",
    lastName: "Сергеев",
    avatarUrl: "https://i.pravatar.cc/150?u=BorisSergeyev",
    description: "Налоговый консультант по P2P-операциям с 7-летним опытом. Специализируюсь на защите клиентов при камеральных проверках, связанных с доходами от криптовалюты на Binance и Bybit. Работаю дистанционно, первичная консультация бесплатно.",
    fnsCodes: ["7710", "7715"],
    serviceNames: ["Камеральная проверка", "Выездная проверка"],
    phone: "+7 (495) 121-01-01",
    telegram: "@sergeev_tax",
    officeAddress: "Москва, Большая Тульская ул., 15, офис 201",
    workingHours: "Пн-Пт, 10:00-19:00",
    yearsOfExperience: 7,
    specializations: ["Камеральные проверки по крипте", "P2P-операции", "Ответы на требования ИФНС"],
  },
  {
    email: "tatyana.kulikova@p2ptax-seed.ru",
    firstName: "Татьяна",
    lastName: "Куликова",
    avatarUrl: "https://i.pravatar.cc/150?u=TatyanKulikova",
    description: "Эксперт по НДФЛ физических лиц и ИП. 9 лет практики в Москве. Консультирую по декларациям 3-НДФЛ, сопровождаю камеральные проверки. Работаю с трейдерами, инвесторами и фрилансерами.",
    fnsCodes: ["7720", "7721"],
    serviceNames: ["Камеральная проверка"],
    phone: "+7 (495) 121-02-02",
    telegram: "@kulikova_ndfl",
    workingHours: "Пн-Пт, 9:00-18:00",
    yearsOfExperience: 9,
  },
  {
    email: "alexei.zaharov@p2ptax-seed.ru",
    firstName: "Алексей",
    lastName: "Захаров",
    avatarUrl: "https://i.pravatar.cc/150?u=AlexeyZaharov",
    description: "Бывший налоговый инспектор ФНС, 12 лет стажа. Досконально знаю процедуры выездных проверок и помогаю клиентам пройти их без доначислений. Веду дела по всей Москве.",
    fnsCodes: ["7722", "7723"],
    serviceNames: ["Выездная проверка", "Камеральная проверка"],
    phone: "+7 (495) 121-03-03",
    telegram: "@zaharov_fns",
    officeAddress: "Москва, 1-й Дербеневский пер., 6",
    workingHours: "Пн-Сб, 10:00-20:00",
    exFnsStartYear: 2010,
    exFnsEndYear: 2022,
    yearsOfExperience: 14,
    specializations: ["Выездные проверки", "Сопровождение на допросах"],
  },
  {
    email: "svetlana.petrova@p2ptax-seed.ru",
    firstName: "Светлана",
    lastName: "Петрова",
    avatarUrl: "https://i.pravatar.cc/150?u=SvetlanaPetrova",
    description: "Налоговый юрист, специализирующийся на зарубежных активах и КИК. Помогаю с уведомлениями об открытии зарубежных счетов, декларациями по КИК, валютным контролем. 6 лет практики.",
    fnsCodes: ["7724", "7725"],
    serviceNames: ["Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (495) 121-04-04",
    telegram: "@petrova_offshore",
    workingHours: "Пн-Пт, 10:00-18:00",
    yearsOfExperience: 6,
  },
  {
    email: "igor.kuznetsov@p2ptax-seed.ru",
    firstName: "Игорь",
    lastName: "Кузнецов",
    avatarUrl: "https://i.pravatar.cc/150?u=IgorKuznetsov",
    description: "Налоговый адвокат, 11 лет практики в арбитражных судах. Оспариваю решения ИФНС в досудебном и судебном порядке. Статистика: 75% дел полностью выиграно. Работаю в Москве и Подмосковье.",
    fnsCodes: ["7726", "7727"],
    serviceNames: ["Выездная проверка", "Отдел оперативного контроля"],
    phone: "+7 (495) 121-05-05",
    telegram: "@kuznetsov_advocate",
    officeAddress: "Москва, Вавилова ул., 69а, офис 310",
    workingHours: "Пн-Пт, 9:00-19:00",
    yearsOfExperience: 11,
  },
  {
    email: "maria.voronova@p2ptax-seed.ru",
    firstName: "Мария",
    lastName: "Воронова",
    avatarUrl: "https://i.pravatar.cc/150?u=MariaVoronova",
    description: "Налоговый консультант по самозанятым и ИП. Помогаю разобраться с налоговым режимом, составляю декларации 3-НДФЛ, консультирую по вопросам совмещения статусов. Работаю в Санкт-Петербурге и дистанционно.",
    fnsCodes: ["7804", "7807"],
    serviceNames: ["Камеральная проверка"],
    phone: "+7 (812) 241-06-06",
    telegram: "@voronova_spb",
    workingHours: "Пн-Пт, 10:00-18:00",
    yearsOfExperience: 5,
  },
  {
    email: "andrei.belikov@p2ptax-seed.ru",
    firstName: "Андрей",
    lastName: "Беликов",
    avatarUrl: "https://i.pravatar.cc/150?u=AndreyBelikov",
    description: "Специалист по налоговым спорам в Санкт-Петербурге. 8 лет опыта представления интересов клиентов в УФНС и арбитражных судах. Специализация — выездные проверки ИП и ООО.",
    fnsCodes: ["7808", "7809"],
    serviceNames: ["Выездная проверка", "Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (812) 241-07-07",
    telegram: "@belikov_spb",
    officeAddress: "Санкт-Петербург, Миллионная ул., 34",
    workingHours: "Пн-Пт, 10:00-19:00",
    yearsOfExperience: 8,
  },
  {
    email: "olga.nikiforova@p2ptax-seed.ru",
    firstName: "Ольга",
    lastName: "Никифорова",
    avatarUrl: "https://i.pravatar.cc/150?u=OlgaNikiforova",
    description: "Сертифицированный бухгалтер и налоговый консультант. Работаю с физлицами и ИП на разных системах налогообложения. Помогаю заполнить 3-НДФЛ, составить возражения на акты проверок.",
    fnsCodes: ["7812", "7815"],
    serviceNames: ["Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (812) 241-08-08",
    telegram: "@nikiforova_tax",
    workingHours: "Пн-Пт, 9:00-18:00",
    yearsOfExperience: 10,
  },
  {
    email: "pavel.sidorov@p2ptax-seed.ru",
    firstName: "Павел",
    lastName: "Сидоров",
    avatarUrl: "https://i.pravatar.cc/150?u=PavelSidorov",
    description: "Налоговый консультант с 6-летним опытом. Специализируюсь на операциях с криптовалютой в Новосибирске. Помогаю правильно задекларировать доходы, пройти камеральные проверки.",
    fnsCodes: ["5405", "5412"],
    serviceNames: ["Камеральная проверка", "Выездная проверка"],
    phone: "+7 (383) 201-09-09",
    telegram: "@sidorov_nsk",
    officeAddress: "Новосибирск, Мясниковой ул., 9",
    workingHours: "Пн-Пт, 10:00-18:00",
    yearsOfExperience: 6,
  },
  {
    email: "irina.noskova@p2ptax-seed.ru",
    firstName: "Ирина",
    lastName: "Носкова",
    avatarUrl: "https://i.pravatar.cc/150?u=IrinaNoskova",
    description: "Налоговый аналитик по зарубежным инвестициям. Консультирую по декларированию доходов от зарубежных брокеров (IBKR, Exante). Работаю в Новосибирске и дистанционно.",
    fnsCodes: ["5413", "5416"],
    serviceNames: ["Камеральная проверка"],
    phone: "+7 (383) 201-10-10",
    telegram: "@noskova_invest",
    workingHours: "Пн-Пт, 9:00-18:00",
    yearsOfExperience: 7,
  },
  {
    email: "mikhail.drozdov@p2ptax-seed.ru",
    firstName: "Михаил",
    lastName: "Дроздов",
    avatarUrl: "https://i.pravatar.cc/150?u=MikhailDrozdov",
    description: "Налоговый юрист с 13-летним опытом в Екатеринбурге. Специализация — выездные проверки ООО и ИП, обжалование доначислений в УФНС и арбитражных судах. Веду дела под ключ.",
    fnsCodes: ["6605", "6606"],
    serviceNames: ["Выездная проверка", "Камеральная проверка"],
    phone: "+7 (343) 201-11-11",
    telegram: "@drozdov_ekb",
    officeAddress: "Екатеринбург, Вилонова ул., 32",
    workingHours: "Пн-Пт, 9:00-19:00",
    exFnsStartYear: 2008,
    exFnsEndYear: 2019,
    yearsOfExperience: 13,
    specializations: ["Выездные проверки ООО", "Обжалование в УФНС"],
  },
  {
    email: "natalia.shevchenko@p2ptax-seed.ru",
    firstName: "Наталья",
    lastName: "Шевченко",
    avatarUrl: "https://i.pravatar.cc/150?u=NataliaShevchenko",
    description: "Налоговый консультант, бывший инспектор ФНС Екатеринбурга. Сопровождаю налоговые проверки от начала до обжалования акта. Специализация — камеральные проверки физлиц.",
    fnsCodes: ["6607", "6608"],
    serviceNames: ["Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (343) 201-12-12",
    telegram: "@shevchenko_ekb",
    workingHours: "Пн-Пт, 10:00-18:00",
    exFnsStartYear: 2012,
    exFnsEndYear: 2021,
    yearsOfExperience: 12,
  },
  {
    email: "sergey.titov@p2ptax-seed.ru",
    firstName: "Сергей",
    lastName: "Титов",
    avatarUrl: "https://i.pravatar.cc/150?u=SergeyTitov",
    description: "Налоговый юрист по криптовалютным операциям в Казани. Помогаю составить декларации 3-НДФЛ, ответить на требования ИФНС, пройти камеральную проверку. 8 лет практики.",
    fnsCodes: ["1605", "1606"],
    serviceNames: ["Камеральная проверка", "Выездная проверка"],
    phone: "+7 (843) 201-13-13",
    telegram: "@titov_kzn",
    officeAddress: "Казань, Баумана ул., 53",
    workingHours: "Пн-Пт, 9:00-18:00",
    yearsOfExperience: 8,
  },
  {
    email: "anna.lukina@p2ptax-seed.ru",
    firstName: "Анна",
    lastName: "Лукина",
    avatarUrl: "https://i.pravatar.cc/150?u=AnnaLukina",
    description: "Налоговый консультант для трейдеров и инвесторов. Помогаю правильно рассчитать НДФЛ по операциям на MOEX, зарубежных брокерах, криптовалютных биржах. 5 лет практики в Нижнем Новгороде.",
    fnsCodes: ["5262", "5263"],
    serviceNames: ["Камеральная проверка"],
    phone: "+7 (831) 201-14-14",
    telegram: "@lukina_nn",
    workingHours: "Пн-Пт, 10:00-18:00",
    yearsOfExperience: 5,
  },
  {
    email: "dmitry.savelyev@p2ptax-seed.ru",
    firstName: "Дмитрий",
    lastName: "Савельев",
    avatarUrl: "https://i.pravatar.cc/150?u=DmitrySavelyev",
    description: "Специалист ОКК по вопросам ККТ и маркировки. Помогаю предпринимателям подготовиться к проверке, оспорить штрафы, наладить учёт в соответствии с требованиями ФНС. 9 лет опыта в Нижнем Новгороде.",
    fnsCodes: ["5264", "5215"],
    serviceNames: ["Отдел оперативного контроля", "Выездная проверка"],
    phone: "+7 (831) 201-15-15",
    telegram: "@savelyev_okk",
    officeAddress: "Нижний Новгород, Адмирала Нахимова ул., 12",
    workingHours: "Пн-Пт, 9:00-19:00",
    yearsOfExperience: 9,
  },
  {
    email: "elena.sorokina@p2ptax-seed.ru",
    firstName: "Елена",
    lastName: "Сорокина",
    avatarUrl: "https://i.pravatar.cc/150?u=ElenaSorokina",
    description: "Налоговый консультант по НДФЛ для самозанятых и ИП в Челябинске. Разбираюсь в нюансах совмещения режимов налогообложения, помогаю с декларациями и возражениями на акты.",
    fnsCodes: ["7453", "7454"],
    serviceNames: ["Камеральная проверка", "Выездная проверка"],
    phone: "+7 (351) 201-16-16",
    telegram: "@sorokina_chel",
    workingHours: "Пн-Пт, 10:00-18:00",
    yearsOfExperience: 6,
  },
  {
    email: "roman.polezhaev@p2ptax-seed.ru",
    firstName: "Роман",
    lastName: "Полежаев",
    avatarUrl: "https://i.pravatar.cc/150?u=RomanPolezhaev",
    description: "Бывший инспектор ИФНС Челябинска, 10 лет стажа. Помогаю бизнесу пройти выездные проверки без лишних доначислений. Знаю все нюансы процедуры изнутри.",
    fnsCodes: ["7455", "7456"],
    serviceNames: ["Выездная проверка", "Отдел оперативного контроля"],
    phone: "+7 (351) 201-17-17",
    telegram: "@polezhaev_chel",
    officeAddress: "Челябинск, Победы пр., 39",
    workingHours: "Пн-Пт, 9:00-19:00",
    exFnsStartYear: 2011,
    exFnsEndYear: 2021,
    yearsOfExperience: 13,
  },
  {
    email: "tatyana.vlasova@p2ptax-seed.ru",
    firstName: "Татьяна",
    lastName: "Власова",
    avatarUrl: "https://i.pravatar.cc/150?u=TatyanaVlasova",
    description: "Налоговый консультант по зарубежным инвесторам и КИК в Самаре. Помогаю с уведомлениями об открытии счётов, отчётами о движении средств, декларациями по КИК. 7 лет практики.",
    fnsCodes: ["6313", "6314"],
    serviceNames: ["Камеральная проверка"],
    phone: "+7 (846) 201-18-18",
    telegram: "@vlasova_samara",
    workingHours: "Пн-Пт, 9:00-18:00",
    yearsOfExperience: 7,
  },
  {
    email: "viktor.naumov@p2ptax-seed.ru",
    firstName: "Виктор",
    lastName: "Наумов",
    avatarUrl: "https://i.pravatar.cc/150?u=ViktorNaumov",
    description: "Налоговый адвокат по спорам с ИФНС в Самаре. Специализируюсь на выездных проверках ИП и ООО. Провёл 80+ успешных дел. Работаю по всему ПФО.",
    fnsCodes: ["6318", "6319"],
    serviceNames: ["Выездная проверка", "Камеральная проверка", "Отдел оперативного контроля"],
    phone: "+7 (846) 201-19-19",
    telegram: "@naumov_samara",
    officeAddress: "Самара, Революционная ул., 73",
    workingHours: "Пн-Пт, 10:00-19:00",
    yearsOfExperience: 11,
  },
  {
    email: "svetlana.abdullina@p2ptax-seed.ru",
    firstName: "Светлана",
    lastName: "Абдуллина",
    avatarUrl: "https://i.pravatar.cc/150?u=SvetlanaAbdullina",
    description: "Налоговый консультант по P2P-операциям в Уфе. 5 лет практики, специализация — камеральные проверки физлиц и ответы на требования ИФНС по операциям с криптовалютой.",
    fnsCodes: ["0203", "0220"],
    serviceNames: ["Камеральная проверка", "Выездная проверка"],
    phone: "+7 (347) 201-20-20",
    telegram: "@abdullina_ufa",
    workingHours: "Пн-Пт, 10:00-18:00",
    yearsOfExperience: 5,
  },
  {
    email: "yuriy.kondratyev@p2ptax-seed.ru",
    firstName: "Юрий",
    lastName: "Кондратьев",
    avatarUrl: "https://i.pravatar.cc/150?u=YuriyKondratyev",
    description: "Бывший советник государственной гражданской службы УФНС Башкортостана. Знаю процедуры обжалования изнутри. Помогаю клиентам из Уфы и регионов оспорить доначисления в вышестоящих органах.",
    fnsCodes: ["0239", "0201"],
    serviceNames: ["Выездная проверка", "Отдел оперативного контроля"],
    phone: "+7 (347) 201-21-21",
    telegram: "@kondratyev_ufa",
    officeAddress: "Уфа, Пушкина ул., 95",
    workingHours: "Пн-Пт, 9:00-19:00",
    exFnsStartYear: 2009,
    exFnsEndYear: 2020,
    yearsOfExperience: 15,
  },
  {
    email: "anna.gromova@p2ptax-seed.ru",
    firstName: "Анна",
    lastName: "Громова",
    avatarUrl: "https://i.pravatar.cc/150?u=AnnaGromova",
    description: "Налоговый консультант по НДФЛ инвесторов в Красноярске. Работаю с трейдерами и владельцами криптоактивов. Составляю декларации 3-НДФЛ, помогаю пройти камеральные проверки.",
    fnsCodes: ["2461", "2462"],
    serviceNames: ["Камеральная проверка"],
    phone: "+7 (391) 201-22-22",
    telegram: "@gromova_krsk",
    workingHours: "Пн-Пт, 10:00-18:00",
    yearsOfExperience: 6,
  },
  {
    email: "aleksei.nesterov@p2ptax-seed.ru",
    firstName: "Алексей",
    lastName: "Нестеров",
    avatarUrl: "https://i.pravatar.cc/150?u=AlekseyNesterov",
    description: "Налоговый юрист, специализирующийся на выездных проверках в Красноярске. 10 лет практики, успешно оспорил 60+ решений ИФНС в арбитражных судах Сибири.",
    fnsCodes: ["2463", "2464"],
    serviceNames: ["Выездная проверка", "Камеральная проверка"],
    phone: "+7 (391) 201-23-23",
    telegram: "@nesterov_krsk",
    officeAddress: "Красноярск, Партизана Железняка ул., 46",
    workingHours: "Пн-Пт, 9:00-19:00",
    yearsOfExperience: 10,
  },
  {
    email: "tatyana.shaposhnikova@p2ptax-seed.ru",
    firstName: "Татьяна",
    lastName: "Шапошникова",
    avatarUrl: "https://i.pravatar.cc/150?u=TatyanaShaposhnikova",
    description: "Сертифицированный налоговый консультант Палаты, 8 лет опыта. Специализация — ОКК, ККТ, маркировка. Работаю в Красноярске и дистанционно по Сибири.",
    fnsCodes: ["2422", "2423"],
    serviceNames: ["Отдел оперативного контроля", "Камеральная проверка"],
    phone: "+7 (391) 201-24-24",
    telegram: "@shaposhnikova_krsk",
    workingHours: "Пн-Пт, 10:00-18:00",
    yearsOfExperience: 8,
  },
  {
    email: "dmitry.romanov@p2ptax-seed.ru",
    firstName: "Дмитрий",
    lastName: "Романов",
    avatarUrl: "https://i.pravatar.cc/150?u=DmitryRomanov",
    description: "Налоговый консультант по зарубежным активам и криптовалюте в Красноярске. Помогаю с КИК, зарубежными счетами, декларированием доходов от DeFi-протоколов. 7 лет практики.",
    fnsCodes: ["2424", "2461"],
    serviceNames: ["Камеральная проверка", "Выездная проверка"],
    phone: "+7 (391) 201-25-25",
    telegram: "@romanov_krsk",
    officeAddress: "Красноярск, Мате Залки ул., 1а",
    workingHours: "Пн-Пт, 9:00-18:00",
    yearsOfExperience: 7,
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

// ─── EXTRA REQUEST SCENARIOS (Issue #1625, +20) ──────────────────────

const EXTRA_REQUEST_SCENARIOS: typeof REQUEST_SCENARIOS = [
  {
    title: "Налоговый вычет при покупке квартиры",
    description: "Купил квартиру в 2023 за 4.5 млн. Хочу получить имущественный вычет. Нужна помощь с подготовкой документов и подачей декларации 3-НДФЛ.",
    fnsCode: "7728",
    status: "ACTIVE",
    daysAgo: 3,
    threadCount: 2,
  },
  {
    title: "Доначисление по ИП на патенте — ИФНС №21",
    description: "ИФНС выставила требование об уплате доначислений по ИП на патентной системе. Считаю, что суммы завышены. Нужна помощь с возражением.",
    fnsCode: "7721",
    status: "ACTIVE",
    daysAgo: 6,
    threadCount: 3,
  },
  {
    title: "Стейкинг и DeFi — как считать НДФЛ?",
    description: "Получаю доход от стейкинга ETH и участия в пулах ликвидности Uniswap. Не понимаю как правильно рассчитать налоговую базу. Нужна консультация.",
    fnsCode: "7715",
    status: "ACTIVE",
    daysAgo: 1,
    threadCount: 2,
  },
  {
    title: "Блокировка р/с по 115-ФЗ в Сбербанке",
    description: "Сбербанк заблокировал расчётный счёт ИП из-за транзитных операций. Оборот за последние 3 месяца — 3.8 млн. Нужна помощь с подготовкой пояснений.",
    fnsCode: "7730",
    status: "ACTIVE",
    daysAgo: 2,
    threadCount: 3,
  },
  {
    title: "Консультация по смене налогового резидентства",
    description: "Планирую переехать в ОАЭ и работать удалённо. Хочу разобраться, как законно минимизировать налоговую нагрузку при смене резидентства. Клиенты в России и ЕС.",
    fnsCode: "7714",
    status: "ACTIVE",
    daysAgo: 4,
    threadCount: 2,
  },
  {
    title: "Ответ на требование по НДС — ООО на ОСНО",
    description: "Пришло требование о предоставлении документов по операциям с НДС за 3 квартал 2024. Срок ответа — 10 дней. Нужна помощь с подготовкой пакета документов.",
    fnsCode: "7709",
    status: "ACTIVE",
    daysAgo: 3,
    threadCount: 2,
  },
  {
    title: "Обжалование штрафа по НДФЛ — физлицо",
    description: "ИФНС насчитала штраф за несвоевременную подачу декларации 3-НДФЛ. Штраф 12 500 руб. Считаю, что срок не пропущен, есть подтверждение отправки. Нужна помощь с жалобой.",
    fnsCode: "7710",
    status: "ACTIVE",
    daysAgo: 5,
    threadCount: 1,
  },
  {
    title: "Выездная проверка ООО — подготовка за 2 месяца",
    description: "Получили решение о выездной проверке, период 2022-2024. ООО на ОСНО, оборот 180 млн/год. Нужен опытный консультант для аудита документов и сопровождения проверки.",
    fnsCode: "7808",
    status: "ACTIVE",
    daysAgo: 10,
    threadCount: 4,
  },
  {
    title: "Декларирование NFT — что считается доходом?",
    description: "Продал несколько NFT на OpenSea, итого около 800 тысяч рублей. Не понимаю как правильно отразить доход в декларации. Нужна разовая консультация.",
    fnsCode: "7716",
    status: "ACTIVE",
    daysAgo: 2,
    threadCount: 2,
  },
  {
    title: "Требование ИФНС по зарубежному брокеру",
    description: "ИФНС запросила документы по операциям через Interactive Brokers за 2023. Портфель акций и облигаций, дивиденды от иностранных эмитентов. Срок ответа 5 дней. Срочно нужна помощь.",
    fnsCode: "7722",
    status: "ACTIVE",
    daysAgo: 1,
    threadCount: 2,
  },
  {
    title: "Налог с продажи авто — нюансы расчёта",
    description: "Продал машину дороже чем покупал. Хочу минимизировать налог. Авто было в собственности 2 года 8 месяцев. Нужна консультация по расчёту и декларированию.",
    fnsCode: "5261",
    status: "CLOSED",
    daysAgo: 45,
    threadCount: 2,
  },
  {
    title: "Оспаривание акта по ОКК — кафе",
    description: "Кафе получило акт проверки ОКК с нарушениями применения ККТ — штраф 90 000 руб. Нарушения оспариваем. Нужен консультант по оперативному контролю.",
    fnsCode: "6606",
    status: "ACTIVE",
    daysAgo: 7,
    threadCount: 3,
  },
  {
    title: "Помощь с подачей 3-НДФЛ по иностранным дивидендам",
    description: "Получаю дивиденды от американских акций через ВТБ. Брокер не удержал налог в полном объёме. Нужна помощь с заполнением 3-НДФЛ и расчётом суммы к доплате.",
    fnsCode: "6603",
    status: "ACTIVE",
    daysAgo: 8,
    threadCount: 1,
  },
  {
    title: "Сопровождение проверки ИП на ОСНО — Казань",
    description: "ИП на ОСНО получил запрос на выездную проверку. Оборот 28 млн/год, основной доход — IT-услуги. Нужна помощь с подготовкой документов и сопровождением инспекторов.",
    fnsCode: "1603",
    status: "CLOSING_SOON",
    daysAgo: 20,
    threadCount: 3,
  },
  {
    title: "Консультация по UBO и бенефициарам КИК",
    description: "Являюсь конечным бенефициаром кипрской компании. Не уверен, нужно ли подавать уведомление КИК и как рассчитать прибыль. Нужна консультация по международному налогообложению.",
    fnsCode: "5263",
    status: "ACTIVE",
    daysAgo: 3,
    threadCount: 2,
  },
  {
    title: "Возврат НДФЛ за лечение — платная клиника",
    description: "Хочу получить социальный вычет за лечение зубов в 2023. Расходы — 180 000 руб. Нужна помощь с документами и подачей 3-НДФЛ.",
    fnsCode: "7453",
    status: "ACTIVE",
    daysAgo: 6,
    threadCount: 1,
  },
  {
    title: "Налог на прибыль ООО — оспаривание доначислений",
    description: "ИФНС доначислила налог на прибыль ООО за 2022 — 1.2 млн. Основание — технические контрагенты. Не согласны, все операции реальные. Нужен юрист.",
    fnsCode: "0202",
    status: "ACTIVE",
    daysAgo: 9,
    threadCount: 4,
  },
  {
    title: "Ошибка в декларации 3-НДФЛ — уточнёнка",
    description: "Обнаружил ошибку в поданной декларации 3-НДФЛ за 2023. Занизил налоговую базу на 350 000 руб. Хочу подать уточнёнку и погасить недоимку до штрафов.",
    fnsCode: "2462",
    status: "ACTIVE",
    daysAgo: 4,
    threadCount: 2,
  },
  {
    title: "Налогообложение фриланса через Upwork — ИП",
    description: "Работаю через Upwork, зарегистрировал ИП на УСН 6%. Банк запросил документы по поступлениям из-за рубежа. Нужна консультация по оформлению контрактов и поступлений.",
    fnsCode: "7724",
    status: "CLOSED",
    daysAgo: 38,
    threadCount: 2,
  },
  {
    title: "Проверка ОКК — алкогольная лицензия",
    description: "Магазин получил предписание ОКК по нарушениям при продаже алкоголя. Штраф 150 000 руб. Нужна помощь с обжалованием в административном порядке.",
    fnsCode: "7451",
    status: "ACTIVE",
    daysAgo: 5,
    threadCount: 2,
  },
];

// ─── Message scripts — realistic 2-4 message back-and-forth ─────────

const MESSAGE_SCRIPTS: string[][] = [
  // Scenario A — specialist responds, client details
  [
    "Здравствуйте! Увидел ваш запрос. Я работаю с такими ситуациями, у меня есть опыт аналогичных кейсов с Тинькофф. Давайте я посмотрю детали: какой код ОКВЭД у вас, и какие пояснения уже готовили?",
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

// ─── Extra message scripts (Issue #1625 — more messages per thread) ──

const EXTRA_MESSAGE_SCRIPTS: string[][] = [
  // I — detailed requirements gathering
  [
    "Здравствуйте! Рассмотрел ваш запрос. Скажите, акт камеральной проверки уже пришёл или только требование о пояснениях?",
    "Пока только требование о пояснениях. Срок — 5 рабочих дней.",
    "Понятно. Нужно подготовить ответ с подтверждающими документами. Пришлите, пожалуйста, текст требования и выгрузку операций за проверяемый период.",
    "Отправил на почту. Документы прикрепил.",
    "Получил, изучаю. Вернусь с планом ответа сегодня вечером.",
  ],
  // J — quick resolution
  [
    "Добрый день! По вашей ситуации — стандартный случай. Понадобится декларация 3-НДФЛ с расчётом по CSV из Bybit. Пришлите выгрузку.",
    "Высылаю. Там 284 сделки за 2023.",
    "Посмотрел. Итог — доход 1 850 000, расход 1 560 000, НДФЛ к уплате около 38 000. Подготовлю декларацию за 2 дня.",
    "Отлично, жду. Когда можем созвониться?",
    "Завтра в 15:00 удобно?",
    "Да, договорились.",
  ],
  // K — specialist engages
  [
    "Здравствуйте. Возьмусь за ваш вопрос. По КИК — нужно уточнить: компания активная или пассивная по критериям НК?",
    "Компания оказывает IT-услуги, выручка чисто активная.",
    "Тогда возможно освобождение от КИК по ст. 25.13-1 НК. Давайте разберём подробнее — пришлите структуру владения.",
    "Структуру пришлю завтра. Спасибо, это обнадёживает.",
  ],
  // L — outreach + proposal
  [
    "Здравствуйте! По выездной проверке — есть опыт аналогичных дел. Первым делом нужна предварительная экспертиза документов. Когда можете встретиться?",
    "Могу в пятницу после 15:00.",
    "Пятница 15:30 — подходит. Адрес офиса пришлю в день встречи.",
    "Договорились. Что взять с собой?",
    "Договоры с основными контрагентами за проверяемый период, банковские выписки, акты выполненных работ.",
  ],
  // M — urgent
  [
    "Получил ваше сообщение. Срочно — пришлите текст требования прямо сейчас, посмотрю сегодня.",
    "Высылаю.",
    "Изучил. Требование стандартное, по статье 88. Подготовим ответ с документами за 1 день. Стоимость — 8 000 руб.",
    "Согласен. Как оплатить?",
    "На карту или по договору оферты — как удобно. Реквизиты пришлю.",
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
    title: "Новое сообщение по вашему запросу",
    body: "Налоговый консультант написал по вашему запросу о разблокировке счёта",
  },
  {
    type: "new_message",
    title: "Новое сообщение",
    body: "У вас новое сообщение от специалиста",
  },
  {
    type: "new_request_in_city",
    title: "Новый запрос в вашем городе",
    body: "Клиент ищет специалиста по камеральной проверке в Москве",
  },
  {
    type: "promo_expiring",
    title: "Срок запросы истекает",
    body: "Ваш запрос закроется через 3 дня — продлить?",
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
        avatarUrl: spec.avatarUrl,
        role: "USER",
        isSpecialist: true,
        specialistProfileCompletedAt: nowSeed,
        isAvailable: true,
        isPublicProfile: true,
      },
      create: {
        email: spec.email,
        firstName: spec.firstName,
        lastName: spec.lastName,
        avatarUrl: spec.avatarUrl,
        role: "USER",
        isSpecialist: true,
        specialistProfileCompletedAt: nowSeed,
        isAvailable: true,
        isPublicProfile: true,
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

  // ─── Issue #1625: Extra specialists (+25) ────────────────────────
  const extraSpecialistUsers: Array<{ id: string; email: string }> = [];
  let extraSpecialistCount = 0;
  for (const spec of EXTRA_SPECIALISTS) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        firstName: spec.firstName,
        lastName: spec.lastName,
        avatarUrl: spec.avatarUrl,
        role: "USER",
        isSpecialist: true,
        specialistProfileCompletedAt: nowSeed,
        isAvailable: true,
        isPublicProfile: true,
      },
      create: {
        email: spec.email,
        firstName: spec.firstName,
        lastName: spec.lastName,
        avatarUrl: spec.avatarUrl,
        role: "USER",
        isSpecialist: true,
        specialistProfileCompletedAt: nowSeed,
        isAvailable: true,
        isPublicProfile: true,
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

    // Generate cases for extra specialists
    const cityHint = spec.officeAddress?.split(",")[0]?.trim() ?? null;
    const cityList = cityHint ? [cityHint] : [];
    const cases = generateCasesForSpecialist(
      spec.firstName,
      cityList,
      spec.fnsCodes,
      spec.serviceNames,
      extraSpecialistCount + 100,
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
    }

    extraSpecialistUsers.push({ id: user.id, email: user.email });
    extraSpecialistCount++;
  }
  console.log(`  Extra specialists: ${extraSpecialistCount}`);

  // ─── Issue #1625: Saved specialists for serter2069@gmail.com (+13) ─
  // Pick 13 specialists from both pools; upsert so idempotent.
  const allSeedSpecialists = [...specialistUsers, ...extraSpecialistUsers];
  const savedTargets = allSeedSpecialists.slice(0, 13);
  let savedCount = 0;
  for (const target of savedTargets) {
    if (target.id === sergeiClient.id) continue; // can't save yourself
    await prisma.savedSpecialist.upsert({
      where: { userId_specialistId: { userId: sergeiClient.id, specialistId: target.id } },
      update: {},
      create: { userId: sergeiClient.id, specialistId: target.id },
    });
    savedCount++;
  }
  console.log(`  Saved specialists (serter2069): ${savedCount}`);

  // ─── Issue #1625: Extra requests (+20) ───────────────────────────
  const allScriptPool = [...MESSAGE_SCRIPTS, ...EXTRA_MESSAGE_SCRIPTS];
  const extraSeedTitles = EXTRA_REQUEST_SCENARIOS.map((r) => r.title);
  await prisma.request.deleteMany({
    where: { title: { in: extraSeedTitles } },
  });
  let extraRequestCount = 0;
  let extraThreadCount = 0;
  let extraMessageCount = 0;

  for (let idx = 0; idx < EXTRA_REQUEST_SCENARIOS.length; idx++) {
    const scenario = EXTRA_REQUEST_SCENARIOS[idx];
    const fns = fnsMap[scenario.fnsCode];
    if (!fns) {
      console.warn(`  [skip extra] FNS ${scenario.fnsCode} not found`);
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
    extraRequestCount++;

    // Pull specialists from both pools who cover this FNS
    const eligibleSpecs = await prisma.specialistFns.findMany({
      where: { fnsId: fns.id },
      select: { specialistId: true },
      take: Math.max(scenario.threadCount, 1),
    });
    const specialistIds = eligibleSpecs.map((s) => s.specialistId);
    const allSpecialistPool = [...specialistUsers, ...extraSpecialistUsers];
    while (specialistIds.length < scenario.threadCount && allSpecialistPool.length > specialistIds.length) {
      const fallback = allSpecialistPool.find((s) => !specialistIds.includes(s.id));
      if (!fallback) break;
      specialistIds.push(fallback.id);
    }

    for (let t = 0; t < scenario.threadCount && t < specialistIds.length; t++) {
      const specialistId = specialistIds[t];
      // Use the full script pool (including extra scripts) for richer threads
      const script = allScriptPool[(idx * 3 + t + 8) % allScriptPool.length];
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
      extraThreadCount++;

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
        extraMessageCount++;
      }
    }
  }
  console.log(`  Extra requests:  ${extraRequestCount}`);
  console.log(`  Extra threads:   ${extraThreadCount}`);
  console.log(`  Extra messages:  ${extraMessageCount}`);

  // ─── Issue #1625: Add more messages to existing threads ──────────
  // Find threads with only 2 messages and add 3-5 more from script pool.
  const thinThreads = await prisma.thread.findMany({
    where: {},
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    take: 20,
  });
  let bonusMessageCount = 0;
  for (const thread of thinThreads) {
    if (thread._count.messages >= 4) continue; // already has enough messages
    const lastMsg = thread.messages[0];
    if (!lastMsg) continue;

    const extraLines = [
      "Хорошо, буду ждать ваш ответ.",
      "Можем ли мы уточнить сроки?",
      "Спасибо за оперативность!",
      "Ещё один вопрос: нужно ли нотариальное заверение документов?",
      "Нет, нотариус не нужен. Достаточно обычных копий с вашей подписью.",
    ];
    for (let i = 0; i < 3; i++) {
      const sender = i % 2 === 0 ? thread.clientId : thread.specialistId;
      await prisma.message.create({
        data: {
          threadId: thread.id,
          senderId: sender,
          text: extraLines[i % extraLines.length],
          createdAt: new Date((lastMsg.createdAt as Date).getTime() + (i + 1) * 20 * 60 * 1000),
        },
      });
      bonusMessageCount++;
    }
  }
  console.log(`  Bonus messages on thin threads: ${bonusMessageCount}`);

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
