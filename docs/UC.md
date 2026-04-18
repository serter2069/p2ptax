# Use Cases: P2PTax

> Scope: UCs added as part of dous/SA review. Each UC follows the canonical template:
> Actor · Preconditions · Main Flow · Transitions · UI States · Edge Cases · Responsive · Business Rules · Acceptance Criteria · Out of Scope

---

## UC-14: City & IFNS Directory (Admin)

**Actor:** Admin  
**Preconditions:** Admin is logged in; city and FNS office records exist in the DB.

### Main Flow
1. Admin opens the admin panel and navigates to the Directory section.
2. System renders a list of cities, each showing the city name and IFNS office count.
3. Admin clicks a city row to expand or navigate to its IFNS list.
4. IFNS list renders with code, name, and search-alias fields.
5. Admin clicks "Edit" on an IFNS row and updates fields in an inline or modal form.
6. Admin clicks "Save". System persists changes via `PUT /api/admin/ifns/:id`.
7. System shows a success toast and returns to the IFNS list for that city.

### Transitions
| From | Action | To |
|------|--------|----|
| IFNS list | Save edit (success) | IFNS list (same city, scroll position preserved) |
| IFNS list | Cancel edit | IFNS list (no changes) |
| City list | Click city row | IFNS list for that city |
| IFNS list | Click back / breadcrumb | City list |

### UI States
| State | Trigger | Visual |
|-------|---------|--------|
| Loading — city list | Initial page load | Skeleton: 8 rows, each `h-8 rounded` |
| Loading — IFNS list | City selected, data fetching | Skeleton: 6 rows, each `h-8 rounded` |
| Empty — IFNS list | City has 0 offices | "Нет записей ИФНС" placeholder with an "Add" CTA |
| Saving | Admin clicks Save | Edit button replaced by spinner, form fields disabled |
| Error | API returns non-2xx | Inline error banner below form with retry button |
| Success | Save returns 200 | Toast "Сохранено", form closes |

### Edge Cases
- **Duplicate code:** if admin enters an IFNS code that already exists in the city → 400 from API → show field-level error "Код уже используется".
- **Concurrent edit:** two admins editing the same IFNS simultaneously → last write wins (no optimistic locking at MVP).
- **Search with special characters:** query normaliser strips `., -#№` before matching.
- **City not found:** slug lookup returns 404 → redirect to city list with error toast.

### Responsive
- Desktop (≥640 px): city list and IFNS list in two-column layout (sidebar + main).
- Mobile (<640 px): city list screen, then full-width IFNS list screen (push navigation).

### Business Rules
- Only `ADMIN` role can edit IFNS records.
- `searchAliases` field is a comma-separated string normalised to lowercase on save.
- City `slug` is immutable after creation.

### Acceptance Criteria
- [ ] AC-1: Editing IFNS name/code and saving reflects the new value in the list without page reload.
- [ ] AC-2: The IFNS list shows a skeleton loader while data is fetching.
- [ ] AC-3: After a successful save, admin sees the IFNS list (not a blank screen or the city list).
- [ ] AC-4: Submitting an empty required field shows a validation error before the API call.

### Out of Scope
- Bulk import/export of cities or IFNS records.
- Adding new cities from the admin panel (done via seed/migration).

---

## UC-15: Avatar Upload

**Actor:** Specialist (authenticated)  
**Preconditions:** User is logged in with SPECIALIST role; MinIO is available.

### Main Flow
1. User opens Profile → Edit → Avatar section.
2. On mobile: native image picker opens. On desktop: drag-and-drop zone or "Choose file" button.
3. User selects an image (JPEG / PNG / WebP, max 5 MB).
4. Frontend shows a local preview before upload.
5. Frontend sends `POST /api/upload/avatar` with `multipart/form-data`.
6. API validates MIME type and size, uploads to MinIO `avatars/` folder, returns `{ url, key }`.
7. Frontend calls `PATCH /api/profile` with `{ avatarUrl: url }` to persist.
8. Avatar updates live in the profile header.

