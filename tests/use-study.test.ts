import { test } from "node:test";
import assert from "node:assert/strict";
import { api, isSameAuthContext } from "../lib/use-study";

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
