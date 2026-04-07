# P2PTax (Налоговик) — UC Document

## Версия: 1.0 | Дата: 2026-04-03 | Источник: Reverse Audit + Collegium

---

# AUTH

## UC-001: Авторизация через Email+OTP

**Актор:** PUBLIC
**Цель:** Войти в систему или зарегистрироваться, используя email и одноразовый код

**Основной поток:**
1. Пользователь вводит email на экране `(auth)/email.tsx`
2. `POST /auth/request-otp { email }` — нормализация email, проверка throttle
3. Генерация 6-значного кода (dev: всегда 000000), сохранение с TTL 10 минут
4. Отправка кода на email (или лог в консоль при DEV_AUTH=true)
5. Пользователь вводит код на экране `(auth)/otp.tsx`
6. `POST /auth/verify-otp { email, code, role? }` — верификация
7. При новом пользователе — создание User записи; при существующем — обновление lastLoginAt
8. Возврат `{ accessToken (15m), refreshToken (30d), isNewUser, user }`

**Альтернативные потоки:**
- E1: >= 3 failed attempts → 429 "Too many OTP attempts"
- E2: OTP не найден/истёк → 400
- E3: Неверный код → инкремент attempts, 401

**Бизнес-правила:**
- Rate limit: 3 req/5min per EMAIL на request-otp (EmailThrottlerGuard — по email, не IP)
- 10 req/5min на verify-otp
- Refresh token rotation: каждый refresh = revoke старого + новый токен

**UI состояния:**
- **Loading (email.tsx):** кнопка "Получить код" — спиннер, disabled
- **Loading (otp.tsx):** кнопка "Войти" — спиннер, disabled
- **Error (email.tsx):** красный текст: "Введите корректный email" / ApiError.message / "Не удалось отправить код. Попробуйте снова."
- **Error (otp.tsx):** красный текст + красный border боксов; "Попытка N из 3"
- **Success (email):** redirect на OTP; **(otp):** redirect по роли
- **Resend:** 60 сек countdown, затем "Отправить код повторно"
- **Dev:** плашка "DEV: код — 000000"

