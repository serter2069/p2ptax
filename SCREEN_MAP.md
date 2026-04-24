# SCREEN MAP: P2PTax

## SDLC Status

<!-- SDLC_STATE_BEGIN -->
```yaml
phase: 6-TEST
started_at: 2026-04-18
updated_at: "2026-04-19T12:00:00Z"
phases:
  SA: {status: DONE}
  CICD: {status: DONE}
  BRAND: {status: DONE}
  SCREEN_MAP: {status: DONE}
  DEV: {status: DONE}
  TEST: {status: IN_PROGRESS}
screens:
  total: 27
  done: 27
  in_progress: 0
  todo: 0
cycles:
  audit:
    run_count: 4
    last_commit: "316a9c7"
    last_run:
      date: "2026-04-19"
      todo_before: 0
      todo_after: 0
      batches: 0
      strategy: default
  audit_quality:
    run_count: 0
    last_run: null
  test:
    run_count: 3
    last_run: null
  verify:
    total_runs: 0
    escalations_to_opus: 0
    stops: 0
autopilot:
  mode: manual
  paused: false
  gate_grace_min: 10
  last_event_at: null
  last_gate_shown_at: null
  last_gate_phase: null
  tick_count_same_phase: 0
  last_phase_seen: null
  stops:
    critical_bug: false
    auth_broken: false
    verify_3fail: null
    blocker_issue: null
```
<!-- SDLC_STATE_END -->


> System Analysis: https://diagrams.love/canvas?schema=cmnw5361i000czmerbi780b2j

## Global Layout Rules (ALL screens)

### Responsive
- Mobile (<640px): content full width, `px-4` (16px padding)
- Desktop (>=640px): content `style={{ maxWidth: 520, width: "100%", alignSelf: "center" }}`
- FORBIDDEN: fixed px widths that break on any viewport

### Auth screens (login, OTP, onboarding)
- Header: back button left + title center (if there's a screen to go back to)
- Content position: upper third (paddingTop: 12-15%), NOT vertical center
- Logo/brand mark above the form
- Single column

### Tab screens (main tabs — feed, search, favorites, chats, profile)
- Header: Home header (logo + icons)
- Content: full width, ScrollView
- Footer: TabBar on mobile (<640px), hidden on desktop
- Desktop: content area expands, grid columns increase (2→3→4)

### Detail screens (listing detail, chat dialog, settings, etc.)
- Header: Back header (chevron-left + title)
- Content: full width, ScrollView
- No TabBar

### Admin screens
- Sidebar navigation on desktop, burger menu on mobile
- Content: full width with table layouts

### Definition of Done — EVERY screen, NO exceptions

| # | Criterion | How to verify |
|---|-----------|--------------|
| 1 | tsc --noEmit = 0 errors | Run from project root |
| 2 | Desktop screenshot (>640px) | maxWidth respected, layout per category above |
| 3 | Mobile screenshot (375px) | Nothing overflows, touch targets >= 44px |
| 4 | Header matches Layout spec | Back button if spec says so, title correct |
| 5 | ALL UI Elements from spec implemented | Cross-check against screen's UI Elements table |
| 6 | Interactive elements work | Input/delete/submit via comet |
| 7 | States implemented | Loading, Error, Empty where spec requires |
| 8 | Colors ONLY from brand (6+3) | grep hex in file — all match palette |
| 9 | TextInput = inline style only | Zero className on any TextInput (NativeWind web bug) |
| 10 | Russian text, no typos | Read all visible strings on screenshot |

Agent CANNOT self-verify. Orchestrator checks via comet screenshots + UX test.

---

## Design System

### Colors (9 tokens — Navy + Gold)
| Token | Tailwind | Hex | Usage |
|-------|----------|-----|-------|
| primary | blue-900 | #1e3a8a | Buttons, links, active tabs, headers |
| primary-dark | slate-900 | #0f172a | Button pressed state |
| accent | amber-700 | #b45309 | CTA actions (write to specialist), highlights |
| background | white | #ffffff | Page background |
| surface | slate-50 | #f8fafc | Card background, input background |
| text-primary | slate-900 | #0f172a | Headlines, body text |
| error | red-600 | #dc2626 | Validation errors, destructive actions, ban badge |
| success | emerald-600 | #059669 | Active status, available badge |
| warning | amber-500 | #f59e0b | Closing soon badge |

Derivative (from base tokens, not counted):
- text-secondary: slate-400 (captions, placeholders)
- border: slate-200 (input borders, dividers)
- muted: slate-300 (disabled state, "not your region")

### Typography
| Style | Size | Weight | Tailwind | Usage |
|-------|------|--------|----------|-------|
| h1 | 24px | 700 | text-2xl font-bold | Screen titles |
| h2 | 20px | 600 | text-xl font-semibold | Section headers |
| h3 | 18px | 600 | text-lg font-semibold | Card titles, specialist name |
| body | 16px | 400 | text-base | Main text, descriptions |
| caption | 14px | 400 | text-sm | Secondary info, timestamps |
| small | 12px | 400 | text-xs | Badges, hints, counters |

Font family: system default

### Spacing
| Token | Value | Tailwind |
|-------|-------|----------|
| xs | 4px | p-1 / gap-1 |
| sm | 8px | p-2 / gap-2 |
| md | 16px | p-4 / gap-4 |
| lg | 24px | p-6 / gap-6 |
| xl | 32px | p-8 / gap-8 |

### Shared Components

**Button (primary):** bg-blue-900, text white, h-12, rounded-xl, full-width mobile, loading spinner, active:bg-slate-900
**Button (accent):** bg-amber-700, text white, same dimensions, active:bg-amber-800
**Button (secondary):** bg-slate-100, text slate-900, same dimensions, active:bg-slate-200
**Button (danger):** border red-600, text red-600, transparent bg, active:bg-red-50
**Input:** bg-slate-50, border slate-200, h-12, rounded-xl, px-4. Focus: border-2 blue-900. Error: border red-600 bg-red-50 + helper text
**Textarea:** same as Input but multiline, char counter bottom-right (caption)
**Card:** bg white, border slate-200, rounded-xl, p-4, shadow-sm
**Avatar:** round, sizes: sm(32), md(48), lg(72), fallback: initials on blue-100 bg with blue-900 text
**Badge:** min-w-[22px] h-[22px] rounded-full, font small. Variants: error(red-600), success(emerald-600), warning(amber-500)
**Chip:** bg-slate-100, rounded-lg, px-2.5 py-1, text caption. Active: bg-blue-900 text-white
**Empty State:** centered, icon 44px slate-300, title body font-semibold slate-400, subtitle sm slate-400, CTA button primary
**Loading State:** skeleton shimmer (slate-200/slate-100 alternating)
**Error State:** icon red-600, message body, Button "Retry"
**Toast:** bottom center, auto-dismiss 3s, success(emerald)/error(red)

### Header Patterns

**Header-Back:** left arrow, center title font-semibold, h-14, bg white, border-b slate-200, rounded-xl
**Header-Home:** left "P2PTax" bold blue-900, right icon buttons (bell with badge), h-14, bg-blue-900 text-white
**Header-Search:** search icon + full-width input, h-14, bg white, border slate-200

### TabBar

Client tabs: Dashboard | My Requests | Messages
Specialist tabs: Dashboard | Public Requests | My Threads
Admin tabs: Dashboard | Users | Moderation
Active: blue-900, inactive: slate-400, height 60 + safe area

---

## Roles & Access

| Role | Description | Assigned |
|------|-------------|----------|
| guest | Not logged in | Default |
| client | Creates requests, receives messages from specialists | First login without specialist onboarding |
| specialist | Browses requests, writes to clients | After completing 3-step onboarding |
| admin | Full control, stats, moderation | Manually via DB |

---

## Screens

Statuses: `TODO` | `IN PROGRESS` | `DONE`

### PUBLIC

---
**Screen: LandingScreen**
Status: DONE
Type: landing
Route: /
Access: public (guest, client, specialist, admin)

Description: Main landing page with featured specialists and quick request form

Content:
  hero_title: "Налоговая проверка? Найдём специалиста за минуту"
  hero_subtitle: "Бесплатный сервис для связи с налоговыми консультантами по всей России. Выездные, камеральные проверки, оперативный контроль — получите помощь от практиков, а не теоретиков."
  cta_primary: "Оставить заявку"
  cta_secondary: "Войти"
  quick_form_title: "Опишите вашу ситуацию"
  quick_form_city_label: "Город"
  quick_form_city_placeholder: "Выберите город"
  quick_form_service_label: "Тип проверки"
  quick_form_service_placeholder: "Выберите тип"
  quick_form_service_options: ["Выездная проверка", "Камеральная проверка", "Отдел оперативного контроля", "Не знаю"]
  quick_form_description_label: "Описание проблемы"
  quick_form_description_placeholder: "Кратко опишите вашу ситуацию: что случилось, какие документы пришли, что требует инспекция"
  quick_form_submit: "Отправить заявку"
  featured_section_title: "Специалисты на платформе"
  featured_cta: "Все специалисты"
  requests_link: "Все заявки"
  signin_link: "Войти"
  footer_note: "Сервис бесплатный. Мы не берём комиссию и не передаём ваши данные третьим лицам."
  error_title: "Не удалось загрузить данные"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Visual Structure:
  sections:
    - id: hero
      layout: "Полноширинный блок, тёмный фон (blue-900), белый текст"
      headline: "Налоговая проверка? Найдём специалиста за минуту"
      subheadline: "Бесплатный сервис для связи с налоговыми консультантами по всей России. Выездные, камеральные проверки, оперативный контроль — получите помощь от практиков, а не теоретиков."
      cta_button: "Оставить заявку"
      cta_action: "Скролл к форме быстрой заявки"

    - id: benefits
      layout: "3 карточки в ряд (desktop), вертикально (mobile)"
      title: "Почему выбирают Налоговик"
      items:
        - icon: "shield-check"
          title: "Проверенные специалисты"
          description: "Консультанты с реальным опытом работы в налоговых инспекциях вашего города"
        - icon: "clock"
          title: "Быстрый ответ"
          description: "Специалисты отвечают в течение нескольких часов, а не дней"
        - icon: "banknotes-off"
          title: "Полностью бесплатно"
          description: "Никаких комиссий и скрытых платежей — связывайтесь напрямую"

    - id: how_it_works
      layout: "3 шага с нумерацией, горизонтально (desktop)"
      title: "Как это работает"
      steps:
        - number: "1"
          title: "Опишите проблему"
          description: "Укажите город, инспекцию и тип проверки. Добавьте описание ситуации."
        - number: "2"
          title: "Получите сообщения"
          description: "Специалисты из вашего города увидят заявку и напишут вам первыми."
        - number: "3"
          title: "Выберите специалиста"
          description: "Общайтесь в чате, сравнивайте подходы и выбирайте того, кому доверяете."

    - id: quick_form
      layout: "Форма на белом фоне, отступы xl, скруглённая карточка"
      title: "Опишите вашу ситуацию"
      fields: "Город (select), Тип проверки (select), Описание (textarea)"
      submit_button: "Отправить заявку"

    - id: featured_specialists
      layout: "Горизонтальный скролл карточек специалистов"
      title: "Специалисты на платформе"
      card: "Аватар (md), имя, услуги (chips)"
      cta_link: "Все специалисты →"

    - id: final_cta
      layout: "Полноширинный блок, фон surface, текст по центру"
      headline: "Не откладывайте — чем раньше обратитесь, тем больше шансов решить вопрос"
      cta_button: "Оставить заявку бесплатно"
      subtext: "Сервис бесплатный. Мы не берём комиссию и не передаём ваши данные третьим лицам."

Layout:
  - Header: Header-Home (logo left, "Sign In" button right)
  - Body: scroll
  - Footer: none

UI elements:
  - Hero section: title "Find a tax specialist", subtitle
  - Quick request form: city (select), service (select), description (textarea), Button "Submit"
    - If not authenticated: inline OTP flow after submit
  - Featured specialists: horizontal scroll cards (avatar md, name, services chips)
    - Card tap → SpecialistPublicProfile
  - Navigation links: "All Requests" → PublicRequestsFeed, "All Specialists" → SpecialistsCatalog
  - Button "Sign In" → AuthEmail

Acceptance Criteria:
  - [ ] Guest opens "/" → hero section, quick request form, featured specialists visible
  - [ ] Guest fills form (city, service, description) and clicks "Submit" → inline OTP flow appears
  - [ ] Guest taps specialist card → navigates to /specialists/[id]
  - [ ] Guest clicks "Sign In" → navigates to /auth/email

States:
  - Loading: skeleton for featured specialists + form
  - Populated: specialists rendered, form active
  - Error: error message + Retry

Data:
  - GET /api/specialists/featured
  - GET /api/cities
  - POST /api/requests/public (quick form)
  - POST /api/auth/request-otp (inline OTP)

Dependencies: none (entry point)

---
**Screen: PublicRequestsFeed**
Status: DONE
Type: list
Route: /requests
Access: public (guest, client, specialist, admin)

Description: Feed of all active public requests

Content:
  page_title: "Заявки"
  filter_labels:
    city: "Город"
    city_placeholder: "Все города"
    service: "Тип проверки"
    service_placeholder: "Все типы"
  card_template:
    title: "{request.title}"
    chips: "{city.name} · {fns.name}"
    service_chip: "{service.name}"
    description: "{request.description} (2 строки)"
    counter: "{count} специалистов написали"
  sort_options: ["Сначала новые", "Сначала старые"]
  empty_title: "Заявок не найдено"
  empty_description: "Попробуйте изменить фильтры или сбросить их"
  empty_cta: "Сбросить фильтры"
  error_title: "Не удалось загрузить заявки"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Layout:
  - Header: Header-Home, title "Requests"
  - Body: filter bar + vertical scrollable list
  - Footer: TabBar (specialist: tab 1) or none (guest)

UI elements:
  - Filter bar: city (select), service (select — one of 3)
  - Request card: title (h3), city+FNS (chips caption), service (chip), description truncated (body 2 lines), counter "X specialists wrote" (caption)
  - Card tap → PublicRequestDetail
  - Infinite scroll (20 per page)
  - Empty state (no results): "No requests found" + reset filters link
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] User opens /requests → list of active requests loads with cards
  - [ ] User selects city filter → list filters by city
  - [ ] User selects service filter → list filters by service
  - [ ] User scrolls to bottom → next page loads (infinite scroll)
  - [ ] User taps request card → navigates to /requests/[id]
  - [ ] No results → "No requests found" empty state with reset link

