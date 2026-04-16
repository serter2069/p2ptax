/**
 * Thread type-level adapter.
 *
 * Backend persists a symmetric pair: `participant1Id` / `participant2Id`
 * (with `participant1Id < participant2Id` enforced at app layer). Backend
 * schema ALSO stores `specialistId` on Thread, but to make frontend code
 * easier to read we expose semantic aliases `clientId` / `specialistId`.
 *
 * This module has no runtime migration cost — it only provides a helper
 * `adaptThread()` that derives the two role-labelled IDs from a raw thread
 * payload. If the backend ever renames the columns, just swap this helper.
 */

export interface RawThreadParticipant {
  id: string;
  email?: string | null;
  role?: 'CLIENT' | 'SPECIALIST' | 'ADMIN' | string | null;
  specialistProfile?: {
    nick?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface RawThread {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participant1?: RawThreadParticipant | null;
  participant2?: RawThreadParticipant | null;
  /** Present on newer payloads — authoritative if set. */
  specialistId?: string | null;
  requestId?: string | null;
  createdAt?: string;
  lastMessageAt?: string | null;
  [key: string]: unknown;
}

export interface AdaptedThread extends RawThread {
  /** Derived: client-side of the conversation. */
  clientId: string;
  /** Derived: specialist-side of the conversation. */
  specialistId: string;
  client: RawThreadParticipant | null;
  specialist: RawThreadParticipant | null;
}

/**
 * Derive semantic `clientId` / `specialistId` from a raw thread.
 *
 * Preference order:
 *   1. Thread.specialistId (backend-authoritative, when present).
 *   2. Participant role — whichever participant has `role === 'SPECIALIST'`.
 *   3. Fallback — caller's id matches `participant1` means they are the client.
 */
export function adaptThread(raw: RawThread, currentUserId?: string | null): AdaptedThread {
  const p1 = raw.participant1 ?? null;
  const p2 = raw.participant2 ?? null;

  let specialistId: string | null = raw.specialistId ?? null;

  // 2. Try participant role
  if (!specialistId) {
    if (p1?.role === 'SPECIALIST') specialistId = raw.participant1Id;
    else if (p2?.role === 'SPECIALIST') specialistId = raw.participant2Id;
  }

  // 3. Fallback — if caller is known and is a client, the OTHER side is specialist
  if (!specialistId && currentUserId) {
    if (raw.participant1Id === currentUserId) specialistId = raw.participant2Id;
    else if (raw.participant2Id === currentUserId) specialistId = raw.participant1Id;
  }

  // Final fallback: p2 is treated as specialist (matches existing code convention)
  if (!specialistId) specialistId = raw.participant2Id;

  const clientId =
    specialistId === raw.participant1Id ? raw.participant2Id : raw.participant1Id;

  const specialist = specialistId === raw.participant1Id ? p1 : p2;
  const client = clientId === raw.participant1Id ? p1 : p2;

  return {
    ...raw,
    clientId,
    specialistId,
    client,
    specialist,
  };
}
