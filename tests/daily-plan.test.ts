import { test } from "node:test";
import assert from "node:assert/strict";
import type { Attempt, Question } from "../lib/catalog";
import { getDailyPlan } from "../lib/daily-plan";
import type { Mistake } from "../lib/study";

const question = (id: string): Question => ({
  id,
  topic: "skill-a",
  prompt: id,
  hint: "想一想",
  packageId: "test-package",
  contentVersion: "test.1",
  unitId: "test-unit",
  skillId: "skill-a",
  difficulty: "foundation",
  questionType: "numeric",
  variantGroup: id,
  author: "original",
  reviewStatus: "reviewed",
});

const attempt = (id: string, createdAt: string): Attempt => ({
  id: `attempt-${id}`,
  question_id: id,
  course_key: "course",
  package_id: "test-package",
  content_version: "test.1",
  unit_id: "test-unit",
  skill_id: "skill-a",
  difficulty: "foundation",
  question_type: "numeric",
  variant_group: id,
  review_status: "reviewed",
  support_level: "independent",
  answer: "0",
  correct: false,
  mode: "practice",
  reason: "",
  created_at: createdAt,
  question: question(id),
  expected: "1",
  explanation: "讲解",
});

function mistake(
  id: string,
  status: Mistake["status"],
  createdAt: string,
  dueAt: string | null = null,
): Mistake {
  const last = attempt(id, createdAt);
  return {
    question: last.question,
    last,
    firstWrong: last,
    status,
    dueAt,
    reviewStep: 0,
    wrongCount: 1,
  };
}

test("daily plan exposes correction, due review, and practice at the same time", () => {
  const mistakes = [
    ...Array.from({ length: 6 }, (_, index) =>
      mistake(
        `correction-${index}`,
        "pending",
        `2026-09-${String(20 + index).padStart(2, "0")}T02:00:00.000Z`,
      ),
    ),
    ...Array.from({ length: 7 }, (_, index) =>
      mistake(
        `review-${index}`,
        "review",
        "2026-09-20T02:00:00.000Z",
        `2026-09-${String(21 + index).padStart(2, "0")}T02:00:00.000Z`,
      ),
    ),
  ];

  const plan = getDailyPlan(mistakes, "2026-09-28T12:00:00+08:00");

  assert.equal(plan.correction.total, 6);
  assert.equal(plan.correction.count, 5);
  assert.equal(plan.review.total, 7);
  assert.equal(plan.review.count, 5);
  assert.equal(plan.practice.count, 5);
  assert.equal(plan.recommended, "correction");
});

test("oldest unresolved corrections and most overdue reviews are selected first", () => {
  const mistakes = [
    mistake("new-correction", "pending", "2026-09-27T02:00:00.000Z"),
    mistake("old-correction", "pending", "2026-09-21T02:00:00.000Z"),
    mistake(
      "due-yesterday",
      "review",
      "2026-09-20T02:00:00.000Z",
      "2026-09-27T02:00:00.000Z",
    ),
    mistake(
      "due-last-week",
      "review",
      "2026-09-20T02:00:00.000Z",
      "2026-09-22T02:00:00.000Z",
    ),
  ];

  const plan = getDailyPlan(mistakes, "2026-09-28T12:00:00+08:00");

  assert.deepEqual(plan.correction.ids, ["old-correction", "new-correction"]);
  assert.deepEqual(plan.review.ids, ["due-last-week", "due-yesterday"]);
  assert.deepEqual(
    mistakes.map((item) => item.question.id),
    ["new-correction", "old-correction", "due-yesterday", "due-last-week"],
  );
});

test("future reviews stay out of the due lane using the China calendar day", () => {
  const plan = getDailyPlan(
    [
      mistake(
        "due-today",
        "review",
        "2026-09-20T02:00:00.000Z",
        "2026-09-27T16:01:00.000Z",
      ),
      mistake(
        "due-tomorrow",
        "review",
        "2026-09-20T02:00:00.000Z",
        "2026-09-28T16:01:00.000Z",
      ),
    ],
    "2026-09-28T00:30:00+08:00",
  );

  assert.deepEqual(plan.review.ids, ["due-today"]);
});

test("lane limits are independent and can be set to zero", () => {
  const plan = getDailyPlan(
    [
      mistake("correction", "pending", "2026-09-20T02:00:00.000Z"),
      mistake(
        "review",
        "review",
        "2026-09-20T02:00:00.000Z",
        "2026-09-21T02:00:00.000Z",
      ),
    ],
    "2026-09-28T12:00:00+08:00",
    { correctionLimit: 0, reviewLimit: 1, practiceCount: 0 },
  );

  assert.equal(plan.correction.total, 1);
  assert.equal(plan.correction.count, 0);
  assert.deepEqual(plan.review.ids, ["review"]);
  assert.equal(plan.practice.count, 0);
  assert.equal(plan.recommended, "review");
});