### Transitions
| From | Action | To |
|------|--------|----|
| Avatar edit section | Upload success | Profile screen (updated avatar visible) |
| Avatar edit section | Cancel / back | Profile screen (no change) |
| Avatar edit section | Upload error | Avatar edit section (error state, retry available) |

### UI States
| State | Trigger | Visual |
|-------|---------|--------|
| Idle | Page load | Current avatar (or placeholder initials circle) + "Change photo" button |
| Picking | Button tapped (mobile) | Native OS image picker overlay |
| Preview | Image selected | Local `<Image uri={localUri}>` overlaid with "Upload" and "Cancel" buttons |
| Uploading | "Upload" pressed | Circular progress indicator; buttons disabled |
| Success | API returns 200 | Avatar updates; brief "Фото сохранено" toast |
| Error | API returns 4xx/5xx | Red banner below avatar with error message and "Retry" button |

### Edge Cases
- **Network drop during upload:** `POST /api/upload/avatar` times out → show "Нет соединения. Повторите попытку." The partially uploaded object in MinIO is orphaned; a scheduled cleanup job removes objects older than 24h not referenced in the DB.
- **Wrong format:** user selects a `.gif` or `.heic` → multer rejects with 400 "Only jpg, png, webp allowed for avatars" → frontend shows "Неподдерживаемый формат. Выберите JPG, PNG или WebP."
- **Wrong format retry:** after error, user can immediately re-open the picker without refreshing the page.
- **File too large:** >5 MB → 413 from multer → "Файл слишком большой. Максимум 5 МБ."
- **MinIO unavailable:** API returns 503 → "Сервис временно недоступен. Попробуйте позже."

### Responsive
- **Mobile (<640 px):** tapping "Change photo" opens the native OS image picker (`expo-image-picker` `launchImageLibraryAsync`). No drag-and-drop.
- **Desktop (≥640 px):** dedicated drag-and-drop zone with dashed border + "or click to browse" fallback. Drag-over state changes border colour to brand accent.

