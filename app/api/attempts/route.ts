import { z } from "zod";
import { findQuestion, gradeAnswer, publicQuestion } from "@/lib/questions";
import {
  courseForPackageId,
  courseKey,
  type Attempt,
} from "@/lib/catalog";
import { REVIEW_INTERVAL_DAYS, chinaDay } from "@/lib/study";
import { hasValidDemoHintReceipt } from "@/lib/hint-receipt";
import {
  apiError,
  requestClient,
  secretClient,
} from "@/lib/supabase/server";
import { privateJson } from "@/lib/http-cache";

const bodySchema = z.object({
  id: z.string().uuid(),
  questionId: z.string().min(1).max(100),
  answer: z.string().trim().min(1).max(100),
  mode: z.enum(["practice", "correction", "review"]),
  workflowVersion: z.string().uuid().nullable().optional(),
  hintReceipt: z.string().max(100).optional(),
  reason: z.enum([
    "",
    "计算时出错",
    "题目没读清",
    "口诀还没想起",
    "分类标准混淆",
    "单位或测量弄混",
    "方法还不熟",
    // Kept while already-open legacy clients finish their sessions.
    "单位或时间弄混",
  ]),
});

function publicAttempt(attempt: unknown) {
  if (!attempt || typeof attempt !== "object" || Array.isArray(attempt))
    return attempt;
  const safe = { ...(attempt as Record<string, unknown>) };
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
  return safe;
}

export type WorkflowAttempt = Pick<
  Attempt,
  "id" | "correct" | "mode" | "support_level" | "created_at"
>;

export type AttemptModeIssue =
  | "CORRECTION_NOT_PENDING"
  | "REVIEW_NOT_DUE";

export type AttemptContext<T> =
  | { kind: "existing"; attempt: T }
  | { kind: "history"; history: WorkflowAttempt[] };

type WorkflowState = {
  status: "clear" | "pending" | "review" | "mastered";
  dueAt: string | null;
  reviewStep: number;
};

function addDays(value: string, days: number) {
  return new Date(
    Date.parse(value) + days * 24 * 60 * 60 * 1000,
  ).toISOString();
}

export function deriveWorkflowState(
  history: readonly WorkflowAttempt[],
): WorkflowState {
  const state: WorkflowState = {
    status: "clear",
    dueAt: null,
    reviewStep: 0,
  };
  const ordered = [...history].sort(
    (left, right) =>
      Date.parse(left.created_at) - Date.parse(right.created_at) ||
      left.id.localeCompare(right.id),
  );
  for (const attempt of ordered) {
    if (!attempt.correct || attempt.support_level !== "independent") {
      state.status = "pending";
      state.dueAt = null;
      state.reviewStep = 0;
      continue;
    }
    if (
      state.status === "pending" &&
      attempt.mode === "correction" &&
      attempt.support_level === "independent"
    ) {
      state.status = "review";
      state.dueAt = addDays(
        attempt.created_at,
        REVIEW_INTERVAL_DAYS[state.reviewStep],
      );
      continue;
    }
    if (
      state.status === "review" &&
      attempt.mode === "review" &&
      attempt.support_level === "independent" &&
      state.dueAt &&
      chinaDay(attempt.created_at) >= chinaDay(state.dueAt)
    ) {
      state.reviewStep += 1;
      if (state.reviewStep >= REVIEW_INTERVAL_DAYS.length) {
        state.status = "mastered";
        state.dueAt = null;
      } else {
        state.dueAt = addDays(
          attempt.created_at,
          REVIEW_INTERVAL_DAYS[state.reviewStep],
        );
      }
    }
  }
  return state;
}

export function attemptModeIssue(
  mode: Attempt["mode"],
  history: readonly WorkflowAttempt[],
  now: Date | string | number = new Date(),
): AttemptModeIssue | null {
  if (mode === "practice") return null;
  const state = deriveWorkflowState(history);
  if (mode === "correction")
    return state.status === "pending" ? null : "CORRECTION_NOT_PENDING";
  return state.status === "review" &&
    state.dueAt &&
    chinaDay(state.dueAt) <= chinaDay(new Date(now))
    ? null
    : "REVIEW_NOT_DUE";
}

/**
 * A retry must resolve its idempotency key before current workflow state is
 * checked. Otherwise a successful correction retry would be rejected because
 * the first request already moved the question into review.
 */
export async function loadAttemptContext<T>(
  loadExisting: () => Promise<T | null>,
  loadHistory: () => Promise<WorkflowAttempt[]>,
): Promise<AttemptContext<T>> {
  const existing = await loadExisting();
  if (existing !== null) return { kind: "existing", attempt: existing };
  return { kind: "history", history: await loadHistory() };
}

function modeIssueResponse(issue: AttemptModeIssue | "WORKFLOW_STALE") {
  return privateJson(
    {
      error:
        issue === "CORRECTION_NOT_PENDING"
          ? "这道题当前不在待纠错中，请刷新任务后再试。"
          : issue === "REVIEW_NOT_DUE"
            ? "这道题还没到复习时间，请刷新任务后再试。"
            : "学习任务已在其他页面更新，请刷新后再试。",
    },
    { status: 409 },
  );
}

function databaseErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

export function atomicAttemptErrorResponse(error: unknown) {
  const message = databaseErrorMessage(error);
  if (message.includes("IDEMPOTENCY_CONFLICT"))
    return privateJson(
      { error: "这次提交编号已用于另一份答案，请重新提交。" },
      { status: 409 },
    );
  if (message.includes("CORRECTION_NOT_PENDING"))
    return modeIssueResponse("CORRECTION_NOT_PENDING");
  if (message.includes("REVIEW_NOT_DUE"))
    return modeIssueResponse("REVIEW_NOT_DUE");
  if (message.includes("WORKFLOW_STALE"))
    return modeIssueResponse("WORKFLOW_STALE");
  return null;
}

export async function POST(request: Request) {
  let input;
  try {
    input = bodySchema.parse(await request.json());
  } catch {
    return privateJson({ error: "请检查答案后再试一次。" }, { status: 400 });
  }
  const question = findQuestion(input.questionId);
  if (!question)
    return privateJson(
      { error: "没有找到这道题，请重新选择练习。" },
      { status: 404 },
    );
  try {
    const auth = await requestClient(request);
    const course = courseForPackageId(question.packageId);
    if (!course) throw new Error("Question package is not supported");
    const attempt: Attempt = {
      id: input.id,
      question_id: question.id,
      course_key: courseKey(course),
      package_id: question.packageId,
      content_version: question.contentVersion,
      unit_id: question.unitId,
      skill_id: question.skillId,
      difficulty: question.difficulty,
      question_type: question.questionType,
      variant_group: question.variantGroup,
      review_status: question.reviewStatus,
      support_level: hasValidDemoHintReceipt(
        question,
        input.id,
        input.hintReceipt,
      )
        ? "hint"
        : "independent",
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
      // The database function owns support derivation, idempotency, workflow
      // version validation, locking, and insertion in one transaction.
      const { data, error } = await secretClient().rpc("record_attempt", {
        p_user_id: auth.user.id,
        p_attempt: { ...attempt, support_level: undefined },
        p_workflow_version: input.workflowVersion ?? null,
      });
      if (error) throw error;
      return privateJson({
        attempt: publicAttempt(data),
        storage: "cloud",
      });
    }
    return privateJson({ attempt, storage: "demo" });
  } catch (error) {
    const conflict = atomicAttemptErrorResponse(error);
    if (conflict) return conflict;
    return apiError(error);
  }
}
