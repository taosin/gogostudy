import { test } from "node:test";
import assert from "node:assert/strict";
import { loadQuestions } from "../lib/question-cache";

test("question catalog requests are deduplicated for the current session", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ questions: [] });
  };
  try {
    const course = `test-${crypto.randomUUID()}`;
    await Promise.all([loadQuestions(course), loadQuestions(course)]);
    await loadQuestions(course);
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a failed question request is evicted so the next action can retry", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return calls === 1
      ? Response.json({ error: "temporary" }, { status: 503 })
      : Response.json({ questions: [] });
  };
  try {
    const course = `retry-${crypto.randomUUID()}`;
    await assert.rejects(loadQuestions(course), /temporary/);
    await loadQuestions(course);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
