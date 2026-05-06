/**
 * Сид-отзывы на сотрудников ИФНС: 0-5 на каждого, source='seed',
 * чтобы было что показать в UI до того как приедут реальные.
 *
 * Идемпотентно — на повторе удаляются только source='seed', живые
 * пользовательские отзывы (source='user') остаются.
 *
 * Запуск: npx tsx prisma/seed-fns-staff-reviews.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ReviewTemplate {
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
}

// Пул отзывов про конкретного сотрудника инспекции. Смещение на 4-5,
// потому что обычно отзывы про конкретного спеца — либо положительные
// («помог разобраться»), либо тихий нейтрал. Откровенно негативные
// встречаются реже.
const POOL: ReviewTemplate[] = [
  { rating: 5, text: "Очень внимательно отнеслись к моему вопросу. Объяснили все нюансы по налоговому вычету, помогли с заявлением. Спасибо за работу." },
  { rating: 5, text: "Профессионал. Разобрались в моём непростом случае с переплатой по ЕНС, всё вернули в срок. Рекомендую обращаться напрямую." },
  { rating: 4, text: "По существу, чётко, без воды. Не очень разговорчивый, но если задавать конкретные вопросы — отвечает грамотно." },
  { rating: 4, text: "Помогли с регистрацией ИП на упрощёнке. Рассказали про лимиты, какие отчёты сдавать, какие сроки. По делу." },
  { rating: 3, text: "Нормально. Не быстро, но и не затягивают. Иногда уходят на совещания и приходится ждать." },
  { rating: 5, text: "Хороший специалист, понятно объясняет. По телефону трудно поймать, проще приехать лично — но если поймали, поможет на 100%." },
  { rating: 4, text: "Грамотно отработали моё обращение по неверному начислению транспортного налога. Перерасчёт сделали быстро." },
  { rating: 4, text: "Помогли разобраться с уведомлением, в котором была ошибка по кадастровой стоимости. Без проволочек." },
  { rating: 2, text: "Долго ждал ответа на письменное обращение. В итоге пришлось ехать лично — а на месте всё решилось за 15 минут." },
  { rating: 5, text: "Спасибо за помощь по вычету за лечение! Сразу сказали какие документы нужны, не пришлось бегать с пересдачей." },
  { rating: 3, text: "Корректно, но сухо. Делает своё дело, не больше." },
  { rating: 4, text: "Принимает строго по записи, лишних разговоров не ведёт, но дело знает." },
  { rating: 5, text: "Очень помогли по налоговой проверке — подсказали как правильно отвечать на требования, какие документы готовить. Стресс снизился в разы." },
];

const FIRST_M = ["Александр", "Михаил", "Дмитрий", "Сергей", "Андрей", "Алексей", "Иван", "Артём", "Николай", "Виктор", "Павел", "Олег"];
const FIRST_F = ["Анна", "Мария", "Ольга", "Татьяна", "Елена", "Наталья", "Ирина", "Ксения", "Светлана", "Юлия", "Марина"];
const LAST = ["Иванов", "Петров", "Смирнов", "Кузнецов", "Попов", "Соколов", "Козлов", "Новиков", "Морозов", "Зайцев", "Павлов", "Семёнов"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function randomAuthor(seed: string): string {
  const female = (hash(seed + "g") % 2) === 0;
  const first = (female ? FIRST_F : FIRST_M)[hash(seed) % (female ? FIRST_F : FIRST_M).length];
  const last = LAST[hash(seed + "l") % LAST.length] + (female ? "а" : "");
  return `${first} ${last[0]}.`;
}

function pickReviews(staffId: string, n: number): ReviewTemplate[] {
  const out: ReviewTemplate[] = [];
  const used = new Set<number>();
  for (let i = 0; i < n; i++) {
    let idx = hash(staffId + "-" + i) % POOL.length;
    let tries = 0;
    while (used.has(idx) && tries < POOL.length) {
      idx = (idx + 1) % POOL.length;
      tries++;
    }
    used.add(idx);
    out.push(POOL[idx]);
  }
  return out;
}

async function main() {
  const staff = await prisma.fnsStaff.findMany({ select: { id: true } });
  console.log(`Seeding reviews for ${staff.length} staff members…`);

  // Чистим только seed-отзывы.
  const removed = await prisma.fnsStaffReview.deleteMany({ where: { source: "seed" } });
  console.log(`Removed previous seed reviews: ${removed.count}`);

  const reviewsToInsert: Parameters<typeof prisma.fnsStaffReview.createMany>[0]["data"] = [];

  for (const s of staff) {
    // Распределение количества отзывов: 0 (15%), 1-2 (35%), 3-5 (50%).
    const r = hash(s.id + "n") % 100;
    let n: number;
    if (r < 15) n = 0;
    else if (r < 50) n = 1 + (hash(s.id + "n2") % 2);
    else n = 3 + (hash(s.id + "n3") % 3);
    if (n === 0) continue;

    const picks = pickReviews(s.id, n);
    for (let i = 0; i < picks.length; i++) {
      const p = picks[i];
      reviewsToInsert.push({
        staffId: s.id,
        userId: null,
        authorName: randomAuthor(s.id + "-" + i),
        rating: p.rating,
        text: p.text,
        source: "seed",
        createdAt: new Date(Date.now() - (hash(s.id + "-d-" + i) % (300 * 24 * 60 * 60 * 1000))),
      });
    }
  }

  console.log(`Inserting ${reviewsToInsert.length} reviews…`);
  // Большой createMany — батчим по 1000.
  for (let i = 0; i < reviewsToInsert.length; i += 1000) {
    await prisma.fnsStaffReview.createMany({
      data: reviewsToInsert.slice(i, i + 1000),
    });
  }

  // Пересчёт кэшей. Делаем raw SQL — быстрее.
  console.log("Refreshing cached aggregates…");
  await prisma.$executeRawUnsafe(`
    UPDATE fns_staff SET
      cached_avg_rating = sub.avg_rating,
      cached_reviews_count = sub.cnt
    FROM (
      SELECT staff_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS cnt
      FROM fns_staff_reviews GROUP BY staff_id
    ) sub
    WHERE fns_staff.id = sub.staff_id
  `);
  // Сотрудников без отзывов — обнуляем кэш.
  await prisma.$executeRawUnsafe(`
    UPDATE fns_staff SET cached_avg_rating = NULL, cached_reviews_count = 0
    WHERE id NOT IN (SELECT DISTINCT staff_id FROM fns_staff_reviews)
  `);

  const stats: Array<{ withReviews: bigint; total: bigint }> = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(*) FROM fns_staff WHERE cached_reviews_count > 0) AS "withReviews",
      (SELECT COUNT(*) FROM fns_staff) AS total
  `;
  console.log(`Done. ${stats[0].withReviews}/${stats[0].total} staff have reviews.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
