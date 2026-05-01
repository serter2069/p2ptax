/**
 * Intake wizard — shared types & deadline math.
 *
 * Wizard data is owned by `IntakeWizard` via reducer; each step component is
 * a controlled view that reads & dispatches into this shape. Persisted to
 * AsyncStorage / localStorage under INTAKE_DRAFT_KEY between sessions.
 */

export type DocumentType = "TREBOVANIE" | "RESHENIE" | "VYEZDNAYA" | "OTHER";

export interface IntakeData {
  /** Step 1 — what kind of paper / event triggered the request. */
  documentType: DocumentType | null;
  /**
   * Step 2 — date of the incident (date the document was received, OR the
   * date of the on-site visit for VYEZDNAYA). Stored as ISO yyyy-mm-dd.
   */
  incidentDate: string;
  /** Step 2 — explicit "this is urgent" flag. Auto-checked when <3 days left. */
  urgency: boolean;
  /** Step 3 — selected city / FNS office (existing CityFnsCascade contract). */
  cityId: string | null;
  fnsId: string | null;
  /** Step 4 — free-text narrative + optional disputed amount. */
  description: string;
  /** Optional disputed-amount in rubles (RESHENIE / VYEZDNAYA tracks). */
  disputedAmount: string;
}

export const EMPTY_INTAKE: IntakeData = {
  documentType: null,
  incidentDate: "",
  urgency: false,
  cityId: null,
  fnsId: null,
  description: "",
  disputedAmount: "",
};

/**
 * AsyncStorage key — single source of truth for wizard draft state.
 * Bumped from the legacy `pending_request_draft` / `p2ptax_request_draft_v1`
 * keys (free-text form). Migration is one-way (legacy is dropped on first
 * wizard mount; nothing meaningful to carry over since fields don't overlap).
 */
export const INTAKE_DRAFT_KEY = "p2ptax_intake_draft_v1";

/** Legacy free-text draft keys — purged once on wizard mount. */
export const LEGACY_DRAFT_KEYS = [
  "p2ptax_request_draft_v1",
  "pending_request_draft",
] as const;

/**
 * Adds N business days (Mon–Fri) to a base date and returns the result.
 * Holidays are NOT modeled — TREBOVANIE deadline is a planning aid, not
 * a legal countdown; we surface the date so the user can verify with their
 * specialist.
 */
function addBusinessDays(base: Date, days: number): Date {
  const out = new Date(base.getTime());
  let added = 0;
  while (added < days) {
    out.setDate(out.getDate() + 1);
    const dow = out.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return out;
}

function addCalendarDays(base: Date, days: number): Date {
  const out = new Date(base.getTime());
  out.setDate(out.getDate() + days);
  return out;
}

/**
 * Compute deadline given documentType + incidentDate.
 *
 *   TREBOVANIE → +10 business days from receipt (ст. 93/93.1 НК РФ — base case).
 *   RESHENIE   → +30 calendar days for objections (ст. 101.4 НК РФ).
 *   VYEZDNAYA  → no auto deadline; "incidentDate" = visit date (informational).
 *   OTHER      → no auto deadline.
 */
export function computeDeadline(
  documentType: DocumentType | null,
  incidentDateIso: string
): Date | null {
  if (!documentType || !incidentDateIso) return null;
  const base = new Date(incidentDateIso);
  if (Number.isNaN(base.getTime())) return null;

  if (documentType === "TREBOVANIE") return addBusinessDays(base, 10);
  if (documentType === "RESHENIE") return addCalendarDays(base, 30);
  return null;
}

/** Days remaining until deadline (negative = past). Null when no deadline. */
export function daysUntil(deadline: Date | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  // Strip time-of-day on both sides so "today" reads as 0, not -0.5.
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/** Formats yyyy-mm-dd → dd.mm.yyyy for display. */
export function formatDateRu(iso: string | Date | null): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

/** Parses dd.mm.yyyy → ISO yyyy-mm-dd. Returns "" if invalid. */
export function parseDateRu(input: string): string {
  const m = input.trim().match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (!m) return "";
  const [, ddRaw, mmRaw, yyyyRaw] = m;
  const dd = parseInt(ddRaw!, 10);
  const mm = parseInt(mmRaw!, 10);
  const yyyy = parseInt(yyyyRaw!, 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900 || yyyy > 2200) return "";
  const iso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return iso;
}

/** Human label for a doc type — used in summary banner / step subtitles. */
export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  TREBOVANIE: "Требование от ФНС",
  RESHENIE: "Решение / акт",
  VYEZDNAYA: "Выездная проверка",
  OTHER: "Другое",
};

/** Per-doc-type prompt for step 2 ("when did this happen"). */
export const DOCUMENT_TYPE_DATE_PROMPT: Record<DocumentType, string> = {
  TREBOVANIE: "Когда вы получили требование?",
  RESHENIE: "Когда вы получили решение / акт?",
  VYEZDNAYA: "Когда назначен визит инспекции?",
  OTHER: "Когда произошло событие?",
};

/** Default title used when wizard sends the legacy `title` field. */
export function deriveTitle(data: IntakeData): string {
  const base = data.documentType
    ? DOCUMENT_TYPE_LABEL[data.documentType]
    : "Запрос";
  // Snip the first line of the description for human-readable context.
  const firstLine = data.description.split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return base;
  const snippet = firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine;
  return `${base}: ${snippet}`;
}
