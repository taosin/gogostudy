import { mathLessons, type MathLesson } from "./math-curriculum";

// Guided lessons have their own browser progress, separate from practice scores.
export const LEARNING_STORAGE_KEY = "gogostudy:math-learning:v1";
export const learningSteps = ["observe", "explore", "understand", "check", "connect"] as const;
export type LearningStep = typeof learningSteps[number];

export type LearningProgress = {
  version: 1;
  activeLessonId: string;
  lessonSteps: Record<string, LearningStep>;
  passedCheckIds: Record<string, string[]>;
  reviewLessonIds: string[];
  completedLessonIds: string[];
};

export type LessonReadiness = {
  ready: boolean;
  missingPrerequisiteIds: string[];
};

const lessonsById = new Map(mathLessons.map((lesson) => [lesson.id, lesson]));
const stepIds = new Set<string>(learningSteps);

export function emptyLearningProgress(): LearningProgress {
  return {
    version: 1,
    activeLessonId: mathLessons[0].id,
    lessonSteps: Object.fromEntries(mathLessons.map((lesson) => [lesson.id, "observe"])),
    passedCheckIds: Object.fromEntries(mathLessons.map((lesson) => [lesson.id, []])),
    reviewLessonIds: [],
    completedLessonIds: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeProgress(value: unknown): LearningProgress {
  if (!isRecord(value) || value.version !== 1) return emptyLearningProgress();

  const progress = emptyLearningProgress();
  if (typeof value.activeLessonId === "string" && lessonsById.has(value.activeLessonId)) {
    progress.activeLessonId = value.activeLessonId;
  }
  const storedSteps = isRecord(value.lessonSteps) ? value.lessonSteps : {};
  const storedChecks = isRecord(value.passedCheckIds) ? value.passedCheckIds : {};
  const reviewIds = new Set(Array.isArray(value.reviewLessonIds) ? value.reviewLessonIds : []);

  for (const lesson of mathLessons) {
    const step = storedSteps[lesson.id];
    if (typeof step === "string" && stepIds.has(step)) {
      progress.lessonSteps[lesson.id] = step as LearningStep;
    }
    const checks = storedChecks[lesson.id];
    const passed = new Set(Array.isArray(checks) ? checks : []);
    progress.passedCheckIds[lesson.id] = lesson.checks
      .filter((check) => passed.has(check.id))
      .map((check) => check.id);

    // Completion is derived from check evidence, never from a saved status flag.
    if (lesson.checks.length > 0 && lesson.checks.every((check) => passed.has(check.id))) {
      progress.completedLessonIds.push(lesson.id);
    } else if (reviewIds.has(lesson.id)) {
      progress.reviewLessonIds.push(lesson.id);
    }
  }
  return progress;
}

export function parseLearningProgress(raw: string | null): LearningProgress {
  if (!raw) return emptyLearningProgress();
  try {
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return emptyLearningProgress();
  }
}

export function selectLesson(progress: LearningProgress, lessonId: string): LearningProgress {
  if (!lessonsById.has(lessonId)) return progress;
  return { ...normalizeProgress(progress), activeLessonId: lessonId };
}

export function setLessonStep(
  progress: LearningProgress,
  lessonId: string,
  step: LearningStep,
): LearningProgress {
  if (!lessonsById.has(lessonId) || !stepIds.has(step)) return progress;
  const current = normalizeProgress(progress);
  return {
    ...current,
    activeLessonId: lessonId,
    lessonSteps: { ...current.lessonSteps, [lessonId]: step },
  };
}

export function recordLearningCheck(
  progress: LearningProgress,
  lessonId: string,
  checkId: string,
  correct: boolean,
): LearningProgress {
  const lesson = lessonsById.get(lessonId);
  if (!lesson || !lesson.checks.some((check) => check.id === checkId)) return progress;
  const current = normalizeProgress(progress);
  const passed = new Set(current.passedCheckIds[lessonId]);
  if (correct) passed.add(checkId);
  else passed.delete(checkId);

  const reviews = new Set(current.reviewLessonIds);
  if (!correct) reviews.add(lessonId);
  return normalizeProgress({
    ...current,
    activeLessonId: lessonId,
    passedCheckIds: { ...current.passedCheckIds, [lessonId]: [...passed] },
    reviewLessonIds: [...reviews],
  });
}

function readinessFor(completed: Set<string>, lessonId: string): LessonReadiness {
  const lesson = lessonsById.get(lessonId);
  if (!lesson) return { ready: false, missingPrerequisiteIds: [] };
  const prerequisiteIds = new Set<string>();
  const visit = (id: string) => {
    if (prerequisiteIds.has(id)) return;
    prerequisiteIds.add(id);
    lessonsById.get(id)?.prerequisites.forEach(visit);
  };
  lesson.prerequisites.forEach(visit);
  const missingPrerequisiteIds = mathLessons
    .filter((candidate) => prerequisiteIds.has(candidate.id) && !completed.has(candidate.id))
    .map((candidate) => candidate.id);
  return { ready: missingPrerequisiteIds.length === 0, missingPrerequisiteIds };
}

export function getLessonReadiness(progress: LearningProgress, lessonId: string): LessonReadiness {
  return readinessFor(new Set(normalizeProgress(progress).completedLessonIds), lessonId);
}

export function getRecommendedLesson(progress: LearningProgress): MathLesson | null {
  const current = normalizeProgress(progress);
  const completed = new Set(current.completedLessonIds);
  const reviews = new Set(current.reviewLessonIds);
  const ready = (lesson: MathLesson) => readinessFor(completed, lesson.id).ready;
  return mathLessons.find((lesson) => reviews.has(lesson.id) && ready(lesson))
    ?? mathLessons.find((lesson) => !completed.has(lesson.id) && ready(lesson))
    ?? null;
}
