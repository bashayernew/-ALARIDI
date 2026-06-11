/** Defaults requested for local/demo; override with ADMIN_EMAIL / ADMIN_PASSWORD in .env */
export const DEFAULT_ADMIN_EMAIL = "admin@123.com";
export const DEFAULT_ADMIN_PASSWORD = "admin123";

export function expectedAdminEmail(): string {
  return process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL;
}

export function expectedAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;
}
