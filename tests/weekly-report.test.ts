import { test } from "node:test";
import assert from "node:assert/strict";
import type { Attempt, Question } from "../lib/catalog";
import {
  getWeeklyReport,
  type WeeklySkillDefinition,
} from "../lib/weekly-report";

const skills: WeeklySkillDefinition[] = [
  { id: "steady", name: "稳稳掌握" },
  { id: "developing", name: "正在进步" },
  { id: "needs-practice", name: "再练一练" },
  { id: "same-question", name: "同题样本" },
  { id: "empty", name: "尚未练习" },
];

function attempt(
  id: string,
  skill: string,
  questionId: string,
  createdAt: string,
  overrides: Partial<Attempt> = {},
): Attempt {
  const question: Question = {
    id: questionId,
    topic: skill,
    prompt: questionId,
    hint: "想一想",
    packageId: "test-package",
    contentVersion: "test.1",
    unitId: "test-unit",
    skillId: skill,
    difficulty: "foundation",
    questionType: "numeric",
    variantGroup: questionId,
    author: "original",
    reviewStatus: "reviewed",
  };
  return {
    id,
    question_id: questionId,
    course_key: "current-course-pack",
    package_id: "test-package",
    content_version: "test.1",
    unit_id: "test-unit",
    skill_id: skill,
    difficulty: "foundation",
    question_type: "numeric",
    variant_group: questionId,
    review_status: "reviewed",
    support_level: "independent",
    answer: "1",
    correct: true,
    mode: "practice",
    reason: "",
    created_at: createdAt,
    question,
    expected: "1",
    explanation: "讲解",
    ...overrides,
  };
}

test("weekly report uses the latest seven China calendar days", () => {
  const report = getWeeklyReport(
    [
      attempt(
        "outside",
        "steady",
        "q-outside",
        "2026-09-21T15:59:00.000Z",
      ),
      attempt(
        "first-minute",
        "steady",
        "q-in-1",
        "2026-09-21T16:01:00.000Z",
      ),
      attempt("today", "steady", "q-in-2", "2026-09-27T16:10:00.000Z"),
    ],
    skills,
    { now: "2026-09-28T00:30:00+08:00" },
  );

  assert.equal(report.startDay, "2026-09-22");
  assert.equal(report.endDay, "2026-09-28");
  assert.equal(report.practiceCount, 2);
  assert.equal(report.learningDays, 2);
});

test("weekly report separates practice, successful corrections, and completed reviews", () => {
  const report = getWeeklyReport(
    [
      attempt("practice-correct", "steady", "q1", "2026-09-27T02:00:00Z"),
      attempt("practice-wrong", "steady", "q2", "2026-09-27T03:00:00Z", {
        correct: false,
      }),
      attempt("practice-with-hint", "steady", "q3", "2026-09-27T03:30:00Z", {
        support_level: "hint",
      }),
      attempt("correction-ok", "steady", "q2", "2026-09-27T04:00:00Z", {
        mode: "correction",
        reason: "题目没读清",
      }),
      attempt("correction-wrong", "steady", "q3", "2026-09-27T05:00:00Z", {
        mode: "correction",
        correct: false,
        reason: "题目没读清",
      }),
      attempt("review-ok", "steady", "q4", "2026-09-27T06:00:00Z", {
        mode: "review",
      }),
      attempt("review-wrong", "steady", "q5", "2026-09-27T07:00:00Z", {
        mode: "review",
        correct: false,
        reason: "方法还不熟",
      }),
      attempt("correction-hint", "steady", "q6", "2026-09-27T08:00:00Z", {
        mode: "correction",
        support_level: "hint",
      }),
      attempt("review-guided", "steady", "q7", "2026-09-27T09:00:00Z", {
        mode: "review",
        support_level: "guided",
      }),
    ],
    skills,
    { now: "2026-09-28T12:00:00+08:00" },
  );

  assert.equal(report.practiceCount, 3);
  assert.equal(report.independentPracticeCount, 2);
  assert.equal(report.independentPracticeCorrectCount, 1);
  assert.equal(report.practiceAccuracy, 50);
  assert.equal(report.correctedCount, 1);
  assert.equal(report.reviewedCount, 1);
  assert.deepEqual(report.topReason, { reason: "题目没读清", count: 2 });
});

