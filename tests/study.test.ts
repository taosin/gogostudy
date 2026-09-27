import { test } from "node:test";
import assert from "node:assert/strict";
import { questions, gradeAnswer, publicQuestion } from "../lib/questions";
import {
  getMistakes,
  stats,
  chinaDay,
  getTodayTask,
  rotateForChinaDay,
} from "../lib/study";
import {
  defaultCourse,
  courseKey,
  supportedCourse,
  type Attempt,
} from "../lib/catalog";
const question = questions[0];
const attempt = (overrides: Partial<Attempt> = {}): Attempt => ({
  id: crypto.randomUUID(),
  question_id: question.id,
  course_key: courseKey(defaultCourse),
  answer: "0",
  correct: false,
  mode: "practice",
  reason: "",
  created_at: "2026-09-26T02:00:00.000Z",
  question: publicQuestion(question),
  expected: question.answer,
  explanation: question.explanation,
  ...overrides,
});
test("question IDs are unique and each choice contains its answer", () => {
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  for (const q of questions) {
    assert.ok(q.explanation && q.hint);
    if (q.options) assert.ok(q.options.includes(q.answer));
    assert.ok(gradeAnswer(q, q.answer));
    assert.ok(!("answer" in publicQuestion(q)));
    assert.ok(!("explanation" in publicQuestion(q)));
  }
});
test("grading accepts full width digits and surrounding whitespace, rejects incomplete text", () => {
  assert.ok(gradeAnswer(question, " ４５ "));
  assert.ok(gradeAnswer(question, "045"));
  assert.ok(!gradeAnswer(question, "45abc"));
  assert.ok(!gradeAnswer(question, ""));
});
test("correction does not imply mastery; same-day review stays pending", () => {
  const wrong = attempt(),
    corrected = attempt({
      correct: true,
      mode: "correction",
      created_at: "2026-09-26T03:00:00.000Z",
    }),
    early = attempt({
      correct: true,
      mode: "review",
      created_at: "2026-09-26T04:00:00.000Z",
    });
  const result = getMistakes([wrong, corrected, early])[0];
  assert.equal(result.status, "review");
  assert.equal(result.reviewStep, 0);
  assert.equal(result.dueAt, "2026-09-27T03:00:00.000Z");
});

test("a review becomes available at the start of its China calendar day", () => {
  const result = getMistakes([
    attempt(),
    attempt({
      correct: true,
      mode: "correction",
      created_at: "2026-09-26T12:00:00.000Z",
    }),
    attempt({
      correct: true,
      mode: "review",
      created_at: "2026-09-26T16:01:00.000Z",
    }),
  ])[0];
  assert.equal(result.status, "review");
  assert.equal(result.reviewStep, 1);
  assert.equal(
    getTodayTask(
      getMistakes([
        attempt(),
        attempt({
          correct: true,
          mode: "correction",
          created_at: "2026-09-26T12:00:00.000Z",
        }),
      ]),
      "2026-09-27T00:01:00+08:00",
    ).kind,
    "review",
  );
});

test("ordinary practice cannot bypass explicit correction", () => {
  const result = getMistakes([
    attempt(),
    attempt({
      correct: true,
      mode: "practice",
      created_at: "2026-09-27T03:00:00.000Z",
    }),
  ])[0];
  assert.equal(result.status, "pending");
  assert.equal(result.dueAt, null);
});

