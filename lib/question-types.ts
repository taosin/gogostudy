import type { Question } from "./catalog";

export type GradedQuestion = Question & {
  answer: string;
  explanation: string;
  hint: string;
};

type QuestionDetails = Omit<Question, "id" | "topic" | "prompt" | "hint">;

export function defineQuestion(
  id: string,
  topic: string,
  prompt: string,
  answer: string,
  explanation: string,
  hint: string,
  extra: QuestionDetails,
): GradedQuestion {
  return {
    id,
    topic,
    prompt,
    answer,
    explanation,
    hint,
    ...extra,
  };
}
