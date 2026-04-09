import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Source: nalog.gov.ru / open public data
// Admin can edit names/addresses via /admin/ifns panel
const ifnsData = [
  {
    name: 'Москва',
    region: 'Москва',
    slug: 'moscow',
    ifns: [
      { code: '7701', name: 'ИФНС России № 1 по г. Москве', slug: 'ifns-1-moscow', address: 'г. Москва, Дмитровский пер., д. 12', searchAliases: 'ФНС 1, инспекция 1, налоговая 1 Москва, 77-01' },
      { code: '7702', name: 'ИФНС России № 2 по г. Москве', slug: 'ifns-2-moscow', address: 'г. Москва, Хохловский пер., д. 8', searchAliases: 'ФНС 2, инспекция 2, налоговая 2 Москва, 77-02' },
      { code: '7703', name: 'ИФНС России № 3 по г. Москве', slug: 'ifns-3-moscow', address: 'г. Москва, ул. Лесная, д. 43', searchAliases: 'ФНС 3, инспекция 3, налоговая 3 Москва, 77-03, Пресненский' },
      { code: '7704', name: 'ИФНС России № 4 по г. Москве', slug: 'ifns-4-moscow', address: 'г. Москва, Хамовнический пер., д. 6', searchAliases: 'ФНС 4, инспекция 4, Хамовники' },
      { code: '7705', name: 'ИФНС России № 5 по г. Москве', slug: 'ifns-5-moscow', address: 'г. Москва, ул. Б. Серпуховская, д. 26/9', searchAliases: 'ФНС 5, инспекция 5, Замоскворечье' },
      { code: '7706', name: 'ИФНС России № 6 по г. Москве', slug: 'ifns-6-moscow', address: 'г. Москва, Солянский туп., д. 2, стр. 1', searchAliases: 'ФНС 6, инспекция 6, Таганский' },
      { code: '7707', name: 'ИФНС России № 7 по г. Москве', slug: 'ifns-7-moscow', address: 'г. Москва, ул. Б. Тульская, д. 15', searchAliases: 'ФНС 7, инспекция 7, налоговая 7 Москва, Якиманка' },
      { code: '7708', name: 'ИФНС России № 8 по г. Москве', slug: 'ifns-8-moscow', address: 'г. Москва, Кожевническая ул., д. 10, стр. 4', searchAliases: 'ФНС 8, инспекция 8, Басманный' },
      { code: '7709', name: 'ИФНС России № 9 по г. Москве', slug: 'ifns-9-moscow', address: 'г. Москва, ул. Трубная, д. 32', searchAliases: 'ФНС 9, инспекция 9, Сокольники' },
      { code: '7710', name: 'ИФНС России № 10 по г. Москве', slug: 'ifns-10-moscow', address: 'г. Москва, Б. Спасская ул., д. 37, стр. 3', searchAliases: 'ФНС 10, инспекция 10, Мещанский' },
      { code: '7713', name: 'ИФНС России № 13 по г. Москве', slug: 'ifns-13-moscow', address: 'г. Москва, Шмитовский пр., д. 1, стр. 1', searchAliases: 'ФНС 13, инспекция 13, Дмитровский' },
      { code: '7714', name: 'ИФНС России № 14 по г. Москве', slug: 'ifns-14-moscow', address: 'г. Москва, ул. Б. Академическая, д. 18', searchAliases: 'ФНС 14, инспекция 14, Тимирязевский' },
      { code: '7715', name: 'ИФНС России № 15 по г. Москве', slug: 'ifns-15-moscow', address: 'г. Москва, Останкинская ул., д. 22', searchAliases: 'ФНС 15, инспекция 15, Алексеевский' },
      { code: '7716', name: 'ИФНС России № 16 по г. Москве', slug: 'ifns-16-moscow', address: 'г. Москва, ул. Таймырская, д. 6', searchAliases: 'ФНС 16, инспекция 16, Ростокино' },
      { code: '7717', name: 'ИФНС России № 17 по г. Москве', slug: 'ifns-17-moscow', address: 'г. Москва, Боярский пер., д. 3', searchAliases: 'ФНС 17, инспекция 17, Ярославский' },
      { code: '7718', name: 'ИФНС России № 18 по г. Москве', slug: 'ifns-18-moscow', address: 'г. Москва, ул. Мартеновская, д. 34', searchAliases: 'ФНС 18, инспекция 18, Перово' },
      { code: '7719', name: 'ИФНС России № 19 по г. Москве', slug: 'ifns-19-moscow', address: 'г. Москва, ул. Рязанский просп., д. 49', searchAliases: 'ФНС 19, инспекция 19, Рязанский' },
      { code: '7720', name: 'ИФНС России № 20 по г. Москве', slug: 'ifns-20-moscow', address: 'г. Москва, ул. Люблинская, д. 37/2', searchAliases: 'ФНС 20, инспекция 20, Выхино' },
      { code: '7721', name: 'ИФНС России № 21 по г. Москве', slug: 'ifns-21-moscow', address: 'г. Москва, ул. Волгоградский просп., д. 46', searchAliases: 'ФНС 21, инспекция 21, Нижегородский' },
      { code: '7722', name: 'ИФНС России № 22 по г. Москве', slug: 'ifns-22-moscow', address: 'г. Москва, ул. Большая Черкизовская, д. 4', searchAliases: 'ФНС 22, инспекция 22' },
      { code: '7723', name: 'ИФНС России № 23 по г. Москве', slug: 'ifns-23-moscow', address: 'г. Москва, ул. Тверская-Ямская 4-я, д. 7', searchAliases: 'ФНС 23, инспекция 23, Царицыно' },
      { code: '7724', name: 'ИФНС России № 24 по г. Москве', slug: 'ifns-24-moscow', address: 'г. Москва, ул. Электролитный пр., д. 3', searchAliases: 'ФНС 24, инспекция 24, Москворечье' },
      { code: '7725', name: 'ИФНС России № 25 по г. Москве', slug: 'ifns-25-moscow', address: 'г. Москва, ул. Новочеремушкинская, д. 69, корп. 1', searchAliases: 'ФНС 25, инспекция 25, налоговая 25 Москва, Чертаново' },
      { code: '7726', name: 'ИФНС России № 26 по г. Москве', slug: 'ifns-26-moscow', address: 'г. Москва, Балаклавский просп., д. 28, корп. 2', searchAliases: 'ФНС 26, инспекция 26, Зюзино' },
      { code: '7727', name: 'ИФНС России № 27 по г. Москве', slug: 'ifns-27-moscow', address: 'г. Москва, ул. Ак. Пилюгина, д. 24', searchAliases: 'ФНС 27, инспекция 27, Теплый Стан' },
      { code: '7728', name: 'ИФНС России № 28 по г. Москве', slug: 'ifns-28-moscow', address: 'г. Москва, ул. Газопровод, д. 9, корп. 1', searchAliases: 'ФНС 28, инспекция 28, Черемушки' },
      { code: '7729', name: 'ИФНС России № 29 по г. Москве', slug: 'ifns-29-moscow', address: 'г. Москва, ул. Кленовый бул., д. 4', searchAliases: 'ФНС 29, инспекция 29, Гагаринский' },
      { code: '7730', name: 'ИФНС России № 30 по г. Москве', slug: 'ifns-30-moscow', address: 'г. Москва, ул. Лукинская, д. 12', searchAliases: 'ФНС 30, инспекция 30, Юго-Западный' },
      { code: '7731', name: 'ИФНС России № 31 по г. Москве', slug: 'ifns-31-moscow', address: 'г. Москва, ул. Боровское шоссе, д. 40', searchAliases: 'ФНС 31, инспекция 31, Солнцево, Ново-Переделкино' },
      { code: '7732', name: 'ИФНС России № 32 по г. Москве', slug: 'ifns-32-moscow', address: 'г. Москва, ул. Большая Очаковская, д. 11', searchAliases: 'ФНС 32, инспекция 32, Тропарево-Никулино' },
      { code: '7733', name: 'ИФНС России № 33 по г. Москве', slug: 'ifns-33-moscow', address: 'г. Москва, ул. Твардовского, д. 8', searchAliases: 'ФНС 33, инспекция 33, Кунцево, Строгино' },
      { code: '7734', name: 'ИФНС России № 34 по г. Москве', slug: 'ifns-34-moscow', address: 'г. Москва, ул. Сходненская, д. 60', searchAliases: 'ФНС 34, инспекция 34, Митино' },
      { code: '7735', name: 'ИФНС России № 35 по г. Москве', slug: 'ifns-35-moscow', address: 'г. Москва, ул. Юбилейный просп., д. 50', searchAliases: 'ФНС 35, инспекция 35, Крюково, Зеленоград' },
      { code: '7736', name: 'ИФНС России № 36 по г. Москве', slug: 'ifns-36-moscow', address: 'г. Москва, ул. Болотниковская, д. 2', searchAliases: 'ФНС 36, инспекция 36, Северное Бутово' },
      { code: '7743', name: 'ИФНС России № 43 по г. Москве', slug: 'ifns-43-moscow', address: 'г. Москва, Кронштадтский бул., д. 9', searchAliases: 'ФНС 43, инспекция 43, Войковский' },
      { code: '7746', name: 'Межрайонная ИФНС России № 46 по г. Москве', slug: 'ifns-46-moscow', address: 'г. Москва, Походный пр., д. 3, стр. 1', searchAliases: 'ФНС 46, МИФНС 46, межрайонная 46, регистрация, крупнейшие' },
    ],
  },
  {
    name: 'Санкт-Петербург',
    region: 'Санкт-Петербург',
    slug: 'saint-petersburg',
    ifns: [
      { code: '7801', name: 'ИФНС России по Центральному р-ну г. Санкт-Петербурга', slug: 'ifns-central-spb', address: 'г. Санкт-Петербург, Наб. р. Фонтанки, д. 76', searchAliases: 'ФНС Центральный Питер, налоговая центральный СПб' },
      { code: '7802', name: 'ИФНС России по Адмиралтейскому р-ну г. Санкт-Петербурга', slug: 'ifns-admiralty-spb', address: 'г. Санкт-Петербург, Измайловский просп., д. 4', searchAliases: 'ФНС Адмиралтейский СПб, Питер' },
      { code: '7803', name: 'ИФНС России по Петроградскому р-ну г. Санкт-Петербурга', slug: 'ifns-petrograd-spb', address: 'г. Санкт-Петербург, Введенская ул., д. 4', searchAliases: 'ФНС Петроградский СПб' },
      { code: '7804', name: 'ИФНС России по Василеостровскому р-ну г. Санкт-Петербурга', slug: 'ifns-vasileo-spb', address: 'г. Санкт-Петербург, ул. Одоевского, д. 29', searchAliases: 'ФНС Васильевский остров СПб, ВО' },
      { code: '7805', name: 'ИФНС России по Выборгскому р-ну г. Санкт-Петербурга', slug: 'ifns-vyborg-spb', address: 'г. Санкт-Петербург, Выборгская наб., д. 33, лит. А', searchAliases: 'ФНС Выборгский СПб' },
      { code: '7806', name: 'ИФНС России по Калининскому р-ну г. Санкт-Петербурга', slug: 'ifns-kalininsky-spb', address: 'г. Санкт-Петербург, ул. Бутлерова, д. 16', searchAliases: 'ФНС Калининский СПб' },
      { code: '7807', name: 'ИФНС России по Кировскому р-ну г. Санкт-Петербурга', slug: 'ifns-kirov-spb', address: 'г. Санкт-Петербург, просп. Стачек, д. 68', searchAliases: 'ФНС Кировский СПб, Нарвская' },
      { code: '7808', name: 'ИФНС России по Красногвардейскому р-ну г. Санкт-Петербурга', slug: 'ifns-krasnogv-spb', address: 'г. Санкт-Петербург, ул. Стахановцев, д. 4', searchAliases: 'ФНС Красногвардейский СПб' },
      { code: '7810', name: 'ИФНС России по Невскому р-ну г. Санкт-Петербурга', slug: 'ifns-nevsky-spb', address: 'г. Санкт-Петербург, просп. Обуховской Обороны, д. 110, к. 2', searchAliases: 'ФНС Невский СПб' },
      { code: '7811', name: 'ИФНС России по Приморскому р-ну г. Санкт-Петербурга', slug: 'ifns-primorsky-spb', address: 'г. Санкт-Петербург, ул. Туристская, д. 28/52', searchAliases: 'ФНС Приморский СПб' },
      { code: '7816', name: 'Межрайонная ИФНС России № 16 по г. Санкт-Петербургу', slug: 'ifns-16-spb', address: 'г. Санкт-Петербург, ул. Розенштейна, д. 21, лит. А', searchAliases: 'МИФНС 16 СПб, межрайонная 16 Питер' },
      { code: '7819', name: 'Межрайонная ИФНС России № 19 по г. Санкт-Петербургу', slug: 'ifns-19-spb', address: 'г. Санкт-Петербург, ул. Трефолева, д. 2Д', searchAliases: 'МИФНС 19 СПб, регистрация СПб' },
    ],
  },
  {
    name: 'Новосибирск',
    region: 'Новосибирская область',
    slug: 'novosibirsk',
    ifns: [
      { code: '5401', name: 'ИФНС России по Центральному р-ну г. Новосибирска', slug: 'ifns-central-nsk', address: 'г. Новосибирск, ул. Каменская, д. 49', searchAliases: 'ФНС Центральный Новосибирск' },
      { code: '5402', name: 'ИФНС России по Железнодорожному р-ну г. Новосибирска', slug: 'ifns-zhd-nsk', address: 'г. Новосибирск, ул. Вокзальная магистраль, д. 35', searchAliases: 'ФНС Железнодорожный Новосибирск' },
      { code: '5404', name: 'ИФНС России по Калининскому р-ну г. Новосибирска', slug: 'ifns-kalininsky-nsk', address: 'г. Новосибирск, просп. Дзержинского, д. 78', searchAliases: 'ФНС Калининский Новосибирск' },
      { code: '5405', name: 'ИФНС России по Кировскому р-ну г. Новосибирска', slug: 'ifns-kirov-nsk', address: 'г. Новосибирск, ул. Зорге, д. 28', searchAliases: 'ФНС Кировский Новосибирск' },
      { code: '5406', name: 'ИФНС России по Ленинскому р-ну г. Новосибирска', slug: 'ifns-leninsky-nsk', address: 'г. Новосибирск, ул. Станционная, д. 28', searchAliases: 'ФНС Ленинский Новосибирск' },
      { code: '5407', name: 'ИФНС России по Октябрьскому р-ну г. Новосибирска', slug: 'ifns-october-nsk', address: 'г. Новосибирск, ул. Народная, д. 126', searchAliases: 'ФНС Октябрьский Новосибирск' },
      { code: '5408', name: 'ИФНС России по Советскому р-ну г. Новосибирска', slug: 'ifns-sovetsky-nsk', address: 'г. Новосибирск, ул. Демакова, д. 15', searchAliases: 'ФНС Советский Новосибирск, Академгородок' },
      { code: '5410', name: 'Межрайонная ИФНС России № 16 по Новосибирской области', slug: 'ifns-16-nsk', address: 'г. Новосибирск, ул. Октябрьская, д. 35', searchAliases: 'МИФНС 16 Новосибирск, крупнейшие НСО' },
    ],
  },
  {
    name: 'Екатеринбург',
    region: 'Свердловская область',
    slug: 'ekaterinburg',
    ifns: [
      { code: '6601', name: 'ИФНС России по Верх-Исетскому р-ну г. Екатеринбурга', slug: 'ifns-verkh-iset-ekb', address: 'г. Екатеринбург, ул. Хомякова, д. 4', searchAliases: 'ФНС Верх-Исетский Екатеринбург' },
      { code: '6602', name: 'ИФНС России по Железнодорожному р-ну г. Екатеринбурга', slug: 'ifns-zhd-ekb', address: 'г. Екатеринбург, ул. Красноармейская, д. 14', searchAliases: 'ФНС Железнодорожный Екатеринбург' },
      { code: '6603', name: 'ИФНС России по Кировскому р-ну г. Екатеринбурга', slug: 'ifns-kirov-ekb', address: 'г. Екатеринбург, ул. Декабристов, д. 4', searchAliases: 'ФНС Кировский Екатеринбург' },
      { code: '6604', name: 'ИФНС России по Ленинскому р-ну г. Екатеринбурга', slug: 'ifns-leninsky-ekb', address: 'г. Екатеринбург, Студенческая ул., д. 3', searchAliases: 'ФНС Ленинский Екатеринбург' },
      { code: '6605', name: 'ИФНС России по Октябрьскому р-ну г. Екатеринбурга', slug: 'ifns-october-ekb', address: 'г. Екатеринбург, ул. Розы Люксембург, д. 1', searchAliases: 'ФНС Октябрьский Екатеринбург' },
      { code: '6606', name: 'ИФНС России по Орджоникидзевскому р-ну г. Екатеринбурга', slug: 'ifns-ordzh-ekb', address: 'г. Екатеринбург, ул. Ломоносова, д. 11а', searchAliases: 'ФНС Орджоникидзевский Екатеринбург' },
      { code: '6623', name: 'Межрайонная ИФНС России № 25 по Свердловской области', slug: 'ifns-25-svrd', address: 'г. Екатеринбург, ул. Тургенева, д. 11', searchAliases: 'МИФНС 25 Свердловская, регистрация Екатеринбург' },
      { code: '6658', name: 'Межрайонная ИФНС России № 32 по Свердловской области', slug: 'ifns-32-svrd', address: 'г. Екатеринбург, ул. Декабристов, д. 18', searchAliases: 'МИФНС 32 Свердловская' },
    ],
  },
  {
    name: 'Казань',
    region: 'Республика Татарстан',
    slug: 'kazan',
    ifns: [
      { code: '1601', name: 'ИФНС России по Вахитовскому р-ну г. Казани', slug: 'ifns-vakhitov-kzn', address: 'г. Казань, ул. Вишневского, д. 26', searchAliases: 'ФНС Вахитовский Казань' },
      { code: '1602', name: 'ИФНС России по Кировскому р-ну г. Казани', slug: 'ifns-kirov-kzn', address: 'г. Казань, ул. Большая Крыловка, д. 26', searchAliases: 'ФНС Кировский Казань' },
      { code: '1603', name: 'ИФНС России по Московскому р-ну г. Казани', slug: 'ifns-moscow-kzn', address: 'г. Казань, ул. Краснококшайская, д. 58а', searchAliases: 'ФНС Московский Казань' },
      { code: '1604', name: 'ИФНС России по Приволжскому р-ну г. Казани', slug: 'ifns-privolzhsky-kzn', address: 'г. Казань, ул. Максимова, д. 1', searchAliases: 'ФНС Приволжский Казань' },
      { code: '1605', name: 'ИФНС России по Советскому р-ну г. Казани', slug: 'ifns-sovetsky-kzn', address: 'г. Казань, ул. Ершова, д. 31а', searchAliases: 'ФНС Советский Казань' },
    ],
  },
  {
    name: 'Нижний Новгород',
    region: 'Нижегородская область',
    slug: 'nizhny-novgorod',
    ifns: [
      { code: '5254', name: 'ИФНС России по Нижегородскому р-ну г. Н. Новгорода', slug: 'ifns-nizhegorodsky-nn', address: 'г. Нижний Новгород, ул. Нижегородская, д. 23', searchAliases: 'ФНС Нижегородский Нижний Новгород' },
      { code: '5256', name: 'ИФНС России по Советскому р-ну г. Н. Новгорода', slug: 'ifns-sovetsky-nn', address: 'г. Нижний Новгород, просп. Молодёжный, д. 31а', searchAliases: 'ФНС Советский Нижний Новгород' },
      { code: '5257', name: 'ИФНС России по Сормовскому р-ну г. Н. Новгорода', slug: 'ifns-sormovo-nn', address: 'г. Нижний Новгород, ул. Баррикад, д. 63', searchAliases: 'ФНС Сормово Нижний Новгород' },
      { code: '5258', name: 'Межрайонная ИФНС России № 18 по Нижегородской области', slug: 'ifns-18-nn', address: 'г. Нижний Новгород, ул. Горького, д. 140', searchAliases: 'МИФНС 18 Нижний Новгород, регистрация НН' },
    ],
  },
  {
    name: 'Краснодар',
    region: 'Краснодарский край',
    slug: 'krasnodar',
    ifns: [
      { code: '2305', name: 'ИФНС России № 5 по г. Краснодару', slug: 'ifns-5-krasnodar', address: 'г. Краснодар, ул. Колхозная, д. 8', searchAliases: 'ФНС 5 Краснодар, налоговая Краснодар' },
      { code: '2311', name: 'ИФНС России № 11 по г. Краснодару', slug: 'ifns-11-krasnodar', address: 'г. Краснодар, ул. Коммунаров, д. 235', searchAliases: 'ФНС 11 Краснодар' },
      { code: '2312', name: 'ИФНС России № 12 по г. Краснодару', slug: 'ifns-12-krasnodar', address: 'г. Краснодар, ул. Садовая, д. 7а', searchAliases: 'ФНС 12 Краснодар' },
      { code: '2399', name: 'Межрайонная ИФНС России № 16 по Краснодарскому краю', slug: 'ifns-16-krasnodar', address: 'г. Краснодар, ул. Красная, д. 118', searchAliases: 'МИФНС 16 Краснодар, регистрация Краснодар' },
    ],
  },
  {
    name: 'Ростов-на-Дону',
    region: 'Ростовская область',
    slug: 'rostov-na-donu',
    ifns: [
      { code: '6150', name: 'ИФНС России по Ворошиловскому р-ну г. Ростова-на-Дону', slug: 'ifns-voroshilovsky-rnd', address: 'г. Ростов-на-Дону, ул. Обороны, д. 7', searchAliases: 'ФНС Ворошиловский Ростов' },
      { code: '6151', name: 'ИФНС России по Железнодорожному р-ну г. Ростова-на-Дону', slug: 'ifns-zhd-rnd', address: 'г. Ростов-на-Дону, пер. Харьковский, д. 11/47', searchAliases: 'ФНС Железнодорожный Ростов' },
      { code: '6152', name: 'ИФНС России по Кировскому р-ну г. Ростова-на-Дону', slug: 'ifns-kirov-rnd', address: 'г. Ростов-на-Дону, ул. Кировский, д. 21', searchAliases: 'ФНС Кировский Ростов' },
      { code: '6155', name: 'ИФНС России по Октябрьскому р-ну г. Ростова-на-Дону', slug: 'ifns-october-rnd', address: 'г. Ростов-на-Дону, просп. Стачки, д. 2а', searchAliases: 'ФНС Октябрьский Ростов' },
      { code: '6163', name: 'Межрайонная ИФНС России № 25 по Ростовской области', slug: 'ifns-25-rnd', address: 'г. Ростов-на-Дону, ул. Большая Садовая, д. 98/130', searchAliases: 'МИФНС 25 Ростов, регистрация Ростов' },
    ],
  },
  {
    name: 'Уфа',
    region: 'Республика Башкортостан',
    slug: 'ufa',
    ifns: [
      { code: '0274', name: 'ИФНС России по Ленинскому р-ну г. Уфы', slug: 'ifns-leninsky-ufa', address: 'г. Уфа, ул. Карла Маркса, д. 27а', searchAliases: 'ФНС Ленинский Уфа' },
      { code: '0276', name: 'ИФНС России по Орджоникидзевскому р-ну г. Уфы', slug: 'ifns-ordzh-ufa', address: 'г. Уфа, ул. 50-летия Октября, д. 5', searchAliases: 'ФНС Орджоникидзевский Уфа' },
      { code: '0278', name: 'ИФНС России по Советскому р-ну г. Уфы', slug: 'ifns-sovetsky-ufa', address: 'г. Уфа, ул. Цюрупы, д. 8', searchAliases: 'ФНС Советский Уфа' },
      { code: '0280', name: 'Межрайонная ИФНС России № 40 по Республике Башкортостан', slug: 'ifns-40-ufa', address: 'г. Уфа, ул. Достоевского, д. 37', searchAliases: 'МИФНС 40 Уфа, регистрация Уфа, Башкортостан' },
    ],
  },
  {
    name: 'Челябинск',
    region: 'Челябинская область',
    slug: 'chelyabinsk',
    ifns: [
      { code: '7451', name: 'ИФНС России по Курчатовскому р-ну г. Челябинска', slug: 'ifns-kurchatov-chel', address: 'г. Челябинск, ул. Воровского, д. 31', searchAliases: 'ФНС Курчатовский Челябинск' },
      { code: '7452', name: 'ИФНС России по Ленинскому р-ну г. Челябинска', slug: 'ifns-leninsky-chel', address: 'г. Челябинск, ул. Горького, д. 4', searchAliases: 'ФНС Ленинский Челябинск' },
      { code: '7453', name: 'ИФНС России по Металлургическому р-ну г. Челябинска', slug: 'ifns-metallurg-chel', address: 'г. Челябинск, ул. Свободы, д. 158', searchAliases: 'ФНС Металлургический Челябинск' },
      { code: '7455', name: 'ИФНС России по Советскому р-ну г. Челябинска', slug: 'ifns-sovetsky-chel', address: 'г. Челябинск, ул. Пионерская, д. 46', searchAliases: 'ФНС Советский Челябинск' },
      { code: '7456', name: 'ИФНС России по Тракторозаводскому р-ну г. Челябинска', slug: 'ifns-tractor-chel', address: 'г. Челябинск, ул. Первой Пятилетки, д. 5', searchAliases: 'ФНС Тракторозаводский Челябинск' },
      { code: '7458', name: 'Межрайонная ИФНС России № 17 по Челябинской области', slug: 'ifns-17-chel', address: 'г. Челябинск, ул. Энгельса, д. 73', searchAliases: 'МИФНС 17 Челябинск, регистрация Челябинск' },
    ],
  },
];

async function seedIfns() {
  console.log('Seeding cities and IFNS...');

  let totalCities = 0;
  let totalIfns = 0;

  for (const cityData of ifnsData) {
    const city = await prisma.city.upsert({
      where: { slug: cityData.slug },
      update: { name: cityData.name, region: cityData.region },
      create: { name: cityData.name, region: cityData.region, slug: cityData.slug },
    });

    totalCities++;

    for (const ifnsItem of cityData.ifns) {
      await prisma.ifns.upsert({
        where: { slug: ifnsItem.slug },
        update: {
          name: ifnsItem.name,
          code: ifnsItem.code,
          address: ifnsItem.address,
          searchAliases: ifnsItem.searchAliases,
          cityId: city.id,
        },
        create: {
          code: ifnsItem.code,
          name: ifnsItem.name,
          address: ifnsItem.address,
          slug: ifnsItem.slug,
          searchAliases: ifnsItem.searchAliases,
          cityId: city.id,
        },
      });

      totalIfns++;
    }

    console.log(`  ${cityData.name}: ${cityData.ifns.length} ИФНС`);
  }

  console.log(`Done: ${totalCities} cities, ${totalIfns} IFNS offices`);
}

seedIfns()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