States:
  - Loading: skeleton cards
  - Empty: "No requests" illustration + text
  - Populated: list with pagination
  - Error: error + Retry

Data: GET /api/requests/public?city_id=X&service_id=Y&page=1&limit=20
Response: {items: [{id, title, city, fns, service, description, threadsCount, createdAt}], total, hasMore}

Dependencies: none

---
**Screen: PublicRequestDetail**
Status: DONE
Type: detail
Route: /requests/[id]
Access: public (guest, client, specialist, admin)

Description: Full details of a public request

Content:
  header_title: "Заявка"
  section_titles:
    description: "Описание"
    similar: "Похожие заявки"
  meta_labels:
    city: "Город"
    fns: "Инспекция"
    service: "Тип проверки"
    status: "Статус"
    created: "Создана"
    responses: "{count} специалистов написали"
  status_labels:
    active: "Активна"
    closing_soon: "Скоро закроется"
    closed: "Закрыта"
  action_buttons:
    guest: "Войдите, чтобы написать"
    specialist_write: "Написать клиенту"
    specialist_open_chat: "Открыть чат"
  badge_not_your_region: "Не ваш регион"
  error_title: "Заявка не найдена"
  error_description: "Возможно, она была удалена или вы перешли по неверной ссылке"
  error_button: "Назад к заявкам"

Layout:
  - Header: Header-Back, title "Request"
  - Body: scroll
  - Footer: sticky Button "Write to Client" (specialist) / "Sign in to write" (guest)

UI elements:
  - Title (h1)
  - City + FNS (chips), Service (chip)
  - Status badge: active (success) / closing_soon (warning) / closed (muted)
  - Description (body, full text)
  - Counter: "X specialists responded" (caption)
  - [guest] Footer button → AuthEmail
  - [specialist] Footer button "Write" → SpecialistConfirmWrite (if no existing thread)
  - [specialist] Footer button "Open Chat" → ChatThread (if thread already exists)
  - [specialist] Badge "Not your region" (muted) if request city not in specialist's cities
  - Section "Similar requests" (same city or service)

Acceptance Criteria:
  - [ ] User opens /requests/[id] → full request details (title, city, FNS, service, description, status badge) visible
  - [ ] Guest sees "Sign in to write" footer button → tap navigates to /auth/email
  - [ ] Specialist sees "Write to Client" button → tap navigates to /requests/[id]/write
  - [ ] Specialist with existing thread sees "Open Chat" → tap navigates to /threads/[threadId]
  - [ ] Request status badge matches: active=green, closing_soon=amber, closed=gray

States:
  - Loading: full skeleton
  - Loaded: all data rendered
  - Error: "Request not found" / general error + Retry
  - Auth-required: button redirects to auth

Data: GET /api/requests/:id/public
Response: {id, title, city, fns, service, description, status, threadsCount, createdAt, hasExistingThread, existingThreadId}

Dependencies: PublicRequestsFeed, LandingScreen

---
**Screen: SpecialistsCatalog**
Status: DONE
Type: list
Route: /specialists
Access: public (guest, client, specialist, admin)

Description: Directory of available specialists

Content:
  page_title: "Специалисты"
  filter_labels:
    city: "Город"
    city_placeholder: "Все города"
    fns: "Инспекция"
    fns_placeholder: "Сначала выберите город"
    services: "Услуги"
  service_checkbox_labels: ["Выездная проверка", "Камеральная проверка", "Отдел оперативного контроля"]
  card_template:
    name: "{firstName} {lastName}"
    services: "{services} (chips)"
    city: "{city.name}"
  sort_options: ["По дате регистрации", "По количеству услуг"]
  empty_title: "Специалистов не найдено"
  empty_description: "Попробуйте изменить фильтры или выбрать другой город"
  empty_cta: "Сбросить фильтры"
  error_title: "Не удалось загрузить список"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Layout:
  - Header: Header-Home, title "Specialists"
  - Body: filter bar + vertical list
  - Footer: none

UI elements:
  - Filter: city (select) → FNS (cascade select, disabled until city chosen)
  - Filter: services (3 checkboxes, multiselect): Inspection, Audit, Operational Control
  - Specialist card: avatar (md), firstName + lastName (h3), services (chips caption), city (caption)
  - Card tap → SpecialistPublicProfile
  - Infinite scroll
  - Only specialists with is_available=true shown
  - Empty state: "No specialists found" + reset filters

Acceptance Criteria:
  - [ ] User opens /specialists → list of available specialists loads
  - [ ] User selects city → FNS dropdown becomes enabled with that city's offices
  - [ ] User checks service checkboxes → list filters by services
  - [ ] User taps specialist card → navigates to /specialists/[id]
  - [ ] No results → "No specialists found" empty state with reset link

States:
  - Loading: skeleton cards
  - Empty: illustration + text
  - Populated: list with pagination
  - Error: error + Retry

Data: GET /api/specialists?city_id=X&fns_id=Y&services=1&services=2&page=1&limit=20

Dependencies: none

---
**Screen: SpecialistPublicProfile**
Status: DONE
Type: detail
Route: /specialists/[id]
Access: public (guest, client, specialist, admin)

Description: Public profile of a specialist

Content:
  header_title: "Профиль специалиста"
  section_titles:
    about: "О специалисте"
    fns_services: "Инспекции и услуги"
    contacts: "Контакты"
    similar: "Похожие специалисты"
  meta_labels:
    available: "Принимает заявки"
    not_available: "Не принимает заявки"
    phone: "Телефон"
    telegram: "Telegram"
    whatsapp: "WhatsApp"
    address: "Адрес офиса"
    hours: "Часы работы"
    registered: "На платформе с"
  action_buttons:
    call: "Позвонить"
    edit: "Редактировать"
    toggle_available: "Принимаю заявки"
    toggle_unavailable: "На паузе"
  collapse_button: "Показать все"
  no_reviews_stub: "Отзывы появятся в следующих версиях"
  error_title: "Специалист не найден"
  error_description: "Возможно, профиль был удалён или вы перешли по неверной ссылке"
  error_button: "Назад к каталогу"

Layout:
  - Header: Header-Back, right: "Edit" (own profile only)
  - Body: scroll
  - Footer: none

UI elements:
  - Avatar (lg, centered)
  - Name: firstName + " " + lastName (h1, centered)
  - Description (body)
  - Toggle is_available (visible only to own specialist): "Accepting requests" / "Not accepting"
  - FNS & Services section: chips grouped by city
    - Format: "Moscow: IFNS #1 [Inspection][Audit], IFNS #5 [Audit]"
    - If >10 chips → "Show all" collapse button
  - Contacts section (PUBLIC — visible to everyone including guests):
    - Phone: "Call" button (tel: link)
    - Telegram: t.me/username link
    - WhatsApp: wa.me/number link
    - Office address (if filled)
    - Working hours (if filled)
  - "Similar specialists" section: horizontal scroll from same city
  - No ratings/reviews in MVP (stub only)

Acceptance Criteria:
  - [ ] User opens /specialists/[id] → avatar, name, description, FNS+services chips, contacts visible
  - [ ] Contacts section visible to everyone (including guests): phone, telegram, whatsapp, address, hours
  - [ ] Own profile shows "Edit" button in header and is_available toggle
  - [ ] Phone shows "Call" button (tel: link), Telegram shows t.me link, WhatsApp shows wa.me link

States:
  - Loading: skeleton avatar + text
  - Loaded: full profile rendered
  - Error: "Specialist not found" / error + Retry

Data: GET /api/specialists/:id
Response: {id, firstName, lastName, avatar, description, isAvailable, phone, telegram, whatsapp, officeAddress, workingHours, fnsServices: [{city, fns, services[]}], createdAt}

Dependencies: SpecialistsCatalog, LandingScreen

---

### AUTH

---
**Screen: AuthEmail**
Status: DONE
Type: form
Route: /auth/email
Access: public (guest only, auth users redirect to their dashboard)

Description: Email entry for login/registration (single flow)

Content:
  page_title: "Вход"
  page_subtitle: "Введите email, чтобы продолжить"
  field_labels:
    email: "Email"
    email_placeholder: "name@example.com"
    email_error_invalid: "Введите корректный email"
    email_error_rate_limit: "Слишком много попыток. Подождите минуту."
  button_submit: "Продолжить"
  terms_link: "Нажимая «Продолжить», вы соглашаетесь с Условиями использования"
  error_title: "Ошибка"
  error_description: "Не удалось отправить код. Попробуйте ещё раз."
  error_button: "Повторить"

Layout:
  - Header: Header-Back (back to Landing)
  - Body: centered vertically, padded horizontal xl
  - Footer: none

UI elements:
  - App logo (centered, 80px, margin-bottom xl)
  - Title "Sign In" (h1, centered)
  - Subtitle "Enter your email to continue" (caption, centered)
  - Input email (keyboard: email, autocapitalize: none)
  - Button primary "Continue" (margin-top lg)
  - Text link "Terms of Use" (caption, centered) → TermsScreen

Acceptance Criteria:
  - [ ] Guest opens /auth/email → email input and "Continue" button visible
  - [ ] Guest enters valid email, clicks "Continue" → spinner shows, then navigates to /auth/otp
  - [ ] Guest enters invalid email → "Invalid email" error on input
  - [ ] Already authenticated user visits /auth/email → redirected to their dashboard

States:
  - Idle: form ready
  - Submitting: button spinner
  - Error: input border error + "Invalid email" / network error toast

Data: POST /api/auth/request-otp {email}
Response: {success: true}

Business rules:
  - Dev mode: OTP always 000000
  - Email creates user if not exists
  - OTP valid for 15 minutes

Dependencies: none (entry point from any unauth trigger)

---
**Screen: AuthOTP**
Status: DONE
Route: /auth/otp
Access: public (guest only)

Description: Enter 6-digit OTP code

Content:
  page_title: "Подтверждение"
  page_subtitle: "Код отправлен на {email}"
  field_labels:
    code: "Код подтверждения"
    code_error_wrong: "Неверный код. Проверьте и попробуйте снова."
    code_error_expired: "Код истёк. Запросите новый."
  button_submit: "Подтвердить"
  resend_link: "Отправить код повторно"
  resend_countdown: "Отправить повторно через {seconds} сек"
  role_choice_title: "Кто вы?"
  role_choice_client: "Мне нужна помощь с налоговой"
  role_choice_specialist: "Я налоговый специалист"
  error_title: "Ошибка подтверждения"
  error_description: "Не удалось проверить код. Попробуйте ещё раз."
  error_button: "Повторить"
  success_toast: "Вы успешно вошли"

Layout:
  - Header: Header-Back, title "Verification"
  - Body: centered, padded horizontal xl
  - Footer: none

UI elements:
  - Text "Code sent to {email}" (body, centered)
  - 6 separate digit inputs (48x48, gap sm, auto-focus next, auto-submit on 6th digit)
  - Button primary "Verify" (margin-top lg)
  - Text link "Resend code" (caption, disabled 60s, shows countdown)

Acceptance Criteria:
  - [ ] User sees "Code sent to {email}" with correct email displayed
  - [ ] User enters 6 digits → auto-submits on 6th digit
  - [ ] Wrong code → all inputs turn error red + "Wrong code" message
  - [ ] "Resend code" link disabled for 60s with countdown timer
  - [ ] Existing client → navigates to ClientDashboard
  - [ ] Existing specialist → navigates to SpecialistDashboard
  - [ ] New user → sees role choice: "I need help" / "I'm a specialist"

States:
  - Idle: waiting for input
  - Verifying: button spinner
  - Error: all inputs border error + "Wrong code"
  - Resending: "Resend in 45s" countdown

Post-verify routing (by role):
  - Existing client → ClientDashboard
  - Existing specialist → SpecialistDashboard
  - New user (no role) → can choose path:
    - "I need help" → becomes client → MyRequestsNew
    - "I'm a specialist" → OnboardingName (step 1/3)

Data: POST /api/auth/verify-otp {email, code}
Response: {accessToken, refreshToken, user: {id, email, role, firstName, lastName}}

Dependencies: AuthEmail (passes email param)

---

### ONBOARDING (specialist, 3 steps)

---
**Screen: OnboardingName**
Status: DONE
Type: form
Route: /onboarding/name
Access: specialist (new, step 1/3)

Description: Enter first and last name

Content:
  page_title: "Ваше имя"
  page_subtitle: "Шаг 1 из 3"
  field_labels:
    first_name: "Имя"
    first_name_placeholder: "Ив��н"
    first_name_error_min: "Минимум 2 символа"
    first_name_error_max: "Максимум 50 символов"
    last_name: "Фамилия"
    last_name_placeholder: "Петров"
    last_name_error_min: "Минимум 2 символа"
    last_name_error_max: "Максимум 50 символов"
  checkbox_terms: "Я принимаю Условия использования"
  button_submit: "Далее"
  error_title: "Ошибка сохранения"
  error_description: "Не удалось сохранить данные. Попробуйте ещё раз."
  error_button: "Повторить"

Layout:
  - Header: none (step indicator 1/3 at top)
  - Body: centered, padded horizontal xl
  - Footer: none

UI elements:
  - Step indicator: "Step 1 of 3" (caption)
  - Title "Your Name" (h1)
  - Input "First name" (required, 2-50 chars)
  - Input "Last name" (required, 2-50 chars)
  - Checkbox "I accept Terms of Use" with link → TermsScreen (required, disables Next if unchecked)
  - Button primary "Next" (disabled until valid + checkbox checked)

Acceptance Criteria:
  - [ ] Step indicator shows "Step 1 of 3"
  - [ ] "Next" button disabled until first name (2+ chars), last name (2+ chars), and checkbox checked
  - [ ] User fills valid data + checks checkbox → "Next" navigates to /onboarding/work-area
  - [ ] Terms link opens TermsScreen

States:
  - Idle: form ready
  - Submitting: button spinner
  - Error: inline validation on fields / server error toast

Data: PUT /api/onboarding/name {firstName, lastName}

Dependencies: AuthOTP

---
**Screen: OnboardingWorkArea**
Status: DONE
Type: form
Route: /onboarding/work-area
Access: specialist (new, step 2/3)

Description: Select cities, FNS offices, and services

