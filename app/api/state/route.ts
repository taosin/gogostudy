import { apiError, requestClient, configured } from "@/lib/supabase/server";
import { emptyState } from "@/lib/catalog";
import { privateJson } from "@/lib/http-cache";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const auth = await requestClient(request);
    if (!auth)
      return privateJson({
        state: emptyState(),
        storage: "demo",
        configured: configured(),
      });
    const attempts: unknown[] = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await auth.client
        .from("attempts")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at")
        .order("id")
        .range(offset, offset + 999);
      if (result.error) throw result.error;
      attempts.push(...result.data);
      if (result.data.length < 1000) break;
      if (offset >= 49000) throw new Error("History exceeds interactive limit");
    }
    const [profile, reflections] = await Promise.all([
      auth.client
        .from("profiles")
        .select("course")
        .eq("user_id", auth.user.id)
        .maybeSingle(),
      auth.client
        .from("reflections")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (profile.error) throw profile.error;
    if (reflections.error) throw reflections.error;
    return privateJson({
      state: {
        attempts,
        reflections: reflections.data,
        course: profile.data?.course || emptyState().course,
      },
      storage: "cloud",
      configured: true,
    });
  } catch (error) {
    return apiError(error);
  }
}
