/**
 * Заправляет ИФНС полным «досье»:
 *   - реальные ИНН/КПП/ОКТМО/телефон/часы из Dadata-кэша (где есть)
 *   - официальный сайт = nalog.gov.ru/rn{регион}/
 *   - официальная почта = шаблонный info.{код}@nalog.gov.ru
 *   - 12 сотрудников на ИФНС, разбитых по 7 отделам, с реалистичными
 *     фото (Pravatar — ручной отбор «деловых» аватарок).
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

const DEFAULT_HOURS =
  "Пн, чт: 9:00–18:00 · Вт, ср: 9:00–20:00 · Пт: 9:00–16:45 · Сб-Вс: выходной";

function normalizeHours(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_HOURS;
  const cleaned = raw.replace(/Код\s+ОКПО[:\d\s]+/i, "").trim();
  if (!cleaned) return DEFAULT_HOURS;
  return cleaned.replace(/\s+/g, " ").slice(0, 240);
}

// === Структура отделов и должностей ===
// 12 человек на ИФНС: руководство (3) + 6 отделов с начальниками
// и заместителями, всего ~12 сотрудников.
interface RoleSpec {
  title: string;
  // Если true — должен быть мужчина в костюме (для руководства).
  preferMale?: boolean;
}
interface DeptSpec {
  dept: string;
  sortOrder: number;
  roles: RoleSpec[];
}

const DEPARTMENTS: DeptSpec[] = [
  {
    dept: "Руководство",
    sortOrder: 1,
    roles: [
      { title: "Начальник инспекции", preferMale: true },
      { title: "Заместитель начальника инспекции", preferMale: true },
      { title: "Заместитель начальника инспекции" },
    ],
  },
  {
    dept: "Отдел выездных проверок",
    sortOrder: 2,
    roles: [
      { title: "Начальник отдела выездных проверок" },
      { title: "Старший государственный налоговый инспектор" },
    ],
  },
  {
    dept: "Отдел камеральных проверок",
    sortOrder: 3,
    roles: [
      { title: "Начальник отдела камеральных проверок" },
      { title: "Старший государственный налоговый инспектор" },
    ],
  },
  {
    dept: "Отдел регистрации и учёта налогоплательщиков",
    sortOrder: 4,
    roles: [
      { title: "Начальник отдела регистрации" },
      { title: "Главный специалист по регистрации" },
    ],
  },
  {
    dept: "Отдел урегулирования задолженности",
    sortOrder: 5,
    roles: [{ title: "Начальник отдела урегулирования задолженности" }],
  },
  {
    dept: "Отдел работы с налогоплательщиками",
    sortOrder: 6,
    roles: [{ title: "Начальник отдела работы с налогоплательщиками" }],
  },
  {
    dept: "Отдел общего и хозяйственного обеспечения",
    sortOrder: 7,
    roles: [{ title: "Начальник отдела общего обеспечения" }],
  },
];

// Pravatar: ручной отбор ID, где люди в деловой одежде (костюм/рубашка).
// Просмотрено визуально на pravatar.cc и отфильтровано к серьёзным
// портретам — без casual hoodies, селфи и т.п.
const PRAVATAR_M = [12, 13, 14, 15, 17, 18, 27, 33, 51, 52, 53, 56, 57, 58, 60, 67, 68, 69];
const PRAVATAR_F = [5, 9, 10, 16, 19, 20, 23, 25, 32, 34, 36, 41, 44, 45, 47, 49];

const FIRST_M = ["Александр", "Михаил", "Дмитрий", "Сергей", "Андрей", "Алексей", "Иван", "Артём", "Николай", "Владимир", "Юрий", "Игорь", "Виктор", "Роман", "Павел", "Олег"];
const FIRST_F = ["Анна", "Мария", "Ольга", "Татьяна", "Елена", "Наталья", "Ирина", "Ксения", "Светлана", "Людмила", "Галина", "Лариса", "Марина", "Юлия", "Валентина"];
const PATR_M = ["Александрович", "Михайлович", "Дмитриевич", "Сергеевич", "Андреевич", "Алексеевич", "Иванович", "Николаевич", "Владимирович", "Юрьевич", "Игоревич", "Викторович"];
const PATR_F = ["Александровна", "Михайловна", "Дмитриевна", "Сергеевна", "Андреевна", "Алексеевна", "Ивановна", "Николаевна", "Владимировна", "Юрьевна"];
const LAST_M = ["Иванов", "Петров", "Смирнов", "Кузнецов", "Попов", "Соколов", "Лебедев", "Козлов", "Новиков", "Морозов", "Волков", "Зайцев", "Павлов", "Семёнов", "Голубев", "Виноградов", "Богданов", "Воробьёв", "Фёдоров", "Михайлов"];

// Простой детерминированный hash для seed.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickByHash<T>(arr: T[], seed: string, salt = ""): T {
  return arr[hash(seed + salt) % arr.length];
}

function randomFnsPhone(regionCode: string, seed: string): string {
  const r = regionCode.slice(0, 2);
  const cityCodes: Record<string, string> = {
    "77": "495", "78": "812", "50": "498", "47": "812",
    "54": "383", "66": "343", "16": "843", "52": "831",
    "74": "351", "63": "846", "02": "347", "24": "391",
    "59": "342", "36": "473", "34": "844", "61": "863",
    "23": "861", "64": "845", "19": "3902", "12": "8362",
    "11": "8212", "29": "8182",
  };
  const cityCode = cityCodes[r] ?? `3${(hash(seed) % 90) + 10}`;
  const h = hash(seed + "phone");
  const a = String((h % 900) + 100);
  const b = String(((h >> 4) % 90) + 10);
  const c = String(((h >> 8) % 90) + 10);
  return `+7 (${cityCode}) ${a}-${b}-${c}`;
}

function avatarUrl(gender: "m" | "f", seed: string): string {
  const pool = gender === "m" ? PRAVATAR_M : PRAVATAR_F;
  const idx = hash(seed) % pool.length;
  const id = pool[idx];
  return `https://i.pravatar.cc/300?img=${id}`;
}

interface StaffEntry {
  firstName: string;
  lastName: string;
  middleName: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  photoUrl: string;
  sortOrder: number;
}

function buildStaff(fnsCode: string): StaffEntry[] {
  const out: StaffEntry[] = [];
  let order = 0;
  for (const dept of DEPARTMENTS) {
    for (const role of dept.roles) {
      const seed = `${fnsCode}-${order}-${role.title}`;
      // Если preferMale (руководство) — мужчина. Иначе ~55% женщин.
      const gender: "m" | "f" = role.preferMale
        ? "m"
        : (hash(seed + "g") % 100) < 55
        ? "f"
        : "m";
      const firstName = pickByHash(gender === "m" ? FIRST_M : FIRST_F, seed, "first");
      const middleName = pickByHash(gender === "m" ? PATR_M : PATR_F, seed, "patr");
      const lastBase = pickByHash(LAST_M, seed, "last");
      const lastName = gender === "f" ? lastBase + "а" : lastBase;
      out.push({
        firstName,
        lastName,
        middleName,
        position: role.title,
        department: dept.dept,
        phone:
          order < 1
            ? randomFnsPhone(fnsCode, seed)
            : `${randomFnsPhone(fnsCode, seed)} доб. ${100 + order * 10}`,
        email: `${fnsCode}.${order + 1}@nalog.gov.ru`,
        photoUrl: avatarUrl(gender, seed),
        sortOrder: order,
      });
      order++;
    }
  }
  return out;
}

async function main() {
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

    await prisma.fnsStaff.deleteMany({ where: { fnsId: f.id, source: "seed" } });
    const entries = buildStaff(f.code).map((e) => ({
      ...e,
      fnsId: f.id,
      source: "seed",
    }));
    await prisma.fnsStaff.createMany({ data: entries });
    staffCreated += entries.length;

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
