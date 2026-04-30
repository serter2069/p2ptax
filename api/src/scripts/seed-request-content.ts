/**
 * seed-request-content.ts
 * Updates request descriptions to realistic tax content and attaches test files via MinIO.
 * Run: cd ~/Documents/Projects/p2ptax && doppler run -- npx ts-node scripts/seed-request-content.ts
 */

import * as Minio from 'minio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// MinIO setup (mirrors api/src/lib/minio.ts)
function parseS3Endpoint(raw: string): { endPoint: string; port: number; useSSL: boolean } {
  try {
    const u = new URL(raw);
    return {
      endPoint: u.hostname,
      port: u.port ? parseInt(u.port, 10) : (u.protocol === 'https:' ? 443 : 80),
      useSSL: u.protocol === 'https:',
    };
  } catch {
    return { endPoint: raw, port: 9000, useSSL: false };
  }
}

const rawEndpoint = process.env.MINIO_ENDPOINT || process.env.HETZNER_S3_ENDPOINT;
const { endPoint, port, useSSL } = rawEndpoint
  ? parseS3Endpoint(rawEndpoint)
  : { endPoint: 'localhost', port: 9000, useSSL: false };

const minioClient = new Minio.Client({
  endPoint,
  port,
  useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY || process.env.HETZNER_S3_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || process.env.HETZNER_S3_SECRET_KEY || 'minioadmin',
});

const MINIO_BUCKET = process.env.MINIO_BUCKET || process.env.HETZNER_S3_BUCKET || 'p2ptax';

const TARGET_EMAIL = 'serter2069@gmail.com';

// Realistic descriptions per request title (3-5 sentences each)
const REALISTIC_DESCRIPTIONS: Record<string, string> = {
  'Разблокировка счёта по 115-ФЗ в Тинькофф':
    'Тинькофф заблокировал расчётный счёт ИП 12 апреля 2024 года по подозрению в сомнительных операциях в рамках 115-ФЗ. ' +
    'Банк направил запрос о предоставлении документов, подтверждающих экономический смысл поступлений на сумму 2,8 млн рублей за I квартал 2024 года. ' +
    'Основные поступления — оплата по договорам с тремя контрагентами (ООО «Альфа-Строй», ООО «ТехноСервис», ИП Кузнецов А.В.). ' +
    'Срок для предоставления пояснений истекает 20 апреля 2024 года, после чего банк вправе расторгнуть договор. ' +
    'Требуется срочная помощь в составлении мотивированного ответа и подборе доказательной базы.',

  'Ответ на требование ИФНС о пояснениях':
    'ИФНС №28 по г. Москве направила требование о представлении пояснений №12-08/4571 от 05.04.2024 в рамках камеральной налоговой проверки декларации 3-НДФЛ за 2023 год. ' +
    'Инспекция запрашивает обоснование расхождений между доходами, задекларированными по форме 3-НДФЛ, и сведениями, поступившими от налоговых агентов (брокеры IBKR и Тинькофф Инвестиции). ' +
    'Расхождение составляет 387 000 рублей и связано с особенностями конвертации валютных дивидендов на дату получения. ' +
    'Срок ответа на требование — 10 апреля 2024 года (5 рабочих дней с момента получения). ' +
    'Необходима помощь в подготовке юридически грамотных пояснений со ссылками на НК РФ и приложением подтверждающих расчётов.',

  'Жалоба в УФНС на решение инспекции':
    'ИФНС №15 по Санкт-Петербургу вынесла решение №17-25/3812 от 01.03.2024 о привлечении к ответственности за налоговое правонарушение. ' +
    'По результатам камеральной проверки декларации по УСН за 2022 год доначислено 214 000 рублей налога, 38 520 рублей пени и 42 800 рублей штрафа. ' +
    'Основание — инспекция отказала в признании расходов на аренду офиса и IT-оборудование, квалифицировав их как экономически необоснованные. ' +
    'Апелляционная жалоба в УФНС по Санкт-Петербургу должна быть подана до вступления решения в силу — не позднее 01.04.2024. ' +
    'Требуется подготовка апелляционной жалобы с правовым обоснованием правомерности учтённых расходов.',

  'НДФЛ с продажи апартаментов — нюансы 2024':
    'В октябре 2023 года были проданы апартаменты в ЖК «Москва-Сити» общей площадью 54 кв.м за 18,5 млн рублей. ' +
    'Объект находился в собственности с ноября 2018 года (4 года и 11 месяцев), что не достигает 5-летнего минимального срока владения, применяемого к апартаментам как к нежилым помещениям. ' +
    'Кадастровая стоимость на 1 января 2023 года составила 22,3 млн рублей, что превышает цену продажи — применяется расчёт от 70% кадастровой стоимости (15,61 млн руб.). ' +
    'Необходимо определить оптимальный способ уменьшения налоговой базы: имущественный вычет (1 млн руб.) или фактические расходы на приобретение (договор 2018 года). ' +
    'Требуется помощь в подготовке декларации 3-НДФЛ за 2023 год и расчёте итоговой суммы налога к уплате.',

  'Доначисление НДС по итогам выездной проверки':
    'ИФНС №9 по г. Москве провела выездную налоговую проверку ООО «ПромТехника» за период 2021–2023 годов. ' +
    'По результатам проверки составлен акт №09-12/1847 от 15.03.2024, в котором предложено доначислить НДС в размере 1 240 000 рублей по взаимоотношениям с тремя контрагентами, признанными налоговым органом «техническими» компаниями. ' +
    'Инспекция применила доктрину необоснованной налоговой выгоды (ст. 54.1 НК РФ), указав на отсутствие реального исполнения сделок. ' +
    'Срок подачи возражений на акт проверки — 30 апреля 2024 года (1 месяц с момента вручения акта). ' +
    'Требуется подготовка мотивированных возражений с доказательствами реальности сделок и участие представителя при рассмотрении материалов проверки.',
};

