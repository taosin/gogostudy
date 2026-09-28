import { test } from "node:test";
import assert from "node:assert/strict";
import {
  api,
  isSameAuthContext,
  normalizeStudyState,
} from "../lib/use-study";
import {
  CURRENT_PACKAGE_ID,
  LEGACY_PACKAGE_ID,
  courseKey,
  defaultCourse,
  legacyCourse,
} from "../lib/catalog";

test("auth request context changes when the user or generation changes", () => {
  const started = { userId: "parent-a", generation: 4 };
  assert.equal(isSameAuthContext(started, { ...started }), true);
  assert.equal(
    isSameAuthContext(started, { userId: "parent-b", generation: 4 }),
    false,
  );
  assert.equal(
    isSameAuthContext(started, { userId: "parent-a", generation: 5 }),
    false,
  );
});

test("legacy local and cloud state is normalized without joining new-course progress", () => {
  const state = normalizeStudyState({
    course: {
      province: "浙江省",
      textbook: "人教版",
      grade: "二年级",
      semester: "上册",
      subject: "数学",
    },
    attempts: [
      {
        id: "67a5ae5c-a147-4cad-90df-5c6ae53d9dd4",
        question_id: "add-1",
        course_key: "浙江省/人教版/二年级/上册/数学",
        answer: "45",
        correct: true,
        mode: "practice",
        reason: "",
        created_at: "2026-09-26T02:00:00.000Z",
        question: {
          id: "add-1",
          topic: "addition",
          prompt: "28 + 17 = ?",
          hint: "先加十位。",
        },
        expected: "45",
        explanation: "28 + 17 = 45。",
      },
    ],
    reflections: [
      {
        id: "bd0b7085-5747-4384-8ed5-741c43e0b310",
        body: "今天会进位加法了。",
        created_at: "2026-09-26T03:00:00.000Z",
        course_key: "浙江省/人教版/二年级/上册/数学",
      },
    ],
  });

  assert.equal(state.course.revision, "旧版课程包");
  assert.equal(state.attempts[0].package_id, LEGACY_PACKAGE_ID);
  assert.equal(state.attempts[0].support_level, "independent");
  assert.equal(state.attempts[0].course_key, courseKey(legacyCourse));
  assert.equal(state.attempts[0].question.packageId, LEGACY_PACKAGE_ID);
  assert.equal(state.reflections[0].course_key, courseKey(legacyCourse));
  assert.equal(
    normalizeStudyState({
      attempts: state.attempts,
      reflections: [],
    }).course.revision,
    "旧版课程包",
  );

  const currentAttempt = {
    ...state.attempts[0],
    id: "df9144fa-ff05-4ce4-ad24-188a59ce1382",
    package_id: CURRENT_PACKAGE_ID,
    course_key: courseKey(defaultCourse),
    created_at: "2026-09-27T02:00:00.000Z",
    question: {
      ...state.attempts[0].question,
      packageId: CURRENT_PACKAGE_ID,
    },
  };
  assert.equal(
    normalizeStudyState({
      attempts: [state.attempts[0], currentAttempt],
      reflections: [],
    }).course.revision,
    "2025课程包",
  );
  assert.equal(
    normalizeStudyState({
      attempts: [{ ...currentAttempt, package_id: "unknown-package" }],
      reflections: [],
    }).course.revision,
    "旧版课程包",
  );
});

test("API requests honor timeouts and caller cancellation", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      const rejectAbort = () =>
        reject(new DOMException("The request was aborted", "AbortError"));
      if (signal?.aborted) rejectAbort();
      else signal?.addEventListener("abort", rejectAbort, { once: true });
    })) as typeof fetch;

  try {
    await assert.rejects(
      api("/api/state", undefined, { timeoutMs: 5 }),
      /请求超时/,
    );

    const controller = new AbortController();
    const pending = api("/api/state", undefined, {
      signal: controller.signal,
      timeoutMs: 1_000,
    });
    controller.abort();
    await assert.rejects(pending, /请求已取消/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined)
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});
