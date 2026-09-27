import { z } from "zod";
import { apiError, requestClient } from "@/lib/supabase/server";
import { privateJson } from "@/lib/http-cache";
const schema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(1).max(500),
  course_key: z.string().min(1).max(100),
});
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
      const { data, error } = await auth.client
        .from("reflections")
        .upsert(
          { ...reflection, user_id: auth.user.id },
          { onConflict: "id", ignoreDuplicates: true },
        )
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) return privateJson({ reflection: data, storage: "cloud" });
      const existing = await auth.client
        .from("reflections")
        .select("*")
        .eq("id", input.id)
        .eq("user_id", auth.user.id)
        .single();
      if (existing.error) throw existing.error;
      return privateJson({ reflection: existing.data, storage: "cloud" });
    }
    return privateJson({ reflection, storage: "demo" });
  } catch (error) {
    return apiError(error);
  }
}
