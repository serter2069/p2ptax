import crypto from "crypto";

/**
 * Minimal ЮKassa REST client — recurring-autopay flow.
 *
 *   - createPayment: redirect Payment with optional save_payment_method.
 *     Used for the FIRST VIP-FNS activation: charges the first day +
 *     binds the card. Returns confirmation_url for the redirect.
 *   - chargeWithSavedMethod: server-to-server autopay. Used by the
 *     daily cron — no 3DS, no user interaction. Requires the saved
 *     payment_method_id we captured on the first payment.
 *   - fetchPayment: read-back used by the webhook to verify status.
 *
 * Auto-charge requires "Списания без подтверждения клиента" enabled
 * for the shop in the ЮKassa cabinet — otherwise chargeWithSavedMethod
 * payments stay pending awaiting 3DS.
 */

const YK_API = "https://api.yookassa.ru/v3";

function basicAuth(): string {
  const shopId = process.env.YK_SHOP_ID;
  const secret = process.env.YK_SECRET_KEY;
  if (!shopId || !secret) {
    throw new Error("YK_SHOP_ID / YK_SECRET_KEY env not set");
  }
  return "Basic " + Buffer.from(`${shopId}:${secret}`).toString("base64");
}

export interface CreatePaymentInput {
  amountKopeks: number;
  description: string;
  /** App user this payment belongs to. Echoed via metadata. */
  userId: string;
  /** Where ЮKassa redirects the user after the redirect-flow payment. */
  returnUrl: string;
  /** When true → ЮKassa tokenizes the card. Returned method id arrives
   *  in the webhook payload (object.payment_method.id) once paid. */
  savePaymentMethod?: boolean;
  /** Extra metadata merged into ЮKassa's metadata bag — read back by
   *  the webhook to know which subscription this payment funded. */
  extraMetadata?: Record<string, string>;
}

export interface CreatePaymentResult {
  paymentId: string;
  confirmationUrl: string;
  status: string;
}

export async function createPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const valueRub = (input.amountKopeks / 100).toFixed(2);
  const body: Record<string, unknown> = {
    amount: { value: valueRub, currency: "RUB" },
    capture: true,
    confirmation: { type: "redirect", return_url: input.returnUrl },
    description: input.description,
    metadata: { userId: input.userId, ...(input.extraMetadata ?? {}) },
  };
  if (input.savePaymentMethod) {
    body.save_payment_method = true;
  }

  const res = await fetch(`${YK_API}/payments`, {
    method: "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/json",
      "Idempotence-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`ЮKassa create payment failed: ${res.status} ${errBody}`);
  }
  const data = (await res.json()) as {
    id: string;
    status: string;
    confirmation: { confirmation_url: string };
  };
  return {
    paymentId: data.id,
    confirmationUrl: data.confirmation.confirmation_url,
    status: data.status,
  };
}

export interface ChargeWithSavedMethodInput {
  amountKopeks: number;
  description: string;
  paymentMethodId: string;
  /** Stable per-attempt key — re-runs of the same charge return the
   *  same Payment instead of double-charging. */
  idempotenceKey: string;
  metadata?: Record<string, string>;
}

export interface ChargeResult {
  paymentId: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
}

/**
 * Server-to-server autopay using a previously-saved payment_method.
 * No confirmation block (the user isn't present), capture: true so
 * the funds are taken in one stage.
 */
export async function chargeWithSavedMethod(
  input: ChargeWithSavedMethodInput
): Promise<ChargeResult> {
  const valueRub = (input.amountKopeks / 100).toFixed(2);
  const body = {
    amount: { value: valueRub, currency: "RUB" },
    capture: true,
    payment_method_id: input.paymentMethodId,
    description: input.description,
    metadata: input.metadata ?? {},
  };
  const res = await fetch(`${YK_API}/payments`, {
    method: "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/json",
      "Idempotence-Key": input.idempotenceKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`ЮKassa autopay failed: ${res.status} ${errBody}`);
  }
  const data = (await res.json()) as {
    id: string;
    status: ChargeResult["status"];
    paid: boolean;
  };
  return { paymentId: data.id, status: data.status, paid: data.paid };
}

export interface YkPaymentRecord {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  metadata?: Record<string, string>;
  payment_method?: {
    id: string;
    type: string;
    saved?: boolean;
    title?: string;
    card?: {
      first6?: string;
      last4?: string;
      card_type?: string;
    };
  };
}

/**
 * Re-fetch a payment from ЮKassa by id — webhook handlers MUST verify
 * status against this canonical record rather than trusting the body.
 */
export async function fetchPayment(paymentId: string): Promise<YkPaymentRecord> {
  const res = await fetch(`${YK_API}/payments/${paymentId}`, {
    headers: { Authorization: basicAuth() },
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`ЮKassa fetch payment failed: ${res.status} ${errBody}`);
  }
  return (await res.json()) as YkPaymentRecord;
}

/**
 * Build a human-readable card title from the ЮKassa payment_method
 * payload. Falls back to the bare type when card details are absent.
 */
export function paymentMethodTitle(pm: YkPaymentRecord["payment_method"]): string {
  if (!pm) return "Карта";
  if (pm.title) return pm.title;
  const last4 = pm.card?.last4;
  const brand = pm.card?.card_type;
  if (last4 && brand) return `${brand} *${last4}`;
  if (last4) return `Карта *${last4}`;
  return "Карта";
}