test("skill advice requires three unique practice attempts across two questions", () => {
  const createdAt = "2026-09-27T02:00:00.000Z";
  const report = getWeeklyReport(
    [
      attempt("s1", "steady", "steady-1", createdAt),
      attempt("s2", "steady", "steady-2", createdAt),
      attempt("s3", "steady", "steady-2", createdAt),
      attempt("d1", "developing", "developing-1", createdAt),
      attempt("d2", "developing", "developing-2", createdAt),
      attempt("d3", "developing", "developing-2", createdAt, {
        correct: false,
      }),
      attempt("n1", "needs-practice", "needs-1", createdAt),
      attempt("n2", "needs-practice", "needs-2", createdAt, {
        correct: false,
      }),
      attempt("n3", "needs-practice", "needs-2", createdAt, {
        correct: false,
      }),
      attempt("one-1", "same-question", "same", createdAt),
      attempt("one-2", "same-question", "same", createdAt),
      attempt("one-3", "same-question", "same", createdAt),
    ],
    skills,
    { now: "2026-09-28T12:00:00+08:00" },
  );

  const byId = new Map(report.skills.map((skill) => [skill.skillId, skill]));
  assert.equal(byId.get("steady")?.level, "steady");
  assert.ok(byId.get("steady")?.recommendation);
  assert.equal(byId.get("developing")?.level, "developing");
  assert.equal(byId.get("needs-practice")?.level, "needs-practice");
  assert.equal(byId.get("same-question")?.level, "insufficient");
  assert.equal(byId.get("same-question")?.recommendation, null);
  assert.equal(byId.get("empty")?.level, "insufficient");
  assert.equal(byId.get("empty")?.accuracy, null);
});

test("hinted and guided practice counts as completed but not as independent evidence", () => {
  const createdAt = "2026-09-27T02:00:00.000Z";
  const report = getWeeklyReport(
    [
      attempt("independent-1", "developing", "question-1", createdAt),
      attempt("independent-2", "developing", "question-2", createdAt, {
        correct: false,
      }),
      attempt("hinted", "developing", "question-3", createdAt, {
        support_level: "hint",
      }),
      attempt("guided", "developing", "question-4", createdAt, {
        support_level: "guided",
        correct: false,
      }),
    ],
    skills,
    { now: "2026-09-28T12:00:00+08:00" },
  );

  const skill = report.skills.find((item) => item.skillId === "developing");
  assert.equal(report.practiceCount, 4);
  assert.equal(report.independentPracticeCount, 2);
  assert.equal(report.practiceAccuracy, 50);
  assert.equal(skill?.practiceCount, 2);
  assert.equal(skill?.uniqueQuestionCount, 2);
  assert.equal(skill?.level, "insufficient");
  assert.equal(skill?.recommendation, null);
});

test("duplicate attempt IDs do not inflate report metrics or skill samples", () => {
  const original = attempt(
    "same-id",
    "steady",
    "steady-1",
    "2026-09-27T02:00:00.000Z",
  );
  const report = getWeeklyReport([original, { ...original }], skills, {
    now: "2026-09-28T12:00:00+08:00",
  });

  assert.equal(report.practiceCount, 1);
  assert.equal(report.skills[0].practiceCount, 1);
  assert.equal(report.skills[0].level, "insufficient");
});

test("empty weeks remain neutral and do not invent recommendations", () => {
  const report = getWeeklyReport([], skills, {
    now: "2026-09-28T12:00:00+08:00",
  });

  assert.equal(report.learningDays, 0);
  assert.equal(report.independentPracticeCount, 0);
  assert.equal(report.practiceAccuracy, null);
  assert.equal(report.topReason, null);
  assert.ok(report.skills.every((skill) => skill.recommendation === null));
});
