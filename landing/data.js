// data.js — static content for P2PTax landing + prototype
// exported via window.PT (wrapped in IIFE so top-level consts don't collide with Babel scripts)
(function(){
const CITIES = [
  { id: 'msk', name: 'Москва', fns_count: 26, specialists: 34 },
  { id: 'spb', name: 'Санкт-Петербург', fns_count: 18, specialists: 21 },
  { id: 'ekb', name: 'Екатеринбург', fns_count: 8, specialists: 9 },
  { id: 'nsk', name: 'Новосибирск', fns_count: 6, specialists: 7 },
  { id: 'kzn', name: 'Казань', fns_count: 5, specialists: 6 },
  { id: 'nnov', name: 'Нижний Новгород', fns_count: 4, specialists: 5 },
  { id: 'sam', name: 'Самара', fns_count: 4, specialists: 4 },
  { id: 'rnd', name: 'Ростов-на-Дону', fns_count: 4, specialists: 5 },
  { id: 'ufa', name: 'Уфа', fns_count: 3, specialists: 3 },
  { id: 'chb', name: 'Челябинск', fns_count: 3, specialists: 4 },
  { id: 'vrn', name: 'Воронеж', fns_count: 3, specialists: 2 },
  { id: 'krd', name: 'Краснодар', fns_count: 3, specialists: 3 },
];

const FNS_BY_CITY = {
  msk: [
    { id: 'msk-1', code: 'ИФНС №1', area: 'ЦАО' },
    { id: 'msk-7', code: 'ИФНС №7', area: 'ЦАО, Хамовники' },
    { id: 'msk-14', code: 'ИФНС №14', area: 'САО, Савёловский' },
    { id: 'msk-23', code: 'ИФНС №23', area: 'ЮВАО, Кузьминки' },
    { id: 'msk-28', code: 'ИФНС №28', area: 'ЮЗАО, Ясенево' },
    { id: 'msk-33', code: 'ИФНС №33', area: 'СЗАО, Митино' },
    { id: 'msk-43', code: 'ИФНС №43', area: 'САО, Аэропорт' },
  ],
  spb: [
    { id: 'spb-1', code: 'ИФНС №1', area: 'Центральный р-н' },
    { id: 'spb-15', code: 'ИФНС №15', area: 'Выборгский р-н' },
    { id: 'spb-22', code: 'ИФНС №22', area: 'Кировский р-н' },
    { id: 'spb-24', code: 'ИФНС №24', area: 'Приморский р-н' },
  ],
  ekb: [
    { id: 'ekb-24', code: 'ИФНС №24', area: 'Верх-Исетский' },
    { id: 'ekb-32', code: 'ИФНС №32', area: 'Чкаловский' },
  ],
};

const SERVICES = [
  { id: 'desk',   name: 'Камеральная проверка', short: 'Камеральная', hint: 'требование по декларации, НДС, пояснения', color: 'oklch(0.78 0.14 130)' },
  { id: 'field',  name: 'Выездная проверка', short: 'Выездная', hint: 'инспектор анализирует за 3 года, допросы', color: 'oklch(0.70 0.16 45)' },
  { id: 'oper',   name: 'Оперативный контроль (ОКК)', short: 'ОКК', hint: 'ККТ, маркировка, наличные, внезапная', color: 'oklch(0.72 0.12 230)' },
  { id: 'unknown',name: 'Пока не знаю', short: 'Не знаю', hint: 'поможем разобраться по вашему описанию', color: 'oklch(0.65 0.02 260)' },
];

const SPECIALISTS = [
  {
    id: 'am', first: 'Алексей', last: 'Морозов', init: 'АМ',
    role: 'Бывш. инспектор, 11 лет',
    city: 'msk', fns: ['msk-7', 'msk-14'], fnsLabel: 'ИФНС №7, №14 — Москва',
    services: ['field', 'desk'],
    online: true, cases: 128, responseTime: '< 2 ч', since: '2016',
    bio: 'Специализация — выездные проверки по крупным ООО. До 2022 — старший госналоговый инспектор. Веду от запроса документов до акта и возражений.',
  },
  {
    id: 'ik', first: 'Ирина', last: 'Ковалёва', init: 'ИК',
    role: 'Налоговый консультант, 8 лет',
    city: 'msk', fns: ['msk-1', 'msk-28'], fnsLabel: 'ИФНС №1, №28 — Москва',
    services: ['desk', 'oper'],
    online: true, cases: 86, responseTime: '< 30 мин', since: '2018',
    bio: 'Камералки по НДС и налогу на прибыль. Переубедила инспекторов по 40+ актам. Работаю с ИП и микробизнесом.',
  },
  {
    id: 'ds', first: 'Дмитрий', last: 'Смирнов', init: 'ДС',
    role: 'Адвокат, 14 лет',
    city: 'msk', fns: ['msk-23', 'msk-33', 'msk-43'], fnsLabel: 'ИФНС №23, №33, №43 — Москва',
    services: ['field', 'desk', 'oper'],
    online: false, cases: 204, responseTime: '2–4 ч', since: '2011',
    bio: 'Веду сложные дела с выходом в арбитраж. Средний чек возражения — 3.4 млн руб.',
  },
  {
    id: 'ev', first: 'Екатерина', last: 'Волкова', init: 'ЕВ',
    role: 'Бывш. сотрудник УФНС, 9 лет',
    city: 'spb', fns: ['spb-1', 'spb-15'], fnsLabel: 'ИФНС №1, №15 — СПб',
    services: ['field', 'oper'],
    online: true, cases: 97, responseTime: '< 1 ч', since: '2016',
    bio: 'Знаю внутреннюю кухню отдела. Помогу подготовиться к допросу, составить пояснения и возражения.',
  },
  {
    id: 'pl', first: 'Павел', last: 'Лебедев', init: 'ПЛ',
    role: 'Аудитор, 12 лет',
    city: 'spb', fns: ['spb-22', 'spb-24'], fnsLabel: 'ИФНС №22, №24 — СПб',
    services: ['desk'],
    online: true, cases: 153, responseTime: '< 2 ч', since: '2013',
    bio: 'Камеральные по НДС, включая разрывы. Представляю интересы в инспекции и УФНС.',
  },
  {
    id: 'mo', first: 'Михаил', last: 'Орлов', init: 'МО',
    role: 'Налоговый консультант, 6 лет',
    city: 'ekb', fns: ['ekb-24'], fnsLabel: 'ИФНС №24 — Екатеринбург',
    services: ['desk', 'oper'],
    online: false, cases: 42, responseTime: '2–5 ч', since: '2019',
    bio: 'Работаю с маркетплейс-селлерами. Камералка по НДС, пояснения по ОКК.',
  },
];

// pre-filled sample request for demo
const SAMPLE_REQUEST = {
  title: 'Пришло требование о пояснениях по НДС за 2 квартал',
  city: 'msk', fns: 'msk-7', service: 'desk',
  desc: 'ООО на ОСНО, оборот 18 млн/кв. Пришло требование через ЛК — просят пояснить разрывы с контрагентом. Срок ответа 5 дней. Сумма вопросов около 180 тыс.',
  budget: 'до 40 000 ₽',
  status: 'active',
  created: '2 часа назад',
  views: 7,
  replies: 2,
};

// sample chat messages (demo thread)
const SAMPLE_MESSAGES = [
  { from: 'them', who: 'am', text: 'Добрый день. Посмотрел ваш запрос. Похожее требование вёл на той же неделе по №7 — контрагент из списка "технических". Есть рабочий сценарий ответа.', time: '14:02' },
  { from: 'them', who: 'am', text: 'Нужны: счета-фактуры, договор, платежки, акты за период. Если цепочка поставки 2-го звена доступна — ещё лучше.', time: '14:03' },
  { from: 'me', text: 'Документы есть. Цепочку вторую не знаю, смогу уточнить. Как работаете — по предоплате или по факту?', time: '14:11' },
  { from: 'them', who: 'am', text: '50% аванс, 50% после подачи пояснений. Если дойдёт до возражений на акт — отдельно. Могу созвониться сегодня вечером.', time: '14:12' },
];

// FAQ / typical situations
const SITUATIONS = [
  {
    id: 'desk',
    num: '[ 01 ]',
    title: 'Камеральная\nпроверка',
    desc: 'Проверка по сданной декларации. Инспектор просит пояснения, документы, вызывает на «беседу». Часто касается НДС и разрывов с контрагентами.',
    meta: [
      { k: 'Срок', v: '3 мес. от подачи' },
      { k: 'Формат', v: 'Онлайн / требования' },
      { k: 'Риск', v: 'Доначисления, штраф' },
      { k: 'Специалистов', v: '42' },
    ],
  },
  {
    id: 'field',
    num: '[ 02 ]',
    title: 'Выездная\nпроверка',
    desc: 'Инспекция изучает деятельность за 3 года. Запрашивают документы, допрашивают сотрудников, анализируют контрагентов. Итог — акт и решение.',
    meta: [
      { k: 'Срок', v: '2–6 мес.' },
      { k: 'Формат', v: 'На территории' },
      { k: 'Риск', v: 'Доначисления + пени' },
      { k: 'Специалистов', v: '29' },
    ],
  },
  {
    id: 'oper',
    num: '[ 03 ]',
    title: 'ОКК —\nоперативный контроль',
    desc: 'Отдел оперативного контроля. ККТ, маркировка, наличные расчёты. Приходят внезапно — проверяют на месте, составляют протокол.',
    meta: [
      { k: 'Срок', v: 'На месте' },
      { k: 'Формат', v: 'Внезапно' },
      { k: 'Риск', v: 'Штраф, блокировка' },
      { k: 'Специалистов', v: '18' },
    ],
  },
];

// reality timeline — "что будет если не отреагировать"
const TIMELINE = [
  { day: 'День 1',     label: 'Пришло требование', desc: 'Через ЛК налогоплательщика или почтой России. Срок на ответ — обычно 5–10 дней.', bad: false },
  { day: 'День 6–10',  label: 'Пропуск срока', desc: 'Автоматический штраф по ст. 129.1 — 5 000 ₽ за первое нарушение.', bad: true },
  { day: 'День 15',    label: 'Приостановка операций', desc: 'ФНС блокирует расчётный счёт до предоставления пояснений или документов.', bad: true },
  { day: 'День 30+',   label: 'Акт камеральной проверки', desc: 'Без пояснений инспектор начисляет налог расчётным методом + пени + штраф 20%.', bad: true },
  { day: 'День 60+',   label: 'Решение к исполнению', desc: 'Списание со счёта в безакцептном порядке, арест имущества, субсидиарка.', bad: true },
];

Object.assign(window, {
  PT_CITIES: CITIES,
  PT_FNS: FNS_BY_CITY,
  PT_SERVICES: SERVICES,
  PT_SPECIALISTS: SPECIALISTS,
  PT_SAMPLE_REQUEST: SAMPLE_REQUEST,
  PT_SAMPLE_MESSAGES: SAMPLE_MESSAGES,
  PT_SITUATIONS: SITUATIONS,
  PT_TIMELINE: TIMELINE,
});
})();