Content:
  page_title: "Рабочая область"
  page_subtitle: "Шаг 2 из 3"
  field_labels:
    add_city: "+ Добавить город"
    city_dropdown_placeholder: "Выберите город"
    fns_section_title: "Инспекции в {city.name}"
    services_label: "Услуги"
    service_options: ["Выездная проверка", "Камеральная проверка", "Отдел оперативного контроля"]
  chip_remove_label: "Удалить"
  collapse_button: "Показать все"
  button_submit: "Далее"
  validation_hint: "Выберите хотя бы одну инспекцию и одну услугу"
  error_title: "Ошибка сохранения"
  error_description: "Не удалось сохранить рабочую область. Попробуйте ещё раз."
  error_button: "Повторить"

Layout:
  - Header: Header-Back (to step 1), step indicator 2/3
  - Body: scroll
  - Footer: sticky Button primary "Next" (disabled until min 1 FNS + 1 service)

UI elements:
  - Title "Work Area" (h1)
  - "+ Add City" button → dropdown of cities
  - For each selected city → expandable section with FNS offices (multiselect)
  - For each selected FNS → 3 checkboxes (min 1 required):
    - Inspection
    - Audit
    - Operational Control
  - Selected FNS shown as chips, grouped by city
  - If >10 chips → "Show all" collapse
  - "x" on chip removes FNS

Acceptance Criteria:
  - [ ] Step indicator shows "Step 2 of 3"
  - [ ] User clicks "+ Add City" → city dropdown appears
  - [ ] After city selected → FNS offices load for that city
  - [ ] User selects FNS → 3 service checkboxes appear (must select min 1)
  - [ ] "Next" disabled until at least 1 FNS + 1 service selected
  - [ ] Selected FNS shown as chips, "x" removes them

States:
  - Idle: form with city selector
  - Loading: cities/FNS loading from API
  - Error: server error toast

Cascade logic:
  - City not selected → FNS disabled
  - City selected → load GET /api/fns?city_id=X → fill FNS list
  - City changed → reset selected FNS for that city

Data:
  - GET /api/cities
  - GET /api/fns?city_id=X
  - PUT /api/onboarding/work-area {fnsServices: [{fnsId, serviceIds: [1,2]}]}

Dependencies: OnboardingName

---
**Screen: OnboardingProfile**
Status: DONE
Type: form
Route: /onboarding/profile
Access: specialist (new, step 3/3)

Description: Optional profile info (avatar, contacts, description)

Content:
  page_title: "Профиль"
  page_subtitle: "Шаг 3 из 3 — всё необязательно, можно заполнить позже"
  field_labels:
    avatar: "Фото"
    avatar_hint: "Нажмите, чтобы загрузить фото"
    description: "О себе"
    description_placeholder: "Расскажите о вашем опыте: сколько лет в профессии, какие вопросы решаете, с какими инспекциями работаете"
    description_counter: "{count}/1000"
    phone: "Телефон"
    phone_placeholder: "+7 (___) ___-__-__"
    telegram: "Telegram"
    telegram_placeholder: "@username"
    whatsapp: "WhatsApp"
    whatsapp_placeholder: "+7 (___) ___-__-__"
    office_address: "Адрес офиса"
    office_address_placeholder: "г. Москва, ул. Примерная, д. 1, оф. 100"
    working_hours: "Часы работы"
    working_hours_placeholder: "Пн-Пт 9:00-18:00"
  contacts_note: "Контакты будут видны всем посетителям платформы"
  button_submit: "Завершить регистрацию"
  error_title: "Ошибка сохранения"
  error_description: "Не удалось сохранить профиль. Попробуйте ещё раз."
  error_button: "Повторить"
  success_toast: "Регистрация завершена! Добро пожаловать."

Layout:
  - Header: Header-Back (to step 2), step indicator 3/3
  - Body: scroll form
  - Footer: sticky Button primary "Complete"

UI elements:
  - Avatar upload area (tap → image picker, preview circle lg)
  - Textarea "About me" (optional, max 1000 chars, counter)
  - Input "Phone" (optional, mask +7XXXXXXXXXX)
  - Input "Telegram" (optional, @username)
  - Input "WhatsApp" (optional, +7XXXXXXXXXX)
  - Input "Office address" (optional, max 200 chars)
  - Input "Working hours" (optional, max 100 chars, e.g. "Mon-Fri 9:00-18:00")
  - Note: all contacts are PUBLIC
  - Button primary "Complete" (always enabled — all fields optional)

Acceptance Criteria:
  - [ ] Step indicator shows "Step 3 of 3"
  - [ ] All fields optional — "Complete" button always enabled
  - [ ] User taps avatar area → image picker opens
  - [ ] User clicks "Complete" → navigates to SpecialistDashboard
  - [ ] Phone input has +7 mask

States:
  - Idle: form ready
  - Uploading: avatar upload progress
  - Error: upload error / server error toast

Data:
  - POST /api/uploads/avatar (multipart) → {url}
  - PUT /api/onboarding/profile {avatar, description, phone, telegram, whatsapp, officeAddress, workingHours}

Business rules:
  - All fields optional — skip doesn't block onboarding
  - Avatar: server resizes to 400x400
  - After submit → specialist is active → SpecialistDashboard

Dependencies: OnboardingWorkArea

---

### CLIENT TABS

---
**Screen: ClientDashboard**
Status: DONE
Type: showcase
Route: /(client-tabs)/dashboard
Access: auth required, role: client

Description: Client home — stats + recent requests

Content:
  welcome_message: "Здравствуйте, {firstName}!"
  stats_labels:
    requests_used: "Заявок использовано"
    requests_format: "{used} из {limit}"
    unread_messages: "Непрочитанных сообщений"
  action_cards:
    create_request: "Создать заявку"
    create_request_subtitle: "Опишите проблему — специалисты напишут сами"
    limit_reached: "Лимит заявок исчерпан"
  section_titles:
    my_requests: "Мои заявки"
    view_all: "Смотреть все"
  empty_title: "У вас пока нет заявок"
  empty_description: "Создайте первую заявку — специалисты из вашего города увидят её и предложат помощь"
  empty_cta: "Создать первую заявку"
  error_title: "Не удалось загрузить данные"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Layout:
  - Header: Header-Home (app name left, settings gear right → ClientSettings)
  - Body: scroll
  - Footer: TabBar (Dashboard active)

UI elements:
  - Stats card: "X of 5 requests used" (progress indicator)
  - Button "Create Request" (primary, disabled at limit) → MyRequestsNew
  - Section "My Requests" (last 3): cards with title, status badge, date
    - Card tap → MyRequestDetail
  - Link "View all requests" → MyRequests tab
  - Section "New messages": count badge if unread threads exist

Acceptance Criteria:
  - [ ] Client sees "X of 5 requests used" with progress indicator
  - [ ] "Create Request" button navigates to /requests/new
  - [ ] At limit (5/5) → "Create Request" button disabled + "Request limit reached"
  - [ ] Last 3 requests displayed as cards, tap → MyRequestDetail
  - [ ] Unread messages count badge visible if unread > 0

States:
  - Loading: skeleton stats + cards
  - Empty: "Create your first request" CTA
  - Populated: stats + request list
  - Error: error + Retry

Data:
  - GET /api/dashboard/stats → {requestsUsed, requestsLimit, unreadMessages}
  - GET /api/requests?limit=3 → [{id, title, status, threadsCount, createdAt}]

Dependencies: none

---
**Screen: MyRequests**
Status: DONE
Type: list
Route: /(client-tabs)/requests
Access: auth required, role: client

Description: All client's requests

Content:
  page_title: "Мои заявки"
  card_template:
    title: "{request.title}"
    status_badge: "{status_label}"
    city_fns: "{city.name} · {fns.name}"
    date: "{createdAt}"
  status_labels:
    active: "Активна"
    closing_soon: "Скоро закроется"
    closed: "Закрыта"
  swipe_action: "Закрыть"
  swipe_confirm: "Закрыть заявку? Это действие нельзя отмени��ь."
  swipe_confirm_yes: "Да, за��рыть"
  swipe_confirm_no: "Отмена"
  create_button: "Создать заявку"
  empty_title: "Заявок пока нет"
  empty_description: "Создайте первую заявку — специалисты из вашего города увидят её и предложат помощь"
  empty_cta: "Создать заявку"
  error_title: "Не удалось загрузить заявки"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"
  success_toast: "Заявка зак��ыта"

Layout:
  - Header: Header-Home, title "My Requests"
  - Body: vertical list
  - Footer: TabBar (Requests active)

UI elements:
  - Request card: title (h3), status badge (active/closing_soon/closed), city+FNS (caption), date (caption)
  - Card tap → MyRequestDetail
  - Swipe left on active/closing_soon → "Close" button (red) → confirm → PATCH status:closed
  - After close: card animates out + toast "Request closed"
  - Button "Create Request" (floating or header) → MyRequestsNew
  - Sort: newest first (default)
  - Empty state: "No requests yet" CTA → MyRequestsNew
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] Client sees all their requests sorted newest first
  - [ ] Request card shows title, status badge, city+FNS, date
  - [ ] Tap card → navigates to /requests/[id]/detail
  - [ ] Swipe left on active request → "Close" button appears → confirm → request closed + toast
  - [ ] Empty state shows "No requests yet" with CTA to create
  - [ ] Pull-to-refresh reloads list

States:
  - Loading: skeleton cards
  - Empty: illustration + CTA
  - Populated: list
  - Error: error + Retry

Data: GET /api/requests
Response: [{id, title, status, city, fns, service, threadsCount, createdAt}]

Dependencies: none

---
**Screen: MyRequestsNew**
Status: DONE
Type: form
Route: /requests/new
Access: auth required, role: client

Description: Create a new request

Content:
  page_title: "Новая заявка"
  field_labels:
    title: "Заголовок"
    title_placeholder: "Кратко опишите суть пробле��ы"
    title_error_min: "Минимум 3 символа"
    title_error_max: "Максимум 100 символов"
    city: "Город"
    city_placeholder: "Выберите город"
    fns: "Инспекция"
    fns_placeholder: "Сначала выберите город"
    description: "Описание"
    description_placeholder: "Подробно опишите ситуацию: что произошло, какие документы получили, что требует инспекция, какая помощь нужна"
    description_counter: "{count}/2000"
    description_error_min: "Минимум 10 символов"
    description_error_max: "Максимум 2000 символов"
    files: "Документы"
    files_hint: "PDF, JPG, PNG — до 10 МБ каждый, не более 5 файлов"
    files_add: "+ Прикрепить файл"
  button_submit: "Опубликовать заявку"
  limit_message: "Лимит заявок исчерпан ({used}/{limit}). Закройте неактуальные заявки, чтобы создать новую."
  error_title: "Ошибка публикации"
  error_description: "Не удалось опубликовать заявку. Проверьте данные и попробуйте ещё р��з."
  error_button: "Повторить"
  success_toast: "Заявка опубликована!"

Layout:
  - Header: Header-Back, title "New Request"
  - Body: scroll form
  - Footer: sticky Button primary "Publish"

UI elements:
  - Input "Title" (required, 3-100 chars)
  - Select "City" (required, from /api/cities)
  - Select "FNS" (required, cascade from city, disabled until city chosen)
  - Textarea "Description" (required, 10-2000 chars, counter)
  - File upload area: "+" button, thumbnails grid (max 5 files, pdf/jpg/png, max 10MB each)
  - Button primary "Publish" (sticky bottom)

Acceptance Criteria:
  - [ ] Form shows: title, city select, FNS select (disabled until city), description, file upload
  - [ ] FNS enables after city selected; resets when city changes
  - [ ] "Publish" disabled until all required fields valid (title 3+, description 10+, city, FNS)
  - [ ] File upload accepts pdf/jpg/png up to 10MB, max 5 files, shows thumbnails
  - [ ] Submit → navigates to MyRequestDetail + "Published!" toast
  - [ ] At request limit → "Publish" disabled + "Request limit reached" message

States:
  - Idle: empty form
  - Saving: button spinner, form disabled
  - Error: inline field errors + form data preserved
  - Success: navigate to MyRequestDetail + toast "Published!"

Cascade: city not selected → FNS disabled. City selected → load FNS. City changed → reset FNS.

Data:
  - GET /api/cities, GET /api/fns?city_id=X
  - POST /api/uploads/documents (multipart) → [{url}]
  - POST /api/requests {title, cityId, fnsId, description, files[]}
Response: {id, ...request}

Business rules:
  - Limit: 5 requests lifetime per client (configurable by admin)
  - At limit → button disabled + "Request limit reached" message
  - No moderation — published immediately

Dependencies: ClientDashboard, MyRequests

---
**Screen: MyRequestDetail**
Status: DONE
Type: detail
Route: /requests/[id]/detail
Access: auth required, role: client (owner)

Description: Client's own request details

Content:
  header_title: "{request.title}"
  section_titles:
    description: "Описание"
    files: "Прикреплённые документы"
    messages: "Сообщения"
    recommended: "Рекомендованные специалисты"
  meta_labels:
    city: "Город"
    fns: "Инспекция"
    service: "Тип проверки"
    status: "Статус"
    created: "Создана"
    responses: "{count} специалистов написали вам"
  status_labels:
    active: "Активна"
    closing_soon: "Скоро закроется"
    closed: "Закрыта"
  action_buttons:
    messages: "Сообщения ({count})"
    extend: "Продлить заявку"
    extend_limit: "Продление использовано ({count}/3)"
    delete: "Удалить заявку"
  delete_confirm: "Удалить заявку? Все сообщения и файлы будут потеряны. Это действие нельзя отменить."
  delete_confirm_yes: "Да, удалить"
  delete_confirm_no: "Отмена"
  error_title: "Заявка не найдена"
  error_description: "Возможно, она была удалена"
  error_button: "Назад"
  success_toast_extended: "Заявка продлена"
  success_toast_deleted: "Заявка удалена"

Layout:
  - Header: Header-Back, title = request title, right: delete icon (trash)
  - Body: scroll
  - Footer: none

UI elements:
  - Status badge: active (success) / closing_soon (warning) / closed (muted)
  - City + FNS (chips), Service (chip)
  - Description (body, full text)
  - Attached files: list with filename + size, tap to download
  - Counter: "X specialists wrote to you" → tap → MessagesGrouped
  - Button "Messages (X)" (primary) → MessagesGrouped
  - [closing_soon] Button "Extend" → POST /api/requests/:id/extend (max 3 extensions)
  - Section "Recommended specialists": matching city/fns/service, is_available=true
    - Specialist card tap → SpecialistPublicProfile
  - Delete: tap trash → confirm → DELETE /api/requests/:id → navigate back