**Валидация:**
- Client email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` → "Введите корректный email"
- Client otp: 6 цифр, auto-submit при 6-й; "Введите все 6 цифр кода"
- Server: `@IsEmail()`, `@Length(6,6)` code, `@IsIn(['client','specialist'])` role
- РАСХОЖДЕНИЕ: UC TTL=10мин — код 15мин; UC 3 attempts — код 5
- Throttle request-otp: 3/15min email + 10/15min IP; verify-otp: 10/5min email
- Blocked user: 403 "Аккаунт заблокирован"

**Уведомления:**
- OTP email: "Ваш код для входа — Налоговик" / "Ваш код: {code}, действителен 10 минут"
- DEV_AUTH=true: OTP=000000, лог, без email

**Edge cases:**
- Двойной клик → disabled; auto-submit; paste 6 цифр; последний неиспользованный OTP
- Pending quick request (UC-079): secureStorage → автосоздание; OTP lock-out >= 5; otp без email → redirect

**Responsive:** maxWidth 430; iOS padding / Android height

**Acceptance criteria:**
- AC-01: Валидный email → OTP экран
- AC-02: Невалидный → клиентская ошибка
- AC-03: Правильный OTP → токены + redirect
- AC-04: Неправильный → "Попытка N из 3"
- AC-05: 5 попыток → 429
- AC-06: Resend через 60с
- AC-07: Rate limit → 429
- AC-08: Blocked → 403

---

## UC-002: Выбор роли при первом входе

**Актор:** PUBLIC (новый пользователь)
**Цель:** Определить роль — CLIENT или SPECIALIST

**Основной поток:**
1. После UC-001 с `isNewUser=true` → redirect на `(auth)/role.tsx`
2. Пользователь выбирает роль
3. Роль передаётся через `PATCH /users/me { role }`

**Бизнес-правила:**
- Роль назначается однократно
- Если role задана при вызове verify-otp — экран роли пропускается

**UI состояния:**
- **Loading:** ActivityIndicator внутри выбранной карточки (заменяет иконку), обе карточки disabled
- **Error:** Alert "Ошибка" / "Не удалось сохранить роль. Попробуйте снова."
- **Success CLIENT:** redirect на `/(dashboard)`
- **Success SPECIALIST:** redirect на `/(onboarding)/username`

**Валидация:**
- Server (UpdateMeDto): `@IsString() @IsIn(['CLIENT', 'SPECIALIST'])` role
- Server: роль можно назначить только если `user.role === null` → иначе BadRequestException "Role already assigned"

**Уведомления:** нет

**Edge cases:**
- Двойной клик → disabled при loading; обе карточки disabled одновременно
- Повторный вход на экран после назначения роли → сервер вернёт 400 (роль уже назначена)
- Прямой переход на URL без isNewUser → PATCH сработает только если role=null

**Responsive:** maxWidth 430, центрирование по вертикали и горизонтали

**Acceptance criteria:**
- AC-01: Выбор CLIENT → PATCH /users/me → redirect на dashboard
- AC-02: Выбор SPECIALIST → PATCH /users/me → redirect на onboarding
- AC-03: Повторная попытка назначить роль → 400
- AC-04: Спиннер отображается в выбранной карточке

---

## UC-003: Онбординг SPECIALIST

**Актор:** SPECIALIST (новый)
**Цель:** Настроить профиль для отображения в каталоге

**Основной поток:**
1. `(onboarding)/username.tsx` — username (3-20, alphanumeric + _)
2. `PATCH /users/me/username { username }`
3. `(onboarding)/cities.tsx` — города работы
4. `(onboarding)/fns.tsx` — ИФНС (опционально)
5. `(onboarding)/services.tsx` — услуги с ценами (чипы + свободный текст)
6. `PATCH /users/me/specialist-profile { cities, services, fnsOffices? }` — создаёт SpecialistProfile, повышает роль до SPECIALIST
7. Redirect на `/(dashboard)`

**Альтернативные потоки:**
- A1: Username занят → 409
- A2: Повторный вызов — идемпотентно обновляет данные

**Бизнес-правила:**
- Username = nick (используется в URL публичного профиля)
- Минимум 1 город, минимум 1 услуга
- Создание профиля + смена роли в одной транзакции

**UI состояния:**
- **Step 1 (username.tsx):** прогресс 1/4, поле ника, кнопка disabled если validate()!=null; Loading — спиннер; Error — красный текст: "Минимум 3 символа" / "Максимум 20 символов" / "Только буквы, цифры и _" / "Этот ник уже занят" (409) / ApiError.message
- **Step 2 (cities.tsx):** прогресс 2/4, чипы городов из RUSSIAN_CITIES, кнопка disabled если 0 выбрано; подсказка "Выбрано: X, Y"
- **Step 3 (fns.tsx):** прогресс 3/4, поиск ИФНС с dropdown (до 8 результатов), выбранные чипы с "x"; Error: "Выберите хотя бы одну ИФНС"
- **Step 4 (services.tsx):** прогресс 4/4, чипы популярных услуг + textarea; Loading — спиннер; Error: "Расскажите о своих услугах" / "Не выбраны города"
- **Success:** refreshTokens → login с новой ролью SPECIALIST → redirect на `/`

**Валидация:**
- **Client username:** regex `/^[a-zA-Z0-9_]+$/`, 3-20 символов, maxLength=20
- **Server SetUsernameDto:** `@Length(3, 20)`, `@Matches(/^[a-zA-Z0-9_]+$/)`
- **Server SetupSpecialistProfileDto:** `@ArrayMinSize(1)` cities, `@ArrayMinSize(1)` services, `@IsOptional()` fnsOffices
- **Server:** username unique check (409), nick unique check (409), role=CLIENT → 400 "Role already assigned", no username → 400

**Уведомления:** нет

**Edge cases:**
- Данные городов/ФНС сохраняются в AsyncStorage для resilience при refresh/deep-link
- Повторный вызов specialist-profile → идемпотентное обновление (existing profile → update)
- CLIENT пытается вызвать endpoint → 400 (privilege escalation guard)
- После завершения: JWT refresh для получения нового токена с ролью SPECIALIST
- Популярные услуги (чипы): "Декларации 3-НДФЛ", "Налоговые споры", "Оптимизация налогов", "Вычеты НДФЛ", "Регистрация ООО/ИП", "НДС консультации", "Налоговый аудит", "Представительство в суде"

**Responsive:** maxWidth 430 на всех шагах; KeyboardAvoidingView

**Acceptance criteria:**
- AC-01: Ник 3-20 символов [a-zA-Z0-9_] → сохраняется
- AC-02: Занятый ник → "Этот ник уже занят"
- AC-03: Минимум 1 город выбран → кнопка активна
- AC-04: Минимум 1 услуга (чип или текст) → profile создаётся
- AC-05: Роль меняется на SPECIALIST в одной транзакции
- AC-06: После завершения — JWT обновляется, роль=SPECIALIST

---

## UC-004: Смена email

**Актор:** CLIENT / SPECIALIST (авторизованный)
**Цель:** Изменить email с подтверждением через OTP

**Основной поток:**
1. В `(dashboard)/settings.tsx` — нажать "Изменить" рядом с email
2. `POST /users/me/change-email/request { newEmail }` — проверка уникальности, отправка OTP
3. `POST /users/me/change-email/confirm { newEmail, code }` — верификация
4. Обновление email, revoke всех refresh tokens, выдача новой пары токенов

**Бизнес-правила:**
- Rate limit: 3/5min на request, 10/5min на confirm
- После смены — принудительная переавторизация (все старые токены revoked)
- Race condition guard: двойная проверка уникальности email

**UI состояния:**
- **Кнопка "Изменить email":** ЗАБЛОКИРОВАНА (disabled, opacity 0.5) с подписью "Будет доступно в следующей версии"
- UI для смены email НЕ РЕАЛИЗОВАН на фронте — кнопка-заглушка

**Валидация:**
- Server ChangeEmailRequestDto: `@IsEmail()` newEmail
- Server ChangeEmailConfirmDto: `@IsEmail()` newEmail, `@Length(6, 6)` code
- Server: new email != current → 400; email taken → 409; OTP attempts >= 3 → 401; race condition → 409
- Throttle request: 3/5min; confirm: 10/5min (EmailThrottlerGuard)

**Уведомления:**
- OTP на новый email: "Ваш код для входа — Налоговик" (тот же шаблон sendOtp)
- DEV_AUTH=true: OTP=000000, лог

**Edge cases:**
- Race condition: email проверяется на уникальность и при request, и при confirm
- После смены: все refresh tokens revoked → принудительная переавторизация
- OTP TTL для change-email: 10 мин (отличается от auth: 15 мин в коде)

**Responsive:** часть settings.tsx — maxWidth 430

**Acceptance criteria:**
- AC-01: Кнопка "Изменить email" отображается как disabled с пояснением
- AC-02: API POST /users/me/change-email/request работает (backend ready)
- AC-03: API POST /users/me/change-email/confirm меняет email + revoke tokens
- AC-04: UI для смены email - НЕ РЕАЛИЗОВАН (заглушка)

---

## UC-005: Удаление аккаунта

**Актор:** CLIENT / SPECIALIST (авторизованный)
**Цель:** Полностью удалить аккаунт и все данные

**Основной поток:**
1. В `(dashboard)/settings.tsx` → Alert подтверждения
2. `DELETE /users/me` — транзакционное удаление: reviews, messages, threads, responses, requests, promotions, specialist profile, user
3. `logout()` + redirect на landing

**Бизнес-правила:**
- Удаление необратимо, всё в одной транзакции

**UI состояния:**
- **Idle:** кнопка "Удалить аккаунт" в "Опасной зоне" (красная рамка), подсказка "Удаление аккаунта необратимо. Все данные будут удалены."
- **Confirm:** Alert с заголовком "Удалить аккаунт", текст "Это действие необратимо. Все ваши данные, запросы и диалоги будут удалены.", кнопки "Отмена" / "Удалить" (destructive)
- **Loading:** ActivityIndicator вместо текста кнопки, кнопка disabled
- **Error:** Alert "Ошибка" / ApiError.message или "Не удалось удалить аккаунт. Попробуйте позже."
- **Success:** logout() → redirect на `/`

**Валидация:** нет клиентской валидации, только JWT auth

**Уведомления:** нет (ни email, ни подтверждение удаления)

**Edge cases:**
- Двойной клик → disabled при deleting
- Порядок удаления в транзакции: reviews (given + received + on requests) → messages → threads → responses (by + to requests) → requests → promotions → specialist profile → user
- Нет soft delete — данные удаляются физически и необратимо
- Нет ON DELETE CASCADE в Prisma schema — удаление вручную в правильном порядке

**Responsive:** часть settings.tsx — maxWidth 430

**Acceptance criteria:**
- AC-01: Кнопка "Удалить аккаунт" → Alert подтверждения
- AC-02: "Отмена" → ничего не происходит
- AC-03: "Удалить" → DELETE /users/me → logout → redirect на landing
- AC-04: Все связанные данные удалены (reviews, messages, threads, responses, requests, promotions, profile)
- AC-05: Ошибка → Alert с сообщением, аккаунт не удалён

---

# CLIENT

## UC-010: Создание налогового запроса

**Актор:** CLIENT
**Цель:** Опубликовать задачу для получения откликов

**Основной поток:**
1. `(dashboard)/requests/new.tsx` — описание (3-2000 символов), город, бюджет (опц.), категория (опц.)
2. `POST /requests { description, city, budget?, category? }`
3. Проверка лимита: <= 5 открытых запросов
4. Статус OPEN
5. Email-уведомление специалистам в этом городе (fire-and-forget)

**Категории:** НДС, НДФЛ, Налог на прибыль, УСН, ИП/ООО, Таможня, Налоговая проверка, Другое

**Бизнес-правила:**
- Максимум 5 одновременно открытых запросов на клиента
- Уведомление non-blocking

**UI состояния:**
- **Loading:** кнопка "Отправить запрос" — спиннер, disabled
- **Error (валидация):** красный текст под каждым полем; Alert при серверной ошибке: "Ошибка" / ApiError.message или "Не удалось создать запрос"
- **Success:** redirect на `/(dashboard)/requests`
- **Счётчик символов:** "{N}/1000" справа под textarea

**Валидация:**
- **Client:** description.trim().length >= 3 → "Минимум 3 символа"; city.trim() не пустой → "Укажите город"; budget целое число >= 0 → "Введите целое число"; maxLength=1000 на textarea
- **РАСХОЖДЕНИЕ:** UC: 3-2000 символов — фронт: maxLength=1000; сервер CreateRequestDto: `@MinLength(3) @MaxLength(2000)`
- **Server:** `@IsNotEmpty() @MinLength(3) @MaxLength(2000)` description; `@IsNotEmpty() @MaxLength(100)` city; `@IsOptional() @IsInt() @Min(0)` budget; `@IsOptional() @MaxLength(100)` category
- **Server:** лимит 5 открытых → 400 "Maximum 5 active requests allowed"

**Уведомления:**
- Специалистам в городе запроса (fire-and-forget, non-blocking): Тема "Новый запрос в городе {city} — Налоговик" / Текст: "{city} — новый запрос: \"{description[:200]}...\"\nОткройте приложение."
- Только специалистам с emailNotifications=true (UC-072 реализован в requests.service.ts)
- Case-insensitive matching городов (JS toLowerCase)

**Edge cases:**
- Двойной клик → disabled при loading
- 5 открытых запросов → 400 от сервера → Alert
- Категории: чипы-toggle (повторный клик снимает выбор)
- Budget необязательный — если пустой, не передаётся

**Responsive:** maxWidth 430 (mobile), maxWidth 680 (desktop, через `!isMobile`)

**Acceptance criteria:**
- AC-01: Описание >= 3 символов + город → запрос создаётся
- AC-02: Описание < 3 символов → "Минимум 3 символа"
- AC-03: Город пустой → "Укажите город"
- AC-04: 6-й запрос → 400 "Maximum 5 active requests"
- AC-05: Специалисты в городе получают email
- AC-06: После создания → redirect на список запросов

---

## UC-011: Просмотр своих запросов

**Актор:** CLIENT
**Цель:** Видеть свои запросы разделёнными на Активные/Закрытые

**Основной поток:**
1. `(dashboard)/requests/index.tsx`
2. `GET /requests/my` — все запросы с количеством откликов
3. Вкладки: "Активные" (OPEN) и "Закрытые" (CLOSED, CANCELLED)

> Note (Architect): Фронт-код содержит фильтр по статусу IN_PROGRESS, которого нет в Prisma enum. Это dead code — удалить фильтр, оставить только OPEN.

**Бизнес-правила:**
- Сортировка по дате (новые сверху)
- Пустой список → EmptyState с CTA "Создать запрос"

**UI состояния:**
- **Loading:** ActivityIndicator (large) по центру
- **Error:** EmptyState icon="alert-circle-outline", title="Ошибка загрузки", subtitle=текст, CTA "Повторить"
- **Empty (active tab):** EmptyState icon="document-text-outline", title="Нет активных запросов", subtitle="Создайте свой первый запрос", CTA "Создать запрос" (только CLIENT)
- **Empty (closed tab):** EmptyState title="Нет закрытых запросов" (без CTA)
- **Success:** FlatList с RefreshControl (pull-to-refresh) + кнопка "Создать запрос" внизу

**Валидация:** нет (только GET запрос)

**Уведомления:** нет

**Edge cases:**
- Pull-to-refresh: RefreshControl tintColor=brandPrimary
- Вкладки: "Активные" (status=OPEN) / "Закрытые" (status!=OPEN) — фильтрация client-side
- Описание обрезается до 60 символов + "..."
- Дата: формат "DD мес. в HH:MM"
- Кнопка "Создать запрос" в footer — только для CLIENT и только если есть результаты

**Responsive:** maxWidth 430 (mobile, одна колонка) / grid с numColumns (desktop)

**Acceptance criteria:**
- AC-01: Список загружается по GET /requests/my
- AC-02: Вкладки переключают фильтр
- AC-03: Пустой список → EmptyState с CTA
- AC-04: Pull-to-refresh обновляет данные
- AC-05: Клик на карточку → детали запроса

---

## UC-012: Просмотр откликов на запрос

**Актор:** CLIENT
**Цель:** Увидеть откликнувшихся специалистов

**Основной поток:**
1. `(dashboard)/requests/[id].tsx`
2. `GET /requests/:id` — запрос + список откликов с данными специалистов
3. Начать чат со специалистом → UC-030

**Бизнес-правила:**
- Только владелец запроса может видеть отклики
- Отклики сортируются по дате (новые сверху)

**UI состояния:**
- **Loading:** ActivityIndicator по центру
- **Error:** EmptyState icon="alert-circle-outline", title="Ошибка" / "Запрос не найден", CTA "Повторить"
- **Empty отклики:** EmptyState icon="mail-outline", title="Пока нет откликов", subtitle="Специалисты скоро увидят ваш запрос"
- **Success:** ScrollView с RefreshControl; карточка запроса + список откликов

**Данные в отклике:**
- Имя специалиста (displayName || nick || email.split('@')[0])
- Дата отклика (полный формат)
- Текст сообщения
- Кнопка "Посмотреть профиль" (ghost, если есть nick) → /specialists/[nick]
- Кнопка "Начать диалог" (secondary) → POST /threads/start → redirect на thread

**Действия владельца (OPEN запрос):**
- "Редактировать" → `/(dashboard)/requests/edit/[id]`
- "Закрыть запрос" (danger) → PATCH status=CLOSED

**Валидация:** нет клиентской; server: owner check (findById возвращает responses только владельцу)

**Уведомления:** нет на этом экране

**Edge cases:**
- Двойной клик "Начать диалог" → startingDialogId guard (один запрос за раз)
- Двойной клик "Закрыть" → closingId=true, disabled
- Не-владелец → видит публичные поля без откликов (UC-074)
- Ошибка при закрытии → Alert

**Responsive:** maxWidth 430

**Acceptance criteria:**
- AC-01: Владелец видит полные данные + отклики
- AC-02: Не-владелец видит публичные поля без откликов
- AC-03: "Начать диалог" → thread создаётся, redirect
- AC-04: "Закрыть запрос" → статус CLOSED
- AC-05: 0 откликов → EmptyState

---

## UC-013: Редактирование/закрытие/отмена запроса

**Актор:** CLIENT
**Цель:** Изменить запрос или изменить его статус

**Основной поток (редактирование):**
1. `(dashboard)/requests/edit/[id].tsx`
2. `PATCH /requests/:id { description?, city?, budget?, category? }`

**Основной поток (статус):**
1. `PATCH /requests/:id { status: "CLOSED" | "CANCELLED" }`

**Бизнес-правила:**
- Редактирование только для OPEN запросов
- CLOSED/CANCELLED — терминальные статусы

**UI состояния (edit/[id].tsx):**
- **Loading (fetch):** ActivityIndicator по центру
- **Loading (save):** кнопка "Сохранить изменения" — спиннер, disabled
- **Error (fetch):** Alert + router.back()
- **Error (save):** Alert "Ошибка" / ApiError.message / "Не удалось сохранить изменения"
- **Error (validate):** красный текст под полями
- **Success:** router.back()

**UI состояния (закрытие — [id].tsx):**
- **Loading:** кнопка "Закрыть запрос" — спиннер, disabled
- **Error:** Alert
- **Success:** статус обновляется в state, кнопки действий скрываются

**Валидация:**
- Client (edit): description >= 3 → "Минимум 3 символа"; city не пустой → "Укажите город"; budget целое → "Введите целое число"; maxLength=1000
- Server (updateFields): owner check + status=OPEN + no empty update
- Server (updateStatus): transition matrix: OPEN → CLOSED|CANCELLED; CLOSED/CANCELLED → ничего (400)
- Server: "Cannot transition request from X to Y"; "Request is already in status X"

**Уведомления:** нет

**Edge cases:**
- Двойной клик save → disabled; категории — toggle чипы
- Редактирование не-OPEN запроса → 400 "Can only edit requests with OPEN status"
- Пустой budget → передаётся null (очистка)
- Пустая category → передаётся null

**Responsive:** maxWidth 430 (mobile) / maxWidth 680 (desktop)

**Acceptance criteria:**
- AC-01: Форма предзаполнена данными запроса
- AC-02: Сохранение → PATCH → router.back()
- AC-03: Закрытие OPEN → CLOSED
- AC-04: Закрытие CLOSED → 400
- AC-05: Не-владелец → 403

---

## UC-014: Оставить отзыв специалисту

**Актор:** CLIENT
**Цель:** Оценить работу специалиста после закрытого запроса

**Основной поток:**
1. `GET /reviews/eligibility/:nick` → `{ canReview, eligibleRequestId }`
2. Форма: рейтинг 1-5, комментарий (опц., до 2000 символов)
3. `POST /reviews { specialistNick, requestId, rating, comment? }`

**Бизнес-правила:**
- Только для CLOSED запросов
- Специалист должен был откликнуться на этот запрос
- Один отзыв на комбинацию client+specialist+request

**UI состояния:**
- Форма отзыва встроена в публичный профиль специалиста (`/specialists/[nick]`)
- НЕТ отдельного экрана для UC-014 (MISSING в Screen Inventory)
- Форма видна только авторизованному CLIENT с `eligibility.canReview=true`

**Валидация:**
- **Server CreateReviewDto:** `@MinLength(1)` specialistNick, `@MinLength(1)` requestId, `@IsInt() @Min(1) @Max(5)` rating, `@IsOptional() @MaxLength(2000)` comment
- **Server guards:** `@Roles(Role.CLIENT)` — только CLIENT может создавать
- **Server checks:** request CLOSED, specialist responded to request, no duplicate (unique constraint)
- Ошибки: 404 "Specialist not found" / "Request not found"; 403 "Not your request"; 400 "Request must be CLOSED" / "Specialist did not respond"; 409 "Already reviewed"

**Уведомления:** нет (специалист не уведомляется о новом отзыве)

**Edge cases:**
- Eligibility check: ищет первый CLOSED request от этого клиента с откликом этого специалиста, без существующего отзыва
- Если несколько CLOSED запросов — берётся первый найденный (findFirst)
- canReview=false если: нет CLOSED запросов, специалист не откликался, уже есть отзыв

**Responsive:** часть /specialists/[nick] — адаптивно по layout профиля

**Acceptance criteria:**
- AC-01: GET /reviews/eligibility/:nick → canReview + eligibleRequestId
- AC-02: POST /reviews с rating 1-5 → отзыв создаётся
- AC-03: Дубликат → 409
- AC-04: Не-CLOSED запрос → 400
- AC-05: Специалист не откликался → 400

---

## UC-015: Просмотр своих отзывов

**Актор:** CLIENT
**Цель:** Видеть историю оставленных отзывов

**Основной поток:**
1. `(dashboard)/settings.tsx` → секция "Мои отзывы"
2. `GET /reviews/my`

**UI состояния:**
- **Loading:** ActivityIndicator (small) внутри карточки
- **Empty:** текст "Вы пока не оставляли отзывов"
- **Success:** список отзывов с разделителями

**Данные в отзыве:**
- Имя специалиста (displayName || nick || email.split('@')[0])
- Звёзды рейтинга (filled/empty) + "N/5"
- Комментарий (до 3 строк, numberOfLines=3) — если есть
- Дата: "DD мес. YYYY" (ru-RU locale)

**Валидация:** нет; секция видна только для role=CLIENT

**Уведомления:** нет

**Edge cases:**
- Секция "Мои отзывы" полностью скрыта для SPECIALIST
- Ошибка загрузки → молча проглатывается (`.catch(() => {})`)
- Нет пагинации — все отзывы загружаются одним запросом

**Responsive:** maxWidth 430 (часть settings.tsx)

**Acceptance criteria:**
- AC-01: CLIENT видит секцию "Мои отзывы"
- AC-02: SPECIALIST не видит секцию
- AC-03: 0 отзывов → "Вы пока не оставляли отзывов"
- AC-04: Отзывы отображаются со звёздами, комментарием, датой

---

# SPECIALIST

## UC-020: Редактирование профиля специалиста

**Актор:** SPECIALIST
**Цель:** Обновить профиль для привлечения клиентов

**Основной поток:**
1. `(dashboard)/profile.tsx`
2. `GET /specialists/me` — текущий профиль с activity (responseCount, avgRating, reviewCount)
3. `PATCH /specialists/me { nick, displayName, bio, cities, services, fnsOffices, contacts }`
4. Аватар: `POST /specialists/me/avatar` (multipart, до 5MB, только images)

> Note (Architect+Sec): Бейджи 'verified' и 'familiar' ранее были self-assignable. ИСПРАВЛЕНО: убрать из ALLOWED_BADGES, только Admin может выставлять через PATCH /specialists/:id/badges.

> Note (Architect): Аватары хранятся на локальном диске сервера (uploads/avatars/). При масштабировании — переход на S3/MinIO в v2.

**Бизнес-правила:**
- Nick: 3-30 символов, alphanumeric + _-
- DisplayName: до 100 символов, Bio: до 1000 символов
- Бейджи только admin-only (кроме UI toggle — убрать)

**UI состояния:**
- **Loading:** `ActivityIndicator` (center) при первой загрузке профиля
- **Error (404):** redirect на `/(dashboard)/specialist-profile` (экран создания профиля)
- **Error (другие):** текст ошибки + кнопка "Повторить" (`fetchProfile()`)
- **Success:** полная форма редактирования с RefreshControl (pull-to-refresh)
- **Saving:** кнопка "Сохранить профиль" показывает loading spinner, disabled
- **Avatar uploading:** ActivityIndicator поверх аватара, кнопка disabled

**Валидация:**
- **Nick (backend):** `@MinLength(3) @MaxLength(30) @Matches(/^[a-zA-Z0-9_-]+$/)` — "Ник может содержать только латинские буквы, цифры, дефис и подчёркивание"
- **Nick (фронт):** readonly поле (нельзя изменить после создания)
- **DisplayName:** `@MaxLength(100)`, optional
- **Bio:** `@MaxLength(1000)`, optional
- **Cities:** `@ArrayMinSize(1)` при создании; при обновлении optional (hint "Нет городов - добавьте хотя бы один")
- **Services:** `@ArrayMaxSize(20)` при обновлении; `@ArrayMinSize(1)` при создании
- **Nick 409:** Alert "Этот ник уже занят, выберите другой."
- ⚠️ НЕ РЕАЛИЗОВАНО: frontend-валидация минимум 1 город/услуга при обновлении

**Вложения/Медиа:**
- **Аватар:** `POST /specialists/me/avatar` (multipart, поле `file`)
  - Лимит: 5 MB; форматы: только `image/*`
  - Хранение: `uploads/avatars/{userId}{ext}` (diskStorage на сервере)
  - Фронт: `expo-image-picker` — Images, allowsEditing, aspect [1,1], quality 0.8
  - Превью: круглое 80x80, placeholder — первая буква ника
  - Ошибка: Alert "Не удалось загрузить фото"; Успех: Alert "Аватар обновлён"
- ⚠️ НЕ РЕАЛИЗОВАНО: удаление аватара, resize/thumbnails на сервере

**Уведомления:**
- Нет email-уведомлений при редактировании профиля

**Edge cases:**
- 404 — redirect на экран создания профиля
- Unique constraint на nick (race condition protected)
- Дублирование городов: проверка `cities.includes()`, Alert "Уже добавлен"
- ИФНС: client-side фильтрация, до 6 suggestions, уже выбранные исключены
- Двойное сохранение: кнопка disabled во время saving

**Responsive:**
- `maxWidth: 430px`, контейнер центрирован
- ⚠️ НЕ РЕАЛИЗОВАНО: `KeyboardAvoidingView` на экране редактирования

**Acceptance criteria:**
- [ ] Профиль загружается с activity (responseCount, avgRating, reviewCount)
- [ ] Ник readonly; DisplayName, contacts, cities, services, fnsOffices редактируемые
- [ ] Аватар: выбор из галереи, обрезка 1:1, upload до 5MB
- [ ] При 404 — redirect на создание; при ошибке — Alert
- [ ] Pull-to-refresh работает; "Сохранить" disabled во время отправки

---

## UC-021: Просмотр ленты запросов в своих городах

**Актор:** SPECIALIST
**Цель:** Найти запросы клиентов в своих городах

**Основной поток:**
1. `(dashboard)/city-requests.tsx`
2. `GET /specialists/me` — города профиля
3. `GET /requests?city={city}&page=1` — запросы OPEN (параллельно для каждого города)
4. Бейдж "Новый" (AsyncStorage, до 500 ID)

**Бизнес-правила:**
- "Новый" — client-side tracking (AsyncStorage, ключ `p2ptax_seen_city_requests`, cap 500)
- Кнопка "Отметить все прочитанными"

**UI состояния:**
- **Loading:** `ActivityIndicator` (center) при первой загрузке
- **Error (no_profile / 404):** EmptyState "Профиль не найден" — "Создайте профиль специалиста, чтобы видеть запросы в ваших городах"
- **Error (другие):** EmptyState "Ошибка загрузки" + CTA "Повторить"
- **Empty (0 городов):** EmptyState "Нет городов в профиле" — "Добавьте города в профиль, чтобы видеть запросы"
- **Empty (0 запросов):** EmptyState "Нет открытых запросов" — "В ваших городах ({cities}) пока нет запросов"
- **Success:** FlatList с RefreshControl + auto-polling каждые 30 секунд

**Валидация:**
- Сообщение отклика: `message.trim()` обязательно, пустое — Alert "Введите сообщение для отклика"
- 409 при повторном отклике — Alert "Вы уже откликались на этот запрос."

**Вложения/Медиа:**
- ⚠️ НЕ РЕАЛИЗОВАНО: вложения к отклику (только текст)

**Уведомления:**
- Email клиенту при отклике: `notifyNewResponse(clientEmail, requestId, specialistId)`
  - Тема: "Новый отклик на ваш запрос — Налоговик"
  - Текст: "На ваш запрос #{requestId} поступил новый отклик от специалиста. Откройте приложение..."

**Edge cases:**
- **Auto-polling:** `setInterval(fetchData, 30_000)` — обновление каждые 30 сек
- **Optimistic respondedIds:** после отклика ID добавляется в Set, бейдж "Отклик отправлен" до рефреша
- **AsyncStorage seen IDs:** cap 500 записей (SEEN_CAP)
- **Кросс-городские дедупликации:** запросы из разных городов мержатся, дедупликация по `item.id`
- **Пагинация per-city:** кнопка "Ещё запросы: {город}" для каждого города с hasMore
- **Category filter:** client-side фильтрация чипами (горизонтальный скролл)
- **Описание обрезается:** до 200 символов + "..."

**Responsive:**
- `maxWidth: 430px` для карточек и модального окна
- Modal bottom-sheet с `KeyboardAvoidingView`

**Acceptance criteria:**
- [ ] Запросы загружаются для всех городов профиля
- [ ] Бейдж "Новый" для непрочитанных, "Отметить все прочитанными" работает
- [ ] Отклик через модалку, сообщение обязательно
- [ ] 409 — Alert "Вы уже откликались"
- [ ] Pull-to-refresh и auto-polling 30 сек
- [ ] Фильтр по категориям работает
- [ ] "Ещё запросы" подгружает следующую страницу

---

## UC-022: Отклик на запрос

**Актор:** SPECIALIST
**Цель:** Предложить услуги клиенту

**Основной поток:**
1. "Откликнуться" → Alert подтверждения → модальное окно с сообщением
2. `POST /requests/:id/respond { message }` — транзакция: создание Response + upsert Thread
3. Email-уведомление CLIENT (fire-and-forget)

**Бизнес-правила:**
- Один отклик на specialist+request (@@unique([specialistId, requestId]) в Prisma)
- Специалист откликается только на запросы в своих городах (case-insensitive)
- Thread создаётся автоматически при отклике

**UI состояния:**
- **Confirm:** Alert "Подтверждение" — "Откликнуться на этот запрос?" [Отмена / Откликнуться]
- **Modal:** multiline input (autoFocus), placeholder "Здравствуйте! Я специалист по..."
- **Submitting:** кнопка "Отправить" с loading, disabled
- **Success:** модалка закрывается, Alert "Отклик отправлен — Клиент получит уведомление.", бейдж "Отклик отправлен"
- **Error 409:** Alert "Вы уже откликались на этот запрос."

**Валидация:**
- `message.trim()` обязательно, пустое — Alert "Введите сообщение для отклика"
- ⚠️ НЕ РЕАЛИЗОВАНО: maxLength на сообщение отклика (ни на фронте, ни в DTO)

**Уведомления:**
- Email клиенту: тема "Новый отклик на ваш запрос — Налоговик", fire-and-forget

**Edge cases:**
- Двойной отклик: DB unique constraint + optimistic respondedIds Set
- Закрытие модалки без отправки: стейт сбрасывается

**Acceptance criteria:**
- [ ] Alert подтверждения перед открытием модалки
- [ ] Пустое сообщение — ошибка
- [ ] Успешный отклик — Alert + бейдж
- [ ] 409 — корректное сообщение об ошибке

---

## UC-023: Просмотр своих откликов

**Актор:** SPECIALIST
**Основной поток:**
1. `(dashboard)/responses.tsx`
2. `GET /requests/my-responses` — отклики с данными запроса

**UI состояния:**
- **Loading:** ActivityIndicator (center) внутри ListEmptyComponent
- **Error:** EmptyState "Ошибка загрузки" + CTA "Повторить"
- **Empty:** EmptyState "Нет откликов" — "Вы ещё не откликались ни на один запрос"
- **Success:** FlatList карточек с RefreshControl

**Вложения/Медиа:**
- Нет вложений

**Уведомления:**
- Нет уведомлений с этого экрана

**Edge cases:**
- **Кнопка "Написать":** `POST /threads/start { otherUserId: clientId }` → redirect в чат
- **startingDialogId:** блокирует параллельные нажатия (disabled пока один запрос в процессе)
- **clientId отсутствует:** кнопка "Написать" не отображается
- **Статус запроса:** "Открыт" (зелёный) / "Закрыт" (серый)
- **Навигация:** tap на карточку → `/(dashboard)/requests/${id}`

**Responsive:**
- `maxWidth: 430px` для карточек

**Acceptance criteria:**
- [ ] Список откликов с данными запроса загружается
- [ ] Статус OPEN/CLOSED корректно
- [ ] "Написать" создаёт thread и переходит в чат
- [ ] Pull-to-refresh работает

---

## UC-024: Продвижение профиля

**Актор:** SPECIALIST
**Цель:** Повысить видимость в каталоге

**Основной поток:**
1. `(dashboard)/promotion.tsx`
2. `GET /promotions/my` — активные и истёкшие
3. Кнопка "Подключить продвижение" → модалка выбора города/тарифа/периода
4. API `POST /promotions/purchase { city, tier, periodMonths, idempotencyKey }`

> Note (BizComplete): Монетизация использует mock payment. API готов для Stripe/ЮKassa.

**Тиры:** BASIC (500 руб/мес), FEATURED (1500 руб/мес), TOP (3000 руб/мес)
**Периоды:** 1 мес, 3 мес (-10%), 6 мес (-20%)
**Срок:** по выбранному периоду. Cron удаляет истёкшие каждый час.

**UI состояния:**
- **Loading:** ActivityIndicator (center)
- **Success (нет промо):** banner "Продвижение не активно" + info card
- **Success (есть промо):** banner "Активно N продвижений" + карточки с tier/city/daysLeft
- **Purchase modal:** fade, чипы города (из profileCities) + тариф + период
- **Purchasing:** кнопка "Подключить (бесплатно)" с spinner, disabled
- **Purchase error:** красный текст внутри модалки

**Валидация:**
- **city:** обязательный, должен быть в profile.cities — "You don't have city X in your profile"
- **tier:** enum `BASIC | FEATURED | TOP`
- **periodMonths:** `@IsIn([1, 3, 6])`, default 1
- **idempotencyKey:** `@IsUUID()`, optional
- **Дубль active:** 400 "You already have an active {tier} promotion in {city} until {date}"

**Уведомления:**
- Email за 3 дня до истечения: "Продвижение истекает через 3 дня" — "Ваше продвижение в городе {city} истекает через 3 дня"
- Флаг `reminderSent` (один раз), проверка `emailNotifications`

**Edge cases:**
- **Idempotency:** client UUID key, backend unique constraint
- **Fallback cities:** если profile.cities пусто — ['Москва']
- **Expired:** фронт фильтрует по `isExpired()`, история до 5 записей
- **Transaction:** `$transaction` с timeout 10s

**Responsive:**
- `maxWidth: 430px` для контейнера и модалки

**Acceptance criteria:**
- [ ] Активные и истёкшие промо загружаются
- [ ] Модалка: выбор города, тарифа, периода
- [ ] Покупка создаёт промоцию (mock)
- [ ] Дубль — ошибка; idempotency — возврат существующей
- [ ] Pull-to-refresh обновляет список

---

# CHAT

## UC-030: Начать диалог

**Актор:** CLIENT / SPECIALIST (авторизованный)
**Основной поток:**
1. `POST /threads/start { otherUserId }` — upsert thread
2. Redirect на `(dashboard)/messages/[threadId].tsx`

**Бизнес-правила:**
- participant1Id < participant2Id (invariant, сортировка: `[userId, otherUserId].sort()`)
- Thread создаётся при отклике (UC-022) или через этот endpoint
- Upsert: `@@unique([participant1Id, participant2Id])`

**UI состояния:**
- **Loading:** кнопка "Написать" с loading spinner
- **Error:** Alert с текстом ошибки
- **Success:** redirect на chat

**Валидация:**
- **otherUserId:** `@IsString() @IsNotEmpty()`
- **Self-thread:** 400 "Cannot start a thread with yourself"
- **User not found:** 404 "User not found"

**Edge cases:**
- Двойной клик: `startingDialogId` блокирует параллельные вызовы
- Upsert: если thread существует — возвращается существующий ID
- Точки входа: responses.tsx, specialist profile, request detail

**Acceptance criteria:**
- [ ] Thread создаётся / возвращается при повторном вызове
- [ ] Redirect на чат после создания
- [ ] Self-thread — ошибка 400

---

## UC-031: Реал-тайм чат

**Актор:** CLIENT / SPECIALIST
**Основной поток:**
1. WebSocket `/chat` namespace, auth через JWT в `handshake.auth.token`
2. `join_thread { threadId }` → join room `thread:{threadId}`
3. `send_message { threadId, content }` → broadcast `message_received`
4. `typing { threadId }` → typing indicator (timeout 2500ms)
5. `mark_read { messageId }` → broadcast `message_read` с readAt

**Бизнес-правила:**
- Только получатель может пометить как прочитанное (sender can't mark own)
- Получатель offline → email-уведомление (fire-and-forget, проверка emailNotifications)
- Пагинация: 50 сообщений на страницу (take=50, orderBy createdAt asc)

**UI состояния:**
- **Loading:** ActivityIndicator (center)
- **Error:** EmptyState "Не удалось загрузить сообщения" + CTA "Повторить"
- **Success:** FlatList с auto-scroll to end
- **Sending:** optimistic update (id: `optimistic-{timestamp}`), при ошибке — откат
- **Typing:** "печатает..." (исчезает через 2.5 сек)
- **Loading more:** ActivityIndicator в header при скролле вверх

**Валидация:**
- **content (backend):** `@IsString() @IsNotEmpty() @MaxLength(2000)`
- **content (фронт):** `maxLength={2000}`, пустое — кнопка disabled
- **Thread access:** verifyParticipant — только участники
- **WS auth:** JWT verify при connection, disconnect при невалидном

**Вложения/Медиа:**
- ⚠️ НЕ РЕАЛИЗОВАНО: файлы, фото, голосовые сообщения
- Только текст (content: string в DB)

**Уведомления:**
- **Offline recipient:** email "Новое сообщение — Налоговик"
  - Текст: "Вам пришло новое сообщение от {senderEmail}. Откройте приложение, чтобы ответить."
  - Проверка `emailNotifications` реализована
  - Определение offline: `isUserInRoom()` — socket получателя в room
- ⚠️ НЕ РЕАЛИЗОВАНО: push-notifications

**Edge cases:**
- **WS reconnect:** `reconnection: true`, attempts: 5, delay: 1000ms
- **WS unavailable — REST fallback:** `POST /threads/:id/messages`, REST emit-ит в WS room
- **Optimistic update:** instant add, дедупликация по id, откат при ошибке
- **Auto mark_read:** при получении чужого сообщения — `emit('mark_read')`
- **Scroll to bottom:** scrollToEnd с 100ms delay при изменении messages
- **Load older:** scroll вверх (offset < 50px) загружает предыдущую страницу
- **Date badges:** разделители по дням
- **Delivery status:** одна галочка (sent) / двойная (read)
- **Параллельные сессии:** socket.io допускает несколько connections одного userId
- **Thread list polling:** 30 сек интервал на экране списка диалогов

**Responsive:**
- `maxWidth: 430px` для пузырей и date badges
- Input: `minHeight: 40`, `maxHeight: 120` (multiline)
- `KeyboardAvoidingView` — padding (iOS) / height (Android)
- Пузыри: max 75% ширины

**Acceptance criteria:**
- [ ] Сообщения загружаются при открытии thread
- [ ] Отправка через WS, fallback REST при disconnect
- [ ] Optimistic update мгновенный
- [ ] Typing indicator работает
- [ ] Read status: одна/двойная галочка
- [ ] Auto mark_read при получении сообщения
- [ ] Load more при скролле вверх
- [ ] Offline recipient получает email
- [ ] WS reconnect до 5 попыток
- [ ] maxLength 2000 символов

---

## UC-032: REST fallback для сообщений

**Актор:** CLIENT / SPECIALIST
**Основной поток:**
1. `POST /threads/:id/messages { content }` — REST отправка
2. `PATCH /threads/:id/messages/:messageId/read` — прочитано через REST

**UI состояния:**
- Transparent fallback — автоматически когда WS недоступен

**Валидация:**
- **content:** `@IsString() @IsNotEmpty() @MaxLength(2000)` (SendMessageDto)
- **Thread access:** verifyParticipant — 404 / 403

**Вложения/Медиа:**
- ⚠️ НЕ РЕАЛИЗОВАНО: вложения через REST

**Уведомления:**
- ⚠️ НЕ РЕАЛИЗОВАНО: email при REST-отправке (только через WS gateway)

**Edge cases:**
- REST controller emit-ит `message_received` в WS room через `chatGateway.server.to()`
- WS emit failure: non-blocking (try/catch)
- Пагинация: `GET /threads/:id/messages?page=N` — 50 msg/page, ASC

**Acceptance criteria:**
- [ ] REST отправка работает когда WS недоступен
- [ ] REST mark_read обновляет readAt
- [ ] WS bridge: получатель видит REST-сообщение в реальном времени

---

# PUBLIC

## UC-040: Каталог специалистов

**Актор:** PUBLIC (без авторизации)
**Основной поток:**
1. `/specialists`
2. `GET /specialists?city=&badge=&sort=&search=&fns=&category=&page=&limit=`
3. Фильтры: город, бейдж, поиск, ИФНС, категория
4. Сортировка: promoted first, затем по responses/experience/rating/newest

> Note (Architect): getCatalog загружает ВСЕ профили без пагинации. При >1000 специалистов — OOM. Добавить пагинацию (UC-075).

**Бизнес-правила:**
- Только специалисты с displayName != null
- Promoted специалисты выше в выдаче
- Контакты не отдаются в каталоге

**UI состояния:**
- **Loading:** ActivityIndicator (large, brandPrimary) по центру экрана
- **Empty (фильтры активны):** EmptyState icon="search-outline", title="Специалистов не найдено", subtitle="Попробуйте изменить фильтры"
- **Error:** EmptyState icon="alert-circle-outline", title="Ошибка загрузки", subtitle=текст ошибки, CTA "Повторить"
- **Success:** FlatList карточек с RefreshControl (pull-to-refresh)

**Гость видит:**
- Полный каталог без авторизации — страница публичная
- Клик на карточку → публичный профиль `/specialists/[nick]`
- Нет CTA авторизации на самой странице каталога (CTA есть на профиле специалиста)

**SEO:**
- `<title>`: "Каталог специалистов — Налоговик"
- `<meta name="description">`: "Каталог проверенных налоговых консультантов и юристов. Выберите специалиста по городу, категории и рейтингу."
- `og:title`: "Каталог специалистов — Налоговик"
- `og:description`: дублирует description
- `og:url`: `${APP_URL}/specialists`
- Structured data: нет (og:type не задан)

**Данные в карточке (порядок отображения):**
1. Аватар (Avatar компонент, размер "lg")
2. displayName (или `@nick` если null) — bold, рядом бейдж "Проверен" (зелёный, если verified)
3. Первая услуга (services[0]) — серый текст
4. Города через запятую — мелкий серый текст
5. Звёзды рейтинга (Stars компонент, size="sm") + опыт работы (`formatExperience`)
6. Чипы услуг (services[1..3]) — голубые пиллы, "+N" если >4
7. Кнопка "Подробнее" — outline, brandPrimary

**Фильтры (реализованные):**
- Поиск (TextInput с debounce 400ms) — ищет по имени, nick, услугам, био, ИФНС
- ИФНС dropdown (автокомплит при вводе, до 6 результатов) + выбранные чипы с "x"
- Специализация: чипы ["Все", "Декларации", "Споры с ФНС", "Оптимизация", "Вычеты", "Регистрация бизнеса", "НДС", "Аудит"]
- Сортировка: чипы ["По рейтингу", "По новизне", "По опыту", "По откликам"]

**Пагинация:** PAGE_SIZE=9, кнопка "Загрузить ещё" внизу (Button variant="secondary"), loadingMore — ActivityIndicator

**Responsive:**
- Mobile (<=430px): одна колонка, maxWidth 430, cardWrapperMobile
- Desktop: сетка (numColumns из useBreakpoints), gap между колонками

**Edge cases:**
- 0 результатов после фильтрации → EmptyState "Специалистов не найдено"
- API ошибка → EmptyState с кнопкой "Повторить"
- Debounce поиска — 400ms задержка перед запросом
- FNS dropdown: макс. 6 результатов, фильтрация по всем терминам (every)

**Acceptance criteria:**
- [ ] Страница загружается без авторизации
- [ ] Поиск по имени находит специалиста
- [ ] Фильтр по специализации сужает выдачу
- [ ] Сортировка по рейтингу ставит лучших первыми
- [ ] Promoted специалисты всегда выше не-promoted
- [ ] Кнопка "Загрузить ещё" подгружает следующую страницу
- [ ] Pull-to-refresh обновляет список
- [ ] При 0 результатов — EmptyState

---

## UC-041: Публичный профиль специалиста

**Актор:** PUBLIC
**Основной поток:**
1. `/specialists/[nick]`
2. `GET /specialists/:nick` — профиль с activity
3. `GET /reviews/specialist/:nick?page=1` — отзывы (20/страницу)

**UI состояния:**
- **Loading:** SafeAreaView + LandingHeader + ActivityIndicator по центру
- **Error (404):** EmptyState icon="alert-circle-outline", title="Специалист не найден", CTA "Назад"
- **Error (другое):** EmptyState title="Не удалось загрузить профиль", CTA "Назад"
- **Success:** ScrollView с sidebar + content sections

**Гость видит:**
- Полный профиль: аватар, имя, услуги, города, ИФНС, опыт, рейтинг, отзывы
- Кнопка "Войти и написать" (вместо "Написать запрос" для авторизованных) → redirect на `/(auth)/email?redirectTo=/specialists/[nick]`
- Подсказка: "Для связи со специалистом необходимо войти или зарегистрироваться"
- Контакты скрыты: кнопка "Войдите чтобы увидеть контакты" → redirect на auth
- Кнопка "Поделиться профилем" — работает без авторизации (копирует URL)
- Кнопка "Пожаловаться" — только для авторизованных (не отображается гостям)
- Форма отзыва — только для авторизованных CLIENT с eligibility.canReview

**SEO:**
- `<title>`: `${displayName} — Налоговик` (через Stack.Screen)
- og:title, og:description, og:url — НЕ заданы через Head (только title через Stack.Screen)

**Секции профиля (порядок):**
- **Sidebar (визитка):**
  - Mobile: горизонтальный ряд (аватар + инфо) → кнопки
  - Desktop: вертикальная колонка (30% ширины, sticky top:24)
  - Содержит: Avatar (xl), displayName, первая услуга, города, Stars рейтинга, бейдж "Проверен", опыт
  - Кнопка "Написать запрос" / "Войти и написать"
  - Кнопка "Поделиться профилем"
  - Кнопка "Пожаловаться" (auth only, не для себя)
- **Content:**
  1. О специалисте (bio)
  2. Услуги и цены (services с парсингом "название — цена")
  3. Опыт работы (большое число + "лет опыта")
  4. Города работы (голубые пиллы)
  5. Налоговые инспекции (жёлтые пиллы)
  6. Связаться (contacts — только для auth, не для SPECIALIST)
  7. Отзывы (list + "Оставить отзыв" + форма + "Показать ещё")

**Форма жалобы:**
- Причины: Спам, Мошенничество, Неприемлемый контент, Другое
- Поле "Подробности" (необязательно)
- `POST /complaints { targetUserId, reason, description? }`
- Alert "Жалоба отправлена. Мы рассмотрим её в течение 24 часов."

**Responsive:**
- Mobile: одна колонка, maxWidth 430px
- Desktop: два столбца (30% sidebar + 70% content), maxWidth 1100px
- Sidebar sticky на desktop

**Edge cases:**
- nick не существует → 404 → EmptyState
- Профиль без bio → секция "О специалисте" скрыта
- Профиль без FNS → секция скрыта
- Профиль без contacts → секция скрыта
- 0 отзывов → текст "Отзывов пока нет"
- Поделиться на web → clipboard, toast "Ссылка скопирована" (2 сек)
- Поделиться на native → Share.share()

**Acceptance criteria:**
- [ ] Профиль открывается без авторизации
- [ ] Гость видит "Войти и написать" вместо "Написать запрос"
- [ ] Контакты скрыты для гостей, показан CTA авторизации
- [ ] Отзывы подгружаются по кнопке "Показать ещё"
- [ ] Кнопка "Поделиться" копирует URL в буфер
- [ ] Desktop: двухколоночный layout, sidebar sticky

---

## UC-042: Публичная лента запросов [!]

**Актор:** PUBLIC

> [x] ИСПРАВЛЕНО (verified 2026-04-06): OptionalJwtAuthGuard применён на GET /requests. Публичный доступ работает.

**Основной поток:**
1. `/requests`
2. `GET /requests?city=&category=&maxBudget=&page=` — публичный endpoint
3. Фильтры: город, категория, бюджет
4. SEO мета-теги
5. CTA "Стать специалистом" для гостей

**UI состояния:**
- **Loading:** ActivityIndicator (large, brandPrimary) по центру
- **Empty (с фильтром города):** EmptyState icon="document-text-outline", title="Запросов пока нет", subtitle=`Нет открытых запросов в городе "${cityFilter}"`
- **Empty (без фильтров):** EmptyState title="Запросов пока нет", subtitle="Нет открытых запросов. Проверьте позже."
- **Error:** EmptyState icon="alert-circle-outline", title="Ошибка загрузки", subtitle=текст ошибки, CTA "Повторить"
- **Success:** FlatList карточек с RefreshControl

**Гость видит:**
- Полную ленту запросов без авторизации
- Карточки с описанием, городом, категорией, бюджетом, кол-вом откликов
- CTA-баннер внизу списка: "Вы специалист? Зарегистрируйтесь и получайте заказы" → кнопка "Стать специалистом" → `/(auth)/email?role=SPECIALIST`
- CTA-баннер отображается ТОЛЬКО для неавторизованных и только если есть результаты

**SEO:**
- `<title>`: "Лента запросов — Налоговик"
- `<meta name="description">`: "Открытые запросы на налоговые, юридические и бухгалтерские услуги. Найдите специалиста в вашем городе."
- `og:title`: "Лента запросов — Налоговик"
- `og:description`: дублирует description
- `og:url`: `${APP_URL}/requests`

**Данные в карточке запроса (порядок):**
1. Город (чип, bgSecondary) + дата (formatDate: "DD мес. HH:MM")
2. Описание (до 4 строк, обрезается numberOfLines=4)
3. Категория (чип, brandPrimary текст) + Бюджет (formatted "XXX XXX rub.")
4. Footer: "Откликов: N" + статус ("Открыт" зелёный / "Закрыт" серый)

**Фильтры (реализованные):**
- Город: Input с debounce 400ms, autoCapitalize="words"
- Категория: горизонтальные чипы ["Все", "НДФЛ", "НДС", "Споры", "Декларации", "Оптимизация", "Вычеты", "Аудит"]
- Бюджет: горизонтальные чипы ["Любой", "до 5 000 rub.", "до 10 000 rub.", "до 50 000 rub."]
- Toggle "Активные" / "Все" — client-side фильтр по статусу OPEN

**Пагинация:** кнопка "Загрузить ещё" (Button variant="secondary", loading/disabled при loadMore)

**Responsive:**
- Mobile: одна колонка, maxWidth 430px, фильтры maxWidth 430px
- Desktop: сетка (numColumns из useBreakpoints), фильтры maxWidth 600px

**Edge cases:**
- 0 запросов + фильтр города → "Нет открытых запросов в городе X"
- 0 запросов без фильтров → "Нет открытых запросов. Проверьте позже."
- Toggle "Все" показывает CLOSED/CANCELLED запросы (client-side фильтр)
- Debounce города — 400ms

**Acceptance criteria:**
- [ ] Страница загружается без авторизации
- [ ] Фильтр по городу работает с debounce
- [ ] Фильтр по категории сужает выдачу
- [ ] Фильтр по бюджету сужает выдачу
- [ ] CTA "Стать специалистом" видна только гостям
- [ ] "Загрузить ещё" подгружает следующую страницу
- [ ] При 0 результатов — контекстный EmptyState

---

## UC-043: Публичная страница запроса [!]

**Актор:** PUBLIC

> [x] ИСПРАВЛЕНО (verified 2026-04-06): OptionalJwtAuthGuard + публичные поля без responses для анонимов.

**Основной поток:**
1. `/requests/[id]`
2. `GET /requests/:id` — публичные данные (без откликов для анонимов, полные для владельца)

**UI состояния:**
- **Loading:** SafeAreaView + LandingHeader + ActivityIndicator по центру
- **Error:** EmptyState icon="alert-circle-outline", title=текст ошибки или "Запрос не найден", CTA "К ленте запросов" → `/requests`
- **Success:** ScrollView со статусом, описанием, метаданными, CTA

**Гость видит:**
- Статус-бейдж ("Открыт" зелёный / "Закрыт" серый) + дата создания (полная: "DD месяц YYYY, HH:MM")
- Карточка "Описание" с полным текстом
- Карточка метаданных: Город, Категория (если есть), Бюджет (если есть), Кол-во откликов
- CTA-блок (голубой фон): "Вы специалист? Войдите чтобы откликнуться на этот запрос" → кнопка "Войти и откликнуться" → `/(auth)/email?role=SPECIALIST`
- Ссылка "Все запросы" → `/requests`

**Для авторизованного SPECIALIST (OPEN запрос):**
- Кнопка "Откликнуться" → redirect на `/(dashboard)/requests/[id]` (dashboard версия)

**SEO:**
- Мета-теги НЕ заданы через Head на этой странице (только Stack.Screen title)

**Responsive:**
- Mobile: maxWidth 430px
- Desktop: maxWidth 700px

**Edge cases:**
- Запрос не существует (404 от API) → EmptyState
- CLOSED запрос → CTA не отображается ни для кого
- Бюджет отображается как "XXX XXX rub." (опечатка в коде — "rub." вместо "руб.")

**Acceptance criteria:**
- [ ] Страница загружается без авторизации
- [ ] Гость видит CTA "Войти и откликнуться"
- [ ] Авторизованный SPECIALIST видит "Откликнуться"
- [ ] Закрытый запрос не показывает CTA
- [ ] Несуществующий ID → EmptyState с CTA "К ленте запросов"

---

# ADMIN

## UC-050: Статистика платформы

**Актор:** ADMIN (email из ADMIN_EMAILS env)
**Основной поток:**
1. `(admin)/index.tsx`
2. `GET /admin/stats` — totalUsers, totalSpecialists, activePromotions, revenueThisMonth

**UI состояния:**
- **Loading:** ActivityIndicator (large, brandPrimary)
- **Error:** красный текст ошибки по центру
- **Success:** 4 карточки + навигация по разделам

**Карточки статистики (сетка 2x2):**
1. "Пользователей" — totalUsers → клик → /(admin)/users
2. "Исполнителей" — totalSpecialists → клик → /(admin)/moderation
3. "Активных продвижений" — activePromotions → клик → /(admin)/promotions
4. "Продвижений за месяц" — revenueThisMonth, sub="(оплат этого месяца)"

**Навигация (список разделов):**
- Пользователи (U) → /(admin)/users
- Модерация (M) → /(admin)/moderation
- Продвижения (P) → /(admin)/promotions
- Запросы (R) → /(admin)/requests
- Отзывы (О) → /(admin)/reviews

**Бизнес-логика API (admin.service.ts):**
- totalUsers: `prisma.user.count()`
- totalSpecialists: `prisma.user.count({ where: { role: 'SPECIALIST' } })`
- activePromotions: `prisma.promotion.count({ where: { expiresAt: { gt: now } } })`
- revenueThisMonth: кол-во промоций созданных с 1-го числа месяца (mock — нет реальных платежей)

**Responsive:** maxWidth 430px, сетка карточек 47% ширины каждая

**Acceptance criteria:**
- [ ] Только ADMIN видит страницу (AdminGuard)
- [ ] 4 карточки со статистикой загружаются
- [ ] Pull-to-refresh обновляет данные
- [ ] Навигация по разделам работает

---

## UC-051: Управление пользователями и специалистами

**Актор:** ADMIN
**Основной поток:**
1. `GET /admin/users?role=` — список пользователей
2. `GET /admin/specialists` — список специалистов
3. `GET /admin/requests` — все запросы

**UI — Пользователи (/(admin)/users.tsx):**

**UI состояния:**
- **Loading:** ActivityIndicator
- **Error:** красный текст ошибки
- **Empty:** "Нет пользователей"
- **Success:** список карточек пользователей

**Фильтры:** табы "Все" / "Клиенты" / "Исполнители" (передаётся ?role= в API)

**Данные в карточке пользователя:**
1. Email (truncated) + бейдж роли ("Исполнитель" accent / "Клиент" info) + бейдж "Заблокирован" (error, если isBlocked)
2. Для SPECIALIST: @nick + города через запятую
3. Footer: Рег: DD.MM.YY + Вход: DD.MM.YY + кнопка "Блок"/"Разблок"

**Блокировка:** Alert подтверждения → `PATCH /admin/users/:id { isBlocked }` → оптимистичное обновление карточки. Заблокированные карточки с красной рамкой и opacity 0.85.

**UI — Запросы (/(admin)/requests.tsx):**

**Summary (верхняя строка):** 3 карточки — Всего / Открытых (зелёный) / Закрытых (серый)

**Данные в карточке запроса:**
1. Город + бейдж статуса (Открыт/Закрыт/Отменён с цветовой кодировкой)
2. Описание (до 2 строк)
3. Footer: email клиента + дата + кол-во откликов с склонением

**Edge cases:**
- Нет пагинации в admin users/requests — загружаются все записи
- Concurrent block: если два админа блокируют одновременно, последний запрос побеждает

**Acceptance criteria:**
- [ ] Фильтр по роли работает
- [ ] Блокировка/разблокировка обновляет карточку
- [ ] Alert подтверждения перед блокировкой
- [ ] Summary запросов показывает актуальные счётчики

---

## UC-052: Модерация бейджей специалистов

**Актор:** ADMIN
**Основной поток:**
1. `(admin)/moderation.tsx` — список специалистов
2. Кнопка "Верифицировать" → `PATCH /specialists/:id/badges { badges: ['verified'] }`
3. API реализован, UI подключён к нему (после исправления)

> Note (AdminMirror): Кнопки approve/reject ранее были заглушкой Alert. ИСПРАВЛЕНО: подключить к PATCH /specialists/:id/badges.

**UI состояния:**
- **Loading:** ActivityIndicator
- **Error:** красный текст ошибки
- **Empty:** "Нет профилей"
- **Success:** список карточек специалистов

**Подсказка вверху:** "Профили исполнителей. Значок «verified» добавляет/убирает кнопка одобрения."

**Данные в карточке специалиста:**
1. @nick + дата обновления (DD.MM.YY)
2. Email пользователя
3. Города через запятую (если есть)
4. Услуги через запятую (до 2 строк)
5. Знаки (badges) через запятую (если есть)
6. Кнопки: "Одобрить" (зелёная рамка) / "Отклонить" (красная рамка)

**Логика кнопок:**
- "Одобрить": добавляет 'verified' в badges через `PATCH /specialists/:userId/badges`; disabled если уже verified; текст меняется на "Одобрен" (opacity 0.7)
- "Отклонить": убирает 'verified' из badges; disabled если нет verified
- ActionLoading: индивидуальный spinner на карточке при запросе
- Оптимистичное обновление state при успехе, Alert при ошибке

**Edge cases:**
- Нет пагинации — загружаются все специалисты (GET /admin/specialists)
- Два админа одновременно: последний PATCH побеждает (нет optimistic lock)

**Acceptance criteria:**
- [ ] Список всех специалистов загружается
- [ ] Кнопка "Одобрить" добавляет verified бейдж
- [ ] Кнопка "Отклонить" убирает verified бейдж
- [ ] Spinner показывается пока запрос выполняется
- [ ] Ошибка отображается через Alert

---

## UC-053: Управление продвижениями и ценами

**Актор:** ADMIN
**Основной поток:**
1. `GET /promotions/admin` — все продвижения
2. `GET/PATCH /promotions/admin/prices` — цены по тирам

**UI состояния:**
- **Loading:** ActivityIndicator
- **Error:** красный текст ошибки
- **Empty:** "Нет продвижений"
- **Success:** редактор цен + таблица цен + список промоций

**Секция "Настройка цен":**
- Input "Город" (TextInput, autoCapitalize="words")
- Тир: 3 кнопки — "Базовое" / "Выделенное" / "Топ"
- Input "Цена (руб.)" (keyboardType="numeric")
- Кнопка "Сохранить цену" → `PATCH /promotions/admin/prices { city, tier, price }`

**Валидация (клиентская):**
- Город пустой → Alert "Введите город"
- Цена <= 0 или NaN → Alert "Введите корректную цену"

**Секция "Текущие цены":**
- Таблица: Город | Тир (Базовое/Выделенное/Топ) | Цена (руб.)
- Серверная логика приоритета цен: city-specific DB > global default DB > hardcoded (BASIC=500, FEATURED=1500, TOP=3000)

**Секция "Активные продвижения" (счётчик в заголовке):**
- Карточки промоций: @nick (или email) + тир-пилл (цветовой код: BASIC=info, FEATURED=accent, TOP=warning)
- Город + дата истечения ("До: DD.MM.YY" или "Истёк: DD.MM.YY" красным)
- Истёкшие промоции с пониженной opacity и светлой рамкой

**Edge cases:**
- Нет пагинации — загружаются все промоции
- Истёкшие промоции отображаются (не удалены ещё cron) — визуально отмечены
- Alert "Готово" после успешного сохранения цены

**Acceptance criteria:**
- [ ] Цены загружаются и отображаются в таблице
- [ ] Новая цена сохраняется и таблица обновляется
- [ ] Промоции отображаются с тир-пиллами
- [ ] Истёкшие промоции визуально отличаются

---

## [x] UC-071: Admin — просмотр и удаление отзывов

**Актор:** ADMIN
**Цель:** Модерировать отзывы на платформе

**Основной поток:**
1. `(admin)/reviews.tsx` — список всех отзывов (rating, comment, specialist, client, date)
2. `GET /reviews/admin?page=` — пагинация (фактический endpoint)
3. Кнопка "Удалить" → `DELETE /reviews/admin/:id`

**Бизнес-правила:**
- Admin может удалить любой отзыв (модерация спама/оскорблений)

**UI состояния:**
- **Loading:** ActivityIndicator
- **Error:** красный текст ошибки
- **Empty:** "Нет отзывов"
- **Success:** список карточек + пагинация

**Подсказка вверху:** "Всего отзывов: N. Страница X из Y."

**Данные в карточке отзыва:**
1. Звёзды (****· формат, N/5) + дата (DD.MM.YY)
2. Комментарий (до 3 строк) или "Без комментария" (italic, muted)
3. Метаданные: "Исполнитель: @nick" + "Клиент: email"
4. Кнопка "Удалить" (красная рамка)

**Удаление:**
- Alert подтверждения: "Удалить отзыв? Отзыв от {email} на @{nick}"
- Кнопки: "Отмена" / "Удалить" (destructive)
- При успехе: оптимистичное удаление из items, total уменьшается на 1
- При ошибке: Alert "Ошибка"

**Пагинация:**
- Кнопки "Назад" / "Вперёд" с pageInfo "X / Y" между ними
- pageSize = 20 (хардкод в UI)
- Disabled при page=1 (назад) или page=totalPages (вперёд)

**Edge cases:**
- Удаление последнего отзыва на странице: список остаётся пустым, не переключает на предыдущую страницу автоматически
- API отдаёт `{ items, total, page, pageSize }` — пагинация серверная

**Acceptance criteria:**
- [ ] Список отзывов загружается с пагинацией
- [ ] Кнопка "Удалить" показывает подтверждение
- [ ] После удаления карточка исчезает без перезагрузки
- [ ] Пагинация работает: "Назад" / "Вперёд"

---

## [x] UC-077: Admin — блокировка пользователя

**Актор:** ADMIN
**Цель:** Заблокировать нарушителя

**Основной поток:**
1. В списке пользователей → кнопка "Блок"/"Разблок"
2. `PATCH /admin/users/:id { isBlocked: true }` — устанавливает флаг isBlocked
3. При следующем входе заблокированный получает 403 "Account blocked"
4. Разблокировка: `PATCH /admin/users/:id { isBlocked: false }`

**Бизнес-правила:**
- isBlocked проверяется в JwtAuthGuard при каждом запросе
- Добавить поле isBlocked в Prisma User model

**UI (интегрирован в /(admin)/users.tsx):**
- Кнопка "Блок" (красная рамка) / "Разблок" (brandPrimary рамка) в footer карточки
- Alert подтверждения: заголовок "Блокировка"/"Разблокировка", текст "{Действие} пользователя {email}?"
- Кнопки: "Отмена" / "Заблокировать" (destructive) или "Разблокировать" (default)
- blockingId state: блокирует UI кнопки для конкретного пользователя, spinner при загрузке
- Оптимистичное обновление: карточка обновляется без перезагрузки списка
- Заблокированная карточка: красная рамка + бейдж "Заблокирован" (error variant) + opacity 0.85

**Edge cases:**
- Двойной клик: blockingId guard предотвращает повторный запрос
- Ошибка API → Alert "Не удалось обновить статус"
- Админ не может заблокировать себя — нет защиты в UI (только если API проверяет)

**Acceptance criteria:**
- [ ] Кнопка "Блок" показывает подтверждение
- [ ] После блокировки карточка визуально меняется (красная рамка + бейдж)
- [ ] Кнопка "Разблок" снимает блокировку
- [ ] Spinner показывается во время запроса
- [ ] Заблокированный пользователь получает 403 при следующем запросе

---

# PLATFORM

## UC-060: Лэндинг

**Актор:** PUBLIC
**Основной поток:**
- Секции: Hero + CTA, Launch Banner, How It Works, Typical Tasks, For Whom, Trust, Reviews (фейковые), FAQ, Final CTA, Footer
- CTA: "Найти специалиста" → /specialists, "Я специалист" → /(auth)/email?role=SPECIALIST
- SEO мета-теги

**SEO:**
- `<title>`: "Налоговик — найдите налогового специалиста"
- `<meta name="description">`: "Налоговые консультанты и юристы в вашем городе. Опишите задачу бесплатно и получите предложения от проверенных специалистов."
- `og:title`: "Налоговик — найдите налогового специалиста"
- `og:description`: дублирует description
- `og:url`: `${APP_URL}`

**Динамические данные (загружаются при mount):**
- `GET /specialists/featured?limit=8` → featuredSpecialists (пока не отображается в UI)
- `GET /requests/recent?limit=5` → recentRequests (пока не отображается в UI)
- `GET /specialists/cities/popular?limit=10` → popularCities (пока не отображается в UI)

**Полный список секций:**

**1. Hero (paddingVertical: 80px)**
- Заголовок: "Проблемы с налоговой?\nНайдём специалиста за 1 час"
- Подзаголовок: "Юристы и налоговые консультанты в вашем городе. Опубликуйте запрос бесплатно — получите предложения от проверенных специалистов"
- QuickRequestForm (UC-079) — встроена в Hero
- 3 CTA-кнопки: "Найти специалиста" (primary) → /specialists, "Разместить запрос" (outline) → /(auth)/email?redirectTo=/(dashboard)/requests/new, "Я специалист" (outline) → /(auth)/email?role=SPECIALIST
- Desktop: справа — Hero image (Unsplash, 400px height), fallback — gradient

**2. Launch Banner (bgSecondary)**
- Текст: "Первые специалисты уже на платформе — присоединяйтесь!"
- Кнопка: "Посмотреть специалистов" → /specialists

**3. Как это работает (white bg)**
- 3 шага:
  1. "Опишите задачу" — "Что нужно сделать, срок, бюджет"
  2. "Получите отклики" — "Специалисты из вашего города пришлют предложения"
  3. "Выберите и платите" — "Безопасная сделка, деньги переходят после выполнения"
- Нумерованные синие кружки (48x48)

**4. Типичные задачи (bgPrimary)**
- Заголовок: "Типичные задачи", подзаголовок: "Что решает платформа"
- 6 карточек: "Декларация 3-НДФЛ", "Спор с налоговой инспекцией", "Оптимизация налогообложения", "Регистрация ИП или ООО", "Налоговый вычет", "Проверка налоговых рисков"
- Desktop: 3 колонки (31%), Mobile: 2 колонки (47%)

**5. Для кого (white bg)**
- 2 карточки с фото (Unsplash):
  - "Заказчикам" (Физлица, ИП и компании): Декларации, Споры с ФНС, Оптимизация, Регистрация бизнеса
  - "Специалистам" (Юристы и налоговые консультанты): Стабильный поток клиентов, Работа в своём городе, Гибкий график, Продвижение профиля

**6. Как мы проверяем специалистов (bgSecondary)**
- 3 пункта с галочками: "Верификация документов", "Реальные отзывы", "Безопасная оплата"

**7. Отзывы клиентов (white bg)**
- 3 фейковых отзыва (hardcoded):
  - Анна К., Москва — про налоговый вычет
  - Дмитрий В., Екатеринбург — про спор с ФНС
  - Марина С., Казань — про регистрацию ООО
- 5 звёзд у каждого

**8. FAQ (bgPrimary)**
- 4 вопроса-ответа (hardcoded):
  - "Сколько стоит разместить запрос?" — бесплатно
  - "Как быстро придут отклики?" — 1-2 часа
  - "Как защищены мои деньги?" — escrow (резервирование)
  - "Что если результат не устроит?" — открыть спор

**9. Final CTA (dark bg #0F2447)**
- "Начните прямо сейчас — это бесплатно"
- "Тысячи специалистов готовы помочь с вашей налоговой задачей"
- 3 кнопки: "Найти специалиста" (white), "Разместить запрос" (outline-white), "Зарегистрироваться как специалист" (outline-white)

**10. Footer (dark bg)**
- Логотип "Н" + "Налоговик"
- Ссылки: Специалисты · Запросы · Тарифы · О платформе (scroll to #how-it-works)
- Copyright: "(c) YYYY Налоговик"

**Responsive:**
- Mobile: все секции в одну колонку, шрифт hero 32px, кнопки width 100%
- Tablet: maxWidth 900, hero image скрыт
- Desktop: maxWidth 1200, hero — два столбца (текст + image), кнопки в ряд, задачи 3 колонки

**Edge cases:**
- Hero image Unsplash не загрузился → fallback синий gradient
- API featured/recent/popular — fire-and-forget (ошибки игнорируются, данные пока не используются в UI)

**Acceptance criteria:**
- [ ] Лэндинг загружается без авторизации
- [ ] Все 10 секций отображаются
- [ ] QuickRequestForm работает (UC-079)
- [ ] CTA "Найти специалиста" → /specialists
- [ ] CTA "Разместить запрос" → auth → create request
- [ ] CTA "Я специалист" → auth с role=SPECIALIST
- [ ] Desktop: двухколоночный hero, 3-колоночные задачи
- [ ] Mobile: одноколоночный layout, кнопки на всю ширину
- [ ] Footer ссылки работают

---

## [x] UC-078: CTA "Разместить запрос" на лэндинге

**Актор:** PUBLIC (потенциальный клиент)
**Цель:** Прямой путь к созданию запроса с лэндинга

**Основной поток:**
1. На лэндинге — кнопка "Разместить запрос" → `/(auth)/email?redirectTo=%2F(dashboard)%2Frequests%2Fnew`
2. Авторизация → redirect на /(dashboard)/requests/new → создание запроса

**Бизнес-правила:**
- Кнопка в Hero секции (рядом с "Найти специалиста") — variant "outline"
- Кнопка в Final CTA секции — variant "outline-white"
- redirectTo закодирован: `%2F(dashboard)%2Frequests%2Fnew`
- НЕ передаёт role= → если новый пользователь, показывается role screen

**UI (фактическая реализация):**
- Hero: кнопка "Разместить запрос" (outline, #1A5BA8 рамка)
- Final CTA: кнопка "Разместить запрос" (outline-white)
- Mobile: width 100%, Desktop: minWidth 200px

**Acceptance criteria:**
- [ ] Кнопка "Разместить запрос" видна в Hero
- [ ] Клик → auth → redirect на создание запроса
- [ ] Для нового пользователя: auth → role screen → dashboard → requests/new

---

## [x] UC-079: Быстрый запрос с лэндинга (Quick Request Flow)

**Актор:** PUBLIC (потенциальный клиент)
**Цель:** Создать запрос прямо на лэндинге без предварительной регистрации

**Основной поток:**
1. На лэндинге — форма "Быстрый запрос": описание + город (обязательные)
2. Нажать "Найти специалиста" → экран email ввода (встроен в flow)
3. OTP верификация → пользователь создаётся как CLIENT
4. Запрос создаётся автоматически с введёнными данными
5. Redirect на `(dashboard)/requests/[id]` — страница нового запроса

**Альтернативные потоки:**
- A1: Пользователь уже зарегистрирован → данные запроса передаются как URL params → после входа создаётся запрос

**Бизнес-правила:**
- Данные запроса временно хранятся в AsyncStorage до завершения авторизации
- После создания запроса — email-уведомление специалистам

**UI формы (QuickRequestForm, встроен в Hero секцию):**
- Заголовок: "Опишите задачу"
- TextInput (multiline, 3 строки, minHeight 80px, maxLength 500): placeholder "Нужна помощь с налоговой декларацией..."
- Города: 5 чипов из топ-10 ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань"]
- Кнопка: "Найти специалиста →" (primary, brandPrimary)
- Ошибки: красный текст под чипами

**Валидация:**
- description.trim().length < 3 → "Описание слишком короткое"
- Город не выбран → "Выберите город"
- Description обрезается до 500 символов при сохранении

**Хранение:**
- `secureStorage.setItem('p2ptax_pending_request', JSON.stringify({ description, city }))`
- Redirect: `/(auth)/email` (без параметров)
- Ожидается, что после auth клиентский код проверяет наличие pending_request и создаёт запрос автоматически

**Edge cases:**
- Только первые 5 городов из QUICK_REQUEST_CITIES отображаются (из 10 в массиве)
- Свободный ввод города не поддерживается — только выбор из чипов
- Если pending_request не обработан после auth — данные остаются в storage

**Acceptance criteria:**
- [ ] Форма отображается в Hero секции лэндинга
- [ ] Ввод описания < 3 символов → ошибка
- [ ] Город не выбран → ошибка
- [ ] Данные сохраняются в secureStorage
- [ ] Redirect на auth после submit
- [ ] После auth запрос создаётся автоматически из pending_request

---

## UC-061: SEO

**Актор:** SYSTEM
**Реализация:**
- Landing, /specialists, /specialists/[nick], /requests — мета-теги через expo-router/head

**Покрытие мета-тегами по страницам:**

| Страница | title | description | og:title | og:description | og:url |
|----------|-------|-------------|----------|----------------|--------|
| `/` (Landing) | Да | Да | Да | Да | Да |
| `/specialists` | Да | Да | Да | Да | Да |
| `/specialists/[nick]` | Да (Stack.Screen) | Нет | Нет | Нет | Нет |
| `/requests` | Да | Да | Да | Да | Да |
| `/requests/[id]` | Нет | Нет | Нет | Нет | Нет |

**Не реализовано:**
- Structured data (JSON-LD) — нигде
- og:type — нигде
- og:image — нигде
- canonical URL — нигде
- robots meta — нигде
- `/specialists/[nick]` — нет description и OG тегов (только Stack.Screen title)
- `/requests/[id]` — нет мета-тегов вообще

**Acceptance criteria:**
- [ ] Landing, /specialists, /requests имеют title + description + OG
- [ ] /specialists/[nick] имеет динамический title

---

## UC-062: Настройки аккаунта

**Актор:** CLIENT / SPECIALIST
**Основной поток:**
1. `GET /users/me/settings` → `{ emailNotifications }`
2. Toggle → `PATCH /users/me/settings { emailNotifications }`

> Note (BizComplete): emailNotifications сохраняется в БД. ИСПРАВЛЕНО: проверка emailNotifications реализована во всех местах отправки (UC-072).

**Валидация:**
- emailNotifications: boolean (IsBoolean, IsOptional в DTO)
- Сохраняется в поле `user.emailNotifications` (boolean, default true в Prisma)

**Acceptance criteria:**
- [ ] Toggle emailNotifications сохраняется в БД
- [ ] После отключения — email-уведомления не отправляются (UC-072)

---

# SYSTEM / INFRASTRUCTURE

## [x] UC-070: Cron — очистка expired OTP и revoked refresh tokens

**Актор:** SYSTEM
**Цель:** Предотвратить бесконечный рост таблиц otp_codes и refresh_tokens

**Основной поток:**
1. Cron (ежедневно в 02:00) удаляет:
   - `otp_codes` где `expiresAt < now - 24h`
   - `refresh_tokens` где `revoked = true OR expiresAt < now - 7d`

**Бизнес-правила:**
- Оставить буфер 24h для отладки (не удалять немедленно)

**Фактическая реализация (cleanup.service.ts):**

| Задача | Cron | Файл | Описание |
|--------|------|------|----------|
| OTP cleanup | `0 * * * *` (каждый час) | cleanup.service.ts | Удаляет `otp_codes` где `expiresAt < now` |
| Token cleanup | `0 3 * * *` (ежедневно 03:00 UTC) | cleanup.service.ts | Удаляет `refresh_tokens` где `revoked = true OR expiresAt < now` |
| Promotion expiry reminders | `0 9 * * *` (ежедневно 09:00 UTC) | cleanup.service.ts | UC-076 |
| Deactivate expired promotions | `EVERY_HOUR` | promotions.service.ts | Удаляет `promotions` где `expiresAt <= now` |

**Расхождения UC vs код:**
- UC говорит "02:00" для cleanup — фактически OTP каждый час, токены в 03:00 UTC
- UC говорит "expiresAt < now - 24h" — фактически `expiresAt < now` (без буфера 24h)
- UC говорит "expiresAt < now - 7d" для токенов — фактически `expiresAt < now` (без буфера 7d)

**Логирование:**
- `Logger(CleanupService.name)` — все задачи логируют количество удалённых записей
- Формат: "Deleted N expired OTP codes", "Deleted N revoked refresh tokens"

**Мониторинг:**
- Нет внешнего мониторинга cron задач
- Нет алертов при сбое cron

**Acceptance criteria:**
- [ ] OTP cleanup запускается каждый час
- [ ] Token cleanup запускается ежедневно
- [ ] Логи записываются для каждого запуска
- [ ] Promotion deactivation работает ежечасно

---

## [x] UC-072: Проверка emailNotifications перед отправкой

**Актор:** SYSTEM
**Цель:** Уважать выбор пользователя отключить email-уведомления

**Основной поток:**
1. Перед каждым вызовом EmailService — проверить `user.emailNotifications === true`
2. Если false — не отправлять

**Затронутые события:**
- Новый отклик на запрос клиента
- Новое сообщение (получатель offline)
- Новый запрос в городе специалиста
- Истечение продвижения (UC-076)

**Фактическая реализация (СТАТУС: РЕАЛИЗОВАНО):**

| Событие | Файл | Проверка emailNotifications |
|---------|------|-----------------------------|
| Новый отклик на запрос | requests.service.ts:230 | `request.client.emailNotifications` — Да |
| Новый запрос в городе | requests.service.ts:77-82 | `p.user.emailNotifications` — Да |
| Новое сообщение (chat) | chat.gateway.ts:168-170 | `recipient.emailNotifications` — Да |
| Promotion expiry reminder | cleanup.service.ts:64-68 | `p.specialist.emailNotifications` — Да |
| OTP email | email.service.ts | Не проверяется (правильно: OTP всегда отправляется) |

**Тексты email-уведомлений:**

1. **Новый отклик** (notifyNewResponse):
   - Subject: "Новый отклик на ваш запрос — Налоговик"
   - Body: "На ваш запрос #{requestId} поступил новый отклик от специалиста.\n\nОткройте приложение, чтобы ознакомиться с предложением и связаться со специалистом."

2. **Новое сообщение** (notifyNewMessage):
   - Subject: "Новое сообщение — Налоговик"
   - Body: "Вам пришло новое сообщение от {senderEmail}.\n\nОткройте приложение, чтобы ответить."

3. **Новый запрос в городе** (notifyNewRequestInCity):
   - Subject: "Новый запрос в городе {city} — Налоговик"
   - Body: "В городе {city} появился новый запрос клиента:\n\n\"{description (до 200 символов)}...\"\n\nОткройте приложение, чтобы откликнуться."

4. **Promotion expiry** (notifyPromotionExpiringSoon):
   - Subject: "Продвижение истекает через 3 дня"
   - Body: "Ваше продвижение в городе {city} истекает через 3 дня.\n\nОбратитесь через чат для продления."

5. **OTP** (sendOtp):
   - Subject: "Ваш код для входа — Налоговик"
   - Body: "Ваш код для входа: {code}\n\nКод действителен 10 минут. Если вы не запрашивали код, проигнорируйте это письмо."

**Dev mode:** если SMTP_HOST не задан — email логируется в консоль, не отправляется

**Acceptance criteria:**
- [ ] Отключение emailNotifications прекращает все уведомления кроме OTP
- [ ] OTP всегда отправляется независимо от настройки
- [ ] Все 4 события проверяют флаг перед отправкой

---

## [x] UC-073: Публичный endpoint ленты запросов

**Актор:** SYSTEM
**Цель:** Убрать JwtAuthGuard с GET /requests для публичного доступа

**Реализация:**
- Заменить `@UseGuards(JwtAuthGuard)` на `@UseGuards(OptionalJwtGuard)` на `GET /requests`
- OptionalJwtGuard: если токен есть — декодирует user, если нет — req.user = null
- Фронт: публичная страница /requests работает без авторизации

**Acceptance criteria:**
- [ ] GET /requests без токена → 200 с данными (не 401)
- [ ] GET /requests с токеном → 200 (req.user заполнен)
- [ ] Фронт /requests загружается без авторизации

---

## [x] UC-074: Публичный endpoint деталей запроса

**Актор:** SYSTEM
**Цель:** Убрать проверку clientId для публичного просмотра запроса

**Реализация:**
- Убрать проверку `request.clientId !== userId` для публичного чтения
- Публичный запрос возвращает: description, city, budget, category, status, createdAt, _count откликов
- Приватные данные (отклики с контактами) — только для владельца запроса
- Или отдельный `GET /requests/:id/public` (без откликов)

**Acceptance criteria:**
- [ ] GET /requests/:id без токена → 200 с публичными полями
- [ ] GET /requests/:id с токеном владельца → 200 с полными данными (+ responses)
- [ ] GET /requests/:id с токеном другого пользователя → 200 с публичными полями
- [ ] Фронт /requests/[id] загружается без авторизации

---

## [x] UC-075: Пагинация каталога специалистов

**Актор:** SYSTEM
**Цель:** Предотвратить OOM при >1000 специалистов в каталоге

**Реализация:**
- `GET /specialists?page=1&limit=9` — пагинация (default limit=9)
- Возврат `{ items: SpecialistItem[], total: number, page: number, pages: number }`
- Фронт: кнопка "Загрузить ещё" (append=true добавляет к существующим items)

**Фактическая реализация (specialists.service.ts getCatalog):**
- PASS 1: Загружает ВСЕ отфильтрованные профили (lightweight select: userId, experience, createdAt)
- Загружает ВСЕ активные промоции для matching userIds
- Вычисляет activity (response counts, rating) для ВСЕХ профилей
- Сортирует in-memory (promoted → sort param)
- Пагинация: `slice(skip, skip + limit)` по отсортированному массиву
- PASS 2: Загружает полные данные только для pageUserIds
- Контакты, bio, id, userId — стрипаются из ответа каталога

**Фронт (PAGE_SIZE=9):**
- Состояние: page, hasMore (page < data.pages)
- "Загрузить ещё": fetchSpecialists(page + 1, true) — append mode
- При смене фильтров: fetchSpecialists(1, false) — replace mode

**Ограничения:**
- PASS 1 всё ещё загружает все профили в память для сортировки (OOM при >100k)
- Для MVP достаточно, для масштабирования нужен cursor-based pagination

**Acceptance criteria:**
- [ ] API возвращает { items, total, page, pages }
- [ ] Фронт показывает "Загрузить ещё" когда hasMore
- [ ] Смена фильтров сбрасывает на page=1

---

## [x] UC-076: Уведомление об истечении продвижения

**Актор:** SYSTEM
**Цель:** Напомнить специалисту о скором истечении продвижения

**Основной поток:**
1. Cron (ежедневно) находит активные промоции с `expiresAt` в течение 3 дней
2. Отправляет email специалисту: "Ваше продвижение в городе X истекает через 3 дня"
3. Флаг `reminderSent` в Promotion — не отправлять повторно

**Бизнес-правила:**
- Уведомление только если `emailNotifications = true` у специалиста
- Один раз на промоцию (флаг reminderSent)

**Фактическая реализация (cleanup.service.ts sendPromotionExpiryReminders):**
- Cron: `0 9 * * *` (ежедневно 09:00 UTC)
- Запрос: `promotion.findMany({ where: { reminderSent: false, expiresAt: { gt: now, lte: threeDaysLater } }, include: { specialist: { email, emailNotifications } } })`
- Фильтрация: только `specialist.emailNotifications === true`
- Отправка: `emailService.notifyPromotionExpiringSoon(email, city)` (последовательно)
- Обновление: `promotion.updateMany({ where: { id: { in: ids }, reminderSent: false }, data: { reminderSent: true } })`
- Лог: "Promotion reminders sent: N"

**Email:**
- Subject: "Продвижение истекает через 3 дня"
- Body: "Ваше продвижение в городе {city} истекает через 3 дня.\n\nОбратитесь через чат для продления."

**Edge cases:**
- Если emailNotifications=false — промоция не отмечается reminderSent (повторно проверится если пользователь включит уведомления)
- Ошибка отправки одного email — другие не блокируются (catch в emailService)
- Cron 09:00 UTC = 12:00 MSK

**Acceptance criteria:**
- [ ] Cron запускается ежедневно в 09:00 UTC
- [ ] Email отправляется за 3 дня до истечения
- [ ] reminderSent предотвращает повторную отправку
- [ ] emailNotifications=false — email не отправляется

---

## SCREEN INVENTORY

| # | Route | File | Component | UC Ref | Guest | Status |
|---|-------|------|-----------|--------|-------|--------|
| 1 | `/` | `app/index.tsx` | LandingScreen | UC-060, UC-078, UC-079 | public | OK |
| 2 | `/pricing` | `app/pricing.tsx` | PricingScreen | NONE | public | ORPHAN |
| 3 | `/dashboard` | `app/dashboard.tsx` | DashboardRedirect | — | redirect | OK |
| 4 | `/+not-found` | `app/+not-found.tsx` | NotFoundScreen | — | public | OK |
| 5 | `/(auth)/email` | `app/(auth)/email.tsx` | EmailScreen | UC-001 | public | OK |
| 6 | `/(auth)/otp` | `app/(auth)/otp.tsx` | OtpScreen | UC-001 | public | OK |
| 7 | `/(auth)/role` | `app/(auth)/role.tsx` | RoleScreen | UC-002 | public | OK |
| 8 | `/(onboarding)/username` | `app/(onboarding)/username.tsx` | UsernameScreen | UC-003 | auth_required | OK |
| 9 | `/(onboarding)/cities` | `app/(onboarding)/cities.tsx` | CitiesScreen | UC-003 | auth_required | OK |
| 10 | `/(onboarding)/fns` | `app/(onboarding)/fns.tsx` | FNSScreen | UC-003 | auth_required | OK |
| 11 | `/(onboarding)/services` | `app/(onboarding)/services.tsx` | ServicesScreen | UC-003 | auth_required | OK |
| 12 | `/(dashboard)` | `app/(dashboard)/index.tsx` | DashboardHub | UC-011, UC-021 | auth_required | OK |
| 13 | `/(dashboard)/profile` | `app/(dashboard)/profile.tsx` | SpecialistProfileScreen | UC-020 | auth_required | OK |
| 14 | `/(dashboard)/specialist-profile` | `app/(dashboard)/specialist-profile.tsx` | SpecialistProfileSetupScreen | UC-003 (alt) | auth_required | ORPHAN |
| 15 | `/(dashboard)/requests` | `app/(dashboard)/requests/index.tsx` | MyRequestsScreen | UC-011 | auth_required | OK |
| 16 | `/(dashboard)/requests/new` | `app/(dashboard)/requests/new.tsx` | CreateRequestScreen | UC-010 | auth_required | OK |
| 17 | `/(dashboard)/requests/[id]` | `app/(dashboard)/requests/[id].tsx` | RequestDetailScreen | UC-012, UC-013 | auth_required | OK |
| 18 | `/(dashboard)/requests/edit/[id]` | `app/(dashboard)/requests/edit/[id].tsx` | EditRequestScreen | UC-013 | auth_required | OK |
| 19 | `/(dashboard)/responses` | `app/(dashboard)/responses.tsx` | MyResponsesScreen | UC-023 | auth_required | OK |
| 20 | `/(dashboard)/city-requests` | `app/(dashboard)/city-requests.tsx` | CityRequestsScreen | UC-021 | auth_required | OK |
| 21 | `/(dashboard)/messages` | `app/(dashboard)/messages/index.tsx` | MessagesScreen | UC-031, UC-032 | auth_required | OK |
| 22 | `/(dashboard)/messages/[threadId]` | `app/(dashboard)/messages/[threadId].tsx` | ThreadScreen | UC-030, UC-031 | auth_required | OK |
| 23 | `/(dashboard)/promotion` | `app/(dashboard)/promotion.tsx` | PromotionScreen | UC-024 | auth_required | DEAD |
| 24 | `/(dashboard)/settings` | `app/(dashboard)/settings.tsx` | SettingsScreen | UC-004, UC-005, UC-015, UC-062 | auth_required | OK |
| 25 | `/specialists` | `app/specialists/index.tsx` | SpecialistsCatalogScreen | UC-040 | public | OK |
| 26 | `/specialists/[nick]` | `app/specialists/[nick].tsx` | SpecialistProfileScreen | UC-041 | public | OK |
| 27 | `/requests` | `app/requests/index.tsx` | RequestsFeedScreen | UC-042 | public | OK |
| 28 | `/requests/[id]` | `app/requests/[id].tsx` | RequestDetailScreen | UC-043 | public | OK |
| 29 | `/(admin)` | `app/(admin)/index.tsx` | AdminDashboard | UC-050 | auth_required (ADMIN) | OK |
| 30 | `/(admin)/users` | `app/(admin)/users.tsx` | AdminUsers | UC-051, UC-077 | auth_required (ADMIN) | OK |
| 31 | `/(admin)/moderation` | `app/(admin)/moderation.tsx` | AdminModeration | UC-052 | auth_required (ADMIN) | OK |
| 32 | `/(admin)/promotions` | `app/(admin)/promotions.tsx` | AdminPromotions | UC-053 | auth_required (ADMIN) | OK |
| 33 | `/(admin)/reviews` | `app/(admin)/reviews.tsx` | AdminReviews | UC-071 | auth_required (ADMIN) | OK |
| 34 | `/(admin)/requests` | `app/(admin)/requests.tsx` | AdminRequests | UC-051 | auth_required (ADMIN) | OK |

### Проблемы
- **DEAD (1):** `/(dashboard)/promotion` — экран есть, навигации на него нет
- **ORPHAN (2):** `/pricing` (нет UC), `/(dashboard)/specialist-profile` (UC-003 частично)
- **MISSING (2):** UC-014 (форма отзыва — нет экрана), UC-079 (Quick Request — только CTA, нет формы)
- **DUPLICATE имена:** RequestDetailScreen (2 файла), SpecialistProfileScreen (2 файла)

### Статистика
- Всего экранов: 34 | Покрыто UC: 30 (88%) | Dead: 1 | Orphan: 2 | Missing: 2

---

<!-- COLLEGIUM_DECISIONS
{
  "UC-042": { "decision": "fix", "reason": "убрать JwtAuthGuard, OptionalJwtGuard", "date": "2026-04-03", "by": "user" },
  "UC-043": { "decision": "fix", "reason": "убрать clientId check для публичного доступа", "date": "2026-04-03", "by": "user" },
  "UC-071": { "decision": "approved", "reason": "добавить admin reviews screen", "date": "2026-04-03", "by": "user" },
  "UC-073": { "decision": "approved", "reason": "auto — критический баг", "date": "2026-04-03", "by": "collegium" },
  "UC-074": { "decision": "approved", "reason": "auto — критический баг", "date": "2026-04-03", "by": "collegium" },
  "UC-076": { "decision": "approved", "reason": "уведомлять за 3 дня", "date": "2026-04-03", "by": "user" },
  "UC-077": { "decision": "approved", "reason": "добавить блокировку пользователей", "date": "2026-04-03", "by": "user" },
  "UC-078": { "decision": "approved", "reason": "добавить CTA на лэндинге", "date": "2026-04-03", "by": "user" },
  "UC-079": { "decision": "approved", "reason": "quick-request flow с лэндинга", "date": "2026-04-03", "by": "user" },
  "Q-admin-moderation-buttons": { "decision": "connect-to-api", "reason": "связать с PATCH /specialists/:id/badges", "date": "2026-04-03", "by": "user" },
  "Q-verified-badges-docs": { "decision": "backlog", "reason": "слишком сложно для MVP", "date": "2026-04-03", "by": "user" },
  "Q-quick-request-landing": { "decision": "approved", "reason": "UC-079 создан", "date": "2026-04-03", "by": "user" },
  "Q-weighted-rating": { "decision": "backlog", "reason": "MVP: avg достаточно", "date": "2026-04-03", "by": "collegium" },
  "Q-monthly-subscription": { "decision": "backlog", "reason": "per-city уже реализовано", "date": "2026-04-03", "by": "collegium" },
  "Q-push-notifications": { "decision": "backlog", "reason": "email работает для MVP", "date": "2026-04-03", "by": "collegium" }
}
-->
