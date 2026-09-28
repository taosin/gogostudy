import { z } from "zod";
import {
  CURRENT_COURSE_REVISION,
  LEGACY_COURSE_REVISION,
  courseOptions,
  normalizeCourse,
} from "@/lib/catalog";
import {
  apiError,
  requestClient,
  secretClient,
} from "@/lib/supabase/server";
import { privateJson } from "@/lib/http-cache";
const schema = z
  .object({
    province: z.string(),
    textbook: z.string(),
    grade: z.string(),
    semester: z.string(),
    subject: z.string(),
    revision: z
      .enum([CURRENT_COURSE_REVISION, LEGACY_COURSE_REVISION])
      .optional(),
  })
  .strict();
export async function POST(request: Request) {
  let course;
  try {
    const parsed = schema.parse(await request.json());
    for (const key of [
      "province",
      "textbook",
      "grade",
      "semester",
      "subject",
    ] as const) {
      if (!(courseOptions[key] as readonly string[]).includes(parsed[key]))
        throw new Error();
    }
    course = normalizeCourse(parsed);
  } catch {
    return privateJson({ error: "课程选择不正确。" }, { status: 400 });
  }
  try {
    const auth = await requestClient(request);
    if (auth) {
      const { error } = await secretClient()
        .from("profiles")
        .upsert({
          user_id: auth.user.id,
          course,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    }
    return privateJson({ course, storage: auth ? "cloud" : "demo" });
  } catch (error) {
    return apiError(error);
  }
}
