/**
 * Сид-заглушка отзывов «как с Я.Карт». На каждую ИФНС раскидываем
 * 3-5 случайных отзывов из общего пула, считаем средний рейтинг и
 * пишем его в `yandexRating` + `yandexReviewsCount` у FnsOffice.
 *
 * Это рыба для UI/SEO — заменится на реальные данные, когда
 * подключим Геопоиск или соберём свои отзывы от пользователей
 * платформы. source='yandex_maps_seed' помечает их как фейковые.
 *
 * Запуск (идемпотентно: пересоздаёт записи только source=yandex_maps_seed):
 *   npx tsx prisma/seed-fns-reviews.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ReviewTemplate {
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
}

// Пул реалистичных отзывов про ИФНС. Смещение в сторону 3-5,
// потому что на Я.Картах у ИФНС обычно средний рейтинг 3.0-4.2.
const REVIEW_POOL: ReviewTemplate[] = [
  { rating: 5, text: "Очень помогли с возвратом НДФЛ за обучение. Сотрудник на приёме всё разъяснил, заявление обработали быстрее, чем ожидала. Спасибо!" },
  { rating: 5, text: "Удобно, что заработал электронный кабинет — большую часть вопросов решаю не выходя из дома. Если приходишь в инспекцию — записывайся через сайт, очередей почти нет." },
  { rating: 4, text: "В целом нормальная инспекция. По телефону горячей линии не дозвониться, но если приехать лично — всё решают в день обращения. Парковка маленькая." },
  { rating: 4, text: "Регистрировал ИП — всё прошло без замечаний. Девушка в окне регистрации помогла исправить заявление, не стали отправлять на пересдачу. Рекомендую." },
  { rating: 3, text: "Обычная налоговая. Очереди есть, особенно перед сроками сдачи отчётности. Сотрудники компетентные, но иногда холодно общаются. Лучше идти с готовыми вопросами." },
  { rating: 3, text: "Отчётность приняли с замечанием, пришлось переделывать и приезжать ещё раз. Записаться на повторный приём не смог — терминал не работал. В итоге простоял в живой очереди 1.5 часа." },
  { rating: 2, text: "Очень долго рассматривали моё заявление по налоговому вычету. Звонил, писал — отписки. Через 4 месяца получил отказ с формулировкой, которую невозможно расшифровать. Пришлось обращаться к специалисту." },
  { rating: 4, text: "Открывал расчётный счёт, попросили подтверждение по налогам. Получил справку об отсутствии задолженности за 1 рабочий день. Молодцы." },
  { rating: 5, text: "Снимаю минус, который ставил в прошлом году — всё перестроили, поставили электронные талоны, добавили окна для физлиц. Стало намного быстрее." },
  { rating: 4, text: "Помогли разобраться с уведомлением о земельном налоге — оказалось, ошибка в кадастровой стоимости. Перерасчёт сделали в течение месяца." },
  { rating: 2, text: "Закрытое отделение по будням после 17:00 — это удобно?? Работающим людям приходится отпрашиваться. Электронные сервисы тоже не всё закрывают." },
  { rating: 3, text: "По НДС всё чётко — камеральные проверки проводят грамотно. По физическим лицам — хаос: разные сотрудники говорят разные вещи." },
  { rating: 5, text: "Спасибо инспектору, который объяснил мне, что моя ИП-упрощёнка может стать самозанятостью — сэкономил кучу денег. Не каждый сотрудник так делает, обычно отвечают сухо «по регламенту»." },
  { rating: 4, text: "Через нотариуса подавал документы по наследству — налоговая обработала быстро, никаких лишних запросов. Спасибо за чёткую работу." },
  { rating: 3, text: "Здание хорошее, парковка — никакая. Электронная очередь периодически подвешивается, но талоны всё равно работают." },
];

const FIRST_NAMES_M = ["Александр", "Михаил", "Дмитрий", "Сергей", "Андрей", "Алексей", "Иван", "Артём", "Николай"];
const FIRST_NAMES_F = ["Анна", "Мария", "Ольга", "Татьяна", "Елена", "Наталья", "Ирина", "Ксения", "Светлана"];
const LAST_NAMES = ["Иванов", "Петров", "Смирнов", "Кузнецов", "Попов", "Соколов", "Лебедев", "Козлов", "Новиков", "Волков"];

function randomAuthor(): string {
  const female = Math.random() < 0.55;
  const first = (female ? FIRST_NAMES_F : FIRST_NAMES_M)[Math.floor(Math.random() * 9)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)] + (female ? "а" : "");
  return `${first} ${last[0]}.`;
}

function randomDateInPastYear(): Date {
  const now = Date.now();
  const yearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const ts = yearAgo + Math.random() * (now - yearAgo);
  return new Date(ts);
}

function pickReviews(n: number): ReviewTemplate[] {
  const pool = [...REVIEW_POOL];
  const out: ReviewTemplate[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}

async function main() {
  const fns = await prisma.fnsOffice.findMany({
    select: { id: true, code: true },
  });
  console.log(`Seeding reviews for ${fns.length} FNS…`);

  let totalReviews = 0;
  let i = 0;
  for (const f of fns) {
    // Стираем старые сид-отзывы (чтобы при повторном прогоне получить
    // свежий random разброс, не дублируя записи).
    await prisma.fnsReview.deleteMany({
      where: { fnsId: f.id, source: "yandex_maps_seed" },
    });

    const n = 3 + Math.floor(Math.random() * 3); // 3..5
    const picks = pickReviews(n);

    await prisma.fnsReview.createMany({
      data: picks.map((p) => ({
        fnsId: f.id,
        authorName: randomAuthor(),
        rating: p.rating,
        text: p.text,
        source: "yandex_maps_seed",
        reviewDate: randomDateInPastYear(),
      })),
    });

    const avg = picks.reduce((s, p) => s + p.rating, 0) / picks.length;
    await prisma.fnsOffice.update({
      where: { id: f.id },
      data: {
        yandexRating: Math.round(avg * 10) / 10,
        yandexReviewsCount: picks.length,
        yandexUpdatedAt: new Date(),
      },
    });

    totalReviews += picks.length;
    i++;
    if (i % 100 === 0) console.log(`  ${i}/${fns.length} (${totalReviews} reviews so far)`);
  }
  console.log(`Done. Reviews seeded: ${totalReviews} across ${fns.length} ИФНС.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
