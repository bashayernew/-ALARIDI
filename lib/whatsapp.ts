/**
 * WhatsApp sending adapter (Meta WhatsApp Cloud API).
 *
 * Currently a guarded stub. To wire up:
 * 1. Create a WhatsApp Business app in Meta for Developers and get a
 *    permanent access token + phone number ID.
 * 2. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID env vars.
 *    (Optional: WHATSAPP_API_VERSION, default "v21.0".)
 * 3. For free-form text outside the 24h customer-service window you must use
 *    an approved template — see sendWhatsAppTemplate below.
 *
 * All call sites wrap this in try/catch (or .catch) so an unconfigured
 * WhatsApp service never blocks business flows (orders / gift cards still
 * complete and email still goes out).
 */

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";

/** True when the WhatsApp Cloud API credentials are present. */
export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

/**
 * Normalize a phone number to the digits-only E.164 form the Cloud API wants
 * (country code included, no "+", no spaces or punctuation). Kuwait numbers
 * entered without a country code (8 digits) are prefixed with 965.
 */
export function normalizeWhatsAppNumber(
  phone: string | null | undefined
): string {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  // Strip a leading "00" international prefix.
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Bare local Kuwait number → prepend country code.
  if (digits.length === 8) digits = `965${digits}`;
  return digits;
}

async function postToCloudApi(body: unknown): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[whatsapp] (dev) not configured, would send:", body);
    }
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`WhatsApp send failed (${res.status}): ${detail}`);
  }
}

export type SendWhatsAppInput = {
  /** Recipient phone — any format; normalized internally. */
  to: string;
  /** Plain-text body. */
  text: string;
};

/**
 * Send a free-form text message. Note: outside the 24h customer-service
 * window Meta only allows approved template messages, so for proactive
 * notifications (gift card delivery, OTP) prefer sendWhatsAppTemplate when
 * you have templates approved. This text path is kept for replies / testing.
 */
export async function sendWhatsApp(input: SendWhatsAppInput): Promise<void> {
  const to = normalizeWhatsAppNumber(input.to);
  if (!to) return;

  await postToCloudApi({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: input.text },
  });
}

/**
 * Send an approved WhatsApp message template. Falls back to a plain text
 * send when no template name is configured (useful in dev / inside the
 * service window).
 */
export async function sendWhatsAppTemplate(input: {
  to: string;
  templateName: string;
  languageCode?: string;
  /** Ordered body parameters that fill the template's {{1}}, {{2}}, ... */
  bodyParams?: string[];
  /** Plain-text fallback used when templates are not configured. */
  fallbackText?: string;
}): Promise<void> {
  const to = normalizeWhatsAppNumber(input.to);
  if (!to) return;

  if (!input.templateName) {
    if (input.fallbackText) await sendWhatsApp({ to, text: input.fallbackText });
    return;
  }

  await postToCloudApi({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.languageCode || "en" },
      components: input.bodyParams?.length
        ? [
            {
              type: "body",
              parameters: input.bodyParams.map((text) => ({
                type: "text",
                text,
              })),
            },
          ]
        : undefined,
    },
  });
}

/** Deliver an activated gift card to the recipient over WhatsApp. */
export async function sendGiftCardWhatsApp(input: {
  to: string;
  code: string;
  amountKwd: number;
  recipientName?: string;
  message?: string;
}): Promise<void> {
  const greet = input.recipientName ? `Hello ${input.recipientName}, ` : "";
  const note = input.message ? `\n\nMessage: ${input.message}` : "";
  const text = `${greet}you received an Al Aridi Sweets gift card! 🎁

Code: ${input.code}
Value: ${input.amountKwd} KWD${note}

Sign in or create an account at alaridi.com, then redeem this code on your account page — the balance is added to your store wallet for checkout. Store credit cannot be withdrawn as cash.`;

  // Use a template if one is configured, otherwise fall back to text.
  await sendWhatsAppTemplate({
    to: input.to,
    templateName: process.env.WHATSAPP_GIFTCARD_TEMPLATE || "",
    languageCode: process.env.WHATSAPP_GIFTCARD_TEMPLATE_LANG || "en",
    bodyParams: [
      input.recipientName || "there",
      String(input.amountKwd),
      input.code,
    ],
    fallbackText: text,
  });
}

/** Send a gift card redemption OTP over WhatsApp. */
export async function sendGiftCardOtpWhatsApp(input: {
  to: string;
  otp: string;
}): Promise<void> {
  const text = `Your Al Aridi gift card verification code is ${input.otp}. It expires in 10 minutes. Enter it on your account page to add the gift card balance to your store wallet.`;

  await sendWhatsAppTemplate({
    to: input.to,
    templateName: process.env.WHATSAPP_OTP_TEMPLATE || "",
    languageCode: process.env.WHATSAPP_OTP_TEMPLATE_LANG || "en",
    bodyParams: [input.otp],
    fallbackText: text,
  });
}