Acceptance Criteria:
  - [ ] Client sees full request: status badge, city+FNS, description, attached files
  - [ ] "Messages (X)" button navigates to /requests/[id]/messages
  - [ ] Trash icon → confirm dialog → request deleted → navigates back
  - [ ] Closing_soon status shows "Extend" button (max 3 extensions)
  - [ ] Recommended specialists section shows matching specialists
  - [ ] File tap → file downloads

States:
  - Loading: skeleton
  - Loaded: all data
  - Error: "Request not found" / error + back

Data:
  - GET /api/requests/:id → {id, title, status, city, fns, service, description, files[], threadsCount, extensionsCount, createdAt}
  - GET /api/threads?request_id=:id (count)

Dependencies: MyRequests, ClientDashboard

---
**Screen: MessagesGrouped**
Status: DONE
Type: list
Route: /requests/[id]/messages
Access: auth required, role: client

Description: Client's threads for a specific request, grouped

Content:
  page_title: "Сообщения"
  card_template:
    specialist_name: "{specialist.firstName} {specialist.lastName}"
    last_message: "{lastMessage} (60 символов)"
    timestamp: "{time_ago}"
    unread_badge: "{unreadCount}"
  empty_title: "Пока нет сообщений"
  empty_description: "Специалисты увидят вашу заявку и напишут вам первыми"
  empty_cta: ""
  error_title: "Не удалось загрузить сообщения"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Layout:
  - Header: Header-Back, title "Messages"
  - Body: vertical list
  - Footer: none

UI elements:
  - Section header per request (if opened from Messages tab — grouped by request)
  - Thread preview card:
    - Avatar (sm) of specialist
    - Specialist name (h3)
    - Last message preview (caption, truncated 60 chars)
    - Unread badge (if client_last_read_at < last_message_at)
    - Timestamp (caption, "15 min ago" / "yesterday" / "01.04")
  - Card tap → ChatThread
  - Empty state: "No messages from specialists yet"
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] Client sees list of threads for this request
  - [ ] Thread card shows specialist avatar, name, last message preview, timestamp
  - [ ] Unread badge visible if unread messages exist
  - [ ] Tap thread → navigates to /threads/[id]
  - [ ] Empty state: "No messages from specialists yet"

States:
  - Loading: skeleton rows
  - Empty: illustration + text
  - Populated: grouped thread list
  - Error: error + Retry

Data: GET /api/threads?request_id=:id (or GET /api/threads?grouped_by=request for all)
Response: [{threadId, specialist: {id, name, avatar}, lastMessage, unreadCount, lastMessageAt}]

Dependencies: MyRequestDetail

---
**Screen: ClientMessages**
Status: DONE
Type: chat
Route: /(client-tabs)/messages
Access: auth required, role: client

Description: All client's threads (across all requests)

Content:
  page_title: "Сообщения"
  card_template:
    specialist_name: "{specialist.firstName} {specialist.lastName}"
    request_title: "{request.title}"
    last_message: "{lastMessage} (1 строка)"
    timestamp: "{time_ago}"
    unread_badge: "{unreadCount}"
  empty_title: "Нет сообщений"
  empty_description: "Когда специалисты напишут по вашим заявкам, сообщения появятся здесь"
  empty_cta: "Посмотреть специалистов"
  error_title: "Не удалось загрузить сообщения"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Layout:
  - Header: Header-Home, title "Messages"
  - Body: vertical list
  - Footer: TabBar (Messages active)

UI elements:
  - Thread row: avatar (sm), specialist name (h3), last message preview (caption 1-line truncate), time (caption right)
  - Unread: badge on avatar, name bold, message bold
  - Card tap → ChatThread
  - Sort: by last_message_at (newest first)
  - Empty state: "No messages yet"
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] Client sees all threads across all requests
  - [ ] Sorted by last message time (newest first)
  - [ ] Unread threads show bold name + message + badge on avatar
  - [ ] Tap thread → navigates to /threads/[id]
  - [ ] Empty state: "No messages yet" with CTA "Browse specialists"

States:
  - Loading: skeleton rows
  - Empty: illustration + CTA "Browse specialists"
  - Populated: thread list
  - Error: error + Retry

Data: GET /api/threads
Response: [{id, specialist: {id, name, avatar}, request: {id, title}, lastMessage, unreadCount, lastMessageAt}]

Business rules:
  - Thread appears instantly when specialist sends first message (no accept step)

Dependencies: none

---
**Screen: ClientSettings**
Status: DONE
Type: settings
Route: /settings/client
Access: auth required, role: client

Description: Client profile settings

Content:
  page_title: "Настройки"
  field_labels:
    avatar: "Фото профиля"
    avatar_hint: "Нажмите, чтобы изменить"
    first_name: "Имя"
    last_name: "Фамилия"
    email: "Email"
    email_hint: "(нельзя изменить)"
    role: "Роль"
    role_value: "Клиент"
  button_save: "Сохранить"
  menu_items:
    notifications:
      title: "Уведомления"
      icon: "bell"
      items:
        - label: "Новые сообщения"
          description: "Получать уведомления о новых сообщениях от специалистов по email"
        - label: "Предупреждения о закрытии"
          description: "Предупреждать, когда заявка скоро закроется"
    legal:
      title: "Правовая информация"
      items:
        - label: "Условия использования"
  danger_zone:
    title: "Аккаунт"
    signout_button: "Выйти из аккаунта"
    signout_confirm: "Вы уверены, что хотите выйти?"
    signout_confirm_yes: "Выйти"
    signout_confirm_no: "Отмена"
  app_version: "Версия {version}"
  error_title: "Ошибка сохранения"
  error_description: "Не удалось сохранить изменения. Попробуйте ещё раз."
  error_button: "Повторить"
  success_toast: "Изменения сохранены"

Layout:
  - Header: Header-Back, title "Settings"
  - Body: scroll form
  - Footer: none

UI elements:
  - Avatar (lg, centered, tap → ImagePicker)
  - Input "First name" (editable)
  - Input "Last name" (editable)
  - Email (displayed, readonly)
  - Role badge "Client" (readonly)
  - Button primary "Save"
  - Divider
  - Section "Notifications": toggle "New messages" (email), toggle "Auto-close warnings" (always on)
  - Divider
  - Link "Terms of Use" → TermsScreen
  - Button danger "Sign Out" → confirm → clear tokens → LandingScreen
  - App version (small, bottom)

Acceptance Criteria:
  - [ ] Form prefilled with current data (avatar, first/last name, email readonly)
  - [ ] "Save" updates profile → toast "Saved"
  - [ ] Notification toggles save on change
  - [ ] "Sign Out" → confirm → clears tokens → navigates to Landing
  - [ ] App version visible at bottom

States:
  - Loaded: form prefilled
  - Saving: button spinner
  - Error: inline errors / toast

Data:
  - GET /api/user/me (prefill)
  - PATCH /api/user/profile {firstName, lastName, avatar}
  - PATCH /api/user/notification-settings {new_messages: bool}
  - POST /api/auth/logout

Dependencies: ClientDashboard

---

### SPECIALIST TABS

---
**Screen: SpecialistDashboard**
Status: DONE
Type: showcase
Route: /(specialist-tabs)/dashboard
Access: auth required, role: specialist

Description: Specialist home — matching requests feed

Content:
  welcome_message: "{firstName}, вот заявки для вас"
  stats_labels:
    threads_total: "Всего диалогов"
    new_messages: "Новых сообщений"
  standby_banner:
    title: "Вы на паузе"
    description: "Клиенты не видят ваш профиль в каталоге. Включите приём заявок в настройках."
    link: "Перейти в настройки"
  action_cards:
    write: "Написать клиенту"
    open_chat: "Открыть чат"
  badge_already_wrote: "Вы уже написали"
  badge_not_your_region: "Не ваш регион"
  link_my_threads: "Мои диалоги"
  empty_title: "Нет подходящих заявок"
  empty_description: "Расширьте рабочую область, чтобы видеть больше заявок из других городов и инспекций"
  empty_cta: "Расширить рабочую область"
  error_title: "Не удалось загрузить заявки"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Layout:
  - Header: Header-Home (app name left, settings gear right → SpecialistSettings)
  - Body: scroll
  - Footer: TabBar (Dashboard active)

