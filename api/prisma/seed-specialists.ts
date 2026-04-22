import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPECIALISTS = [
  {
    email: "aleksey.voronov@p2ptax-seed.ru",
    firstName: "Алексей",
    lastName: "Воронов",
    description: "Налоговый консультант с 8-летним опытом. Специализируюсь на P2P-операциях, криптовалюте и налоговых проверках. Помог более 300 клиентам.",
    fnsCodes: ["7701", "7702"],
    serviceNames: ["Выездная проверка", "Камеральная проверка"],
  },
  {
    email: "marina.sokolova@p2ptax-seed.ru",
    firstName: "Марина",
    lastName: "Соколова",
    description: "Эксперт по налоговому праву. Работаю с ИП и физлицами по вопросам операций с криптовалютой и P2P. Опыт 6 лет.",
    fnsCodes: ["7703", "7704"],
    serviceNames: ["Камеральная проверка", "Отдел оперативного контроля"],
  },
  {
    email: "dmitry.petrov@p2ptax-seed.ru",
    firstName: "Дмитрий",
    lastName: "Петров",
    description: "Бывший сотрудник ФНС, 10 лет в налоговых органах. Досконально знаю процедуры проверок. Помогу урегулировать любую ситуацию.",
    fnsCodes: ["7801", "7802"],
    serviceNames: ["Выездная проверка", "Камеральная проверка", "Отдел оперативного контроля"],
  },
  {
    email: "elena.kuznetsova@p2ptax-seed.ru",
    firstName: "Елена",
    lastName: "Кузнецова",
    description: "Специалист по налоговому планированию. Помогаю минимизировать налоговые риски при работе с цифровыми активами. Онлайн-консультации по всей России.",
    fnsCodes: ["5401", "5402"],
    serviceNames: ["Камеральная проверка"],
  },
  {
    email: "sergey.morozov@p2ptax-seed.ru",
    firstName: "Сергей",
    lastName: "Морозов",
    description: "Юрист-налоговик, специализация — оспаривание решений ФНС. Представляю интересы клиентов в налоговых органах и судах. Опыт 12 лет.",
    fnsCodes: ["6601", "6602"],
    serviceNames: ["Выездная проверка", "Отдел оперативного контроля"],
  },
  {
    email: "irina.fedorova@p2ptax-seed.ru",
    firstName: "Ирина",
    lastName: "Фёдорова",
    description: "Налоговый консультант, специализируюсь на помощи трейдерам и инвесторам в крипту. Составление деклараций, сопровождение проверок.",
    fnsCodes: ["1601", "1602"],
    serviceNames: ["Камеральная проверка", "Выездная проверка"],
  },
  {
    email: "andrey.nikitin@p2ptax-seed.ru",
    firstName: "Андрей",
    lastName: "Никитин",
    description: "Практикующий налоговый адвокат. Более 200 успешно закрытых дел по налоговым спорам. Бесплатная первичная консультация.",
    fnsCodes: ["7705", "7707"],
    serviceNames: ["Выездная проверка", "Камеральная проверка"],
  },
  {
    email: "olga.stepanova@p2ptax-seed.ru",
    firstName: "Ольга",
    lastName: "Степанова",
    description: "Сертифицированный налоговый консультант. Работаю с фрилансерами, самозанятыми и ИП. Специализация — доходы от P2P и DeFi.",
    fnsCodes: ["7803", "7807"],
    serviceNames: ["Камеральная проверка", "Отдел оперативного контроля"],
  },
];

async function main() {
  // Get existing FNS offices and services
  const allFns = await prisma.fnsOffice.findMany({ select: { id: true, code: true } });
  const fnsMap: Record<string, string> = {};
  for (const f of allFns) fnsMap[f.code] = f.id;

  const allServices = await prisma.service.findMany({ select: { id: true, name: true } });
  const serviceMap: Record<string, string> = {};
  for (const s of allServices) serviceMap[s.name] = s.id;

  let created = 0;

  for (const spec of SPECIALISTS) {
    // Upsert user
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: "SPECIALIST",
        isAvailable: true,
      },
      create: {
        email: spec.email,
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: "SPECIALIST",
        isAvailable: true,
      },
    });

    // Upsert profile
    await prisma.specialistProfile.upsert({
      where: { userId: user.id },
      update: { description: spec.description },
      create: { userId: user.id, description: spec.description },
    });

    // Create FNS links + services
    for (const fnsCode of spec.fnsCodes) {
      const fnsId = fnsMap[fnsCode];
      if (!fnsId) continue;

      const sfns = await prisma.specialistFns.upsert({
        where: { specialistId_fnsId: { specialistId: user.id, fnsId } },
        update: {},
        create: { specialistId: user.id, fnsId },
      });

      for (const serviceName of spec.serviceNames) {
        const serviceId = serviceMap[serviceName];
        if (!serviceId) continue;

        await prisma.specialistService.upsert({
          where: { specialistId_fnsId_serviceId: { specialistId: user.id, fnsId, serviceId } },
          update: {},
          create: {
            specialistId: user.id,
            fnsId,
            serviceId,
            specialistFnsId: sfns.id,
          },
        });
      }
    }

    created++;
    console.log(`  [+] ${spec.firstName} ${spec.lastName}`);
  }

  console.log(`\nSeeded ${created} specialists.`);

  // Also seed a few client requests if needed
  const existingRequests = await prisma.request.count();
  if (existingRequests < 5) {
    const clientUser = await prisma.user.upsert({
      where: { email: "test.client@p2ptax-seed.ru" },
      update: { role: "CLIENT", firstName: "Иван", lastName: "Тестов" },
      create: { email: "test.client@p2ptax-seed.ru", role: "CLIENT", firstName: "Иван", lastName: "Тестов" },
    });

    const moscowFns = await prisma.fnsOffice.findFirst({ where: { code: "7701" } });
    const serviceKam = await prisma.service.findFirst({ where: { name: "Камеральная проверка" } });

    if (moscowFns && serviceKam) {
      await prisma.request.create({
        data: {
          userId: clientUser.id,
          cityId: moscowFns.cityId,
          fnsId: moscowFns.id,
          serviceId: serviceKam.id,
          title: "Вызов в ФНС по операциям P2P",
          description: "Получил требование от ИФНС предоставить пояснения по операциям на Binance P2P за 2023 год. Нужна помощь в подготовке ответа и документов.",
          status: "ACTIVE",
        },
      });

      await prisma.request.create({
        data: {
          userId: clientUser.id,
          cityId: moscowFns.cityId,
          fnsId: moscowFns.id,
          serviceId: serviceKam.id,
          title: "Декларация 3-НДФЛ по крипте",
          description: "Нужна помощь в заполнении декларации 3-НДФЛ по доходам от продажи криптовалюты за 2023-2024 год. Объём операций ~200 транзакций.",
          status: "ACTIVE",
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
