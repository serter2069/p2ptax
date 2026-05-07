// Дополнительные публичные запросы для лендинга — 30 штук, разные
// сценарии (камеральная / выездная / 115-ФЗ / ОКК / возврат / спор).
// Идемпотентно: на rerun удаляет всё созданное от выделенного юзера
// SEED_USER_EMAIL и пересоздаёт.
// Запуск: npx tsx prisma/seed-public-requests.ts

import { PrismaClient, RequestStatus } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_USER_EMAIL = "seed-public-feed@p2ptax-seed.ru";

// 10 разнообразных сценариев × 3 повторения = 30 запросов с разными
// ИФНС/городами/датами. Title на русском, без техномаркеров — лента
// должна выглядеть как настоящая активность клиентов.
const TEMPLATES: Array<{
  category: "camera" | "field" | "115fz" | "okk" | "refund" | "dispute";
  title: string;
  description: string;
}> = [
  {
    category: "camera",
    title: "Запрос пояснений по 6-НДФЛ — расхождения с РСВ",
    description:
      "Пришёл запрос пояснений: расхождение между 6-НДФЛ и РСВ за 2 квартал. Бухгалтер уволилась, нужно срочно подготовить ответ.",
  },
  {
    category: "camera",
    title: "Доначисление НДС 480 тыс. по камеральной",
    description:
      "По итогам камералки выкатили 480 тыс. доначисления + штрафы. Считаем, что часть вычетов сняли необоснованно. Нужно возражение и дальше — апелляция в УФНС.",
  },
  {
    category: "field",
    title: "Назначена выездная проверка за 2022-2024",
    description:
      "Получили решение о ВНП за три года. Требуют документы по контрагентам, штатное расписание, договоры. Готовимся, нужен сопровождающий специалист в инспекции.",
  },
  {
    category: "field",
    title: "Допросы свидетелей в рамках выездной",
    description:
      "Вызвали трёх сотрудников на допросы. Нужна подготовка — что говорить, как отвечать на вопросы про контрагентов и документооборот.",
  },
  {
    category: "115fz",
    title: "Заблокировали счёт по 115-ФЗ",
    description:
      "Банк заблокировал расчётный счёт, ссылаясь на сомнительные операции. Запросили кучу документов. ИФНС параллельно прислала требование по разрывам НДС.",
  },
  {
    category: "115fz",
    title: "Контрагент пожаловался — попали в чёрный список банка",
    description:
      "Контрагент пожаловался, нас попали в плохой реестр банка. Нужна реабилитация: подготовить пояснения, доказать реальность сделок.",
  },
  {
    category: "okk",
    title: "Контрольная закупка отделом оперативного контроля",
    description:
      "Провели контрольную покупку в нашей точке, не пробили чек. Составили протокол. Хотим минимизировать штраф или оспорить.",
  },
  {
    category: "okk",
    title: "Не зарегистрировали кассу — штраф 30 тыс.",
    description:
      "Открыли новую точку, забыли сразу зарегистрировать кассу в ОФД. Через две недели — штраф 30 тыс. Можно ли смягчить?",
  },
  {
    category: "refund",
    title: "Возврат переплаты НДС — ИФНС не отвечает",
    description:
      "Переплатили НДС за прошлый квартал, хотим вернуть на расчётный счёт. ИФНС не отвечает на заявление уже месяц.",
  },
  {
    category: "dispute",
    title: "Кадастровая стоимость завышена в 3 раза",
    description:
      "Кадастровая стоимость объекта завышена в 3 раза. Налог рассчитали соответственно. Готовимся к комиссии и далее в суд.",
  },
];

async function main() {
  console.log("[seed-public] starting");

  // Выделенный пользователь под этот сидер. По нему делаем rerun-cleanup.
  const seedUser = await prisma.user.upsert({
    where: { email: SEED_USER_EMAIL },
    update: {},
    create: {
      email: SEED_USER_EMAIL,
      firstName: "Клиент",
      lastName: "Демо",
      role: "USER",
      isSpecialist: false,
    },
    select: { id: true },
  });

  // Берём широкий набор ФНС, чтобы запросы были по разным городам.
  const fnsOffices = await prisma.fnsOffice.findMany({
    select: { id: true, cityId: true, name: true, code: true },
    orderBy: { code: "asc" },
    take: 60,
  });
  if (fnsOffices.length === 0) {
    console.error("Нет ни одной ФНС. Запусти seed-fns сначала.");
    process.exit(1);
  }

  // Идемпотентность: чистим всё что юзер уже создавал.
  const cleared = await prisma.request.deleteMany({
    where: { userId: seedUser.id },
  });
  if (cleared.count > 0) console.log(`[seed-public] cleared ${cleared.count} stale`);

  let created = 0;
  // 30 запросов = 10 шаблонов × 3 повторения, каждое в разной ФНС.
  for (let rep = 0; rep < 3; rep++) {
    for (let i = 0; i < TEMPLATES.length; i++) {
      const tpl = TEMPLATES[i];
      const fns = fnsOffices[(rep * TEMPLATES.length + i) % fnsOffices.length];
      // Распределяем createdAt в окне последних 30 дней так, чтобы
      // первая часть была свежее (ACTIVE), последняя постарше (часть
      // CLOSING_SOON, очень мало CLOSED).
      const daysAgo = Math.floor(((rep * 10 + i) * 31) / 30) % 30;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const status: RequestStatus =
        daysAgo > 25
          ? RequestStatus.CLOSED
          : daysAgo > 18
          ? RequestStatus.CLOSING_SOON
          : RequestStatus.ACTIVE;
      // Чтобы при rerun-cleanup-recreate FE-кэш не путал стары/новый
      // запрос — title для повторов тегаем номером без визуальных
      // скобок. Например "(вариант 2)".
      const title =
        rep === 0 ? tpl.title : `${tpl.title} (вариант ${rep + 1})`;
      await prisma.request.create({
        data: {
          userId: seedUser.id,
          cityId: fns.cityId,
          fnsId: fns.id,
          title,
          description: tpl.description,
          status,
          createdAt,
          lastActivityAt: createdAt,
        },
      });
      created++;
    }
  }

  const total = await prisma.request.count();
  const active = await prisma.request.count({ where: { status: RequestStatus.ACTIVE } });
  console.log(`[seed-public] created ${created}. total=${total}, active=${active}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
