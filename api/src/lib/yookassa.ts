import crypto from "crypto";

/**
 * Minimal ЮKassa REST client — just enough for the VIP wallet top-up
 * flow. Two surfaces:
 *   - createPayment: POST /v3/payments to start a redirect-flow
 *     Payment, returns the confirmation_url the user redirects to.
 *   - parseNotification: validate + parse a webhook body.
 *
 * Why no SDK: the official @a2seven/yoo-checkout package adds 10 deps
 * for what is effectively four fields and a Basic-auth header; the
 * webhook-signature scheme isn't worth a SDK either (no signature is
 * provided by ЮKassa — the recommended verification is to re-fetch
 * the payment by id over the API). Lighter and more auditable to
 * write the dozen lines we actually use.
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
  /** App user this payment belongs to. Echoed back via metadata. */
  userId: string;
  /** Where ЮKassa redirects the user after the payment is completed. */
  returnUrl: string;
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
  const body = {
    amount: { value: valueRub, currency: "RUB" },
    capture: true, // single-stage, no manual capture step
    confirmation: { type: "redirect", return_url: input.returnUrl },
    description: input.description,
    metadata: { userId: input.userId, kind: "vip_topup" },
  };

  const res = await fetch(`${YK_API}/payments`, {
    method: "POST",
    headers: {
      Authorization: basicAuth(),
      "Content-Type": "application/json",
      // ЮKassa requires an Idempotence-Key on every Payment create
      // request — repeating the same key returns the same Payment
      // (instead of charging twice on a retried HTTP call).
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

/**
 * Re-fetch a payment from ЮKassa by id — used by the webhook handler
 * to verify a payment without trusting the webhook body. ЮKassa's
 * recommended pattern is "webhook → fetch the canonical payment
 * record → act on its status".
 */
export async function fetchPayment(paymentId: string): Promise<{
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  metadata?: Record<string, string>;
}> {
  const res = await fetch(`${YK_API}/payments/${paymentId}`, {
    headers: { Authorization: basicAuth() },
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`ЮKassa fetch payment failed: ${res.status} ${errBody}`);
  }
  return (await res.json()) as Awaited<ReturnType<typeof fetchPayment>>;
}
