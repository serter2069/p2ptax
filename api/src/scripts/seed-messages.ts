import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAIL = 'serter2069@gmail.com';

// Realistic messages from specialists about tax topics
const messageTexts = [
  'Здравствуйте! Изучил ваш запрос. По ситуации с 115-ФЗ могу помочь — есть успешный опыт разблокировки счетов в аналогичных случаях.',
  'Добрый день! Готов взяться за ваше дело. Для начала нужно собрать пакет документов: выписки по счёту за 3 месяца, договоры с контрагентами, пояснительная записка.',
  'Рассмотрел ваш запрос. Камеральная проверка по НДФЛ — типичная ситуация. Подготовим ответ на требование в течение 3 рабочих дней.',
  'Здравствуйте! По вопросу разблокировки счёта: Тинькофф требует пояснений по операциям. Составлю мотивированный ответ, снимали блокировки в 90% случаев.',
  'Добрый день, Сергей! Могу взяться за сопровождение. Доначисление по НДС — оспоримо, если соблюдены сроки обжалования. Когда получили акт?',
  'Изучил материалы. Выездная проверка — серьёзно, но управляемо. Нужно срочно подготовить возражения на акт. Есть ли у вас уже акт проверки?',
  'Здравствуйте! По продаже апартаментов — нюанс в том, что они не жилые, минимальный срок владения для освобождения от НДФЛ всё равно 5 лет. Давайте считать налог.',
  'Добрый день! Могу помочь с камеральной проверкой. Для уточнения: какой период проверяет ИФНС и какую сумму доначисляют?',
  'Рассмотрел ваш запрос. По требованию ИФНС о пояснениях — срок ответа 5 рабочих дней. Готов составить юридически грамотный ответ.',
  'Здравствуйте! Специализируюсь на 115-ФЗ, работаю с Тинькофф и Сбер. Присылайте реквизиты требования — подскажу по стратегии.',
  'Добрый день, Сергей! Видел похожие дела — доначисление по УСН 6% оспорили полностью. Нужно проверить, правильно ли ИФНС применила ставку.',
  'Изучил детали. Готов подготовить возражения на акт камеральной проверки. Работаю в вашем регионе, знаю инспекцию.',
  'Здравствуйте! По вашей ситуации: апелляционная жалоба в УФНС — это первый шаг. Стоимость и сроки обсудим при звонке.',
  'Добрый день! Специализируюсь на налоговых спорах. Готов взяться за ваше дело. Пришлите копию требования?',
  'Рассмотрел запрос. Операции ИП часто попадают под 115-ФЗ. Помогаю составить убедительные пояснения для банка.',
];

async function main() {
  // Find target user
  const targetUser = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true, email: true, firstName: true },
  });

  if (!targetUser) {
    throw new Error(`User ${TARGET_EMAIL} not found`);
  }
  console.log(`Target user: ${targetUser.firstName} (${targetUser.id})`);

  // Get specialists to use as senders
  const specialists = await prisma.user.findMany({
    where: {
      deletedAt: null,
      isSpecialist: true,
      firstName: { not: null },
      id: { not: targetUser.id },
    },
    select: { id: true, email: true, firstName: true, lastName: true },
    take: 7,
  });

  if (specialists.length < 3) {
    throw new Error(`Not enough specialists found: ${specialists.length}`);
  }
  console.log(`Found ${specialists.length} specialists`);

  // Get target user's existing requests
  const existingRequests = await prisma.request.findMany({
    where: { userId: targetUser.id, status: 'ACTIVE' },
    select: { id: true, title: true },
    take: 3,
  });

  // Get a city and fns for new requests
  const city = await prisma.city.findFirst({ select: { id: true } });
  const fns = await prisma.fnsOffice.findFirst({ select: { id: true } });

  if (!city || !fns) {
    throw new Error('No city or FNS office found');
  }

  // Create 2 additional requests for the target user
  const newRequestTitles = [
    'Доначисление НДС по итогам выездной проверки',
    'Жалоба в УФНС на решение инспекции',
  ];

  const newRequests = [];
  for (const title of newRequestTitles) {
    const req = await prisma.request.create({
      data: {
        userId: targetUser.id,
        title,
        cityId: city.id,
        fnsId: fns.id,
        description: `Запрос создан для тестирования системы сообщений. ${title}.`,
        status: 'ACTIVE',
      },
    });
    newRequests.push(req);
    console.log(`Created request: ${title}`);
  }

  const allRequests = [...existingRequests, ...newRequests];

  // Create threads and messages
  // We'll create 5 threads with 2-3 messages each = 10-15 total messages
  const threadPlan = [
    { requestIdx: 0, specialistIdx: 0, msgCount: 3 },
    { requestIdx: 0, specialistIdx: 1, msgCount: 2 },
    { requestIdx: 1, specialistIdx: 2, msgCount: 3 },
    { requestIdx: 2, specialistIdx: 3, msgCount: 2 },
    { requestIdx: 3, specialistIdx: 4, msgCount: 3 },
    { requestIdx: 4, specialistIdx: 5, msgCount: 2 },
  ];

  let totalMessages = 0;
  let msgIdx = 0;

  for (const plan of threadPlan) {
    const request = allRequests[plan.requestIdx];
    const specialist = specialists[plan.specialistIdx % specialists.length];

    if (!request) continue;

    // Check if thread already exists for this request+specialist combo
    const existingThread = await prisma.thread.findFirst({
      where: { requestId: request.id, specialistId: specialist.id },
    });

    if (existingThread) {
      console.log(`Thread already exists for request ${request.id} + specialist ${specialist.id}, skipping`);
      continue;
    }

    // Create thread with clientLastReadAt = null (all messages unread)
    const thread = await prisma.thread.create({
      data: {
        requestId: request.id,
        clientId: targetUser.id,
        specialistId: specialist.id,
        clientLastReadAt: null, // null = client hasn't read anything
        lastMessageAt: new Date(),
      },
    });

    // Create messages from specialist (incoming, unread for client)
    const messages = [];
    for (let i = 0; i < plan.msgCount; i++) {
      const text = messageTexts[msgIdx % messageTexts.length];
      msgIdx++;
      const msg = await prisma.message.create({
        data: {
          threadId: thread.id,
          senderId: specialist.id,
          text,
          createdAt: new Date(Date.now() - (plan.msgCount - i) * 60000), // stagger by 1 min
        },
      });
      messages.push(msg);
      totalMessages++;
    }

    // Update thread's lastMessageAt
    await prisma.thread.update({
      where: { id: thread.id },
      data: { lastMessageAt: messages[messages.length - 1].createdAt },
    });

    console.log(`Thread ${thread.id}: specialist ${specialist.firstName} sent ${plan.msgCount} messages on request "${request.title}"`);
  }

  console.log(`\nDone. Total messages created: ${totalMessages}`);
  console.log(`All messages are from specialists -> clientLastReadAt=null -> unread for ${TARGET_EMAIL}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
