/**
 * Email sending adapter.
 *
 * Currently a no-op stub. To wire up:
 * 1. Pick a provider (Resend, SendGrid, AWS SES).
 * 2. Add the SDK and an env var (e.g. `RESEND_API_KEY`).
 * 3. Replace the body of `sendEmail` with a real call.
 *
 * All call sites use try/catch so an unconfigured email service should not
 * block business flows (orders/gift cards still complete).
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  /** Plain-text body */
  text: string;
  /** Optional HTML body */
  html?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] (dev) would send:", {
      to: input.to,
      subject: input.subject,
    });
  }
  // TODO: integrate a provider here.
}

export async function sendGiftCardEmail(input: {
  to: string;
  code: string;
  amountKwd: number;
  recipientName?: string;
  message?: string;
}): Promise<void> {
  const subject = `You received an Al Aridi gift card worth ${input.amountKwd} KWD`;
  const greet = input.recipientName
    ? `Hello ${input.recipientName},`
    : "Hello,";
  const text = `${greet}

You received an Al Aridi Sweets gift card!

Code: ${input.code}
Value: ${input.amountKwd} KWD

${input.message ? `Message: ${input.message}\n\n` : ""}Redeem at your account page with the assigned recipient email or phone. Balance is added to your store wallet for checkout on alaridi.com. Store credit cannot be withdrawn as cash.

Thank you!
`;
  await sendEmail({ to: input.to, subject, text });
}

export async function sendOrderConfirmationEmail(input: {
  to: string;
  orderId: string;
  totalKwd: number;
}): Promise<void> {
  const subject = `Order ${input.orderId.slice(0, 8)} received — Al Aridi Sweets`;
  const text = `Your order for ${input.totalKwd} KWD has been received and is being prepared. You can track it at /orders/${input.orderId}`;
  await sendEmail({ to: input.to, subject, text });
}

export async function sendContactNotificationEmail(input: {
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
}): Promise<void> {
  const to = process.env.CONTACT_NOTIFICATION_EMAIL || "info@alaridi.com";
  const subject = `[Al Aridi] New contact form: ${input.subject || "no subject"}`;
  const text = `From: ${input.fromName} <${input.fromEmail}>\n\n${input.body}`;
  await sendEmail({ to, subject, text });
}