UI elements:
  - [is_available=false] Banner: "You're in standby mode" (warning bg, link to toggle in settings)
  - Stats: total threads count, new messages count
  - Request cards (matching specialist's city/fns/services):
    - Title (h3), city+FNS (chips), service (chip), description truncated
    - Button "Write" → SpecialistConfirmWrite
    - Badge "You already wrote" if thread exists → button changes to "Open Chat" → ChatThread
    - Badge "Not your region" (muted) for cross-city requests
  - CLOSED requests not shown
  - Link "My Threads" → SpecialistMyThreads
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] Shows matching requests (specialist's city/fns/services)
  - [ ] is_available=false → warning banner "You're in standby mode"
  - [ ] Request card with "Write" button → navigates to /requests/[id]/write
  - [ ] Request with existing thread shows "Open Chat" instead → navigates to /threads/[id]
  - [ ] Closed requests not shown
  - [ ] Stats visible: total threads, new messages

States:
  - Loading: skeleton stats + cards
  - Empty: "No matching requests yet" + CTA "Expand your work area"
  - Populated: stats + request list
  - Error: error + Retry

Data:
  - GET /api/specialist/stats → {threadsTotal, newMessages}
  - GET /api/specialist/requests → [{id, title, city, fns, service, description, hasThread, threadId}]

Dependencies: none

---
**Screen: SpecialistConfirmWrite**
Status: DONE
Type: form
Route: /requests/[id]/write (modal)
Access: auth required, role: specialist

Description: Confirm modal before starting a thread with client

Content:
  page_title: "Написать клиенту"
  page_subtitle: "Прочитайте заявку и напишите первое сообщение"
  section_titles:
    request_summary: "Заявка клиента"
  field_labels:
    message: "Ваше сообщение"
    message_placeholder: "Здравствуйте! Я специалист по... Могу помочь с вашей ситуацией. Расскажите подробнее..."
    message_counter: "{count}/1000"
    message_error_min: "Минимум 10 символов"
  button_submit: "Отправить сообщение"
  button_cancel: "Отмена"
  error_request_closed: "Заявка закрыта — написать невозможно"
  error_thread_exists: "Вы уже писали по этой заявке"
  error_rate_limit: "Лимит новых диалогов на сегодня исчерпан (20 в день). Попробуйте завтра."
  error_title: "Ошибка отправки"
  error_description: "Не удалось отправить сообщение. Попробуйте ещё раз."
  error_button: "Повторить"
  success_toast: "Сообщение отправлено. Диалог создан."

Layout:
  - Header: Header-Back, title "Write to Client"
  - Body: scroll
  - Footer: sticky Button primary "Send"

UI elements:
  - Request summary (read-only): title, city+FNS (chips), service (chip), description (2-3 lines truncated)
  - Textarea "Your message" (required, 10-1000 chars, counter, placeholder "Hello! I can help with...")
  - Button primary "Send" (disabled until 10+ chars)
  - Button secondary "Cancel" (back)

**NOT in UI:** no price field, no deadline/DatePicker, no separate comment, no Accept/Reject

Acceptance Criteria:
  - [ ] Request summary (title, city, FNS, service, description) visible read-only
  - [ ] "Send" disabled until message has 10+ characters
  - [ ] Submit → thread created → navigates to ChatThread
  - [ ] 409 (thread exists) → redirects to existing thread
  - [ ] 429 (rate limit) → "Limit 20 messages per day" error

States:
  - Loading: skeleton request summary
  - Idle: form ready
  - Submitting: button spinner
  - Error:
    - 409 (request closed): "Request closed" + back
    - 409 (thread exists): redirect to existing thread
    - 429 (rate limit 20/day): "Limit 20 messages per day. Try tomorrow." + back
    - 500: general error + retry

Data:
  - GET /api/requests/:id (summary)
  - POST /api/threads {requestId, firstMessage}
Response: {threadId}
Then redirect → ChatThread

Business rules:
  - One thread per pair (request_id, specialist_id) — UNIQUE
  - Repeat click "Write" on same request → redirects to existing thread (modal doesn't open)
  - Rate limit: 20 new threads per day per specialist

Dependencies: SpecialistDashboard, PublicRequestsFeed

---
**Screen: SpecialistMyThreads**
Status: DONE
Type: list
Route: /(specialist-tabs)/threads
Access: auth required, role: specialist

Description: All specialist's threads

Content:
  page_title: "Мои диалоги"
  filter_labels:
    all: "Все"
    unread: "Непрочитанные"
  card_template:
    request_title: "{request.title} (усечённый)"
    client_name: "{client.firstName}"
    last_message: "{lastMessage} (60 символов)"
    timestamp: "{time_ago}"
    unread_badge: "{unreadCount}"
    closed_badge: "Заявка закрыта"
  empty_title: "Вы ещё не написали ни одному клиенту"
  empty_description: "Откликнитесь на заявку — клиент увидит ваше сообщение и сможет ответить"
  empty_cta: "Смотреть заявки"
  error_title: "Не удалось загрузить диалоги"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Layout:
  - Header: Header-Home, title "My Threads"
  - Body: filter chips + vertical list
  - Footer: TabBar (My Threads active)

UI elements:
  - Filter chips: All | Unread
  - Thread card:
    - Request title (truncated, tappable)
    - Client firstName (or "Client")
    - Last message preview (60 chars)
    - Unread badge (if specialist_last_read_at < last_message_at)
    - Timestamp last_message_at
    - Badge "Request closed" if request.status=closed
  - Card tap → ChatThread
  - Empty state: "You haven't written to any clients yet" + CTA → PublicRequestsFeed
  - Pull-to-refresh

Acceptance Criteria:
  - [ ] All specialist's threads listed
  - [ ] Filter chips: All | Unread
  - [ ] Thread card: request title, client name, last message, timestamp, unread badge
  - [ ] Closed request → "Request closed" badge on thread
  - [ ] Tap thread → navigates to /threads/[id]
  - [ ] Empty state with CTA → PublicRequestsFeed

States:
  - Loading: skeleton rows
  - Empty: illustration + CTA
  - Populated: filtered list
  - Error: error + Retry

Data: GET /api/threads
Response: [{id, request: {id, title, status}, client: {firstName}, lastMessage, unreadCount, lastMessageAt}]

Business rules:
  - Cannot "deactivate" thread — just stop writing
  - Closed request → thread is read-only

Dependencies: none

---
**Screen: SpecialistSettings**
Status: DONE
Type: settings
Route: /settings/specialist
Access: auth required, role: specialist

Description: Specialist profile editing

Content:
  page_title: "Настройки"
  field_labels:
    avatar: "Фото профиля"
    avatar_hint: "Нажмите, чтобы изменить"
    first_name: "Имя"
    first_name_placeholder: "Иван"
    last_name: "Фамилия"
    last_name_placeholder: "Петров"
    fns_section: "Инспекции и услуги"
    fns_search_placeholder: "Найти инспекцию"
    services_label: "Услуги"
    phone: "Телефон"
    phone_placeholder: "+7 (___) ___-__-__"
    telegram: "Telegram"
    telegram_placeholder: "@username"
    whatsapp: "WhatsApp"
    whatsapp_placeholder: "+7 (___) ___-__-__"
    office_address: "Адрес офиса"
    office_address_placeholder: "г. Москва, ул. Примерная, д. 1"
    working_hours: "Часы работы"
    working_hours_placeholder: "Пн-Пт 9:00-18:00"
  toggle_available:
    label: "Приём заявок"
    on: "Принимаю заявки"
    off: "На паузе"
    hint: "Когда выключено, ваш профиль скрыт из каталога"
  button_save: "Сохранить"
  menu_items:
    notifications:
      title: "Уведомления"
      items:
        - label: "Новые сообщения"
          description: "Получать уведомления о новых сообщениях от клиентов по email"
  danger_zone:
    title: "Аккаунт"
    signout_button: "Выйти из аккаунта"
    signout_confirm: "Вы уверены, что хотите выйти?"
    signout_confirm_yes: "Выйти"
    signout_confirm_no: "Отмена"
  error_title: "Ошибка сохранения"
  error_description: "Не удалось сохранить изменения. Попробуйте ещё раз."
  error_button: "Повторить"
  success_toast: "Изменения сохранены"

Layout:
  - Header: Header-Back, title "Settings"
  - Body: scroll form
  - Footer: none

UI elements:
  - Avatar (lg, tap → ImagePicker, upload immediately)
  - Input "First name" (required, 2-50 chars)
  - Input "Last name" (required, 2-50 chars)
  - FNS multiselect (chips, search by name, max 210)
  - Services multiselect (3 checkboxes per FNS, min 1 each)
  - Input "Phone" (+7 mask)
  - Input "Telegram" (@username)
  - Input "WhatsApp" (+7 mask)
  - Input "Office address"
  - Input "Working hours"
  - Toggle "Available for requests" (is_available) — instant PATCH, no Save needed
  - Button primary "Save"
  - Divider
  - Section "Notifications": toggles email preferences
  - Divider
  - Button danger "Sign Out" → confirm → clear tokens → LandingScreen

Acceptance Criteria:
  - [ ] Form prefilled with current profile data
  - [ ] is_available toggle saves instantly (no Save button needed)
  - [ ] FNS multiselect with service checkboxes per FNS
  - [ ] "Save" updates profile → toast
  - [ ] "Sign Out" → confirm → clear tokens → Landing

States:
  - Loaded: form prefilled from profile
  - Saving: button spinner
  - Error: inline errors / toast

Data:
  - GET /api/specialist/profile (prefill)
  - PATCH /api/specialist/profile {firstName, lastName, fnsServices, phone, telegram, whatsapp, officeAddress, workingHours}
  - PATCH /api/specialist/profile {isAvailable: bool} (instant toggle)
  - POST /api/uploads/avatar → {url}
  - POST /api/auth/logout

Dependencies: SpecialistPublicProfile (own profile), SpecialistDashboard

---

### SHARED

---
**Screen: ChatThread**
Status: DONE
Type: chat
Route: /threads/[id]
Access: auth required, role: client + specialist (thread participants only)

Description: Chat between client and specialist about a request

Content:
  header_title: "{otherParticipant.firstName}"
  input_placeholder: "Введите сообщение..."
  attach_button: "Прикрепить файл"
  attach_hint: "PDF, JPG, PNG — до 10 МБ, не более 3 файлов"
  send_button: "Отправить"
  typing_indicator: "печатает..."
  online_status: "в сети"
  read_receipt_sent: "Отправлено"
  read_receipt_delivered: "Доставлено"
  read_receipt_read: "Прочитано"
  closed_banner: "Заявка закрыта. Чат доступен только для чтения."
  image_viewer_download: "Скачать"
  empty_title: "Начните общение"
  empty_description: "Напишите сообщение, чтобы начать диалог"
  error_title: "Не удалось загрузить сообщения"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"
  error_send_failed: "Сообщение не отправлено. Повторить?"

Layout:
  - Header: Header-Back, title = other participant's name
  - Body: messages list (scroll, newest at bottom)
  - Footer: message input bar (text input + attach button + send button)

UI elements:
  - Message bubbles: own (right, primary bg) / other (left, surface bg)
  - Each bubble: text (body), time (small), read receipts (sent/delivered/read checkmarks)
  - Images: inline thumbnail (200x200), tap → fullscreen viewer (zoom, swipe, download)
  - Files: icon + filename + size, tap → download
  - Typing indicator: "typing..." with dots animation (via WebSocket)
  - Online status: green dot on avatar in header
  - Input bar: text input, "+" for attachments (max 3 per message, pdf/jpg/png, 10MB), send button
  - [request closed] Input disabled, banner: "Request closed. Chat is read-only."
  - Auto-scroll to latest message on open
  - Mark as read on open: PATCH /api/threads/:id/read

Acceptance Criteria:
  - [ ] Messages display: own messages right (primary bg), other's left (surface bg)
  - [ ] User types message + taps send → message appears in thread
  - [ ] Attach files (max 3, pdf/jpg/png, 10MB) → send with message
  - [ ] Image attachments show inline thumbnail → tap opens fullscreen viewer
  - [ ] Auto-scroll to newest message on open
  - [ ] Request closed → input disabled + "Chat is read-only" banner
  - [ ] Typing indicator shows when other participant is typing

States:
  - Loading: skeleton bubbles
  - Populated: messages rendered, input active
  - Error: error + Retry

Data:
  - GET /api/threads/:id/messages → [{id, senderId, text, files[], createdAt, readAt}]
  - POST /api/threads/:id/messages {text, files[]}
  - PATCH /api/threads/:id/read
  - WebSocket: typing events, new message events, presence

Business rules:
  - Thread created atomically on first POST /api/threads (with first message)
  - Participants: client (request owner) + specialist. UNIQUE(request_id, specialist_id)
  - Request CLOSED → input blocked, POST /messages → 422

Notifications triggered:
  - NEW_MESSAGE → email to other participant

Dependencies: ClientMessages, MessagesGrouped, SpecialistMyThreads

---
**Screen: TermsScreen**
Status: DONE
Type: detail
Route: /terms (modal)
Access: public

Description: Terms of use (static content)

Content:
  page_title: "Условия использования"
  close_button: "Закрыть"
  error_title: "Не удалось загрузить текст"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Layout:
  - Header: Header-Back, title "Terms of Use", close button (x)
  - Body: WebView / scroll with rendered content
  - Footer: none

Acceptance Criteria:
  - [ ] Opens as modal with close button (x)
  - [ ] Static content scrollable
  - [ ] Back/close returns to previous screen

UI elements:
  - Static content (HTML/markdown)
  - Scroll

Data: GET /api/content/terms (or static file)

Dependencies: AuthEmail, OnboardingName, ClientSettings, SpecialistSettings

---

### ADMIN

---
**Screen: AdminDashboard**
Status: DONE
Type: showcase
Route: /(admin-tabs)/dashboard
Access: auth required, role: admin

Description: Admin overview with stats

Content:
  page_title: "Панель управления"
  welcome_message: "Администратор"
  stats_labels:
    active_requests: "Активных заявок"
    new_users_week: "Новых пользователей за неделю"
    new_users_month: "Новых пользователей за месяц"
    threads_week: "Диалогов за неделю"
    threads_month: "Диалогов за месяц"
    conversion: "Конверсия заявка → диалог"
    top_cities: "Топ городов"
    top_specialists: "Топ специалистов по диалогам"
    registrations_chart: "Регистрации"
  action_cards:
    users: "Управление пользователями"
    moderation: "Модерация"
    settings: "Настройки системы"
  error_title: "Не удалось загрузить статистику"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Layout:
  - Header: Header-Home, title "Admin", right: settings gear → AdminSettings
  - Body: scroll
  - Footer: TabBar (Dashboard active)

UI elements:
  - Stats grid:
    - Active requests (number, tap → AdminModeration)
    - New users this week/month
    - Threads this week/month
    - Registrations chart (line graph)
    - Geography (top cities)
    - Conversion: request → thread
    - Top specialists by threads
  - Each metric tappable → relevant section

Acceptance Criteria:
  - [ ] Stats grid: active requests, new users, threads, registrations chart, geography, conversion, top specialists
  - [ ] Each stat tappable → navigates to relevant section
  - [ ] Settings gear → navigates to /admin/settings

States:
  - Loading: skeleton stats
  - Populated: all metrics rendered
  - Error: error + Retry

Data: GET /api/admin/stats

Dependencies: none (admin root)

---
**Screen: AdminUsers**
Status: DONE
Type: list
Route: /(admin-tabs)/users
Access: auth required, role: admin

Description: User management — search, view, ban

Content:
  page_title: "Пользователи"
  search_placeholder: "Поиск по email или имени"
  filter_labels:
    all: "Все"
    clients: "Клиенты"
    specialists: "Специалисты"
    banned: "Заблокированные"
  card_template:
    name: "{firstName} {lastName}"
    email: "{email}"
    role_badge: "{role}"
    status_badge: "{status}"
    registered: "Зарегистрирован {date}"
  action_buttons:
    ban: "Заблокировать"
    unban: "Разблокировать"
    edit: "Редактировать"
    close_all_requests: "Закрыть все заявки"
  ban_confirm: "Заблокировать пользователя {name}? Он не сможет входить в систему."
  ban_confirm_yes: "Заблокировать"
  ban_confirm_no: "Отмена"
  role_labels:
    CLIENT: "Клиент"
    SPECIALIST: "Специалист"
    ADMIN: "Админ"
  empty_title: "Пользователей не найдено"
  empty_description: "Попробуйте изменить параметры поиска"
  error_title: "Не удалось загрузить пользователей"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"
  success_toast_ban: "Пользователь заблокирован"
  success_toast_unban: "Пользователь разблокирован"

Layout:
  - Header: Header-Search (search bar)
  - Body: filter chips + vertical list (infinite scroll)
  - Footer: TabBar (Users active)

UI elements:
  - Search bar: by email/name, debounce 300ms
  - Filter chips: All | Clients | Specialists | Banned
  - User row: avatar (sm), firstName+lastName + email (truncated), role badge, status badge, registration date
  - Row tap → expand inline details:
    - Full info
    - Button "Ban" / "Unban" → confirm alert
    - Button "Edit" → inline edit fields
    - Button "Force close all requests" (for clients)
  - Pagination: 20/page infinite scroll

Acceptance Criteria:
  - [ ] Search by email/name with debounce
  - [ ] Filter chips: All | Clients | Specialists | Banned
  - [ ] Tap user row → expands with details + Ban/Unban/Edit buttons
  - [ ] Ban user → confirm → user marked banned
  - [ ] Infinite scroll (20/page)

States:
  - Loading: skeleton rows
  - Populated: user list
  - Error: error + Retry

Data:
  - GET /api/admin/users?q=X&role=Y&page=1&limit=20
  - PATCH /api/admin/users/:id {isBanned: true/false}
  - PATCH /api/admin/users/:id {firstName, lastName, ...}
  - POST /api/admin/users/:id/close-all-requests

Business rules:
  - Banned user cannot login, sees "Account blocked"
  - Admin can edit any user's data
  - Admin can force-close any request

Dependencies: AdminDashboard

---
**Screen: AdminModeration**
Status: DONE
Type: list
Route: /(admin-tabs)/moderation
Access: auth required, role: admin

Description: Content moderation queue (reserved for future, empty in MVP)

Content:
  page_title: "Модерация"
  action_buttons:
    approve: "Одобрить"
    reject: "Отклонить"
  empty_title: "Всё чисто"
  empty_description: "Нет элементов, требующих модерации"
  error_title: "Не удалось загрузить очередь"
  error_description: "Проверьте соединение с интернетом и попробуйте снова"
  error_button: "Повторить"

Layout:
  - Header: Header-Home, title "Moderation"
  - Body: list
  - Footer: TabBar (Moderation active)

Acceptance Criteria:
  - [ ] MVP: always shows "All clear" empty state
  - [ ] Queue structure ready for future items with Approve/Reject buttons

UI elements:
  - Queue items with Approve/Reject buttons
  - Empty state: "All clear" (MVP: always empty, no moderation)

States:
  - Loading: skeleton
  - Empty: "All clear"
  - Populated: queue items
  - Error: error + Retry

Data: GET /api/admin/moderation/queue

Business rules:
  - MVP: no moderation, instant publish. Screen reserved for future.

Dependencies: AdminDashboard

---
**Screen: AdminSettings**
Status: DONE
Type: settings
Route: /admin/settings
Access: auth required, role: admin

Description: System-wide settings

Content:
  page_title: "Настройки системы"
  field_labels:
    max_requests_per_client:
      label: "Макс. заявок на клиента"
      hint: "Лимит заявок за всё время для каждого клиента"
    max_threads_per_request:
      label: "Макс. диалогов на заявку"
      hint: "Сколько специалистов могут написать по одной заявке"
    auto_close_days:
      label: "Автозакрытие (дни)"
      hint: "Через сколько дней без активности заявка закрывается автоматически"
    max_extensions:
      label: "Макс. продлений"
      hint: "Сколько раз клиент может продлить заявку"
    close_warning_days:
      label: "Предупреждение (дни)"
      hint: "За сколько дней до закрытия показывать предупреждение"
    max_file_size_mb:
      label: "Макс. размер файла (МБ)"
      hint: "Максимальный размер одного файла"
    max_files_per_message:
      label: "Макс. файлов в сообщении"
      hint: "Максимальное количество файлов в одном сообщении"
  button_save: "Сохранить настройки"
  note: "Изменения применяются только к новым заявкам. Существующие заявки не пересчитываются."
  error_title: "Ошибка сохранения"
  error_description: "Не удалось сохранить настройки. Проверьте значения и попробуйте ещё раз."
  error_button: "Повторить"
  success_toast: "Настройки сохранены"

Layout:
  - Header: Header-Back, title "Settings"
  - Body: scroll form
  - Footer: none

UI elements:
  - Input "Max requests per client" (number, default 5)
  - Input "Max threads per request" (number, default 10)
  - Input "Auto-close days" (number, default 30)
  - Input "Max extensions" (number, default 3)
  - Input "Close warning days" (number, default 3)
  - Input "Max file size MB" (number, default 10)
  - Input "Max files per message" (number, default 5)
  - Each with label + current value from DB
  - Button primary "Save" → toast "Saved"

Acceptance Criteria:
  - [ ] All configurable values shown with current DB values
  - [ ] Edit values + "Save" → toast "Saved"
  - [ ] Fields: max requests/client, max threads/request, auto-close days, max extensions, close warning days, max file size, max files/message

States:
  - Loaded: values from DB
  - Saving: button spinner
  - Error: validation / server error

Data:
  - GET /api/admin/settings
  - PATCH /api/admin/settings {key: value, ...}

Business rules:
  - Changes apply immediately to new requests
  - Existing requests NOT recalculated

Dependencies: AdminDashboard

---

## Navigation Map

```
GUEST:
  Landing → AuthEmail → AuthOTP → [role routing]
  Landing → PublicRequestsFeed → PublicRequestDetail
  Landing → SpecialistsCatalog → SpecialistPublicProfile

CLIENT (after auth):
  TabBar: Dashboard | My Requests | Messages

  ClientDashboard → MyRequestsNew → MyRequestDetail
  ClientDashboard → ClientSettings
  MyRequests → MyRequestDetail → MessagesGrouped → ChatThread
  ClientMessages → ChatThread
  MyRequestDetail → SpecialistPublicProfile

SPECIALIST (after onboarding):
  TabBar: Dashboard | Public Requests | My Threads

  SpecialistDashboard → SpecialistConfirmWrite → ChatThread
  SpecialistDashboard → SpecialistSettings
  PublicRequestsFeed → PublicRequestDetail → SpecialistConfirmWrite → ChatThread
  SpecialistMyThreads → ChatThread
  SpecialistPublicProfile → SpecialistSettings

ADMIN:
  TabBar: Dashboard | Users | Moderation

  AdminDashboard → AdminSettings
  AdminDashboard → AdminUsers
  AdminDashboard → AdminModeration
```

## Access Matrix

| Screen | guest | client | specialist | admin |
|--------|-------|--------|------------|-------|
| Landing | yes | yes | yes | yes |
| PublicRequestsFeed | yes | yes | yes | yes |
| PublicRequestDetail | yes | yes | yes | yes |
| SpecialistsCatalog | yes | yes | yes | yes |
| SpecialistPublicProfile | yes | yes | yes | yes |
| TermsScreen | yes | yes | yes | yes |
| AuthEmail | yes | redirect | redirect | redirect |
| AuthOTP | yes | redirect | redirect | redirect |
| OnboardingName | - | - | new only | - |
| OnboardingWorkArea | - | - | new only | - |
| OnboardingProfile | - | - | new only | - |
| ClientDashboard | - | yes | - | - |
| MyRequests | - | yes | - | - |
| MyRequestsNew | - | yes | - | - |
| MyRequestDetail | - | owner | - | - |
| MessagesGrouped | - | owner | - | - |
| ClientMessages | - | yes | - | - |
| ClientSettings | - | yes | - | - |
| SpecialistDashboard | - | - | yes | - |
| SpecialistConfirmWrite | - | - | yes | - |
| SpecialistMyThreads | - | - | yes | - |
| SpecialistSettings | - | - | yes | - |
| ChatThread | - | participant | participant | - |
| AdminDashboard | - | - | - | yes |
| AdminUsers | - | - | - | yes |
| AdminModeration | - | - | - | yes |
| AdminSettings | - | - | - | yes |

## Data Model (from SA)

| Table | Key fields |
|-------|-----------|
| users | id, email, role, first_name, last_name, is_available, is_banned |
| specialist_profiles | user_id, description, avatar_url, phone, telegram, whatsapp, office_address, working_hours |
| specialist_fns | specialist_id, fns_id (many-to-many) |
| specialist_services | specialist_id, fns_id, service_id |
| cities | id, name (seeded) |
| fns_offices | id, city_id, name, code (seeded) |
| services | id, name (3 rows: Inspection, Audit, Operational Control) |
| requests | id, user_id, title, city_id, fns_id, description, status (active/closing_soon/closed), last_activity_at, extensions_count |
| threads | id, request_id, client_id, specialist_id, last_message_at, client_last_read_at, specialist_last_read_at |
| messages | id, thread_id, sender_id, text, created_at |
| files | id, entity_type, entity_id, url, filename, size, mime_type |
| settings | key, value (admin-configurable limits) |

Unique indexes: specialist_fns(specialist_id, fns_id), threads(request_id, specialist_id)

## Business Rules Summary

- **Monetization:** MVP is 100% FREE. No payments, no subscriptions, no commissions.
- **Request lifecycle:** active → closing_soon (<=3 days) → closed (auto 30 days no activity or manual). Max 3 extensions. Reopening impossible, but "Create similar" copies data.
- **Thread = first message:** No Response entity. Specialist writes first message → thread created atomically. No Accept/Reject step.
- **Rate limits:** 5 requests lifetime per client, 20 new threads per day per specialist (configurable by admin).
- **Notifications:** MVP email only (no push). Events: new thread, new message, closing warning (3 days), request closed.
- **Files:** MinIO storage. Avatar 5MB jpg/png/webp → resize 400x400. Documents 10MB pdf/jpg/png max 5. Chat attachments 10MB max 3 per message.
- **Contacts:** Specialist contacts (phone, telegram, whatsapp, address, hours) are PUBLIC — visible to everyone including guests.

---

## Section 5: DB Schema

> Derived from SA entities, SCREEN_MAP data fields, and existing Prisma schema.
> All PKs are UUID. All tables have `created_at timestamptz DEFAULT now()`. Prices in kopecks (integer). Strings in Russian.

### Table: users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT uuid_generate_v4() | User identifier |
| email | varchar(255) | UNIQUE, NOT NULL | Login email |
| role | enum('CLIENT','SPECIALIST','ADMIN') | NULLABLE | Assigned after onboarding or first login choice |
| first_name | varchar(50) | NULLABLE | First name (2-50 chars) |
| last_name | varchar(50) | NULLABLE | Last name (2-50 chars) |
| avatar_url | varchar(512) | NULLABLE | MinIO path to avatar |
| is_available | boolean | NOT NULL, DEFAULT false | Specialist: accepting requests toggle |
| is_banned | boolean | NOT NULL, DEFAULT false | Admin ban flag |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Registration timestamp |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last profile update |

### Table: specialist_profiles
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Profile identifier |
| user_id | uuid | UNIQUE, FK -> users.id ON DELETE CASCADE | One-to-one with user |
| description | text | NULLABLE, max 1000 chars | About me / experience |
| phone | varchar(20) | NULLABLE | Phone (+7XXXXXXXXXX), PUBLIC |
| telegram | varchar(50) | NULLABLE | Telegram @username, PUBLIC |
| whatsapp | varchar(20) | NULLABLE | WhatsApp number, PUBLIC |
| office_address | varchar(200) | NULLABLE | Office address, PUBLIC |
| working_hours | varchar(100) | NULLABLE | e.g. "Пн-Пт 9:00-18:00", PUBLIC |

### Table: cities
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | City identifier |
| name | varchar(100) | NOT NULL | City name in Russian (e.g. "Москва") |

### Table: fns_offices
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | FNS office identifier |
| city_id | uuid | NOT NULL, FK -> cities.id ON DELETE CASCADE | Parent city |
| name | varchar(200) | NOT NULL | Full name (e.g. "ИФНС №1 по г. Москве") |
| code | varchar(10) | NOT NULL | FNS code (e.g. "7701") |

### Table: services
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Service identifier |
| name | varchar(100) | NOT NULL | Service name in Russian |

Fixed seed values (3 rows):
1. "Выездная проверка"
2. "Камеральная проверка"
3. "Отдел оперативного контроля"

Note: the 4th option "Не знаю" is a CLIENT-SIDE UI-only choice in the quick request form on Landing — it is NOT stored in the services table. When a client selects "Не знаю", the request is created WITHOUT a service_id (NULL), meaning the client doesn't know which service applies.

### Table: specialist_fns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Join record identifier |
| specialist_id | uuid | NOT NULL, FK -> users.id ON DELETE CASCADE | Specialist user |
| fns_id | uuid | NOT NULL, FK -> fns_offices.id ON DELETE CASCADE | FNS office |

### Table: specialist_services
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Record identifier |
| specialist_id | uuid | NOT NULL, FK -> users.id ON DELETE CASCADE | Specialist user |
| fns_id | uuid | NOT NULL, FK -> fns_offices.id ON DELETE CASCADE | FNS office |
| service_id | uuid | NOT NULL, FK -> services.id ON DELETE CASCADE | Service type |
| specialist_fns_id | uuid | NOT NULL, FK -> specialist_fns.id ON DELETE CASCADE | Parent join record |

### Table: requests
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Request identifier |
| user_id | uuid | NOT NULL, FK -> users.id ON DELETE CASCADE | Client who created the request |
| title | varchar(100) | NOT NULL | Request title (3-100 chars) |
| city_id | uuid | NOT NULL, FK -> cities.id | City |
| fns_id | uuid | NOT NULL, FK -> fns_offices.id | FNS office |
| description | text | NOT NULL | Problem description (10-2000 chars) |
| status | enum('ACTIVE','CLOSING_SOON','CLOSED') | NOT NULL, DEFAULT 'ACTIVE' | Lifecycle status |
| last_activity_at | timestamptz | NOT NULL, DEFAULT now() | Last thread/message activity, drives auto-close |
| extensions_count | integer | NOT NULL, DEFAULT 0 | How many times client extended (max 3) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Creation timestamp |

### Table: threads
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Thread identifier |
| request_id | uuid | NOT NULL, FK -> requests.id ON DELETE CASCADE | Parent request |
| client_id | uuid | NOT NULL, FK -> users.id | Request owner (client) |
| specialist_id | uuid | NOT NULL, FK -> users.id | Specialist who initiated thread |
| last_message_at | timestamptz | NULLABLE | Timestamp of last message in thread |
| client_last_read_at | timestamptz | NULLABLE | Client read cursor for unread calculation |
| specialist_last_read_at | timestamptz | NULLABLE | Specialist read cursor for unread calculation |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Thread creation (= first message) |

### Table: messages
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Message identifier |
| thread_id | uuid | NOT NULL, FK -> threads.id ON DELETE CASCADE | Parent thread |
| sender_id | uuid | NOT NULL, FK -> users.id | Message author (client or specialist) |
| text | text | NOT NULL | Message body (1-2000 chars) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Sent timestamp |

### Table: files
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | File identifier |
| entity_type | varchar(30) | NOT NULL | Polymorphic type: 'avatar', 'document', 'chat_attachment' |
| entity_id | uuid | NOT NULL | FK to parent entity (user.id, request.id, message.id) |
| url | varchar(512) | NOT NULL | MinIO file URL |
| filename | varchar(255) | NOT NULL | Original filename |
| size | integer | NOT NULL | File size in bytes |
| mime_type | varchar(50) | NOT NULL | MIME type (e.g. 'application/pdf', 'image/jpeg') |
| request_id | uuid | NULLABLE, FK -> requests.id ON DELETE SET NULL | Optional direct FK for request attachments |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Upload timestamp |

### Table: settings
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | varchar(100) | PK | Setting key |
| value | varchar(255) | NOT NULL | Setting value (stored as string, parsed by app) |

Default settings rows:
| key | value | Description |
|-----|-------|-------------|
| max_requests_per_client | 5 | Lifetime request limit per client |
| max_threads_per_request | 10 | Max specialist threads per request |
| auto_close_days | 30 | Days without activity before auto-close |
| max_extensions | 3 | Max extensions per request |
| close_warning_days | 3 | Days before close to show warning |
| max_file_size_mb | 10 | Max file size in MB |
| max_files_per_message | 5 | Max files per chat message |

### Table: otp_codes
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | OTP record identifier |
| email | varchar(255) | NOT NULL | Target email |
| code | varchar(6) | NOT NULL | 6-digit OTP code |
| expires_at | timestamptz | NOT NULL | Expiry (15 min from creation) |
| used | boolean | NOT NULL, DEFAULT false | Whether code was consumed |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Creation timestamp |

### Table: refresh_tokens
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Token record identifier |
| user_id | uuid | NOT NULL, FK -> users.id ON DELETE CASCADE | Token owner |
| token | varchar(512) | UNIQUE, NOT NULL | Refresh token value |
| expires_at | timestamptz | NOT NULL | Token expiry (30 days sliding) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Issue timestamp |

### Table: notification_settings
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Record identifier |
| user_id | uuid | UNIQUE, FK -> users.id ON DELETE CASCADE | User whose preferences |
| new_messages | boolean | NOT NULL, DEFAULT true | Email on new messages |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Last update |

### Relations

```
users 1--1 specialist_profiles (user_id)
users 1--* specialist_fns (specialist_id)
users 1--* specialist_services (specialist_id)
users 1--* requests (user_id)
users 1--* threads as client (client_id)
users 1--* threads as specialist (specialist_id)
users 1--* messages (sender_id)
users 1--* refresh_tokens (user_id)
users 1--1 notification_settings (user_id)

cities 1--* fns_offices (city_id)
cities 1--* requests (city_id)

fns_offices 1--* specialist_fns (fns_id)
fns_offices 1--* specialist_services (fns_id)
fns_offices 1--* requests (fns_id)

services 1--* specialist_services (service_id)

specialist_fns 1--* specialist_services (specialist_fns_id)

requests 1--* threads (request_id)
requests 1--* files (request_id)

threads 1--* messages (thread_id)

files -- polymorphic on (entity_type, entity_id)
```

### Indexes

```sql
-- Auth
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_otp_codes_email_expires ON otp_codes(email, expires_at);

-- Specialist join tables
CREATE UNIQUE INDEX idx_specialist_fns_unique ON specialist_fns(specialist_id, fns_id);
CREATE UNIQUE INDEX idx_specialist_services_unique ON specialist_services(specialist_id, fns_id, service_id);

-- Requests
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_city_id ON requests(city_id);
CREATE INDEX idx_requests_fns_id ON requests(fns_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_status_last_activity ON requests(status, last_activity_at);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);

-- Threads
CREATE UNIQUE INDEX idx_threads_request_specialist ON threads(request_id, specialist_id);
CREATE INDEX idx_threads_client_last_msg ON threads(client_id, last_message_at DESC);
CREATE INDEX idx_threads_specialist_last_msg ON threads(specialist_id, last_message_at DESC);
CREATE INDEX idx_threads_request_id ON threads(request_id);

-- Messages
CREATE INDEX idx_messages_thread_created ON messages(thread_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Files (polymorphic)
CREATE INDEX idx_files_entity ON files(entity_type, entity_id);
CREATE INDEX idx_files_request_id ON files(request_id);

-- Notification settings
CREATE UNIQUE INDEX idx_notification_settings_user ON notification_settings(user_id);
```

---

## Section 6: API Spec

> All endpoints consolidated from screen Data sections. Base URL: `/api`.
> Auth: JWT Bearer token in `Authorization` header. Dev OTP: `000000`.

### Auth
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| POST | /api/auth/request-otp | `{email}` | `{success: true}` | No | Rate: 5/min per email. Creates user if not exists. Dev: code=000000 |
| POST | /api/auth/verify-otp | `{email, code}` | `{accessToken, refreshToken, user: {id, email, role, firstName, lastName}}` | No | 3 wrong attempts -> resend required. Routes by role post-verify |
| POST | /api/auth/refresh | `{refreshToken}` | `{accessToken, refreshToken}` | No | Token rotation: old refresh invalidated. 30d sliding window |
| POST | /api/auth/logout | - | `{success: true}` | Yes | Deletes all refresh tokens for user |

### Onboarding (specialist, 3 steps)
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| PUT | /api/onboarding/name | `{firstName, lastName}` | `{success: true}` | Yes (specialist, new) | Step 1/3. Sets role=SPECIALIST, first/last name |
| PUT | /api/onboarding/work-area | `{fnsServices: [{fnsId, serviceIds: [uuid]}]}` | `{success: true}` | Yes (specialist, new) | Step 2/3. Saves to specialist_fns + specialist_services |
| PUT | /api/onboarding/profile | `{avatar?, description?, phone?, telegram?, whatsapp?, officeAddress?, workingHours?}` | `{success: true}` | Yes (specialist, new) | Step 3/3. All optional. Completes onboarding, sets is_available=true |

### Reference Data
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| GET | /api/cities | - | `[{id, name}]` | No | Seeded data, ~15 Russian cities |
| GET | /api/fns | `?city_id=uuid` | `[{id, name, code, cityId}]` | No | FNS offices filtered by city. ~70 total |
| GET | /api/services | - | `[{id, name}]` | No | 3 fixed rows |

### User Profile
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| GET | /api/user/me | - | `{id, email, role, firstName, lastName, avatarUrl, isAvailable, createdAt}` | Yes | Current user info for settings prefill |
| PATCH | /api/user/profile | `{firstName?, lastName?, avatar?}` | `{success: true}` | Yes | Client profile update |
| PATCH | /api/user/notification-settings | `{new_messages: bool}` | `{success: true}` | Yes | Toggle email notifications |

### Specialists
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| GET | /api/specialists | `?city_id&fns_id&services[]=uuid&page=1&limit=20` | `{items: [{id, firstName, lastName, avatar, services, city}], total, hasMore}` | No | Only is_available=true. Paginated |
| GET | /api/specialists/featured | - | `[{id, firstName, lastName, avatar, services}]` | No | Landing page featured (top 10 newest available) |
| GET | /api/specialists/:id | - | `{id, firstName, lastName, avatar, description, isAvailable, phone, telegram, whatsapp, officeAddress, workingHours, fnsServices: [{city, fns, services[]}], createdAt}` | No | Public profile. Contacts visible to everyone |

### Specialist Profile (self)
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| GET | /api/specialist/profile | - | Full specialist profile (own) | Yes (specialist) | Prefill settings form |
| PATCH | /api/specialist/profile | `{firstName?, lastName?, fnsServices?, phone?, telegram?, whatsapp?, officeAddress?, workingHours?, isAvailable?}` | `{success: true}` | Yes (specialist) | isAvailable toggle is instant PATCH |
| GET | /api/specialist/stats | - | `{threadsTotal, newMessages}` | Yes (specialist) | Dashboard stats |
| GET | /api/specialist/requests | - | `[{id, title, city, fns, service, description, hasThread, threadId}]` | Yes (specialist) | Matching requests for dashboard |

### Requests (client)
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| POST | /api/requests | `{title, cityId, fnsId, description, files[]}` | `{id, ...request}` | Yes (client) | Create request. 5 lifetime limit (configurable). No moderation |
| GET | /api/requests | `?limit=N` | `[{id, title, status, city, fns, service, threadsCount, createdAt}]` | Yes (client) | Client's own requests |
| GET | /api/requests/:id | - | `{id, title, status, city, fns, service, description, files[], threadsCount, extensionsCount, createdAt}` | Yes (client, owner) | Full detail for request owner |
| PATCH | /api/requests/:id | `{status: 'CLOSED'}` | `{success: true}` | Yes (client, owner) | Manual close |
| POST | /api/requests/:id/extend | - | `{success: true}` | Yes (client, owner) | Extend request. Max 3 extensions. Resets last_activity_at |
| DELETE | /api/requests/:id | - | `{success: true}` | Yes (client, owner) | Delete request + cascade files |

### Requests (public)
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| GET | /api/requests/public | `?city_id&service_id&page=1&limit=20` | `{items: [{id, title, city, fns, service, description, threadsCount, createdAt}], total, hasMore}` | No | Public feed. Only ACTIVE+CLOSING_SOON. Paginated |
| POST | /api/requests/public | `{cityId, serviceId?, description}` | `{id, ...}` | No* | Quick request from landing. *Triggers inline OTP if not auth |
| GET | /api/requests/:id/public | - | `{id, title, city, fns, service, description, status, threadsCount, createdAt, hasExistingThread?, existingThreadId?}` | No | Public detail. hasExistingThread only for auth specialist |

### Dashboard (client)
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| GET | /api/dashboard/stats | - | `{requestsUsed, requestsLimit, unreadMessages}` | Yes (client) | Client dashboard stats |

### Threads & Messages
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| POST | /api/threads | `{requestId, firstMessage}` | `{threadId}` | Yes (specialist) | Create thread + first message atomically. UNIQUE(request_id, specialist_id). Rate: 20 new/day |
| GET | /api/threads | `?request_id&grouped_by=request` | `[{id, request, specialist/client, lastMessage, unreadCount, lastMessageAt}]` | Yes | List threads. Grouped if param set. Client sees specialist info, specialist sees client info |
| GET | /api/threads/:id/messages | - | `[{id, senderId, text, files[], createdAt, readAt}]` | Yes (participant) | Message history for thread |
| POST | /api/threads/:id/messages | `{text, files[]}` | `{id, ...message}` | Yes (participant) | Send message. 422 if request CLOSED |
| PATCH | /api/threads/:id/read | - | `{success: true}` | Yes (participant) | Mark thread read. Updates client_last_read_at or specialist_last_read_at |

### File Uploads
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| POST | /api/uploads/avatar | multipart/form-data | `{url}` | Yes | jpg/png/webp, max 5MB. Server resizes to 400x400 |
| POST | /api/uploads/documents | multipart/form-data | `[{url, filename, size}]` | Yes | pdf/jpg/png, max 10MB each, max 5 files |
| POST | /api/uploads/chat-attachments | multipart/form-data | `[{url, filename, size}]` | Yes | pdf/jpg/png, max 10MB each, max 3 per message |

### Admin
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| GET | /api/admin/stats | - | `{activeRequests, newUsersWeek, newUsersMonth, threadsWeek, threadsMonth, topCities, topSpecialists, conversion}` | Yes (admin) | Dashboard metrics |
| GET | /api/admin/users | `?q&role&page=1&limit=20` | `{items: [{id, email, firstName, lastName, role, isBanned, createdAt}], total}` | Yes (admin) | User list with search. Debounce 300ms client-side |
| PATCH | /api/admin/users/:id | `{isBanned?, firstName?, lastName?, ...}` | `{success: true}` | Yes (admin) | Edit user, ban/unban |
| POST | /api/admin/users/:id/close-all-requests | - | `{closedCount}` | Yes (admin) | Force-close all active requests for user |
| GET | /api/admin/settings | - | `{key: value, ...}` | Yes (admin) | All configurable settings |
| PATCH | /api/admin/settings | `{key: value, ...}` | `{success: true}` | Yes (admin) | Update settings. Applies to new requests only |
| GET | /api/admin/moderation/queue | - | `{items: []}` | Yes (admin) | MVP: always empty. Reserved for future |

### Content
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| GET | /api/content/terms | - | `{html: "..."}` | No | Terms of use static content |

### Health
| Method | Endpoint | Body/Query | Response | Auth | Notes |
|--------|----------|------------|----------|------|-------|
| GET | /api/health | - | `{status: "ok", version: "..."}` | No | Healthcheck for monitoring |

### WebSocket Events (Chat)
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| typing | client -> server | `{threadId}` | User is typing |
| typing | server -> client | `{threadId, userId}` | Other participant is typing |
| new_message | server -> client | `{threadId, message}` | Real-time new message |
| presence | server -> client | `{userId, online: bool}` | Online status for chat header |

### Rate Limits Summary
| Endpoint | Limit | Scope |
|----------|-------|-------|
| POST /api/auth/request-otp | 5/min | per email |
| POST /api/threads | 20 new/day | per specialist |
| POST /api/requests | 5 lifetime | per client (configurable in settings) |
| General API | 100/min | per IP |

---

## Section 7: Seed Data

### Developer Test Account (ALWAYS created first)
| Field | Value |
|-------|-------|
| email | serter2069@gmail.com |
| phone | +17024826083 |
| first_name | Sergei |
| last_name | Admin |
| role | ADMIN |
| is_available | true |
| is_banned | false |
| avatar_url | null |

This account also gets:
- A specialist_profile with description "Администратор и тестовый специалист"
- specialist_fns entries for Moscow IFNS #1 and #46
- specialist_services for all 3 services at each FNS
- 3 requests as client (active, closing_soon, closed)
- 5 threads (3 as client recipient, 2 as specialist initiator)
- Multiple messages in each thread
- notification_settings with new_messages=true

### Seed: cities (15 rows)
| name |
|------|
| Москва |
| Санкт-Петербург |
| Новосибирск |
| Екатеринбург |
| Казань |
| Нижний Новгород |
| Челябинск |
| Самара |
| Омск |
| Ростов-на-Дону |
| Уфа |
| Красноярск |
| Воронеж |
| Пермь |
| Волгоград |

### Seed: fns_offices (~70 rows, examples per city)
| city | name | code |
|------|------|------|
| Москва | ИФНС России №1 по г. Москве | 7701 |
| Москва | ИФНС России №2 по г. Москве | 7702 |
| Москва | ИФНС России №3 по г. Москве | 7703 |
| Москва | ИФНС России №4 по г. Москве | 7704 |
| Москва | ИФНС России №5 по г. Москве | 7705 |
| Москва | ИФНС России №7 по г. Москве | 7707 |
| Москва | ИФНС России №8 по г. Москве | 7708 |
| Москва | ИФНС России №9 по г. Москве | 7709 |
| Москва | ИФНС России №10 по г. Москве | 7710 |
| Москва | ИФНС России №13 по г. Москве | 7713 |
| Москва | ИФНС России №14 по г. Москве | 7714 |
| Москва | ИФНС России №15 по г. Москве | 7715 |
| Москва | ИФНС России №16 по г. Москве | 7716 |
| Москва | ИФНС России №17 по г. Москве | 7717 |
| Москва | ИФНС России №18 по г. Москве | 7718 |
| Москва | ИФНС России №19 по г. Москве | 7719 |
| Москва | ИФНС России №20 по г. Москве | 7720 |
| Москва | ИФНС России №21 по г. Москве | 7721 |
| Москва | ИФНС России №22 по г. Москве | 7722 |
| Москва | ИФНС России №23 по г. Москве | 7723 |
| Москва | ИФНС России №24 по г. Москве | 7724 |
| Москва | ИФНС России №25 по г. Москве | 7725 |
| Москва | ИФНС России №26 по г. Москве | 7726 |
| Москва | ИФНС России №27 по г. Москве | 7727 |
| Москва | ИФНС России №28 по г. Москве | 7728 |
| Москва | ИФНС России №29 по г. Москве | 7729 |
| Москва | ИФНС России №30 по г. Москве | 7730 |
| Москва | ИФНС России №31 по г. Москве | 7731 |
| Москва | ИФНС России №33 по г. Москве | 7733 |
| Москва | ИФНС России №34 по г. Москве | 7734 |
| Москва | ИФНС России №35 по г. Москве | 7735 |
| Москва | ИФНС России №36 по г. Москве | 7736 |
| Москва | ИФНС России №43 по г. Москве | 7743 |
| Москва | ИФНС России №46 по г. Москве | 7746 |
| Москва | ИФНС России №51 по г. Москве | 7751 |
| Санкт-Петербург | ИФНС России по Адмиралтейскому р-ну | 7802 |
| Санкт-Петербург | ИФНС России по Василеостровскому р-ну | 7801 |
| Санкт-Петербург | ИФНС России по Выборгскому р-ну | 7803 |
| Санкт-Петербург | ИФНС России по Калининскому р-ну | 7804 |
| Санкт-Петербург | ИФНС России по Кировскому р-ну | 7805 |
| Санкт-Петербург | ИФНС России по Красногвардейскому р-ну | 7806 |
| Санкт-Петербург | ИФНС России по Московскому р-ну | 7810 |
| Санкт-Петербург | ИФНС России по Невскому р-ну | 7811 |
| Санкт-Петербург | ИФНС России по Петроградскому р-ну | 7813 |
| Санкт-Петербург | ИФНС России по Приморскому р-ну | 7814 |
| Новосибирск | ИФНС России по Дзержинскому р-ну г. Новосибирска | 5401 |
| Новосибирск | ИФНС России по Железнодорожному р-ну г. Новосибирска | 5402 |
| Новосибирск | ИФНС России по Заельцовскому р-ну г. Новосибирска | 5403 |
| Новосибирск | ИФНС России по Кировскому р-ну г. Новосибирска | 5404 |
| Екатеринбург | ИФНС России по Кировскому р-ну г. Екатеринбурга | 6670 |
| Екатеринбург | ИФНС России по Ленинскому р-ну г. Екатеринбурга | 6671 |
| Екатеринбург | ИФНС России по Октябрьскому р-ну г. Екатеринбурга | 6672 |
| Екатеринбург | ИФНС России по Верх-Исетскому р-ну г. Екатеринбурга | 6673 |
| Казань | ИФНС России по Авиастроительному р-ну г. Казани | 1684 |
| Казань | ИФНС России по Вахитовскому р-ну г. Казани | 1685 |
| Казань | ИФНС России по Кировскому р-ну г. Казани | 1686 |
| Нижний Новгород | ИФНС России по Автозаводскому р-ну г. Нижнего Новгорода | 5256 |
| Нижний Новгород | ИФНС России по Канавинскому р-ну г. Нижнего Новгорода | 5257 |
| Нижний Новгород | ИФНС России по Нижегородскому р-ну г. Нижнего Новгорода | 5258 |
| Челябинск | ИФНС России по Калининскому р-ну г. Челябинска | 7453 |
| Челябинск | ИФНС России по Курчатовскому р-ну г. Челябинска | 7454 |
| Самара | ИФНС России по Железнодорожному р-ну г. Самары | 6311 |
| Самара | ИФНС России по Кировскому р-ну г. Самары | 6312 |
| Омск | ИФНС России по Кировскому АО г. Омска | 5501 |
| Ростов-на-Дону | ИФНС России по Ворошиловскому р-ну г. Ростова-на-Дону | 6163 |
| Ростов-на-Дону | ИФНС России по Ленинскому р-ну г. Ростова-на-Дону | 6164 |
| Уфа | ИФНС России по Кировскому р-ну г. Уфы | 0274 |
| Красноярск | ИФНС России по Железнодорожному р-ну г. Красноярска | 2461 |
| Воронеж | ИФНС России по Коминтерновскому р-ну г. Воронежа | 3666 |
| Пермь | ИФНС России по Ленинскому р-ну г. Перми | 5902 |
| Волгоград | ИФНС России по Дзержинскому р-ну г. Волгограда | 3441 |

### Seed: services (3 rows, fixed)
| name |
|------|
| Выездная проверка |
| Камеральная проверка |
| Отдел оперативного контроля |

### Seed: users (50 target)

Breakdown by role:
- 1 admin (serter2069@gmail.com)
- 29 clients
- 20 specialists

Example specialists:
| first_name | last_name | email | city | services |
|------------|-----------|-------|------|----------|
| Иван | Петров | ivan.petrov@example.com | Москва | Выездная проверка, Камеральная проверка |
| Елена | Сидорова | elena.sidorova@example.com | Москва | Камеральная проверка |
| Алексей | Козлов | alexey.kozlov@example.com | Санкт-Петербург | Отдел оперативного контроля |
| Мария | Новикова | maria.novikova@example.com | Екатеринбург | Выездная проверка |
| Дмитрий | Морозов | dmitry.morozov@example.com | Казань | Камеральная проверка, Отдел оперативного контроля |
| Анна | Волкова | anna.volkova@example.com | Новосибирск | Выездная проверка, Камеральная проверка, Отдел оперативного контроля |
| Сергей | Лебедев | sergey.lebedev@example.com | Нижний Новгород | Камеральная проверка |
| Ольга | Соловьёва | olga.solovyova@example.com | Челябинск | Выездная проверка |
| Андрей | Васильев | andrey.vasiliev@example.com | Самара | Отдел оперативного контроля |
| Наталья | Зайцева | natalya.zaitseva@example.com | Ростов-на-Дону | Выездная проверка, Камеральная проверка |
| Михаил | Павлов | mikhail.pavlov@example.com | Москва | Отдел оперативного контроля |
| Татьяна | Семёнова | tatyana.semenova@example.com | Санкт-Петербург | Камеральная проверка |
| Владимир | Голубев | vladimir.golubev@example.com | Москва | Выездная проверка, Камеральная проверка, Отдел оперативного контроля |
| Екатерина | Виноградова | ekaterina.vinogradova@example.com | Казань | Камеральная проверка |
| Николай | Богданов | nikolay.bogdanov@example.com | Екатеринбург | Выездная проверка, Отдел оперативного контроля |
| Юлия | Воробьёва | yulia.vorobyova@example.com | Новосибирск | Камеральная проверка |
| Александр | Фёдоров | alexandr.fedorov@example.com | Нижний Новгород | Выездная проверка |
| Ирина | Михайлова | irina.mikhaylova@example.com | Москва | Камеральная проверка, Отдел оперативного контроля |
| Виктор | Николаев | viktor.nikolaev@example.com | Санкт-Петербург | Выездная проверка |
| Людмила | Макарова | lyudmila.makarova@example.com | Москва | Камеральная проверка |

2 specialists have is_available=false (Павлов, Макарова) — to test hidden-from-catalog behavior.

Example clients:
| first_name | last_name | email |
|------------|-----------|-------|
| Пётр | Иванов | petr.ivanov@example.com |
| Светлана | Кузнецова | svetlana.kuznetsova@example.com |
| Артём | Смирнов | artem.smirnov@example.com |
| Ксения | Попова | ksenia.popova@example.com |
| Роман | Соколов | roman.sokolov@example.com |
| ... | ... | ... (29 total, faker.js generated) |

### Seed: requests (100 target)

Distribution by status:
- 60 ACTIVE
- 20 CLOSING_SOON (last_activity_at = now - 27 days)
- 20 CLOSED (last_activity_at = now - 31+ days)

Distribution by city: weighted toward Москва (40%), СПб (20%), rest 40% spread.

Example requests:
| title | city | fns | description (truncated) | status |
|-------|------|-----|-------------------------|--------|
| Выездная проверка за 2024 год | Москва | ИФНС №1 | Получили уведомление о выездной проверке за 2024 г., нужна помощь... | ACTIVE |
| Камеральная проверка 3-НДФЛ | Москва | ИФНС №46 | Подал декларацию 3-НДФЛ, налоговая запросила пояснения... | ACTIVE |
| Требование из ИФНС по НДС | Санкт-Петербург | по Адмиралтейскому р-ну | Пришло требование о предоставлении документов по НДС... | CLOSING_SOON |
| Оспорить штраф за несвоевременную сдачу | Екатеринбург | по Кировскому р-ну | Начислили штраф 1000 руб за опоздание с декларацией... | ACTIVE |
| Помощь с возвратом переплаты НДФЛ | Казань | по Вахитовскому р-ну | Переплатил НДФЛ, подал заявление на возврат 3 месяца назад... | CLOSED |
| Подготовка к выездной проверке ООО | Москва | ИФНС №14 | ООО получило решение о выездной проверке, нужен специалист... | ACTIVE |
| Камеральная проверка УСН | Новосибирск | по Дзержинскому р-ну | Налоговая просит пояснения по УСН декларации за 2025... | ACTIVE |
| Оперативный контроль торговой точки | Москва | ИФНС №22 | К нам в магазин пришли из оперативного контроля, выписали протокол... | ACTIVE |
| Спор по земельному налогу | Ростов-на-Дону | по Ворошиловскому р-ну | Кадастровая стоимость участка завышена, налог считают неправильно... | CLOSING_SOON |
| Консультация по патентной системе | Самара | по Железнодорожному р-ну | Хочу перейти на патент, нужен специалист для расчёта... | ACTIVE |

serter2069@gmail.com has 3 requests: 1 ACTIVE, 1 CLOSING_SOON, 1 CLOSED.

### Seed: threads (target ~200, derived from requests)

Distribution:
- Active requests: 2-5 threads each
- Closing_soon requests: 1-3 threads each
- Closed requests: 1-2 threads each
- serter2069@gmail.com: 5 threads total (3 as client, 2 as specialist writing to other clients)

### Seed: messages (500 target)

Distribution:
- 2-10 messages per thread (average 5)
- Mix of client and specialist messages per thread
- First message always from specialist (thread creator)
- Timestamps spread over 90 days, increasing within thread

Example messages:
| sender_role | text (example) |
|-------------|----------------|
| specialist | Здравствуйте! Я специалист по камеральным проверкам с опытом 8 лет. Могу помочь с вашей ситуацией. Расскажите подробнее, какие документы запросила инспекция? |
| client | Добрый день! Спасибо за сообщение. Инспекция запросила книгу продаж и счета-фактуры за 3 квартал 2025 года. |
| specialist | Понял. Это стандартный запрос при камеральной проверке НДС. Вам нужно подготовить ответ в течение 10 рабочих дней. Давайте я помогу составить пояснение. |
| client | Да, было бы отлично. Сколько времени это займёт? |
| specialist | Обычно на подготовку ответа уходит 2-3 дня. Пришлите мне сканы запроса и имеющихся документов, я посмотрю. |

serter2069@gmail.com threads have 5-8 messages each, covering both roles.

### Seed: notifications_settings

All 50 users get a notification_settings row with new_messages=true (default).

### Seed: settings (admin-configurable)
| key | value |
|-----|-------|
| max_requests_per_client | 5 |
| max_threads_per_request | 10 |
| auto_close_days | 30 |
| max_extensions | 3 |
| close_warning_days | 3 |
| max_file_size_mb | 10 |
| max_files_per_message | 5 |

### Seed Script Rules

```
Language: TypeScript (runs via ts-node or tsx)
Location: api/prisma/seed.ts
Library: @faker-js/faker with locale 'ru'
Deterministic: faker.seed(42) — same data every run

Execution order (respecting FK constraints):
1. Clear all tables (reverse order)
2. cities (15 rows)
3. fns_offices (~70 rows)
4. services (3 rows)
5. settings (7 rows)
6. users — admin first (serter2069@gmail.com), then specialists (20), then clients (29)
7. specialist_profiles (20 rows)
8. specialist_fns + specialist_services (2-5 FNS per specialist, 1-3 services per FNS)
9. notification_settings (50 rows)
10. requests (100 rows, spread across clients, 3 for admin)
11. files for requests (0-3 per request, ~150 total)
12. threads (200 rows, 5 for admin)
13. messages (500 rows, spread across threads)
14. files for messages (0-2 per message, ~100 total)

Timestamps:
- User created_at: spread over 90 days ago to now
- Request created_at: spread over 90 days
- Message created_at: sequential within thread, spread over thread lifetime
- CLOSING_SOON requests: last_activity_at = now - 27 days
- CLOSED requests: last_activity_at = now - 31+ days

Status representation:
- All 3 request statuses present (ACTIVE, CLOSING_SOON, CLOSED)
- All roles present (CLIENT, SPECIALIST, ADMIN)
- 2 banned users (1 client, 1 specialist) — to test ban UI
- 2 specialists with is_available=false — to test hidden-from-catalog
- Some requests at extension limit (extensions_count=3)
- Some requests with 0 threads (new, nobody wrote yet)

Volume targets:
- users: 50 (1 admin + 20 specialists + 29 clients)
- specialist_profiles: 20
- specialist_fns: ~60 (avg 3 per specialist)
- specialist_services: ~120 (avg 2 per FNS link)
- requests: 100
- threads: ~200
- messages: 500
- files: ~250
- notification_settings: 50
- settings: 7
- otp_codes: 0 (transient, not seeded)
- refresh_tokens: 0 (transient, not seeded)
```

---

## Section 8: Test Cycles Log

| Cycle | Date | L0 | L1 | L2 | L3 | L4 | L5 | Bugs | Status |
|-------|------|----|----|----|----|----|----|------|--------|
| 1 | 2026-04-19 | 14/17→PASS | PASS | PASS | 5/5 | PASS | PARTIAL | #1139 #1140 #1141 #1142 #1143 | DONE |
| 2 | 2026-04-19 | 8/8 PASS | PASS | — | PASS | PASS | PASS | 0 new | DONE |
| 3 | 2026-04-19 | 12/13 PASS | PASS | — | PASS | — | PASS | #1146 #1147 | DONE |
| 4 | 2026-04-19 | 12/12 PASS | PASS | — | PASS | — | PASS | #1149 #1150 | DONE |

**ALPHA GATE: PASSED (2026-04-19)** — 4 cycles complete, 0 critical bugs. 2 medium hardening items tracked.

### Cycle 1 — 2026-04-19 (details)

**Infrastructure fixes applied in-session:**
- Fixed: `EXPO_PUBLIC_API_URL` в Doppler dev → убран лишний `/api` суффикс
- Fixed: DB schema drift → добавлены City.slug, FnsOffice.address, FnsOffice.searchAliases, таблица complaints
- Fixed: admin@p2ptax.ru role=null → seed запущен, role=ADMIN применён
- Fixed: дублированные города (кириллик slug) → удалены 5 записей

**L0 Backend (14/17 → all endpoints verified):**
- Auth OTP flow: PASS
- Admin auth: PASS (после фикса seed)
- Public endpoints: PASS (/api/requests/public, /api/specialists, /api/cities, /api/services)
- Notifications: PASS
- Create request: PASS (с корректными полями cityId + fnsId)
- Admin users list: PASS
- Validation (401, wrong OTP): PASS

**L1 Code Quality:**
- TSC frontend: 0 errors
- TSC backend: 0 errors
- console.log: api/src/cron/requestLifecycle.ts (1 файл)
- Hardcoded hex colors: 36 файлов (частично исправлены в предыдущем аудите)

**L2 Layout (5 screens):** All PASS — нет overflow, tiny tap targets, offscreen content

**L3 Flows:** Landing PASS, Auth Email PASS, Email Submit PASS, OTP Screen PASS, Auth Complete PASS

**L4 Elements:** Cities paginated PASS, IFNS by slug PASS, Create Request PASS

**L5 Edge Cases:** Empty title validation PASS, Long title PASS, SQL injection SAFE, IDOR → 403 вместо 404 (bug #1142)

**Open bugs (GitHub issues):**
- #1139 EXPO_PUBLIC_API_URL конфиг (зафиксировано, нужна проверка staging/prod)
- #1140 DB schema drift миграция (нужна migration в репо)
- #1141 cities frontend/API mismatch (fnsOffices vs officesCount)
- #1142 403 вместо 404 для несуществующих ресурсов
- #1143 дублированные города (зафиксировано in-session)