// Test file contents
const TEST_FILES = [
  {
    filename: 'Требование_ФНС_12-08-4571.txt',
    mimeType: 'text/plain',
    content: Buffer.from(
      'ТРЕБОВАНИЕ О ПРЕДСТАВЛЕНИИ ПОЯСНЕНИЙ\n' +
      '№ 12-08/4571 от 05.04.2024\n\n' +
      'ИФНС России №28 по г. Москве сообщает следующее.\n\n' +
      'В соответствии со ст. 88 НК РФ при проведении камеральной налоговой проверки\n' +
      'декларации по форме 3-НДФЛ за 2023 год (рег. №77-00-03/01234567)\n' +
      'выявлены следующие противоречия:\n\n' +
      '1. Сумма дохода, указанная в декларации: 2 145 000 руб.\n' +
      '2. Сумма дохода по сведениям налоговых агентов: 2 532 000 руб.\n' +
      '3. Расхождение: 387 000 руб.\n\n' +
      'Требуем в течение 5 рабочих дней представить пояснения по указанным расхождениям\n' +
      'либо представить уточнённую налоговую декларацию.\n\n' +
      'Начальник отдела камеральных проверок\n' +
      'Петрова И.С.\n\n' +
      'Дата вручения требования: 05.04.2024',
      'utf-8'
    ),
  },
  {
    filename: 'Акт_выездной_проверки_09-12-1847.txt',
    mimeType: 'text/plain',
    content: Buffer.from(
      'АКТ НАЛОГОВОЙ ПРОВЕРКИ\n' +
      '№ 09-12/1847 от 15.03.2024\n\n' +
      'Вид проверки: Выездная налоговая проверка\n' +
      'Налогоплательщик: ООО «ПромТехника» (ИНН 7709876543)\n' +
      'Проверяемый период: 01.01.2021 – 31.12.2023\n\n' +
      'УСТАНОВЛЕНО:\n\n' +
      'В нарушение п. 1 ст. 54.1 НК РФ налогоплательщик необоснованно применил\n' +
      'налоговые вычеты по НДС по счетам-фактурам следующих контрагентов:\n\n' +
      '1. ООО «Технострой» (ИНН 7701234567) — сумма НДС 520 000 руб.\n' +
      '2. ООО «МегаПоставка» (ИНН 7712345678) — сумма НДС 410 000 руб.\n' +
      '3. ООО «ТрансЛогик» (ИНН 7723456789) — сумма НДС 310 000 руб.\n\n' +
      'Итого доначислен НДС: 1 240 000 руб.\n' +
      'Пени: 186 000 руб.\n' +
      'Штраф (ст. 122 НК РФ): 248 000 руб.\n\n' +
      'Срок представления возражений: 30.04.2024\n\n' +
      'Руководитель проверяющей группы: Иванов А.В.',
      'utf-8'
    ),
  },
  {
    filename: 'Решение_ИФНС_17-25-3812.txt',
    mimeType: 'text/plain',
    content: Buffer.from(
      'РЕШЕНИЕ\n' +
      'о привлечении к ответственности за совершение налогового правонарушения\n' +
      '№ 17-25/3812 от 01.03.2024\n\n' +
      'ИФНС России №15 по г. Санкт-Петербургу,\n' +
      'рассмотрев материалы камеральной налоговой проверки\n' +
      'декларации по УСН за 2022 год ИП Смирнова Д.К. (ИНН 781234567890),\n\n' +
      'РЕШИЛА:\n\n' +
      '1. Привлечь к ответственности за совершение налогового правонарушения.\n\n' +
      '2. Доначислить:\n' +
      '   - Налог по УСН: 214 000 руб.\n' +
      '   - Пени: 38 520 руб.\n' +
      '   - Штраф (п. 1 ст. 122 НК РФ): 42 800 руб.\n\n' +
      'Основание: расходы на аренду офиса и IT-оборудование (ст. 346.16 НК РФ)\n' +
      'признаны экономически необоснованными.\n\n' +
      'Апелляционная жалоба: в УФНС по г. Санкт-Петербургу до 01.04.2024.\n\n' +
      'Начальник ИФНС №15: Козлов В.Н.',
      'utf-8'
    ),
  },
];

