import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { GradedQuestion } from "./question-types";

// Demo progress never leaves this browser. This receipt keeps the client API
// honest without requiring a database; cloud progress uses a server-recorded
// hint session instead.
export function createDemoHintReceipt(
  question: GradedQuestion,
  attemptId: string,
) {
  return createHash("sha256")
    .update(
      [
        "gogostudy-demo-hint-v1",
        attemptId,
        question.id,
        question.answer,
        question.explanation,
      ].join("\0"),
    )
    .digest("base64url");
}

export function hasValidDemoHintReceipt(
  question: GradedQuestion,
  attemptId: string,
  receipt: string | undefined,
) {
  if (!receipt) return false;
  const expected = Buffer.from(createDemoHintReceipt(question, attemptId));
  const actual = Buffer.from(receipt);
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}
