export const PUBLIC_QUESTION_CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=300, stale-while-revalidate=3600",
  "CDN-Cache-Control":
    "public, max-age=86400, stale-while-revalidate=604800",
  "Vercel-CDN-Cache-Control":
    "public, max-age=86400, stale-while-revalidate=604800",
} as const;

export const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Authorization",
} as const;

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

export function privateJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(PRIVATE_NO_STORE_HEADERS))
    headers.set(key, value);
  return Response.json(data, { ...init, headers });
}
