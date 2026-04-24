# P2PTax — Product Context

**Product**: Marketplace для налоговых специалистов в России. Соединяет клиентов получивших требования/уведомления ФНС с практиками налогового консультирования.

**Domain**: Налоговый консалтинг по трём каноническим видам проверок (ФНС). Не юридические услуги в целом. Не финансовые консультации. Не бухгалтерия. Только налоговые проверки и сопутствующие процедуры ФНС.

**Target users**:
- **CLIENT (primary emotional driver)**: Русский гражданин / ИП / представитель юрлица, который только что получил уведомление/требование ФНС. Emotional state: паника + растерянность + страх штрафов и блокировок. Не tech-savvy. Не юрист. Нужен trust и чёткий next step.
- **SPECIALIST**: Практикующий налоговый консультант с опытом в камеральных, выездных или оперативных проверках. Часто бывшие сотрудники ФНС (ex-инспекторы). Ищет клиентов напрямую, без юридических фирм-посредников.
- **ADMIN**: Платформенный модератор — управляет пользователями, городами/ФНС, правилами модерации, настройками системы.
- **GUEST**: Неавторизованный посетитель — может смотреть публичные заявки и каталог специалистов, не видит контактов.

**Value proposition**: «Специалисты по вашей ФНС. Не юристы из интернета.» Практики с опытом решают реальные проблемы налоговых проверок напрямую с клиентом. Бесплатно для клиента и специалиста в MVP. Без подписок, без комиссий, без premium.

**Emotional goal**: перевести клиента из состояния «паника: пришло требование ФНС» в «я в нормальных руках, специалист уже ответил».

**Visual direction**: fintech-trust × professional-services. References: Stripe (dashboard rigor), Wealthfront (calm reassurance tone), Airbnb (specialist listings + profiles), Linear (crisp typography and density). **Не** consumer-app, **не** social network, **не** e-commerce. Primary palette: navy/blue trust accent `#2256c2`, white/slate neutrals, emerald for success/online, amber for warnings/urgency, red for critical (штрафы/блокировки).

**Locale**: Russian primary. Без корпоративного жаргона. Прямо и человечно. «Вы» formal. Без англицизмов где есть русский эквивалент. Без bro-copy, без шуток — люди в стрессе.

**Expected content on all screens**:
- 3 канонические услуги (из SA `services` table): **Выездная проверка**, **Камеральная проверка**, **Отдел оперативного контроля**.
- Города РФ (seeded list) + ИФНС (до ~210 офисов, relation city_has_many fns_offices).
- Специалисты: имя, опыт, город(а), ФНС (по которым работает), услуги, phone/telegram/whatsapp (public для авторизованных), office address, working hours.
- Заявки: title, city, ФНС, service, description, status (active / closing_soon / closed), threads count.
- Threads: 1:1 диалоги client ↔ specialist, SA daily limit 20 threads/day для specialist.

**FORBIDDEN content** (эти вещи killed in MVP per SA):
- **Rating/reviews/stars** — MVP stub only. Клиент **не получает** отзывы. Специалист тоже без публичного rating пока (будет в post-MVP).
- **Payment UI / Premium / Subscription / Commission** — MVP полностью бесплатный. Никаких платёжных шлюзов, никаких pricing plans.
- **Push-уведомления UI** — MVP email-only. Никаких push toggles в настройках.
- **Response entity** — упразднён. Нет «Откликнуться», «Принять отклик», «Новый отклик» в UI и копии. Thread открывается сразу как только specialist пишет первое сообщение.
- **Неканонические услуги** — «Споры с ИФНС», «Зарубежные счета», «Самозанятые», «115-ФЗ», «Регионы ФНС» как отдельные категории = content-relevance bug. Только 3 канона.
- **Fake marketing numbers** — «128 специалистов» / «210 специалистов» при реальном seed 18 = trust-killer.
- **Dating/social-app patterns** — swipe matching, romantic copy, broad consumer tone.
- **E-commerce patterns** — cart, checkout, купить в один клик. Это сервисный marketplace, не магазин.

**Key business rules (from SA, non-negotiable)**:
- **Guest**: смотрит публичные заявки + каталог + профили. НЕ видит контактов, НЕ пишет, НЕ создаёт заявки.
- **Client**: создаёт заявки (лимит default 5), читает messages от специалистов, отвечает, закрывает свои заявки. **НЕ** пишет первым specialists по чужим заявкам.
- **Specialist**: пишет client'у по публичной заявке (создаёт thread, лимит 20/день), ведёт переписку, управляет профилем. **НЕ** создаёт заявки, **НЕ** видит private-данные других specialists.
- **Admin**: всё выше + блокировка/разблокировка users, CRUD городов/ФНС, modification rules, limit_requests editor.
- **Notifications**: только email (SMTP/Resend). События: NEW_MESSAGE_FROM_SPECIALIST, NEW_MESSAGE, REQUEST_CLOSING_SOON (27 days inactivity), REQUEST_CLOSED.
- **Files**: MinIO S3-compatible bucket. Avatar up to 5 MB jpg/png/webp. Documents/chat attachments up to 10 MB pdf/jpg/png.
- **Requests auto-close** на 30 days неактивности. Predupreshenie клиенту за 3 days (SA: REQUEST_CLOSING_SOON).

**Design system principles**:
- Dark-mode возможен как optional theme, но primary = light (fintech trust reads better on white).
- Spacing scale: 4/8/12/16/24/32/48/64 tokens only.
- Typography: H1 32-56px (hero), H2 32-40px (sections), H3 20-24px, body 16px, small 14px, caption 12px. Manrope / Inter / system sans-serif.
- Role-signalling: subtle accent color per role — client=blue (default), specialist=emerald, admin=amber. Chrome остаётся нейтральным.
- Components barrel: `components/ui/`, `components/layout/`, `components/landing/`, `components/dashboard/`, `components/specialist/`, `components/filters/`.

**Key differentiators**:
- Прямой контакт client ↔ specialist без интермедиаров (нет юридической фирмы между).
- Ex-ФНС специалисты (если заявлено) = unique credibility.
- Три канона услуг = clear scope, не "всё подряд".
- Бесплатный MVP для обоих сторон = низкий барьер.
- ФНС-специфичный матчинг (city + inspection number + service type).

sa_schema: cmnw5361i000czmerbi780b2j
