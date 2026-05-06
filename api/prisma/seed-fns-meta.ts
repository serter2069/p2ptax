/**
 * Заправляет ИФНС полным «досье»:
 *   - реальные ИНН/КПП/ОКТМО/телефон/часы из Dadata-кэша (где есть)
 *   - официальный сайт = nalog.gov.ru/rn{регион}/
 *   - официальная почта = шаблонный i{код}@nalog.gov.ru
 *   - 4-6 «сотрудников» с должностями, телефонами и аватарами
 *     (используем dicebear avatar service по seed-имени)
 *
 * Идемпотентно: контакты — UPDATE, сотрудники — DELETE source='seed'
 * + INSERT.
 *
 * Запуск:
 *   npx tsx prisma/seed-fns-meta.ts
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";

const prisma = new PrismaClient();

interface DadataRecord {
  code: string;
  name: string;
  address: string | null;
  oktmo: string | null;
}

interface DadataFull {
  code: string;
  name: string;
  address: string;
  oktmo: string;
  inn: string;
  kpp: string;
  phone: string;
  comment: string;
}

const DADATA_FILE = "/var/www/p2ptax/api/prisma/data/dadata-fns.json";

// === Стандартный график ФНС ===
const DEFAULT_HOURS =
  "Пн, чт: 9:00–18:00 · Вт: 9:00–20:00 · Ср: 9:00–20:00 · Пт: 9:00–16:45 · Сб-Вс: выходной";

// Удаляет «Понедельник, четверг с 9.00 до 18.00; ...» из Dadata
// и приводит к более компактному виду.
function normalizeHours(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_HOURS;
  // Берём только часть с расписанием (после «Код ОКПО:...» или с начала).
  const cleaned = raw.replace(/Код\s+ОКПО[:\d\s]+/i, "").trim();
  if (!cleaned) return DEFAULT_HOURS;
  return cleaned.replace(/\s+/g, " ").slice(0, 240);
}

// === Сотрудники ===
const POSITIONS = [
  { title: "Начальник инспекции", department: null },
  { title: "Заместитель начальника", department: null },
  { title: "Начальник отдела камеральных проверок", department: "Отдел камеральных проверок" },
  { title: "Начальник отдела выездных проверок", department: "Отдел выездных проверок" },
  { title: "Начальник отдела регистрации и учёта налогоплательщиков", department: "Регистрация" },
  { title: "Начальник отдела урегулирования задолженности", department: "Урегулирование" },
  { title: "Начальник отдела работы с налогоплательщиками", department: "Работа с НП" },
];

const FIRST_M = ["Александр", "Михаил", "Дмитрий", "Сергей", "Андрей", "Алексей", "Иван", "Артём", "Николай", "Владимир", "Юрий", "Игорь"];
const FIRST_F = ["Анна", "Мария", "Ольга", "Татьяна", "Елена", "Наталья", "Ирина", "Ксения", "Светлана", "Людмила", "Галина", "Лариса"];
const PATR_M = ["Александрович", "Михайлович", "Дмитриевич", "Сергеевич", "Андреевич", "Алексеевич", "Иванович", "Николаевич", "Владимирович"];
const PATR_F = ["Александровна", "Михайловна", "Дмитриевна", "Сергеевна", "Андреевна", "Алексеевна", "Ивановна", "Николаевна", "Владимировна"];
const LAST_M = ["Иванов", "Петров", "Смирнов", "Кузнецов", "Попов", "Соколов", "Лебедев", "Козлов", "Новиков", "Морозов", "Волков", "Зайцев"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFnsPhone(regionCode: string): string {
  // Регион → код города (приближённо). Берём первые 2 цифры регион-кода.
  const r = regionCode.slice(0, 2);
  const cityCodes: Record<string, string> = {
    "77": "495", "78": "812", "50": "498", "47": "812",
    "54": "383", "66": "343", "16": "843", "52": "831",
    "74": "351", "63": "846", "02": "347", "24": "391",
    "59": "342", "36": "473", "34": "844", "61": "863",
    "23": "861", "64": "845",
  };
  const cityCode = cityCodes[r] ?? `${3 + Math.floor(Math.random() * 7)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`;
  const num =
    String(Math.floor(100 + Math.random() * 900)) + "-" +
    String(Math.floor(10 + Math.random() * 90)) + "-" +
    String(Math.floor(10 + Math.random() * 90));
  return `+7 (${cityCode}) ${num}`;
}

function avatarUrlFor(seed: string): string {
  // Dicebear avataaars — детерминированно по seed (имени).
  const enc = encodeURIComponent(seed);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${enc}&backgroundType=gradientLinear&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

function makeStaffEntry(idx: number, fnsCode: string): {
  firstName: string; lastName: string; middleName: string;
  position: string; department: string | null; phone: string | null;
  email: string; photoUrl: string;
} {
  const role = POSITIONS[idx];
  const female = Math.random() < 0.5;
  const firstName = randomItem(female ? FIRST_F : FIRST_M);
  const middleName = randomItem(female ? PATR_F : PATR_M);
  const lastName = randomItem(LAST_M) + (female ? "а" : "");
  const fullName = `${firstName} ${lastName}`;
  return {
    firstName,
    lastName,
    middleName,
    position: role.title,
    department: role.department,
    // У начальника — отдельный мобильный, у замов — общий + добавочный.
    phone: idx <= 1 ? randomFnsPhone(fnsCode) : `${randomFnsPhone(fnsCode)} доб. ${100 + idx * 10}`,
    email: `${fnsCode}.${idx}@nalog.gov.ru`,
    photoUrl: avatarUrlFor(fullName + fnsCode),
  };
}

async function main() {
  // 1. Читаем Dadata-кэш для контактов.
  let dadataMap = new Map<string, DadataFull>();
  if (existsSync(DADATA_FILE)) {
    const records: (DadataRecord & Partial<DadataFull>)[] = JSON.parse(
      readFileSync(DADATA_FILE, "utf-8")
    );
    for (const r of records) {
      if (r.code) dadataMap.set(r.code, r as DadataFull);
    }
  }
  console.log(`Dadata cache: ${dadataMap.size} records`);

  const fns = await prisma.fnsOffice.findMany({ select: { id: true, code: true, name: true } });
  console.log(`Updating contacts + staff for ${fns.length} ИФНС…`);

  let updatedContacts = 0;
  let staffCreated = 0;

  for (const f of fns) {
    const dd = dadataMap.get(f.code);
    const region = f.code.slice(0, 2);

    await prisma.fnsOffice.update({
      where: { id: f.id },
      data: {
        inn: dd?.inn ?? null,
        kpp: dd?.kpp ?? null,
        oktmo: dd?.oktmo ?? null,
        officialPhone: dd?.phone ?? "+7 (800) 222-22-22",
        officialEmail: `info.${f.code}@nalog.gov.ru`,
        officialWebsite: `https://www.nalog.gov.ru/rn${region}/`,
        workingHours: normalizeHours(dd?.comment),
      },
    });
    updatedContacts++;

    // Сидим только если ещё нет (либо source=seed). Если админ
    // вручную ввёл сотрудников — не трогаем.
    await prisma.fnsStaff.deleteMany({ where: { fnsId: f.id, source: "seed" } });
    const count = 4 + Math.floor(Math.random() * 3); // 4..6
    const entries = [];
    for (let i = 0; i < count; i++) {
      entries.push({ ...makeStaffEntry(i, f.code), fnsId: f.id, sortOrder: i, source: "seed" });
    }
    await prisma.fnsStaff.createMany({ data: entries });
    staffCreated += count;

    if (updatedContacts % 100 === 0) {
      console.log(`  ${updatedContacts}/${fns.length} (staff so far: ${staffCreated})`);
    }
  }

  console.log(`Done. Contacts: ${updatedContacts}, staff: ${staffCreated}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
