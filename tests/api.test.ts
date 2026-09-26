import { test } from "node:test";
import assert from "node:assert/strict";
import { GET as listQuestions } from "../app/api/questions/route";
import { POST as submitAttempt } from "../app/api/attempts/route";
import { POST as saveSettings } from "../app/api/settings/route";
import { POST as saveReflection } from "../app/api/reflections/route";
import { questions } from "../lib/questions";
import { defaultCourse, courseKey } from "../lib/catalog";
function post(path: string, body: unknown) {
  return new Request("http://localhost" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
test("question API only exposes public prompt data", async () => {
  const response = await listQuestions(
    new Request("http://localhost/api/questions"),
  );
  const data = await response.json();
  assert.equal(data.questions.length, 29);
  assert.ok(
    data.questions.every(
      (q: Record<string, unknown>) => !("answer" in q) && !("explanation" in q),
    ),
  );
});
test("unsupported curriculum returns no fallback questions", async () => {
  const response = await listQuestions(
    new Request("http://localhost/api/questions?course=unsupported"),
  );
  assert.deepEqual((await response.json()).questions, []);
});
test("server grades the answer, ignoring a forged client correctness value", async () => {
  const response = await submitAttempt(
    post("/api/attempts", {
      id: crypto.randomUUID(),
      questionId: questions[0].id,
      answer: "0",
      mode: "practice",
      reason: "",
      correct: true,
      expected: "0",
      user_id: crypto.randomUUID(),
    }),
  );
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.storage, "demo");
  assert.equal(data.attempt.correct, false);
  assert.equal(data.attempt.expected, "45");
  assert.equal(data.attempt.course_key, courseKey(defaultCourse));
  assert.ok(!("user_id" in data.attempt));
});
test("blank and invalid question submissions are rejected", async () => {
  const body = {
    id: crypto.randomUUID(),
    questionId: "not-real",
    answer: "1",
    mode: "practice",
    reason: "",
  };
  assert.equal((await submitAttempt(post("/api/attempts", body))).status, 404);
  assert.equal(
    (await submitAttempt(post("/api/attempts", { ...body, answer: " " })))
      .status,
    400,
  );
  assert.equal(
    (await submitAttempt(post("/api/attempts", { ...body, id: "bad-id" })))
      .status,
    400,
  );
});
test("settings validate supported values and reflections reject blank input", async () => {
  assert.equal(
    (
      await saveSettings(
        post("/api/settings", { ...defaultCourse, grade: "unknown" }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await saveReflection(
        post("/api/reflections", {
          id: crypto.randomUUID(),
          body: " ",
          course_key: courseKey(defaultCourse),
        }),
      )
    ).status,
    400,
  );
});
