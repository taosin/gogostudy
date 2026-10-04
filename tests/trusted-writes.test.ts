import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  atomicAttemptErrorResponse,
  attemptModeIssue,
  deriveWorkflowState,
  loadAttemptContext,
  type WorkflowAttempt,
} from "../app/api/attempts/route";
import {
  apiError,
  secretClient,
  serverWriteConfigured,
} from "../lib/supabase/server";
import { hintSessionErrorResponse } from "../app/api/hints/route";

const baseTime = "2026-09-20T02:00:00.000Z";

function workflowAttempt(
  id: string,
  overrides: Partial<WorkflowAttempt> = {},
): WorkflowAttempt {
  return {
    id,
    correct: false,
    mode: "practice",
    support_level: "independent",
    created_at: baseTime,
    ...overrides,
  };
}

test("server write client fails closed with an explicit 503", async () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalPublishable =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const originalSecret = process.env.SUPABASE_SECRET_KEY;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    delete process.env.SUPABASE_SECRET_KEY;
    assert.equal(serverWriteConfigured(), false);
    let caught: unknown;
    assert.throws(
      () => secretClient(),
      (error) => {
        caught = error;
        return /SERVER_WRITE_UNAVAILABLE/.test(String(error));
      },
    );
    const originalConsoleError = console.error;
    console.error = () => undefined;
    try {
      const response = apiError(caught);
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /云端保存尚未配置完成/);
    } finally {
      console.error = originalConsoleError;
    }
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalPublishable === undefined)
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalPublishable;
    if (originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = originalSecret;
  }
});

test("anonymous Supabase identities are rejected with an explicit 403", async () => {
  const originalConsoleError = console.error;
  console.error = () => undefined;
  try {
    const response = apiError(new Error("ANONYMOUS_NOT_ALLOWED"));
    assert.equal(response.status, 403);
    assert.match((await response.json()).error, /匿名账户不能保存/);
  } finally {
    console.error = originalConsoleError;
  }
});

test("idempotent retry is resolved before workflow history is loaded", async () => {
  const calls: string[] = [];
  const existing = { id: "same-request" };
  const context = await loadAttemptContext(
    async () => {
      calls.push("existing");
      return existing;
    },
    async () => {
      calls.push("history");
      return [workflowAttempt("wrong")];
    },
  );
  assert.deepEqual(calls, ["existing"]);
  assert.deepEqual(context, { kind: "existing", attempt: existing });
});

test("new attempt loads workflow history after the idempotency miss", async () => {
  const calls: string[] = [];
  const history = [workflowAttempt("wrong")];
  const context = await loadAttemptContext(
    async () => {
      calls.push("existing");
      return null;
    },
    async () => {
      calls.push("history");
      return history;
    },
  );
  assert.deepEqual(calls, ["existing", "history"]);
  assert.deepEqual(context, { kind: "history", history });
});

test("correction is accepted only while a mistake is pending", () => {
  assert.equal(attemptModeIssue("correction", []), "CORRECTION_NOT_PENDING");
  const pending = [workflowAttempt("wrong")];
  assert.equal(attemptModeIssue("correction", pending), null);

  const corrected = [
    ...pending,
    workflowAttempt("corrected", {
      correct: true,
      mode: "correction",
      created_at: "2026-09-20T03:00:00.000Z",
    }),
  ];
  assert.equal(
    attemptModeIssue("correction", corrected),
    "CORRECTION_NOT_PENDING",
  );
});

test("hint-assisted correction does not start interval review", () => {
  const history = [
    workflowAttempt("wrong"),
    workflowAttempt("hinted", {
      correct: true,
      mode: "correction",
      support_level: "hint",
      created_at: "2026-09-20T03:00:00.000Z",
    }),
  ];
  assert.equal(deriveWorkflowState(history).status, "pending");
  assert.equal(attemptModeIssue("correction", history), null);
  assert.equal(
    attemptModeIssue("review", history, "2026-09-30T00:00:00.000Z"),
    "REVIEW_NOT_DUE",
  );
});

test("a first-try correct answer with a hint enters pending correction", () => {
  const state = deriveWorkflowState([
    workflowAttempt("hinted-first-try", {
      correct: true,
      mode: "practice",
      support_level: "hint",
    }),
  ]);
  assert.equal(state.status, "pending");
  assert.equal(state.dueAt, null);
  assert.equal(state.reviewStep, 0);
});

