import { apiError, requestClient, configured } from "@/lib/supabase/server";
import {
  emptyState,
  defaultCourse,
  legacyCourse,
  courseForPackageId,
  courseKey,
  normalizeCourse,
} from "@/lib/catalog";
import { privateJson } from "@/lib/http-cache";
export const dynamic = "force-dynamic";

function publicRecord<T extends { user_id?: unknown }>(row: T) {
  const safe: Record<string, unknown> = { ...row };
  delete safe.user_id;
  if (
    safe.question &&
    typeof safe.question === "object" &&
    !Array.isArray(safe.question)
  ) {
    const question = { ...(safe.question as Record<string, unknown>) };
    delete question.hint;
    safe.question = question;
  }
  return safe as Omit<T, "user_id">;
}

export function resolveStateCourse(
  profileCourse: unknown,
  attempts: unknown[],
) {
  if (profileCourse) return normalizeCourse(profileCourse);
  const latest = attempts.at(-1);
  if (latest && typeof latest === "object" && "package_id" in latest) {
    const packageId = (latest as { package_id?: unknown }).package_id;
    if (typeof packageId === "string") {
      const course = courseForPackageId(packageId);
      if (course) return course;
    }
  }
  return attempts.length ? { ...legacyCourse } : emptyState().course;
}

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
      attempts.push(...result.data.map(publicRecord));
      if (result.data.length < 1000) break;
      if (offset >= 49000) throw new Error("History exceeds interactive limit");
    }
    const [profile, currentReflections, legacyReflections] = await Promise.all([
      auth.client
        .from("profiles")
        .select("course")
        .eq("user_id", auth.user.id)
        .maybeSingle(),
      auth.client
        .from("reflections")
        .select("*")
        .eq("user_id", auth.user.id)
        .eq("course_key", courseKey(defaultCourse))
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(100),
      auth.client
        .from("reflections")
        .select("*")
        .eq("user_id", auth.user.id)
        .eq("course_key", courseKey(legacyCourse))
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(100),
    ]);
    if (profile.error) throw profile.error;
    if (currentReflections.error) throw currentReflections.error;
    if (legacyReflections.error) throw legacyReflections.error;
    const reflections = [
      ...currentReflections.data,
      ...legacyReflections.data,
    ]
      .sort(
        (left, right) =>
          Date.parse(right.created_at) - Date.parse(left.created_at) ||
          right.id.localeCompare(left.id),
      )
      .map(publicRecord);
    return privateJson({
      state: {
        attempts,
        reflections,
        course: resolveStateCourse(profile.data?.course, attempts),
      },
      storage: "cloud",
      configured: true,
    });
  } catch (error) {
    return apiError(error);
  }
}
