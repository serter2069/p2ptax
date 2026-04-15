import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SERVICES = [
  'Выездная проверка',
  'Камеральная проверка',
  'Отдел оперативного контроля',
];

interface CityData {
  name: string;
  slug: string;
  region: string;
  ifns: { code: string; name: string; slug: string }[];
}

const CITIES: CityData[] = [
  {
    name: 'Москва',
    slug: 'moscow',
    region: 'Москва',
    ifns: [
      { code: '7701', name: 'ИФНС России №1 по г. Москве', slug: 'ifns-1-moscow' },
      { code: '7707', name: 'ИФНС России №7 по г. Москве', slug: 'ifns-7-moscow' },
      { code: '7715', name: 'ИФНС России №15 по г. Москве', slug: 'ifns-15-moscow' },
      { code: '7733', name: 'ИФНС России №33 по г. Москве', slug: 'ifns-33-moscow' },
      { code: '7746', name: 'ИФНС России №46 по г. Москве', slug: 'ifns-46-moscow' },
    ],
  },
  {
    name: 'Санкт-Петербург',
    slug: 'saint-petersburg',
    region: 'Санкт-Петербург',
    ifns: [
      { code: '7801', name: 'ИФНС России №1 по г. Санкт-Петербургу', slug: 'ifns-1-spb' },
      { code: '7815', name: 'ИФНС России №15 по г. Санкт-Петербургу', slug: 'ifns-15-spb' },
      { code: '7825', name: 'ИФНС России №25 по г. Санкт-Петербургу', slug: 'ifns-25-spb' },
    ],
  },
  {
    name: 'Казань',
    slug: 'kazan',
    region: 'Республика Татарстан',
    ifns: [
      { code: '1603', name: 'ИФНС России №3 по г. Казани', slug: 'ifns-3-kazan' },
      { code: '1614', name: 'ИФНС России №14 по г. Казани', slug: 'ifns-14-kazan' },
    ],
  },
  {
    name: 'Новосибирск',
    slug: 'novosibirsk',
    region: 'Новосибирская область',
    ifns: [
      { code: '5412', name: 'ИФНС России №12 по г. Новосибирску', slug: 'ifns-12-novosibirsk' },
      { code: '5418', name: 'ИФНС России №18 по г. Новосибирску', slug: 'ifns-18-novosibirsk' },
    ],
  },
  {
    name: 'Екатеринбург',
    slug: 'ekaterinburg',
    region: 'Свердловская область',
    ifns: [
      { code: '6608', name: 'ИФНС России №8 по г. Екатеринбургу', slug: 'ifns-8-ekaterinburg' },
      { code: '6624', name: 'ИФНС России №24 по г. Екатеринбургу', slug: 'ifns-24-ekaterinburg' },
    ],
  },
  {
    name: 'Ростов-на-Дону',
    slug: 'rostov-on-don',
    region: 'Ростовская область',
    ifns: [
      { code: '6105', name: 'ИФНС России №5 по г. Ростову-на-Дону', slug: 'ifns-5-rostov' },
      { code: '6123', name: 'ИФНС России №23 по г. Ростову-на-Дону', slug: 'ifns-23-rostov' },
    ],
  },
  {
    name: 'Краснодар',
    slug: 'krasnodar',
    region: 'Краснодарский край',
    ifns: [
      { code: '2302', name: 'ИФНС России №2 по г. Краснодару', slug: 'ifns-2-krasnodar' },
      { code: '2304', name: 'ИФНС России №4 по г. Краснодару', slug: 'ifns-4-krasnodar' },
    ],
  },
  {
    name: 'Самара',
    slug: 'samara',
    region: 'Самарская область',
    ifns: [
      { code: '6311', name: 'ИФНС России №11 по г. Самаре', slug: 'ifns-11-samara' },
      { code: '6320', name: 'ИФНС России №20 по г. Самаре', slug: 'ifns-20-samara' },
    ],
  },
];

async function main() {
  console.log('Seeding services...');
  for (const name of SERVICES) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  ${SERVICES.length} services upserted`);

  console.log('Seeding cities and IFNS offices...');
  let totalIfns = 0;
  for (const cityData of CITIES) {
    const city = await prisma.city.upsert({
      where: { name: cityData.name },
      update: { slug: cityData.slug, region: cityData.region },
      create: { name: cityData.name, slug: cityData.slug, region: cityData.region },
    });

    for (const ifnsData of cityData.ifns) {
      await prisma.ifns.upsert({
        where: { code: ifnsData.code },
        update: { name: ifnsData.name, slug: ifnsData.slug, cityId: city.id },
        create: {
          code: ifnsData.code,
          name: ifnsData.name,
          slug: ifnsData.slug,
          cityId: city.id,
        },
      });
      totalIfns++;
    }
  }
  console.log(`  ${CITIES.length} cities, ${totalIfns} IFNS offices upserted`);

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
