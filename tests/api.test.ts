import { test } from "node:test";
import assert from "node:assert/strict";
import { GET as listQuestions } from "../app/api/questions/route";
import {
  GET as loadState,
  resolveStateCourse,
} from "../app/api/state/route";
import { POST as submitAttempt } from "../app/api/attempts/route";
import { POST as revealHint } from "../app/api/hints/route";
import { POST as saveSettings } from "../app/api/settings/route";
import { POST as saveReflection } from "../app/api/reflections/route";
import { questions } from "../lib/questions";
import {
  CURRENT_PACKAGE_ID,
  LEGACY_PACKAGE_ID,
  defaultCourse,
  legacyCourse,
  courseKey,
} from "../lib/catalog";
function post(path: string, body: unknown) {
  return new Request("http://localhost" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
test("question API only exposes public prompt data", async () => {
  const response = await listQuestions(
    new Request(
      `http://localhost/api/questions?course=${encodeURIComponent(
        courseKey(defaultCourse),
      )}`,
    ),
  );
  const data = await response.json();
  assert.equal(data.packageId, CURRENT_PACKAGE_ID);
  assert.equal(data.questions.length, 56);
  assert.ok(
    data.questions.every(
      (q: Record<string, unknown>) =>
        q.packageId === CURRENT_PACKAGE_ID &&
        typeof q.contentVersion === "string" &&
        typeof q.unitId === "string" &&
        typeof q.skillId === "string" &&
        !("answer" in q) &&
        !("explanation" in q) &&
        !("hint" in q),
    ),
  );
  assert.match(response.headers.get("cache-control") || "", /max-age=300/);
  assert.match(
    response.headers.get("vercel-cdn-cache-control") || "",
    /max-age=86400/,
  );
});
test("legacy package remains available under its versioned course key", async () => {
  const response = await listQuestions(
    new Request(
      `http://localhost/api/questions?course=${encodeURIComponent(
        courseKey(legacyCourse),
      )}`,
    ),
  );
  const data = await response.json();
  assert.equal(data.packageId, LEGACY_PACKAGE_ID);
  assert.equal(data.questions.length, 29);
  assert.ok(
    data.questions.every(
      (question: Record<string, unknown>) =>
        question.packageId === LEGACY_PACKAGE_ID,
    ),
  );
});
test("question API scopes a new-package request to its unit", async () => {
  const response = await listQuestions(
    new Request(
      `http://localhost/api/questions?course=${encodeURIComponent(
        courseKey(defaultCourse),
      )}&topic=u1-classification`,
    ),
  );
  const data = await response.json();
  assert.equal(data.questions.length, 8);
  assert.ok(
    data.questions.every(
      (question: Record<string, unknown>) =>
        question.unitId === "u1-classification" &&
        question.topic === "u1-classification",
    ),
  );
});
test("question API requires an explicit course key", async () => {
  const response = await listQuestions(
    new Request("http://localhost/api/questions"),
  );
  assert.equal(response.status, 400);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
});
test("unsupported curriculum returns no fallback questions", async () => {
  const response = await listQuestions(
    new Request("http://localhost/api/questions?course=unsupported"),
  );
  assert.deepEqual((await response.json()).questions, []);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
});
test("invalid question query shapes are rejected without cache pollution", async () => {
  const response = await listQuestions(
    new Request("http://localhost/api/questions?course=a&course=b"),
  );
  assert.equal(response.status, 400);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
});
test("private learning state is never cached by a browser or shared CDN", async () => {
  const response = await loadState(
    new Request("http://localhost/api/state"),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("vary"), "Authorization");
});
test("state restores the course from the latest attempt when no profile exists", () => {
  assert.equal(courseKey(resolveStateCourse(undefined, [])), courseKey(defaultCourse));
  assert.equal(
    courseKey(
      resolveStateCourse(undefined, [{ package_id: CURRENT_PACKAGE_ID }]),
    ),
    courseKey(defaultCourse),
  );
  assert.equal(
    courseKey(resolveStateCourse(null, [{ package_id: "unknown" }])),
    courseKey(legacyCourse),
  );
  assert.equal(
    courseKey(resolveStateCourse(undefined, [{ package_id: LEGACY_PACKAGE_ID }])),
    courseKey(legacyCourse),
  );
  assert.equal(
    courseKey(
      resolveStateCourse(defaultCourse, [{ package_id: LEGACY_PACKAGE_ID }]),
    ),
    courseKey(defaultCourse),
  );
});
test("server grades the answer, ignoring a forged client correctness value", async () => {
  const question = questions.find(
    (item) => item.packageId === CURRENT_PACKAGE_ID,
  )!;
  const response = await submitAttempt(
    post("/api/attempts", {
      id: crypto.randomUUID(),
      questionId: question.id,
      answer: "__wrong__",
      mode: "practice",
      reason: "",
      supportLevel: "hint",
      correct: true,
      expected: "0",
      user_id: crypto.randomUUID(),
    }),
  );
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.storage, "demo");
  assert.equal(data.attempt.correct, false);
  assert.equal(data.attempt.expected, question.answer);
  assert.equal(data.attempt.course_key, courseKey(defaultCourse));
  assert.equal(data.attempt.package_id, CURRENT_PACKAGE_ID);
  assert.equal(data.attempt.content_version, question.contentVersion);
  assert.equal(data.attempt.skill_id, question.skillId);
  assert.equal(data.attempt.support_level, "independent");
  assert.equal(data.attempt.question.packageId, CURRENT_PACKAGE_ID);
  assert.ok(!("hint" in data.attempt.question));
  assert.ok(!("user_id" in data.attempt));
  assert.match(response.headers.get("cache-control") || "", /private/);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
});
test("hint endpoint returns a private demo receipt bound to the attempt", async () => {
  const question = questions.find(
    (item) => item.packageId === CURRENT_PACKAGE_ID,
  )!;
  const id = crypto.randomUUID();
  const hintResponse = await revealHint(
    post("/api/hints", { attemptId: id, questionId: question.id }),
  );
  const revealed = await hintResponse.json();
  assert.equal(hintResponse.status, 200);
  assert.equal(revealed.hint, question.hint);
  assert.equal(revealed.storage, "demo");
  assert.equal(typeof revealed.hintReceipt, "string");
  assert.match(hintResponse.headers.get("cache-control") || "", /no-store/);

  const attemptResponse = await submitAttempt(
    post("/api/attempts", {
      id,
      questionId: question.id,
      answer: question.answer,
      mode: "practice",
      reason: "",
      hintReceipt: revealed.hintReceipt,
    }),
  );
  const saved = await attemptResponse.json();
  assert.equal(saved.attempt.support_level, "hint");

  const switchedAttempt = await submitAttempt(
    post("/api/attempts", {
      id: crypto.randomUUID(),
      questionId: question.id,
      answer: question.answer,
      mode: "practice",
      reason: "",
      hintReceipt: revealed.hintReceipt,
    }),
  );
  assert.equal(
    (await switchedAttempt.json()).attempt.support_level,
    "independent",
  );
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
  const forgedSupport = await submitAttempt(
    post("/api/attempts", {
      ...body,
      id: crypto.randomUUID(),
      questionId: questions[0].id,
      supportLevel: "hint",
    }),
  );
  assert.equal(forgedSupport.status, 200);
  assert.equal((await forgedSupport.json()).attempt.support_level, "independent");
});
test("settings validate supported values and reflections reject blank input", async () => {
  const settingsResponse = await saveSettings(
    post("/api/settings", { ...defaultCourse, grade: "unknown" }),
  );
  assert.equal(settingsResponse.status, 400);
  assert.match(
    settingsResponse.headers.get("cache-control") || "",
    /no-store/,
  );
  const legacySettings = await saveSettings(
    post("/api/settings", {
      province: legacyCourse.province,
      textbook: legacyCourse.textbook,
      grade: legacyCourse.grade,
      semester: legacyCourse.semester,
      subject: legacyCourse.subject,
    }),
  );
  assert.equal(legacySettings.status, 200);
  assert.equal((await legacySettings.json()).course.revision, "旧版课程包");
  const reflectionResponse = await saveReflection(
    post("/api/reflections", {
      id: crypto.randomUUID(),
      body: " ",
      course_key: courseKey(defaultCourse),
    }),
  );
  assert.equal(reflectionResponse.status, 400);
  assert.match(
    reflectionResponse.headers.get("cache-control") || "",
    /no-store/,
  );
});
