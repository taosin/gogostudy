import { z } from "zod";
import { findQuestion } from "@/lib/questions";
import { createDemoHintReceipt } from "@/lib/hint-receipt";
import {
  apiError,
  requestClient,
  secretClient,
} from "@/lib/supabase/server";
import { privateJson } from "@/lib/http-cache";

const bodySchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().min(1).max(100),
});

function databaseErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

export function hintSessionErrorResponse(error: unknown) {
  const message = databaseErrorMessage(error);
  if (message.includes("HINT_RATE_LIMIT"))
    return privateJson(
      { error: "打开的提示太多了，请稍后再试。" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  if (message.includes("HINT_ID_CONFLICT"))
    return privateJson(
      { error: "这次答题已用于另一道题，请重新开始。" },
      { status: 409 },
    );
  return null;
}

export async function POST(request: Request) {
  let input;
  try {
    input = bodySchema.parse(await request.json());
  } catch {
    return privateJson({ error: "暂时无法打开提示，请重试。" }, { status: 400 });
  }

  const question = findQuestion(input.questionId);
  if (!question)
    return privateJson(
      { error: "没有找到这道题，请重新选择练习。" },
      { status: 404 },
    );

  try {
    const auth = await requestClient(request);
    if (auth) {
      const { error } = await secretClient().rpc("record_hint_session", {
        p_user_id: auth.user.id,
        p_attempt_id: input.attemptId,
        p_question_id: question.id,
      });
      if (error) throw error;
      return privateJson({ hint: question.hint, storage: "cloud" });
    }

    return privateJson({
      hint: question.hint,
      hintReceipt: createDemoHintReceipt(question, input.attemptId),
      storage: "demo",
    });
  } catch (error) {
    const conflict = hintSessionErrorResponse(error);
    if (conflict) return conflict;
    return apiError(error);
  }
}
