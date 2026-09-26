import { test } from "node:test";
import assert from "node:assert/strict";
import { questions, gradeAnswer, publicQuestion } from "../lib/questions";
import { getMistakes, stats, chinaDay } from "../lib/study";
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
  assert.equal(result.dueAt, "2026-09-27T03:00:00.000Z");
});
test("a successful spaced review masters a question, later error reopens it", () => {
  const wrong = attempt(),
    corrected = attempt({
      correct: true,
      mode: "correction",
      created_at: "2026-09-26T03:00:00.000Z",
    }),
    review = attempt({
      correct: true,
      mode: "review",
      created_at: "2026-09-27T03:00:00.000Z",
    });
  assert.equal(getMistakes([review, wrong, corrected])[0].status, "mastered");
  assert.equal(
    getMistakes([
      wrong,
      corrected,
      review,
      attempt({ created_at: "2026-09-28T02:00:00.000Z" }),
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
  assert.equal(result[0].status, "mastered");
});
