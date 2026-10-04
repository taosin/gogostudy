import type { MathLesson } from "./math-curriculum";

export type SubjectId = "math" | "chinese" | "history" | "geography" | "english";
export type DiscoveryActivity =
  | { kind: "sequence"; instruction: string; items: { id: string; text: string; note?: string }[]; order: string[]; success: string }
  | { kind: "pairs"; instruction: string; pairs: { left: string; right: string; explanation: string }[] }
  | { kind: "sort"; instruction: string; categories: string[]; items: { text: string; category: number; explanation: string }[]; success: string }
  | { kind: "evidence"; instruction: string; passage: string; clues: { text: string; correct: boolean; explanation: string }[]; conclusion: string }
  | { kind: "map"; instruction: string; cells: string[]; start: number; target: number; success: string }
  | { kind: "listen"; instruction: string; lang: "en-GB" | "zh-CN"; items: { text: string; meaning: string; spoken?: string }[] };

export type LearningLesson = Omit<MathLesson, "activity"> & { activity: MathLesson["activity"] | DiscoveryActivity };
export type SubjectCurriculum = {
  id: SubjectId;
  title: string;
  tagline: string;
  description: string;
  stages: { id: string; title: string; subtitle: string }[];
  domains: { id: string; title: string; description: string; color: string }[];
  lessons: LearningLesson[];
  sources?: { title: string; url: string }[];
};

type LessonDraft = Omit<LearningLesson, "checks"> & {
  checks: [Omit<LearningLesson["checks"][number], "id">, Omit<LearningLesson["checks"][number], "id">];
};
export function defineLesson(draft: LessonDraft): LearningLesson {
  return { ...draft, checks: draft.checks.map((check, index) => ({ ...check, id: `${draft.id}-${index ? "transfer" : "understand"}` })) };
}
