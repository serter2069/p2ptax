# P2PTax — Product Context

**Product**: Marketplace для налоговых специалистов в России. Соединяет клиентов получивших требования/уведомления ФНС с практиками налогового консультирования.

**Domain**: Налоговый консалтинг по трём каноническим видам проверок (ФНС). Не юридические услуги в целом. Не финансовые консультации. Не бухгалтерия. Только налоговые проверки и сопутствующие процедуры ФНС.

**Target users** (Iter11 — role unification):

Роли в БД теперь 3: `GUEST / USER / ADMIN`. Роль `SPECIALIST` отдельно больше не существует — вместо этого у пользователя есть opt-in флаг `isSpecialist` + `specialistProfileCompletedAt`. Это позволяет специалисту одновременно быть клиентом (т.е. создавать собственные запросы про налоги), убирает искусственное дублирование UI и двух дашбордов.

- **USER (primary)**: Любой авторизованный человек. Emotional driver для большинства — русский гражданин / ИП / представитель юрлица, который только что получил уведомление/требование ФНС. Паника + растерянность + страх штрафов и блокировок. Не tech-savvy. Не юрист. Нужен trust и чёткий next step.
  - **USER с `isSpecialist=true` (sub-mode «специалист»)**: Практикующий налоговый консультант с опытом в камеральных, выездных или оперативных проверках. Часто бывшие сотрудники ФНС (ex-инспекторы). Ищет клиентов напрямую, без юридических фирм-посредников. **Opportunity (Iter11)**: может сам создавать запросы — раньше было запрещено, теперь специалист тоже человек, может получить требование ФНС на свой личный ИНН.
  - **USER с `isSpecialist=false`**: «Обычный клиент». Ищет специалиста по своей ФНС. Не видит публичного фида лидов.
- **ADMIN**: Платформенный модератор — управляет пользователями, городами/ФНС, правилами модерации, настройками системы.
- **GUEST**: Неавторизованный посетитель — может смотреть публичные запросы и каталог специалистов, не видит контактов.

**Value proposition**: «Специалисты по вашей ФНС. Не юристы из интернета.» Практики с опытом решают реальные проблемы налоговых проверок напрямую с клиентом. Бесплатно для клиента и специалиста в MVP. Без подписок, без комиссий, без premium.

**Emotional goal**: перевести клиента из состояния «паника: пришло требование ФНС» в «я в нормальных руках, специалист уже ответил».

**Visual direction**: fintech-trust × professional-services. References: Stripe (dashboard rigor), Wealthfront (calm reassurance tone), Airbnb (specialist listings + profiles), Linear (crisp typography and density). **Не** consumer-app, **не** social network, **не** e-commerce. Primary palette: navy/blue trust accent `#2256c2`, white/slate neutrals, emerald for success/online, amber for warnings/urgency, red for critical (штрафы/блокировки).

**Locale**: Russian primary. Без корпоративного жаргона. Прямо и человечно. «Вы» formal. Без англицизмов где есть русский эквивалент. Без bro-copy, без шуток — люди в стрессе.

**Expected content on all screens**:
- 3 канонические услуги (из SA `services` table): **Выездная проверка**, **Камеральная проверка**, **Отдел оперативного контроля**.
- Города РФ (seeded list) + ИФНС (до ~210 офисов, relation city_has_many fns_offices).
- Специалисты: имя, опыт, город(а), ФНС (по которым работает), услуги, phone/telegram/whatsapp (public для авторизованных), office address, working hours.
- Запросы: title, city, ФНС, service, description, status (active / closing_soon / closed), threads count.
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

**Key business rules (from SA, non-negotiable)** — обновлено после Iter11 role-unification:
- **Guest**: смотрит публичные запросы + каталог + профили. НЕ видит контактов, НЕ пишет, НЕ создаёт запросы.
- **USER (все авторизованные)**: создаёт запросы (лимит default 5), читает messages от специалистов, отвечает, закрывает свои запросы. **НЕ** пишет первым specialists по чужим запросам (если `isSpecialist=false`).
- **USER + isSpecialist=true** (и `specialistProfileCompletedAt != null`): всё что USER + пишет клиенту по публичному запросу (создаёт thread, лимит 20/день), ведёт переписку, управляет профилем специалиста, видит публичный фид лидов. **Не** видит private-данные других specialists. В отличие от старой схемы — специалист теперь **может** создавать собственные запросы (он тоже может получить требование ФНС на свой ИНН).
- **Admin**: всё выше + блокировка/разблокировка users, CRUD городов/ФНС, modification rules, limit_requests editor.
- **Исключение в каталоге**: пользователь не видит себя в `/api/specialists` (если сам специалист) — нельзя связаться самому с собой.
- **Notifications**: только email (SMTP/Resend). События: NEW_MESSAGE_FROM_SPECIALIST, NEW_MESSAGE, REQUEST_CLOSING_SOON (27 days inactivity), REQUEST_CLOSED.
- **Files**: MinIO S3-compatible bucket. Avatar up to 5 MB jpg/png/webp. Documents/chat attachments up to 10 MB pdf/jpg/png.
- **Requests auto-close** на 30 days неактивности. Predupreshenie клиенту за 3 days (SA: REQUEST_CLOSING_SOON).

**Design system principles**:
- Dark-mode возможен как optional theme, но primary = light (fintech trust reads better on white).
- Spacing scale: 4/8/12/16/24/32/48/64 tokens only.
- Typography: H1 32-56px (hero), H2 32-40px (sections), H3 20-24px, body 16px, small 14px, caption 12px. Manrope / Inter / system sans-serif.
- Role-signalling: subtle accent color per role — USER non-specialist=blue (default), USER isSpecialist=emerald, admin=amber. Chrome остаётся нейтральным. Для специалиста, который одновременно просматривает свою личный запрос как клиент, accent может мягко переключаться по контексту страницы (решение дизайна в PR 2 UI-merge).
- Components barrel: `components/ui/`, `components/layout/`, `components/landing/`, `components/dashboard/`, `components/specialist/`, `components/filters/`.

**Key differentiators**:
- Прямой контакт client ↔ specialist без интермедиаров (нет юридической фирмы между).
- Ex-ФНС специалисты (если заявлено) = unique credibility.
- Три канона услуг = clear scope, не "всё подряд".
- Бесплатный MVP для обоих сторон = низкий барьер.
- ФНС-специфичный матчинг (city + inspection number + service type).

sa_schema: cmnw5361i000czmerbi780b2j
