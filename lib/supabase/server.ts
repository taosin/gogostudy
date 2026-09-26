import { createClient } from "@supabase/supabase-js";
export function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export async function requestClient(request: Request) {
  if (!configured()) return null;
  const token = request.headers.get("authorization");
  if (!token) return null;
  if (!/^Bearer \S+$/.test(token)) throw new Error("UNAUTHORIZED");
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: token } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { data, error } = await client.auth.getUser(token.slice(7));
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return { client, user: data.user };
}
export function apiError(error: unknown) {
  console.error(
    "Study API:",
    error instanceof Error ? error.message : "Request failed",
  );
  const unauthorized =
    error instanceof Error && error.message === "UNAUTHORIZED";
  return Response.json(
    {
      error: unauthorized
        ? "登录已过期，请重新登录后再保存。"
        : "暂时无法保存或读取，请稍后重试。你的输入还在。",
    },
    { status: unauthorized ? 401 : 503 },
  );
}
