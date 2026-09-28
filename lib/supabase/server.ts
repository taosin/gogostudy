import "server-only";
import { createClient } from "@supabase/supabase-js";
import { privateJson } from "../http-cache";

const SERVER_WRITE_UNAVAILABLE = "SERVER_WRITE_UNAVAILABLE";

export function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * Reads use the caller's verified JWT and stay protected by RLS. Mutating
 * routes use this separate server-only client after their authorization and
 * workflow checks have passed.
 */
export function serverWriteConfigured() {
  return Boolean(configured() && process.env.SUPABASE_SECRET_KEY);
}

export function secretClient() {
  if (!serverWriteConfigured()) throw new Error(SERVER_WRITE_UNAVAILABLE);
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
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
  if (data.user.is_anonymous) throw new Error("ANONYMOUS_NOT_ALLOWED");
  return { client, user: data.user };
}
export function apiError(error: unknown) {
  console.error(
    "Study API:",
    error instanceof Error ? error.message : "Request failed",
  );
  const unauthorized =
    error instanceof Error && error.message === "UNAUTHORIZED";
  const anonymousNotAllowed =
    error instanceof Error && error.message === "ANONYMOUS_NOT_ALLOWED";
  const writeUnavailable =
    error instanceof Error && error.message === SERVER_WRITE_UNAVAILABLE;
  return privateJson(
    {
      error: unauthorized
        ? "登录已过期，请重新登录后再保存。"
        : anonymousNotAllowed
          ? "匿名账户不能保存学习记录，请使用邮箱登录。"
        : writeUnavailable
          ? "云端保存尚未配置完成，请稍后再试。你的输入还在。"
        : "暂时无法保存或读取，请稍后重试。你的输入还在。",
    },
    { status: unauthorized ? 401 : anonymousNotAllowed ? 403 : 503 },
  );
}