test("a supported due review resets the workflow to pending", () => {
  const state = deriveWorkflowState([
    workflowAttempt("wrong"),
    workflowAttempt("corrected", {
      correct: true,
      mode: "correction",
      created_at: "2026-09-20T03:00:00.000Z",
    }),
    workflowAttempt("guided-review", {
      correct: true,
      mode: "review",
      support_level: "guided",
      created_at: "2026-09-21T03:00:00.000Z",
    }),
  ]);
  assert.equal(state.status, "pending");
  assert.equal(state.dueAt, null);
  assert.equal(state.reviewStep, 0);
});

test("review is accepted only on its due China calendar day", () => {
  const history = [
    workflowAttempt("wrong"),
    workflowAttempt("corrected", {
      correct: true,
      mode: "correction",
      created_at: "2026-09-20T15:30:00.000Z",
    }),
  ];
  assert.equal(
    attemptModeIssue("review", history, "2026-09-20T15:59:59.000Z"),
    "REVIEW_NOT_DUE",
  );
  assert.equal(
    attemptModeIssue("review", history, "2026-09-20T16:00:00.000Z"),
    null,
  );
});

test("practice remains available without advancing a pending workflow", () => {
  const pending = [workflowAttempt("wrong")];
  assert.equal(attemptModeIssue("practice", []), null);
  assert.equal(attemptModeIssue("practice", pending), null);
  assert.equal(deriveWorkflowState(pending).status, "pending");
});

test("workflow ordering is deterministic when timestamps are equal", () => {
  const state = deriveWorkflowState([
    workflowAttempt("b-correction", {
      correct: true,
      mode: "correction",
    }),
    workflowAttempt("a-wrong"),
  ]);
  assert.equal(state.status, "review");
  assert.equal(state.dueAt, "2026-09-21T02:00:00.000Z");
});

test("atomic write conflicts are returned as private 409 responses", async () => {
  const idempotency = atomicAttemptErrorResponse({
    message: "IDEMPOTENCY_CONFLICT",
  });
  assert.ok(idempotency);
  assert.equal(idempotency.status, 409);
  assert.match((await idempotency.json()).error, /提交编号/);

  const stale = atomicAttemptErrorResponse(new Error("WORKFLOW_STALE"));
  assert.ok(stale);
  assert.equal(stale.status, 409);
  assert.match((await stale.json()).error, /其他页面更新/);
});

test("hint session quota and ID conflicts use actionable responses", async () => {
  const limited = hintSessionErrorResponse({ message: "HINT_RATE_LIMIT" });
  assert.ok(limited);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "60");

  const conflict = hintSessionErrorResponse({ message: "HINT_ID_CONFLICT" });
  assert.ok(conflict);
  assert.equal(conflict.status, 409);
});

test("atomic attempt migration locks workflows and restricts RPC execution", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261004131547_atomic_attempt_writes.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /p_workflow_version/);
  assert.match(sql, /IDEMPOTENCY_CONFLICT/);
  assert.match(sql, /support_level <> 'independent'/);
  assert.match(sql, /primary key \(user_id, attempt_id\)/);
  assert.match(sql, /v_mode = 'practice' and v_status = 'pending'/);
  assert.match(sql, /record_hint_session/);
  assert.match(sql, /'hint-user:' \|\| p_user_id::text/);
  assert.match(sql, /v_active_count >= 50/);
  assert.match(sql, /hint_sessions_expires_at/);
  assert.match(
    sql,
    /from public\.hint_sessions[\s\S]*user_id = p_user_id[\s\S]*attempt_id = v_attempt_id[\s\S]*question_id = v_question_id/,
  );
  assert.match(
    sql,
    /revoke execute on function public\.record_hint_session\(uuid, uuid, text\)[\s\S]*from public, anon, authenticated/,
  );
  assert.match(
    sql,
    /grant execute on function public\.record_hint_session\(uuid, uuid, text\)[\s\S]*to service_role/,
  );
  assert.match(
    sql,
    /revoke execute on function public\.record_attempt\(uuid, jsonb, uuid\)[\s\S]*from public, anon, authenticated/,
  );
  assert.match(
    sql,
    /grant execute on function public\.record_attempt\(uuid, jsonb, uuid\)[\s\S]*to service_role/,
  );
});