test("three due reviews advance the 1 / 3 / 7 day cycle, then an error reopens it", () => {
  const wrong = attempt(),
    corrected = attempt({
      correct: true,
      mode: "correction",
      created_at: "2026-09-26T03:00:00.000Z",
    }),
    firstReview = attempt({
      correct: true,
      mode: "review",
      created_at: "2026-09-27T03:00:00.000Z",
    }),
    secondReview = attempt({
      correct: true,
      mode: "review",
      created_at: "2026-09-30T03:00:00.000Z",
    }),
    finalReview = attempt({
      correct: true,
      mode: "review",
      created_at: "2026-10-07T03:00:00.000Z",
    });
  const first = getMistakes([firstReview, wrong, corrected])[0];
  assert.equal(first.status, "review");
  assert.equal(first.reviewStep, 1);
  assert.equal(first.dueAt, "2026-09-30T03:00:00.000Z");
  const second = getMistakes([wrong, corrected, firstReview, secondReview])[0];
  assert.equal(second.reviewStep, 2);
  assert.equal(second.dueAt, "2026-10-07T03:00:00.000Z");
  const mastered = getMistakes([
    wrong,
    corrected,
    firstReview,
    secondReview,
    finalReview,
  ])[0];
  assert.equal(mastered.status, "mastered");
  assert.equal(mastered.reviewStep, 3);
  assert.equal(
    getMistakes([
      wrong,
      corrected,
      firstReview,
      secondReview,
      finalReview,
      attempt({ created_at: "2026-10-08T02:00:00.000Z" }),
    ])[0].status,
    "pending",
  );
});
test("practice correctness excludes correction attempts", () => {
  const s = stats([
    attempt(),
    attempt({ correct: true }),
    attempt({ correct: true, mode: "correction" }),
  ]);
  assert.equal(s.accuracy, 50);
  assert.equal(s.total, 3);
});
test("course scopes never merge and unsupported selections do not fall back", () => {
  assert.equal(
    getMistakes([attempt(), attempt({ course_key: "another" })]).length,
    2,
  );
  assert.ok(supportedCourse(defaultCourse));
  assert.ok(!supportedCourse({ ...defaultCourse, subject: "语文" }));
});
test("study days use China time near midnight", () => {
  assert.equal(chinaDay("2026-09-26T16:01:00Z"), "2026-09-27");
});

test("Supabase offset timestamps use the same review interval as ISO UTC timestamps", () => {
  const result = getMistakes([
    attempt(),
    attempt({
      correct: true,
      mode: "correction",
      created_at: "2026-09-26T03:00:00+00:00",
    }),
    attempt({
      correct: true,
      mode: "review",
      created_at: "2026-09-27T11:00:00+08:00",
    }),
  ]);
  assert.equal(result[0].status, "review");
  assert.equal(result[0].reviewStep, 1);
  assert.equal(result[0].dueAt, "2026-09-30T03:00:00.000Z");
});

test("today task prioritizes correction, then due review, then practice", () => {
  const wrong = attempt();
  assert.equal(getTodayTask(getMistakes([wrong]), "2026-10-01").kind, "correction");
  const corrected = attempt({
    correct: true,
    mode: "correction",
    created_at: "2026-09-26T03:00:00.000Z",
  });
  assert.equal(
    getTodayTask(getMistakes([wrong, corrected]), "2026-09-27T03:00:00.000Z")
      .kind,
    "review",
  );
  assert.equal(
    getTodayTask(getMistakes([wrong, corrected]), "2026-09-26T04:00:00.000Z")
      .kind,
    "practice",
  );
});

test("daily topic rotation includes every topic across consecutive days", () => {
  const values = ["a", "b", "c", "d", "e", "f", "g"];
  const seen = new Set<string>();
  for (let day = 27; day <= 33; day += 1) {
    const date = new Date(Date.UTC(2026, 8, day));
    for (const value of rotateForChinaDay(values, date).slice(0, 5)) seen.add(value);
  }
  assert.deepEqual([...seen].sort(), values);
});

test("stats report today's practice and a continuous learning streak", () => {
  const result = stats(
    [
      attempt({ created_at: "2026-09-25T03:00:00.000Z" }),
      attempt({ created_at: "2026-09-26T03:00:00.000Z" }),
      attempt({
        created_at: "2026-09-27T03:00:00.000Z",
        mode: "correction",
      }),
      attempt({
        created_at: "2026-09-27T04:00:00.000Z",
        correct: true,
      }),
    ],
    "2026-09-27T12:00:00+08:00",
  );
  assert.equal(result.today, 2);
  assert.equal(result.todayPractice, 1);
  assert.equal(result.streak, 3);
});
