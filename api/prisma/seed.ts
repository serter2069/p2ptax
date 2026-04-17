import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Cities
  const cities = await Promise.all([
    prisma.city.create({ data: { name: "Москва" } }),
    prisma.city.create({ data: { name: "Санкт-Петербург" } }),
    prisma.city.create({ data: { name: "Новосибирск" } }),
    prisma.city.create({ data: { name: "Екатеринбург" } }),
    prisma.city.create({ data: { name: "Казань" } }),
  ]);

  const [moscow, spb, nsk, ekb, kazan] = cities;

  // FNS offices
  const fnsData: { cityId: string; name: string; code: string }[] = [
    // Moscow
    { cityId: moscow.id, name: "ИФНС №1 по г. Москве", code: "7701" },
    { cityId: moscow.id, name: "ИФНС №2 по г. Москве", code: "7702" },
    { cityId: moscow.id, name: "ИФНС №3 по г. Москве", code: "7703" },
    { cityId: moscow.id, name: "ИФНС №4 по г. Москве", code: "7704" },
    { cityId: moscow.id, name: "ИФНС №5 по г. Москве", code: "7705" },
    // SPB
    { cityId: spb.id, name: "ИФНС №1 по г. Санкт-Петербургу", code: "7801" },
    { cityId: spb.id, name: "ИФНС №2 по г. Санкт-Петербургу", code: "7802" },
    { cityId: spb.id, name: "ИФНС №3 по г. Санкт-Петербургу", code: "7803" },
    // Novosibirsk
    { cityId: nsk.id, name: "ИФНС №1 по г. Новосибирску", code: "5401" },
    { cityId: nsk.id, name: "ИФНС №2 по г. Новосибирску", code: "5402" },
    { cityId: nsk.id, name: "ИФНС №3 по г. Новосибирску", code: "5403" },
    // Ekaterinburg
    { cityId: ekb.id, name: "ИФНС №1 по г. Екатеринбургу", code: "6601" },
    { cityId: ekb.id, name: "ИФНС №2 по г. Екатеринбургу", code: "6602" },
    { cityId: ekb.id, name: "ИФНС №3 по г. Екатеринбургу", code: "6603" },
    // Kazan
    { cityId: kazan.id, name: "ИФНС №1 по г. Казани", code: "1601" },
    { cityId: kazan.id, name: "ИФНС №2 по г. Казани", code: "1602" },
    { cityId: kazan.id, name: "ИФНС №3 по г. Казани", code: "1603" },
  ];

  for (const fns of fnsData) {
    await prisma.fnsOffice.create({ data: fns });
  }

  // Services
  await prisma.service.createMany({
    data: [
      { name: "Выездная проверка" },
      { name: "Камеральная проверка" },
      { name: "Отдел оперативного контроля" },
    ],
  });

  // Settings
  const settings = [
    { key: "requests_limit", value: "5" },
    { key: "max_threads_per_request", value: "10" },
    { key: "auto_close_days", value: "30" },
    { key: "max_extensions", value: "3" },
    { key: "close_warning_days", value: "3" },
    { key: "max_file_size_mb", value: "10" },
    { key: "max_files_per_message", value: "5" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("Seed complete: 5 cities, 17 FNS offices, 3 services, 7 settings");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