### Business Rules
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`.
- Max file size: 5 MB (enforced both client-side and server-side).
- Previous avatar key in MinIO is NOT deleted immediately (future cleanup job).
- Avatar URL is stored as a relative path `/{bucket}/{key}`.

### Acceptance Criteria
- [ ] AC-1: Uploading a valid image updates the avatar visible in the profile header without page reload.
- [ ] AC-2: Uploading a `.gif` file shows an error message and does not call the API.
- [ ] AC-3: A network error during upload shows a retry option; tapping Retry re-submits without re-selecting the file.
- [ ] AC-4: On desktop, dragging an image onto the drop zone triggers the upload flow.

### Out of Scope
- Server-side image resizing (noted as TODO in upload.ts — future task).
- Avatar cropping UI.
- Video or GIF avatars.

---

## UC-16: Chat File Attachments

**Actor:** Client or Specialist (authenticated, thread participant)  
**Preconditions:** A chat thread exists between client and specialist; MinIO is available.

### Main Flow
1. User opens a chat thread.
2. User taps the attachment icon in the message composer.
3. File picker opens; user selects a PDF, JPEG, or PNG (max 10 MB).
4. Frontend uploads file via `POST /api/upload/chat-file` (returns `{ uploadToken, fileUrl, filename, size, mimeType }`).
5. Frontend shows the attachment preview chip in the composer with filename and size.
6. User optionally adds text, then taps Send.
7. WebSocket message is sent: `{ type: "message", threadId, text?, files: [{ uploadToken, filename, size, mimeType }] }`.
8. Backend resolves `uploadToken` to a MinIO key, persists the `Message` record with file metadata, and broadcasts to the thread.
9. Both participants see the message with a tappable file link.

### Transitions
| From | Action | To |
|------|--------|----|
| Composer (idle) | Attachment icon tapped | File picker overlay |
| File picker | File selected | Composer (attachment chip shown) |
| File picker | Cancelled | Composer (no change) |
| Composer (attachment) | Send tapped (success) | Composer cleared; message appears in thread |
| Composer (attachment) | Send fails (WS error) | Composer retains attachment chip; error toast shown |
| Composer (attachment) | X on chip tapped | Attachment removed; upload token abandoned |

### UI States
| State | Trigger | Visual |
|-------|---------|--------|
| Idle | Thread open | Attachment icon in composer toolbar |
| Uploading | File selected | Progress bar in attachment chip; Send button disabled |
| Attachment ready | Upload complete | Chip with filename, size, remove (×) button; Send enabled |
| Sending | Send tapped | Send button spinner; composer disabled |
| Success | WS broadcast received | Message bubble with file link; composer reset |
| Upload error | API 4xx/5xx | Red chip with "Ошибка загрузки. Повторить?" |
| Send error | WS send fails | Toast "Не удалось отправить. Повторите." Composer preserved |

### Edge Cases
- **MinIO upload OK but WS send fails (rollback strategy):** The file is already uploaded to MinIO when the WS send fails. Frontend retains the `uploadToken` in state. User can retry Send — the same token is re-sent; backend resolves it again (idempotent). If user navigates away, the token is abandoned and the orphaned MinIO object is cleaned up by the scheduled job (>24h unreferenced).
- **Large file:** >10 MB → multer returns 413 before MinIO write → "Файл слишком большой. Максимум 10 МБ."
- **Wrong MIME type:** backend returns 400 → "Допустимые форматы: PDF, JPG, PNG."
- **WS disconnected before upload completes:** upload finishes (HTTP, not WS), chip appears; user reconnects and sends normally.
- **Duplicate send (double-tap):** Send button is disabled while sending; subsequent taps are no-ops.
- **Thread no longer accessible:** backend returns 403 on send → "Нет доступа к этому чату."

### Responsive
- **Mobile (<640 px):** attachment icon in bottom composer bar; file picker is native OS picker. Attachment chip is full-width below text input.
- **Desktop (≥640 px):** attachment icon in composer toolbar; optional drag-and-drop onto the chat window triggers file selection. Chip appears inline in the composer row.

### Business Rules
- Accepted MIME types: `application/pdf`, `image/jpeg`, `image/png`.
- Max file size per attachment: 10 MB.
- Max attachments per message: 1 (MVP). Multiple attachments are out of scope.
- `uploadToken` is a UUID generated by the backend, used to correlate pre-uploaded MinIO objects with WS send events.
- Orphaned objects (token never sent in a message, older than 24 h) are removed by a cron job.

### Acceptance Criteria
- [ ] AC-1: Selecting a valid file shows an upload progress indicator and then an attachment chip before Send is enabled.
- [ ] AC-2: Sending a message with an attachment delivers a tappable file link to both thread participants.
- [ ] AC-3: If the WS send fails, the composer is preserved with the attachment chip and a retry option is shown.
- [ ] AC-4: Uploading an unsupported file type shows an error message and does not attempt a MinIO write.
- [ ] AC-5: The attachment chip can be removed (×) before sending, cancelling the upload token.

### Out of Scope
- Multiple attachments per message.
- In-app PDF viewer (files open in OS default handler).
- Server-side virus scanning.

---

## UC-17: Contact Methods

**Actor:** Specialist (authenticated)  
**Preconditions:** User has SPECIALIST role; specialist profile exists.

### Main Flow
1. Specialist opens Profile → Contact Methods.
2. System loads contacts via `GET /api/profile/contacts` (own list, includes `id, type, value, label, order`).
3. Specialist can add a new contact (`POST /api/profile/contacts`), edit existing, reorder (drag-and-drop), or delete.
4. Reorder sends `PATCH /api/profile/contacts/reorder` with `{ ids: [id1, id2, ...] }`.
5. System persists the new order atomically; returns updated list.
6. Public visitors see contacts via `GET /api/specialists/:id/contacts`.

### Data / Fields
| Field | Edit Form | Public Profile |
|-------|-----------|----------------|
| `type` | Required dropdown: phone, email, telegram, whatsapp, vk, website | Shown as icon |
| `value` | Required text input (phone/URL/handle) | Shown as tappable link/text |
| `label` | Optional text input (custom display name, e.g. "WhatsApp for clients") | Shown below value if present |
| `order` | Implicit (drag handle in list) | Applied to public display order |
| `id` | Read-only | Not shown |

**Public profile** shows all contact methods ordered by `order` asc, then `createdAt` asc.  
**Edit form** shows all fields above; `type` cannot be changed after creation (delete and re-add).

### Transitions
| From | Action | To |
|------|--------|----|
| Contact list | "Add" tapped | Add form (modal or inline row) |
| Add form | Save success | Contact list (new item appended) |
| Add form | Cancel | Contact list (no change) |
| Contact list | Edit icon tapped | Edit form for that row |
| Edit form | Save success | Contact list (updated row) |
| Edit form | Cancel | Contact list (no change) |
| Contact list | Delete confirmed | Contact list (row removed) |

### UI States
| State | Trigger | Visual |
|-------|---------|--------|
| Loading | Screen open | Skeleton: 4 rows with icon + text placeholders |
| Empty | No contacts | "Добавьте способ связи" placeholder + "Add" button |
| Idle | Contacts loaded | Ordered list with drag handles, edit/delete icons |
| Reordering | Drag active | Dragged row elevated (shadow), others shift |
| Saving | Any mutating action | Affected row shows spinner |
| Error | API non-2xx | Inline error banner, action rolled back in UI |
| Max reached | 6 contacts present | "Add" button hidden; tooltip "Максимум 6 контактов" |

### Edge Cases
- **Reorder during concurrent save:** if a reorder request is in-flight when another add/edit completes, the two `order` arrays may diverge. Strategy: reorder request is debounced 500 ms after drag ends; if a save is in progress, reorder waits and re-sends after save resolves.
- **Deleting a contact mid-reorder:** delete fires immediately; if a reorder was debouncing, its `ids` array may include the deleted id → backend ignores unknown ids in reorder payload.
- **Max limit (6):** backend returns 400 "Достигнут лимит контактов" → frontend shows toast and hides the Add button.
- **Empty value submitted:** frontend validates `value` is non-empty before calling API.
- **Invalid type:** backend enforces `VALID_TYPES` allowlist; unknown type returns 400.

### Responsive
- **Mobile (<640 px):** drag-to-reorder via long-press (react-native `DragFlatList` or equivalent). Edit/delete in swipe actions or via context menu.
- **Desktop (≥640 px):** drag handle visible at all times on the left of each row. Edit/delete icons visible on hover.

### Business Rules
- Max 6 contact methods per specialist profile.
- `type` field is immutable after creation.
- Valid types: `phone`, `email`, `telegram`, `whatsapp`, `vk`, `website`.
- Public endpoint (`GET /api/specialists/:id/contacts`) is unauthenticated.
- Own contacts endpoint (`GET /api/profile/contacts`) requires SPECIALIST auth.

### Acceptance Criteria
- [ ] AC-1: Adding a contact with valid type/value appears in the list and on the public profile.
- [ ] AC-2: Reordering contacts persists the new order after page reload.
- [ ] AC-3: When 6 contacts exist, the Add button is hidden and an explanatory message is shown.
- [ ] AC-4: Deleting a contact removes it from both the edit list and the public profile.

### Out of Scope
- Contact verification (e.g. confirming a phone number via SMS).
- Changing `type` on an existing contact without delete-and-recreate.
- Social profile preview/embed.

---

## UC-SYS-08: Notification System

**Actor:** System (automated, triggered by domain events)  
**Preconditions:** BullMQ worker is running; Valkey (Redis) is reachable; SMTP is configured.

### Main Flow
1. A domain event fires (e.g. new message, new response to a request, promo expiring).
2. `sendNotification(data)` is called with `{ userId, type, title, body, entityId? }`.
3. System persists an in-app `Notification` record in PostgreSQL.
4. Job is enqueued in BullMQ queue `notifications` with `fan-out` job type.
5. Worker processes the job: loads user notification preferences.
6. Fan-out: sends email (via SMTP/nodemailer) and logs in-app delivery, subject to preferences.
7. Each channel outcome is persisted in `NotificationDeliveryLog`.

### Business Rules
- **User preferences:** per `(userId, eventType)` pair stored in `NotificationPreference`. Default when no record exists: both `email` and `inApp` enabled.
- **Email skip:** if user has no email address or has disabled email for the event type, delivery is logged as `skipped` (not `failed`).
- **Graceful degradation:** if Valkey is unavailable at startup or at enqueue time, the system falls back to direct in-app log without email. No error is surfaced to the caller.
- **Retry policy:** BullMQ job retries up to 3 times with exponential back-off starting at 2 s.
- **Job retention:** completed jobs kept for last 100; failed jobs kept for last 50 (configurable via `defaultJobOptions`).
- **Supported event types:** `new_response`, `new_message`, `new_request_in_city`, `promo_expiring`.

### Edge Cases
- **Queue overflow (Valkey OOM or max-memory policy eviction):** BullMQ `add()` throws; `sendNotification` catches the error, logs a warning, and falls back to direct in-app `NotificationDeliveryLog` insert. Caller never throws.
- **Dead-letter (job exhausts all 3 retries):** BullMQ marks job `failed`; `_worker.on('failed', ...)` logs the error. No automatic re-queue. Operations can inspect failed jobs via BullMQ dashboard or `queue.getFailed()`. A future alert/webhook can be added.
- **SMTP timeout:** `nodemailer.sendMail` rejects; channel status logged as `failed` with reason. BullMQ retries the whole job (both channels) up to 3 times.
- **Duplicate notifications:** no deduplication at queue level (MVP). Callers must ensure `sendNotification` is not called twice for the same event.
- **Worker restart:** in-flight job is re-queued by BullMQ (job not acked before crash) → may deliver duplicate notification on retry.
- **Valkey not configured:** `getNotificationQueue()` returns `null`; in-app log is written synchronously to DB with `reason: "queue_unavailable_fallback"`.

### UI States (Notification Bell / Inbox)
| State | Trigger | Visual |
|-------|---------|--------|
| Loading | Inbox opened | Skeleton list |
| Empty | No notifications | "Уведомлений нет" placeholder |
| Unread badge | Unread count > 0 | Red badge on bell icon with count |
| Notification row | Record present | Icon + title + body + relative timestamp |
| Read | Row tapped | Row dimmed; unread count decremented |

### Acceptance Criteria
- [ ] AC-1: A `new_message` event creates a `Notification` record in the DB and a `NotificationDeliveryLog` entry for both `email` and `inApp` channels.
- [ ] AC-2: If the user has disabled email for `new_message`, the email log entry has `status: "skipped"` and no SMTP call is made.
- [ ] AC-3: If Valkey is unavailable, `sendNotification` completes without throwing and writes an in-app delivery log with `reason: "queue_unavailable_fallback"`.
- [ ] AC-4: A job that fails all 3 retries is recorded in the BullMQ failed job list and does not crash the worker process.

### Out of Scope
- Push notifications (APNs / FCM).
- SMS channel.
- Real-time WebSocket push of notification count to the bell icon (future).
- Admin UI for managing failed jobs (use BullMQ dashboard separately).
