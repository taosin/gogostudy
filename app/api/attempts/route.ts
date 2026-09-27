import { z } from "zod";
import { questions, gradeAnswer, publicQuestion } from "@/lib/questions";
import { defaultCourse, courseKey, type Attempt } from "@/lib/catalog";
import { apiError, requestClient } from "@/lib/supabase/server";
import { privateJson } from "@/lib/http-cache";
const bodySchema = z.object({
  id: z.string().uuid(),
  questionId: z.string(),
  answer: z.string().trim().min(1).max(100),
  mode: z.enum(["practice", "correction", "review"]),
  reason: z.enum([
    "",
    "计算时出错",
    "题目没读清",
    "方法还不熟",
    "单位或时间弄混",
  ]),
});
export async function POST(request: Request) {
  let input;
  try {
    input = bodySchema.parse(await request.json());
  } catch {
    return privateJson({ error: "请检查答案后再试一次。" }, { status: 400 });
  }
  const question = questions.find((q) => q.id === input.questionId);
  if (!question)
    return privateJson(
      { error: "没有找到这道题，请重新选择练习。" },
      { status: 404 },
    );
  try {
    const auth = await requestClient(request);
    const attempt: Attempt = {
      id: input.id,
      question_id: question.id,
      course_key: courseKey(defaultCourse),
      question: publicQuestion(question),
      answer: input.answer,
      correct: gradeAnswer(question, input.answer),
      mode: input.mode,
      reason: input.reason,
      expected: question.answer,
      explanation: question.explanation,
      created_at: new Date().toISOString(),
    };
    if (auth) {
      const existing = await auth.client
        .from("attempts")
        .select("*")
        .eq("id", input.id)
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data)
        return privateJson({ attempt: existing.data, storage: "cloud" });
      const { data, error } = await auth.client
        .from("attempts")
        .insert({ ...attempt, user_id: auth.user.id })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") {
          const retry = await auth.client
            .from("attempts")
            .select("*")
            .eq("id", input.id)
            .eq("user_id", auth.user.id)
            .single();
          if (retry.error) throw retry.error;
          return privateJson({ attempt: retry.data, storage: "cloud" });
        }
        throw error;
      }
      return privateJson({ attempt: data, storage: "cloud" });
    }
    return privateJson({ attempt, storage: "demo" });
  } catch (error) {
    return apiError(error);
  }
}
