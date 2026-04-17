import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Cities with slugs
  const cityData = [
    { name: "Москва", slug: "moscow" },
    { name: "Санкт-Петербург", slug: "saint-petersburg" },
    { name: "Новосибирск", slug: "novosibirsk" },
    { name: "Екатеринбург", slug: "ekaterinburg" },
    { name: "Казань", slug: "kazan" },
    { name: "Нижний Новгород", slug: "nizhny-novgorod" },
    { name: "Челябинск", slug: "chelyabinsk" },
    { name: "Самара", slug: "samara" },
    { name: "Уфа", slug: "ufa" },
    { name: "Красноярск", slug: "krasnoyarsk" },
  ];

  const cities: Record<string, string> = {};
  for (const c of cityData) {
    const city = await prisma.city.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
    cities[c.slug] = city.id;
  }

  // FNS offices (92 total)
  const fnsData: {
    citySlug: string;
    name: string;
    code: string;
    address: string;
    searchAliases: string;
  }[] = [
    // Moscow (30 offices)
    {
      citySlug: "moscow",
      name: "ИФНС №1 по г. Москве",
      code: "7701",
      address: "г. Москва, Хохловский пер., 9",
      searchAliases: "ифнс 1 москва фнс 7701",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №2 по г. Москве",
      code: "7702",
      address: "г. Москва, Казакова ул., 8",
      searchAliases: "ифнс 2 москва фнс 7702",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №3 по г. Москве",
      code: "7703",
      address: "г. Москва, Люсиновская ул., 41",
      searchAliases: "ифнс 3 москва фнс 7703",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №4 по г. Москве",
      code: "7704",
      address: "г. Москва, Донская ул., 26",
      searchAliases: "ифнс 4 москва фнс 7704",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №5 по г. Москве",
      code: "7705",
      address: "г. Москва, Большая Тульская ул., 15",
      searchAliases: "ифнс 5 москва фнс 7705",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №7 по г. Москве",
      code: "7707",
      address: "г. Москва, Большая Переяславская ул., 16",
      searchAliases: "ифнс 7 москва фнс 7707",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №8 по г. Москве",
      code: "7708",
      address: "г. Москва, Мурманский пр., 6",
      searchAliases: "ифнс 8 москва фнс 7708",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №9 по г. Москве",
      code: "7709",
      address: "г. Москва, Большая Марьинская ул., 15",
      searchAliases: "ифнс 9 москва фнс 7709",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №10 по г. Москве",
      code: "7710",
      address: "г. Москва, Большая Тульская ул., 15",
      searchAliases: "ифнс 10 москва фнс 7710",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №13 по г. Москве",
      code: "7713",
      address: "г. Москва, Петрозаводская ул., 20а",
      searchAliases: "ифнс 13 москва фнс 7713",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №14 по г. Москве",
      code: "7714",
      address: "г. Москва, Стрелецкая ул., 5",
      searchAliases: "ифнс 14 москва фнс 7714",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №15 по г. Москве",
      code: "7715",
      address: "г. Москва, Ак. Пилюгина ул., 6",
      searchAliases: "ифнс 15 москва фнс 7715",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №16 по г. Москве",
      code: "7716",
      address: "г. Москва, Сокольническая пл., 26",
      searchAliases: "ифнс 16 москва фнс 7716",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №17 по г. Москве",
      code: "7717",
      address: "г. Москва, Полтавская ул., 7",
      searchAliases: "ифнс 17 москва фнс 7717",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №18 по г. Москве",
      code: "7718",
      address: "г. Москва, Советская ул., 6",
      searchAliases: "ифнс 18 москва фнс 7718",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №19 по г. Москве",
      code: "7719",
      address: "г. Москва, Новохохловская ул., 10а",
      searchAliases: "ифнс 19 москва фнс 7719",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №20 по г. Москве",
      code: "7720",
      address: "г. Москва, Тайнинская ул., 15",
      searchAliases: "ифнс 20 москва фнс 7720",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №21 по г. Москве",
      code: "7721",
      address: "г. Москва, Оранжерейная ул., 12",
      searchAliases: "ифнс 21 москва фнс 7721",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №22 по г. Москве",
      code: "7722",
      address: "г. Москва, 1-й Дербеневский пер., 6",
      searchAliases: "ифнс 22 москва фнс 7722",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №23 по г. Москве",
      code: "7723",
      address: "г. Москва, Большая Тульская ул., 15",
      searchAliases: "ифнс 23 москва фнс 7723",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №24 по г. Москве",
      code: "7724",
      address: "г. Москва, Чертановская ул., 34а",
      searchAliases: "ифнс 24 москва фнс 7724",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №25 по г. Москве",
      code: "7725",
      address: "г. Москва, Большая Тульская ул., 15",
      searchAliases: "ифнс 25 москва фнс 7725",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №26 по г. Москве",
      code: "7726",
      address: "г. Москва, Вавилова ул., 69а",
      searchAliases: "ифнс 26 москва фнс 7726",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №27 по г. Москве",
      code: "7727",
      address: "г. Москва, Хавская ул., 12",
      searchAliases: "ифнс 27 москва фнс 7727",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №28 по г. Москве",
      code: "7728",
      address: "г. Москва, Сивашская ул., 6",
      searchAliases: "ифнс 28 москва фнс 7728",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №29 по г. Москве",
      code: "7729",
      address: "г. Москва, Мичуринский пр., 6",
      searchAliases: "ифнс 29 москва фнс 7729",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №30 по г. Москве",
      code: "7730",
      address: "г. Москва, Пресненский вал, 21",
      searchAliases: "ифнс 30 москва фнс 7730",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №31 по г. Москве",
      code: "7731",
      address: "г. Москва, Олимпийский пр., 4",
      searchAliases: "ифнс 31 москва фнс 7731",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №33 по г. Москве",
      code: "7733",
      address: "г. Москва, Карельский б-р, 2",
      searchAliases: "ифнс 33 москва фнс 7733",
    },
    {
      citySlug: "moscow",
      name: "ИФНС №36 по г. Москве",
      code: "7736",
      address: "г. Москва, Дорожная ул., 48",
      searchAliases: "ифнс 36 москва фнс 7736",
    },
    // Saint-Petersburg (15 offices)
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №1 по г. Санкт-Петербургу",
      code: "7801",
      address: "г. Санкт-Петербург, Красного Текстильщика ул., 10-12",
      searchAliases: "ифнс 1 спб санкт-петербург фнс 7801",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №2 по г. Санкт-Петербургу",
      code: "7802",
      address: "г. Санкт-Петербург, Промышленная ул., 4",
      searchAliases: "ифнс 2 спб санкт-петербург фнс 7802",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №3 по г. Санкт-Петербургу",
      code: "7803",
      address: "г. Санкт-Петербург, Смоленская ул., 31",
      searchAliases: "ифнс 3 спб санкт-петербург фнс 7803",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №4 по г. Санкт-Петербургу",
      code: "7804",
      address: "г. Санкт-Петербург, Пискарёвский пр., 2",
      searchAliases: "ифнс 4 спб санкт-петербург фнс 7804",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №7 по г. Санкт-Петербургу",
      code: "7807",
      address: "г. Санкт-Петербург, Первомайская ул., 51",
      searchAliases: "ифнс 7 спб санкт-петербург фнс 7807",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №8 по г. Санкт-Петербургу",
      code: "7808",
      address: "г. Санкт-Петербург, Миллионная ул., 34",
      searchAliases: "ифнс 8 спб санкт-петербург фнс 7808",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №9 по г. Санкт-Петербургу",
      code: "7809",
      address: "г. Санкт-Петербург, Почтамтская ул., 13",
      searchAliases: "ифнс 9 спб санкт-петербург фнс 7809",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №10 по г. Санкт-Петербургу",
      code: "7810",
      address: "г. Санкт-Петербург, Яковлевский пер., 4",
      searchAliases: "ифнс 10 спб санкт-петербург фнс 7810",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №11 по г. Санкт-Петербургу",
      code: "7811",
      address: "г. Санкт-Петербург, Цветочная ул., 16",
      searchAliases: "ифнс 11 спб санкт-петербург фнс 7811",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №12 по г. Санкт-Петербургу",
      code: "7812",
      address: "г. Санкт-Петербург, Звёздная ул., 13",
      searchAliases: "ифнс 12 спб санкт-петербург фнс 7812",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №15 по г. Санкт-Петербургу",
      code: "7815",
      address: "г. Санкт-Петербург, Атаманская ул., 11",
      searchAliases: "ифнс 15 спб санкт-петербург фнс 7815",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №16 по г. Санкт-Петербургу",
      code: "7816",
      address: "г. Санкт-Петербург, Рябовское ш., 59",
      searchAliases: "ифнс 16 спб санкт-петербург фнс 7816",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №17 по г. Санкт-Петербургу",
      code: "7817",
      address: "г. Санкт-Петербург, Швецова ул., 23",
      searchAliases: "ифнс 17 спб санкт-петербург фнс 7817",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №18 по г. Санкт-Петербургу",
      code: "7818",
      address: "г. Санкт-Петербург, Гарантийная ул., 2",
      searchAliases: "ифнс 18 спб санкт-петербург фнс 7818",
    },
    {
      citySlug: "saint-petersburg",
      name: "Межрайонная ИФНС №19 по г. Санкт-Петербургу",
      code: "7819",
      address: "г. Санкт-Петербург, Юнтоловский пр., 53",
      searchAliases: "ифнс 19 спб санкт-петербург фнс 7819",
    },
    // Novosibirsk (8 offices)
    {
      citySlug: "novosibirsk",
      name: "ИФНС №1 по г. Новосибирску",
      code: "5401",
      address: "г. Новосибирск, Залесского ул., 1",
      searchAliases: "ифнс 1 новосибирск фнс 5401",
    },
    {
      citySlug: "novosibirsk",
      name: "ИФНС №2 по г. Новосибирску",
      code: "5402",
      address: "г. Новосибирск, Тополёвая ул., 5",
      searchAliases: "ифнс 2 новосибирск фнс 5402",
    },
    {
      citySlug: "novosibirsk",
      name: "ИФНС №3 по г. Новосибирску",
      code: "5403",
      address: "г. Новосибирск, Кирова ул., 3б",
      searchAliases: "ифнс 3 новосибирск фнс 5403",
    },
    {
      citySlug: "novosibirsk",
      name: "ИФНС №4 по г. Новосибирску",
      code: "5404",
      address: "г. Новосибирск, Красина ул., 60",
      searchAliases: "ифнс 4 новосибирск фнс 5404",
    },
    {
      citySlug: "novosibirsk",
      name: "ИФНС №5 по г. Новосибирску",
      code: "5405",
      address: "г. Новосибирск, Мясниковой ул., 9",
      searchAliases: "ифнс 5 новосибирск фнс 5405",
    },
    {
      citySlug: "novosibirsk",
      name: "ИФНС №12 по г. Новосибирску",
      code: "5412",
      address: "г. Новосибирск, Дуси Ковальчук ул., 179",
      searchAliases: "ифнс 12 новосибирск фнс 5412",
    },
    {
      citySlug: "novosibirsk",
      name: "Межрайонная ИФНС №13 по Новосибирской области",
      code: "5413",
      address: "г. Новосибирск, Советская ул., 5",
      searchAliases: "ифнс 13 новосибирск фнс 5413 межрайонная",
    },
    {
      citySlug: "novosibirsk",
      name: "Межрайонная ИФНС №16 по Новосибирской области",
      code: "5416",
      address: "г. Новосибирск, Кирова ул., 3",
      searchAliases: "ифнс 16 новосибирск фнс 5416 межрайонная",
    },
    // Ekaterinburg (8 offices)
    {
      citySlug: "ekaterinburg",
      name: "ИФНС №1 по г. Екатеринбургу",
      code: "6601",
      address: "г. Екатеринбург, Ленина пр., 38",
      searchAliases: "ифнс 1 екатеринбург фнс 6601",
    },
    {
      citySlug: "ekaterinburg",
      name: "ИФНС №2 по г. Екатеринбургу",
      code: "6602",
      address: "г. Екатеринбург, Стачек ул., 2а",
      searchAliases: "ифнс 2 екатеринбург фнс 6602",
    },
    {
      citySlug: "ekaterinburg",
      name: "ИФНС №3 по г. Екатеринбургу",
      code: "6603",
      address: "г. Екатеринбург, Трактовая ул., 26",
      searchAliases: "ифнс 3 екатеринбург фнс 6603",
    },
    {
      citySlug: "ekaterinburg",
      name: "ИФНС №4 по г. Екатеринбургу",
      code: "6604",
      address: "г. Екатеринбург, Военной Авиации ул., 2а",
      searchAliases: "ифнс 4 екатеринбург фнс 6604",
    },
    {
      citySlug: "ekaterinburg",
      name: "ИФНС №5 по г. Екатеринбургу",
      code: "6605",
      address: "г. Екатеринбург, Вилонова ул., 32",
      searchAliases: "ифнс 5 екатеринбург фнс 6605",
    },
    {
      citySlug: "ekaterinburg",
      name: "ИФНС №6 по г. Екатеринбургу",
      code: "6606",
      address: "г. Екатеринбург, Лобкова ул., 32а",
      searchAliases: "ифнс 6 екатеринбург фнс 6606",
    },
    {
      citySlug: "ekaterinburg",
      name: "ИФНС №7 по г. Екатеринбургу",
      code: "6607",
      address: "г. Екатеринбург, Декабристов ул., 83",
      searchAliases: "ифнс 7 екатеринбург фнс 6607",
    },
    {
      citySlug: "ekaterinburg",
      name: "ИФНС №8 по г. Екатеринбургу",
      code: "6608",
      address: "г. Екатеринбург, Хибиногорский пер., 2",
      searchAliases: "ифнс 8 екатеринбург фнс 6608",
    },
    // Kazan (6 offices)
    {
      citySlug: "kazan",
      name: "ИФНС №1 по г. Казани",
      code: "1601",
      address: "г. Казань, Ершова ул., 1б",
      searchAliases: "ифнс 1 казань фнс 1601",
    },
    {
      citySlug: "kazan",
      name: "ИФНС №2 по г. Казани",
      code: "1602",
      address: "г. Казань, Вишневского ул., 26",
      searchAliases: "ифнс 2 казань фнс 1602",
    },
    {
      citySlug: "kazan",
      name: "ИФНС №3 по г. Казани",
      code: "1603",
      address: "г. Казань, Зинина ул., 4",
      searchAliases: "ифнс 3 казань фнс 1603",
    },
    {
      citySlug: "kazan",
      name: "ИФНС №4 по г. Казани",
      code: "1604",
      address: "г. Казань, Портовая ул., 25а",
      searchAliases: "ифнс 4 казань фнс 1604",
    },
    {
      citySlug: "kazan",
      name: "Межрайонная ИФНС №5 по Республике Татарстан",
      code: "1605",
      address: "г. Казань, Баумана ул., 53",
      searchAliases: "ифнс 5 казань фнс 1605 межрайонная",
    },
    {
      citySlug: "kazan",
      name: "Межрайонная ИФНС №6 по Республике Татарстан",
      code: "1606",
      address: "г. Казань, Батурина ул., 5",
      searchAliases: "ифнс 6 казань фнс 1606 межрайонная",
    },
    // Nizhny Novgorod (7 offices)
    {
      citySlug: "nizhny-novgorod",
      name: "ИФНС №1 по Нижегородскому р-ну г. Нижний Новгород",
      code: "5260",
      address: "г. Нижний Новгород, Тимирязева ул., 30",
      searchAliases: "ифнс 1 нижний новгород нн фнс 5260",
    },
    {
      citySlug: "nizhny-novgorod",
      name: "ИФНС №2 по Советскому р-ну г. Нижний Новгород",
      code: "5261",
      address: "г. Нижний Новгород, Светлогорская ул., 8",
      searchAliases: "ифнс 2 нижний новгород нн фнс 5261",
    },
    {
      citySlug: "nizhny-novgorod",
      name: "ИФНС №3 по Канавинскому р-ну г. Нижний Новгород",
      code: "5262",
      address: "г. Нижний Новгород, Советская ул., 10",
      searchAliases: "ифнс 3 нижний новгород нн фнс 5262",
    },
    {
      citySlug: "nizhny-novgorod",
      name: "ИФНС №4 по Приокскому р-ну г. Нижний Новгород",
      code: "5263",
      address: "г. Нижний Новгород, Красносельская ул., 46",
      searchAliases: "ифнс 4 нижний новгород нн фнс 5263",
    },
    {
      citySlug: "nizhny-novgorod",
      name: "ИФНС №5 по Ленинскому р-ну г. Нижний Новгород",
      code: "5264",
      address: "г. Нижний Новгород, Адмирала Нахимова ул., 12",
      searchAliases: "ифнс 5 нижний новгород нн фнс 5264",
    },
    {
      citySlug: "nizhny-novgorod",
      name: "Межрайонная ИФНС №15 по Нижегородской области",
      code: "5215",
      address: "г. Нижний Новгород, Литвинова ул., 99",
      searchAliases: "ифнс 15 нижний новгород нн фнс 5215 межрайонная",
    },
    {
      citySlug: "nizhny-novgorod",
      name: "Межрайонная ИФНС №18 по Нижегородской области",
      code: "5218",
      address: "г. Нижний Новгород, Грузинская ул., 46",
      searchAliases: "ифнс 18 нижний новгород нн фнс 5218 межрайонная",
    },
    // Chelyabinsk (6 offices)
    {
      citySlug: "chelyabinsk",
      name: "ИФНС №1 по г. Челябинску",
      code: "7451",
      address: "г. Челябинск, Сони Кривой ул., 3а",
      searchAliases: "ифнс 1 челябинск фнс 7451",
    },
    {
      citySlug: "chelyabinsk",
      name: "ИФНС №2 по г. Челябинску",
      code: "7452",
      address: "г. Челябинск, Воровского ул., 16",
      searchAliases: "ифнс 2 челябинск фнс 7452",
    },
    {
      citySlug: "chelyabinsk",
      name: "ИФНС №3 по г. Челябинску",
      code: "7453",
      address: "г. Челябинск, Энтузиастов ул., 2",
      searchAliases: "ифнс 3 челябинск фнс 7453",
    },
    {
      citySlug: "chelyabinsk",
      name: "ИФНС №4 по г. Челябинску",
      code: "7454",
      address: "г. Челябинск, Кузнецова ул., 7",
      searchAliases: "ифнс 4 челябинск фнс 7454",
    },
    {
      citySlug: "chelyabinsk",
      name: "Межрайонная ИФНС №22 по Челябинской области",
      code: "7455",
      address: "г. Челябинск, Победы пр., 39",
      searchAliases: "ифнс 22 челябинск фнс 7455 межрайонная",
    },
    {
      citySlug: "chelyabinsk",
      name: "Межрайонная ИФНС №23 по Челябинской области",
      code: "7456",
      address: "г. Челябинск, Троицкий тракт, 52а",
      searchAliases: "ифнс 23 челябинск фнс 7456 межрайонная",
    },
    // Samara (6 offices)
    {
      citySlug: "samara",
      name: "ИФНС №1 по Ленинскому р-ну г. Самара",
      code: "6311",
      address: "г. Самара, Садовая ул., 127",
      searchAliases: "ифнс 1 самара фнс 6311",
    },
    {
      citySlug: "samara",
      name: "ИФНС №2 по Железнодорожному р-ну г. Самара",
      code: "6312",
      address: "г. Самара, Льва Толстого ул., 11",
      searchAliases: "ифнс 2 самара фнс 6312",
    },
    {
      citySlug: "samara",
      name: "ИФНС №3 по Октябрьскому р-ну г. Самара",
      code: "6313",
      address: "г. Самара, Аэродромная ул., 47а",
      searchAliases: "ифнс 3 самара фнс 6313",
    },
    {
      citySlug: "samara",
      name: "ИФНС №4 по Самарскому р-ну г. Самара",
      code: "6314",
      address: "г. Самара, Чапаевская ул., 128",
      searchAliases: "ифнс 4 самара фнс 6314",
    },
    {
      citySlug: "samara",
      name: "Межрайонная ИФНС №18 по Самарской области",
      code: "6318",
      address: "г. Самара, Революционная ул., 73",
      searchAliases: "ифнс 18 самара фнс 6318 межрайонная",
    },
    {
      citySlug: "samara",
      name: "Межрайонная ИФНС №19 по Самарской области",
      code: "6319",
      address: "г. Самара, Мирная ул., 5а",
      searchAliases: "ифнс 19 самара фнс 6319 межрайонная",
    },
    // Ufa (5 offices)
    {
      citySlug: "ufa",
      name: "ИФНС №1 по г. Уфа",
      code: "0201",
      address: "г. Уфа, Цюрупы ул., 2",
      searchAliases: "ифнс 1 уфа фнс 0201",
    },
    {
      citySlug: "ufa",
      name: "ИФНС №2 по г. Уфа",
      code: "0202",
      address: "г. Уфа, Ленина ул., 61",
      searchAliases: "ифнс 2 уфа фнс 0202",
    },
    {
      citySlug: "ufa",
      name: "ИФНС №3 по г. Уфа",
      code: "0203",
      address: "г. Уфа, Шафиева ул., 11",
      searchAliases: "ифнс 3 уфа фнс 0203",
    },
    {
      citySlug: "ufa",
      name: "Межрайонная ИФНС №20 по Республике Башкортостан",
      code: "0220",
      address: "г. Уфа, Коммунистическая ул., 59",
      searchAliases: "ифнс 20 уфа фнс 0220 межрайонная",
    },
    {
      citySlug: "ufa",
      name: "Межрайонная ИФНС №39 по Республике Башкортостан",
      code: "0239",
      address: "г. Уфа, Пушкина ул., 95",
      searchAliases: "ифнс 39 уфа фнс 0239 межрайонная",
    },
    // Krasnoyarsk (7 offices)
    {
      citySlug: "krasnoyarsk",
      name: "ИФНС №1 по г. Красноярску",
      code: "2461",
      address: "г. Красноярск, Дубровинского ул., 114",
      searchAliases: "ифнс 1 красноярск фнс 2461",
    },
    {
      citySlug: "krasnoyarsk",
      name: "ИФНС №2 по г. Красноярску",
      code: "2462",
      address: "г. Красноярск, Кутузова ул., 16",
      searchAliases: "ифнс 2 красноярск фнс 2462",
    },
    {
      citySlug: "krasnoyarsk",
      name: "ИФНС №3 по г. Красноярску",
      code: "2463",
      address: "г. Красноярск, Партизана Железняка ул., 46",
      searchAliases: "ифнс 3 красноярск фнс 2463",
    },
    {
      citySlug: "krasnoyarsk",
      name: "ИФНС №4 по г. Красноярску",
      code: "2464",
      address: "г. Красноярск, Академгородок ул., 22",
      searchAliases: "ифнс 4 красноярск фнс 2464",
    },
    {
      citySlug: "krasnoyarsk",
      name: "Межрайонная ИФНС №22 по Красноярскому краю",
      code: "2422",
      address: "г. Красноярск, Батурина ул., 20",
      searchAliases: "ифнс 22 красноярск фнс 2422 межрайонная",
    },
    {
      citySlug: "krasnoyarsk",
      name: "Межрайонная ИФНС №23 по Красноярскому краю",
      code: "2423",
      address: "г. Красноярск, 60 лет Октября ул., 53",
      searchAliases: "ифнс 23 красноярск фнс 2423 межрайонная",
    },
    {
      citySlug: "krasnoyarsk",
      name: "Межрайонная ИФНС №24 по Красноярскому краю",
      code: "2424",
      address: "г. Красноярск, Мате Залки ул., 1а",
      searchAliases: "ифнс 24 красноярск фнс 2424 межрайонная",
    },
  ];

  let fnsCount = 0;
  for (const fns of fnsData) {
    const cityId = cities[fns.citySlug];
    if (!cityId) continue;
    await prisma.fnsOffice.upsert({
      where: { code: fns.code },
      update: {
        name: fns.name,
        cityId,
        address: fns.address,
        searchAliases: fns.searchAliases,
      },
      create: {
        name: fns.name,
        code: fns.code,
        cityId,
        address: fns.address,
        searchAliases: fns.searchAliases,
      },
    });
    fnsCount++;
  }

  // Services
  const serviceNames = [
    "Выездная проверка",
    "Камеральная проверка",
    "Отдел оперативного контроля",
  ];
  for (const name of serviceNames) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

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

  console.log(
    `Seed complete: 10 cities, ${fnsCount} FNS offices, 3 services, 7 settings`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
