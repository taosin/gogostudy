import { z } from "zod";
import { courseOptions } from "@/lib/catalog";
import { apiError, requestClient } from "@/lib/supabase/server";
const schema = z
  .object({
    province: z.string(),
    textbook: z.string(),
    grade: z.string(),
    semester: z.string(),
    subject: z.string(),
  })
  .strict();
export async function POST(request: Request) {
  let course;
  try {
    course = schema.parse(await request.json());
    for (const key of Object.keys(
      courseOptions,
    ) as (keyof typeof courseOptions)[]) {
      if (!courseOptions[key].includes(course[key])) throw new Error();
    }
  } catch {
    return Response.json({ error: "课程选择不正确。" }, { status: 400 });
  }
  try {
    const auth = await requestClient(request);
    if (auth) {
      const { error } = await auth.client
        .from("profiles")
        .upsert({
          user_id: auth.user.id,
          course,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    }
    return Response.json({ course, storage: auth ? "cloud" : "demo" });
  } catch (error) {
    return apiError(error);
  }
}
