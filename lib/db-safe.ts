/**
 * When PostgreSQL is down or DATABASE_URL is wrong, Prisma throws
 * PrismaClientInitializationError (often code P1001). We fall back so the UI
 * still loads in development; production should always have a live DB.
 */

export function isPrismaConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as {
    code?: string;
    name?: string;
    message?: string;
    cause?: { message?: string };
  };
  if (e.code && ["P1001", "P1000", "P1017"].includes(e.code)) return true;
  if (e.name === "PrismaClientInitializationError") return true;
  if (
    e.name === "PrismaClientKnownRequestError" &&
    typeof e.message === "string" &&
    /Cannot fetch data from service|fetch failed/i.test(e.message)
  ) {
    return true;
  }
  if (
    typeof e.message === "string" &&
    /Can't reach database|ECONNREFUSED|connection refused|getaddrinfo|Cannot fetch data from service|fetch failed/i.test(
      e.message
    )
  )
    return true;
  if (
    typeof e.cause?.message === "string" &&
    /ECONNREFUSED|fetch failed|connection refused/i.test(e.cause.message)
  ) {
    return true;
  }
  return false;
}

export async function dbQuery<T>(fallback: T, run: () => Promise<T>): Promise<T> {
  const { data } = await dbQueryWithFlag(fallback, run);
  return data;
}

/** Like `dbQuery` but returns whether the fallback was used (e.g. to show an admin notice in dev). */
export async function dbQueryWithFlag<T>(
  fallback: T,
  run: () => Promise<T>
): Promise<{ data: T; usedFallback: boolean }> {
  try {
    const data = await run();
    return { data, usedFallback: false };
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      if (process.env.NODE_ENV !== "development") {
        throw error;
      }
      console.warn(
        "[Al Aridi] Database unreachable — start Postgres (e.g. `docker compose up -d`) or fix DATABASE_URL. Using empty data for this request."
      );
      return { data: fallback, usedFallback: true };
    }
    throw error;
  }
}