async function ensureBucket(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(MINIO_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(MINIO_BUCKET);
      console.log(`Created bucket: ${MINIO_BUCKET}`);
    }
  } catch (err) {
    console.warn('MinIO bucket check failed (continuing without attachments):', (err as Error).message);
    throw err;
  }
}

async function uploadFile(file: { filename: string; mimeType: string; content: Buffer }): Promise<string> {
  const key = `documents/seed/${Date.now()}-${file.filename}`;
  await minioClient.putObject(MINIO_BUCKET, key, file.content, file.content.length, {
    'Content-Type': file.mimeType,
  });
  return `/${MINIO_BUCKET}/${key}`;
}

async function main() {
  console.log('=== seed-request-content.ts ===\n');

  // 1. Find target user
  const user = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true, email: true, firstName: true },
  });

  if (!user) {
    throw new Error(`User ${TARGET_EMAIL} not found`);
  }
  console.log(`User: ${user.firstName} (${user.id})`);

  // 2. Get all requests
  const requests = await prisma.request.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\nFound ${requests.length} requests:`);
  requests.forEach((r) => console.log(`  [${r.status}] ${r.title} (${r.id})`));

  // 3. Update descriptions to realistic content
  console.log('\n--- Updating descriptions ---');
  let updatedCount = 0;
  for (const req of requests) {
    const newDesc = REALISTIC_DESCRIPTIONS[req.title];
    if (!newDesc) {
      // Generate a generic realistic description for unknown titles
      const genericDesc =
        `Запрос касается налогового спора в рамках контрольных мероприятий ФНС. ` +
        `Налоговый орган выставил требование о предоставлении документов и пояснений по финансово-хозяйственной деятельности. ` +
        `Имеются признаки нарушения норм налогового законодательства, требующие немедленного реагирования и профессиональной оценки. ` +
        `Необходима консультация опытного налогового специалиста для выработки правовой позиции и подготовки ответных документов.`;
      await prisma.request.update({
        where: { id: req.id },
        data: { description: genericDesc },
      });
      console.log(`  Updated (generic): "${req.title}"`);
    } else {
      await prisma.request.update({
        where: { id: req.id },
        data: { description: newDesc },
      });
      console.log(`  Updated: "${req.title}"`);
    }
    updatedCount++;
  }
  console.log(`Updated ${updatedCount} descriptions.`);

  // 4. Attach test files to 3 requests (pick the first 3 with real content)
  console.log('\n--- Attaching test files via MinIO ---');
  const targetRequests = requests.slice(0, 3);

  let minioOk = true;
  try {
    await ensureBucket();
  } catch {
    minioOk = false;
    console.warn('MinIO unavailable — skipping file attachments.');
  }

  if (minioOk) {
    for (let i = 0; i < targetRequests.length; i++) {
      const req = targetRequests[i];
      const fileSpec = TEST_FILES[i];
      if (!fileSpec) continue;

      try {
        const fileUrl = await uploadFile(fileSpec);
        const fileRecord = await prisma.file.create({
          data: {
            entityType: 'request',
            entityId: req.id,
            url: fileUrl,
            filename: fileSpec.filename,
            size: fileSpec.content.length,
            mimeType: fileSpec.mimeType,
            requestId: req.id,
          },
        });
        console.log(`  Attached "${fileSpec.filename}" to request "${req.title}" (File.id=${fileRecord.id})`);
      } catch (err) {
        console.error(`  Failed to attach file to "${req.title}":`, (err as Error).message);
      }
    }
  }

  // 5. Summary
  const filesInDb = await prisma.file.count({ where: { entityType: 'request', requestId: { in: targetRequests.map((r) => r.id) } } });
  console.log(`\nDone. ${updatedCount} descriptions updated. ${filesInDb} file records in DB.`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
