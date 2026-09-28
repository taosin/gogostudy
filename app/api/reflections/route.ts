import { z } from "zod";
import {
  apiError,
  requestClient,
  secretClient,
} from "@/lib/supabase/server";
import { privateJson } from "@/lib/http-cache";
const schema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(1).max(500),
  course_key: z.string().min(1).max(100),
});

function publicReflection(row: unknown) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;
  const safe = { ...(row as Record<string, unknown>) };
  delete safe.user_id;
  return safe;
}

export async function POST(request: Request) {
  let input;
  try {
    input = schema.parse(await request.json());
  } catch {
    return privateJson(
      { error: "写下 1～500 字的小收获吧。" },
      { status: 400 },
    );
  }
  try {
    const auth = await requestClient(request);
    const reflection = { ...input, created_at: new Date().toISOString() };
    if (auth) {
      const { data, error } = await secretClient()
        .from("reflections")
        .upsert(
          { ...reflection, user_id: auth.user.id },
          { onConflict: "id", ignoreDuplicates: true },
        )
        .select("id,body,course_key,created_at")
        .maybeSingle();
      if (error) throw error;
      if (data)
        return privateJson({
          reflection: publicReflection(data),
          storage: "cloud",
        });
      const existing = await auth.client
        .from("reflections")
        .select("id,body,course_key,created_at")
        .eq("id", input.id)
        .eq("user_id", auth.user.id)
        .single();
      if (existing.error) throw existing.error;
      return privateJson({
        reflection: publicReflection(existing.data),
        storage: "cloud",
      });
    }
    return privateJson({ reflection, storage: "demo" });
  } catch (error) {
    return apiError(error);
  }
}
