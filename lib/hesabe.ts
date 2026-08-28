import crypto from "crypto";

/**
 * Hesabe payment gateway (Kuwait — KNET / Visa / MasterCard / Apple Pay).
 * Indirect method: we send an encrypted checkout request, get a token, and
 * redirect the customer to Hesabe's hosted payment page. Hesabe then sends
 * the customer back to our callback URL with an encrypted result.
 *
 * Required environment variables (set in Vercel → Settings → Environment
 * Variables — never commit these to git):
 *   PAYMENT_PROVIDER=hesabe
 *   HESABE_MERCHANT_CODE  — "Merchant ID" from the merchant panel
 *   HESABE_ACCESS_CODE    — "Access Code"
 *   HESABE_SECRET_KEY     — "Secret Key" (32 characters, AES key)
 *   HESABE_IV_KEY         — "IV Key" (16 characters)
 *   HESABE_ENV            — "production" or "sandbox" (default sandbox)
 *   SITE_URL              — e.g. https://alaridisweets.com (for callbacks)
 */

function baseUrl(): string {
  return (process.env.HESABE_ENV ?? "sandbox") === "production"
    ? "https://api.hesabe.com"
    : "https://sandbox.hesabe.com";
}

export function siteUrl(): string {
  return (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://alaridisweets.com"
  ).replace(/\/+$/, "");
}

function keys() {
  const merchantCode = process.env.HESABE_MERCHANT_CODE ?? "";
  const accessCode = process.env.HESABE_ACCESS_CODE ?? "";
  const secretKey = process.env.HESABE_SECRET_KEY ?? "";
  const ivKey = process.env.HESABE_IV_KEY ?? "";
  if (!merchantCode || !accessCode || !secretKey || !ivKey) {
    throw new Error(
      "Hesabe keys missing. Set HESABE_MERCHANT_CODE, HESABE_ACCESS_CODE, HESABE_SECRET_KEY and HESABE_IV_KEY."
    );
  }
  return { merchantCode, accessCode, secretKey, ivKey };
}

/** AES-256-CBC, hex output — matches Hesabe's HesabeCrypt library. */
export function hesabeEncrypt(
  plain: string,
  secretKey: string,
  ivKey: string
): string {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey, "utf8"),
    Buffer.from(ivKey, "utf8")
  );
  return Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]).toString(
    "hex"
  );
}

export function hesabeDecrypt(
  encrypted: string,
  secretKey: string,
  ivKey: string,
  encoding: "hex" | "base64" = "hex"
): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey, "utf8"),
    Buffer.from(ivKey, "utf8")
  );
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.trim(), encoding)),
    decipher.final(),
  ]).toString("utf8");
}

/** Try every known Hesabe response shape; returns null when none fits. */
function tryParseHesabeBody(
  raw: string,
  secretKey: string,
  ivKey: string
): unknown | null {
  const trimmed = raw.trim();
  const attempts: (() => unknown)[] = [
    () => {
      const v = JSON.parse(trimmed);
      // A JSON-quoted encrypted string ("abc123...") needs decrypting too.
      if (typeof v === "string") {
        return JSON.parse(hesabeDecrypt(v, secretKey, ivKey, "hex"));
      }
      return v;
    },
    () => JSON.parse(hesabeDecrypt(trimmed, secretKey, ivKey, "hex")),
    () => JSON.parse(hesabeDecrypt(trimmed, secretKey, ivKey, "base64")),
  ];
  for (const attempt of attempts) {
    try {
      const v = attempt();
      if (v && typeof v === "object") return v;
    } catch {
      // try next shape
    }
  }
  return null;
}

export type HesabeCheckoutInput = {
  orderId: string;
  amountKwd: number;
  customerName?: string | null;
  customerEmail?: string | null;
};

/**
 * Creates a Hesabe checkout session and returns the URL to redirect the
 * customer to. Throws on any failure (caller decides how to handle).
 */
export async function createHesabeCheckout(
  input: HesabeCheckoutInput
): Promise<string> {
  const { merchantCode, accessCode, secretKey, ivKey } = keys();
  const base = baseUrl();
  const callback = `${siteUrl()}/api/hesabe/callback`;

  const payload: Record<string, unknown> = {
    merchantCode,
    amount: Number(input.amountKwd.toFixed(3)),
    currency: "KWD",
    paymentType: 0, // indirect — Hesabe hosted page with all methods
    responseUrl: callback,
    failureUrl: callback,
    version: "2.0",
    orderReferenceNumber: input.orderId,
    variable1: input.orderId,
  };
  if (input.customerName?.trim()) payload.name = input.customerName.trim();
  if (input.customerEmail?.trim()) payload.email = input.customerEmail.trim();

  const encrypted = hesabeEncrypt(JSON.stringify(payload), secretKey, ivKey);

  const res = await fetch(`${base}/checkout`, {
    method: "POST",
    headers: {
      accessCode,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ data: encrypted }).toString(),
    cache: "no-store",
  });

  const raw = await res.text();

  // The body may be plain JSON, or an encrypted hex/base64 string.
  const parsed = tryParseHesabeBody(raw, secretKey, ivKey);
  if (parsed == null) {
    // Log a snippet of what Hesabe actually sent so we can diagnose.
    console.error(
      "Hesabe raw response (first 400 chars):",
      JSON.stringify(raw.slice(0, 400)),
      "| HTTP",
      res.status,
      "| content-type:",
      res.headers.get("content-type")
    );
    throw new Error(`Hesabe checkout: unreadable response (HTTP ${res.status})`);
  }

  const obj = parsed as {
    status?: boolean;
    message?: string;
    response?: { data?: unknown };
  };
  const token = obj?.response?.data;
  if (!obj?.status || typeof token !== "string" || !token) {
    throw new Error(
      `Hesabe checkout failed: ${obj?.message ?? `HTTP ${res.status}`}`
    );
  }
  return `${base}/payment?data=${token}`;
}

export type HesabePaymentResult = {
  success: boolean;
  orderId: string | null;
  paymentId: string | null;
  paymentToken: string | null;
  resultCode: string | null;
  amount: number | null;
};

/** Decrypts and interprets the ?data= payload Hesabe sends to our callback. */
export function parseHesabeCallback(encryptedData: string): HesabePaymentResult {
  const { secretKey, ivKey } = keys();
  let decrypted: string;
  try {
    decrypted = hesabeDecrypt(encryptedData, secretKey, ivKey, "hex");
  } catch {
    decrypted = hesabeDecrypt(encryptedData, secretKey, ivKey, "base64");
  }
  const json = JSON.parse(decrypted) as {
    status?: boolean;
    response?: {
      data?: {
        resultCode?: string;
        amount?: number;
        paymentToken?: string | number;
        paymentId?: string | number;
        orderReferenceNumber?: string | null;
        variable1?: string | null;
      };
    };
  };
  const d = json?.response?.data ?? {};
  const resultCode = (d.resultCode ?? "").toString().toUpperCase();
  const success =
    json?.status === true &&
    ["CAPTURED", "ACCEPT", "SUCCESS"].includes(resultCode);
  return {
    success,
    orderId: d.orderReferenceNumber || d.variable1 || null,
    paymentId: d.paymentId != null ? String(d.paymentId) : null,
    paymentToken: d.paymentToken != null ? String(d.paymentToken) : null,
    resultCode: resultCode || null,
    amount: typeof d.amount === "number" ? d.amount : null,
  };
}
