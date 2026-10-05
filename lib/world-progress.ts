import { getWorldDestination, getWorldPlace, getWorldQuestion, getWorldTrail, worldDestinations, worldQuestions, type WorldPlaceId } from "./world-content";
import { learningStorageKey } from "./learning-progress";
import { learningSubjects } from "./learning-subjects";
import { worldLessonIndex } from "./world-lesson-index";
import type { SubjectId } from "./learning-types";

export const WORLD_STORAGE_KEY = "gogostudy:world:v1";
export const WORLD_PROGRESS_EVENT = "gogostudy:world-progress";
export type WorldProgress = {
  version: 1;
  selectedPlaceId: WorldPlaceId;
  lastDestinationId: string | null;
  activeTrailId: string | null;
  lastTrailDestinationId: string | null;
  visitedDestinationIds: string[];
  savedQuestionIds: string[];
};

export function emptyWorldProgress(): WorldProgress {
  return { version: 1, selectedPlaceId: "universe", lastDestinationId: null, activeTrailId: null, lastTrailDestinationId: null, visitedDestinationIds: [], savedQuestionIds: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function knownIds(value: unknown, allowed: Set<string>): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && allowed.has(id)))] : [];
}
const destinationIds = new Set(worldDestinations.map((item) => item.id));
const questionIds = new Set(worldQuestions.map((item) => item.id));

export function normalizeWorldProgress(value: unknown): WorldProgress {
  if (!isRecord(value) || value.version !== 1) return emptyWorldProgress();
  const place = typeof value.selectedPlaceId === "string" ? getWorldPlace(value.selectedPlaceId) : undefined;
  const last = typeof value.lastDestinationId === "string" ? getWorldDestination(value.lastDestinationId) : undefined;
  const trail = typeof value.activeTrailId === "string" ? getWorldTrail(value.activeTrailId) : undefined;
  return {
    version: 1,
    selectedPlaceId: place?.id ?? "universe",
    lastDestinationId: last?.id ?? null,
    activeTrailId: trail?.id ?? null,
    lastTrailDestinationId: trail?.stops.find((stop) => stop.destinationId === value.lastTrailDestinationId)?.destinationId ?? null,
    visitedDestinationIds: knownIds(value.visitedDestinationIds, destinationIds),
    savedQuestionIds: knownIds(value.savedQuestionIds, questionIds),
  };
}

export function parseWorldProgress(raw: string | null): WorldProgress {
  if (!raw) return emptyWorldProgress();
  try { return normalizeWorldProgress(JSON.parse(raw)); }
  catch { return emptyWorldProgress(); }
}

export function selectWorldPlace(progress: WorldProgress, placeId: string): WorldProgress {
  const place = getWorldPlace(placeId);
  return place ? { ...normalizeWorldProgress(progress), selectedPlaceId: place.id } : progress;
}

// A chosen route is a travel preference, never proof that a lesson was learned.
export function beginWorldTrail(progress: WorldProgress, trailId: string): WorldProgress {
  const trail = getWorldTrail(trailId);
  if (!trail) return progress;
  const current = normalizeWorldProgress(progress);
  return { ...current, activeTrailId: trail.id, lastTrailDestinationId: current.activeTrailId === trail.id ? current.lastTrailDestinationId : null };
}

export function leaveWorldTrail(progress: WorldProgress): WorldProgress {
  return { ...normalizeWorldProgress(progress), activeTrailId: null, lastTrailDestinationId: null };
}

export function visitWorldDestination(progress: WorldProgress, destinationId: string): WorldProgress {
  const destination = getWorldDestination(destinationId);
  if (!destination) return progress;
  const current = normalizeWorldProgress(progress);
  const isTrailStop = getWorldTrail(current.activeTrailId)?.stops.some((stop) => stop.destinationId === destination.id);
  return {
    ...current,
    selectedPlaceId: destination.placeId,
    lastDestinationId: destination.id,
    // Looking back at a prerequisite must not move the route past the lesson we left.
    lastTrailDestinationId: isTrailStop ? destination.id : current.lastTrailDestinationId,
    visitedDestinationIds: [...new Set([...current.visitedDestinationIds, destination.id])],
  };
}

export function toggleWorldQuestion(progress: WorldProgress, questionId: string): WorldProgress {
  if (!getWorldQuestion(questionId)) return progress;
  const current = normalizeWorldProgress(progress);
  const saved = new Set(current.savedQuestionIds);
  if (saved.has(questionId)) saved.delete(questionId);
  else saved.add(questionId);
  return { ...current, savedQuestionIds: [...saved] };
}

export type WorldLessonEvidence = { destinationId: string; lessonId: string; subjectId: SubjectId; title: string; passedChecks: number; totalChecks: number };
export type WorldLearningEvidence = { completedLessons: WorldLessonEvidence[]; reviewLessons: WorldLessonEvidence[]; passedChecks: number; storageError: boolean };

// Read existing per-subject evidence without changing any score or progress key.
// Stored completion flags are intentionally ignored, just as in the learning engine.
export function readWorldLearningEvidence(readItem: (key: string) => string | null): WorldLearningEvidence {
  const result: WorldLearningEvidence = { completedLessons: [], reviewLessons: [], passedChecks: 0, storageError: false };
  for (const subject of learningSubjects) {
    let value: unknown;
    try {
      const raw = readItem(learningStorageKey(subject.id));
      value = raw ? JSON.parse(raw) : null;
    } catch { result.storageError = true; continue; }
    if (!isRecord(value) || value.version !== 1) continue;
    const checks = isRecord(value.passedCheckIds) ? value.passedCheckIds : {};
    const reviews = new Set(Array.isArray(value.reviewLessonIds) ? value.reviewLessonIds : []);
    for (const lesson of worldLessonIndex.filter((item) => item.subjectId === subject.id)) {
      const stored = checks[lesson.id];
      const passed = new Set(Array.isArray(stored) ? stored : []);
      const count = lesson.checkIds.filter((id) => passed.has(id)).length;
      const evidence = { destinationId: `${subject.id}:${lesson.id}`, lessonId: lesson.id, subjectId: subject.id, title: lesson.title, passedChecks: count, totalChecks: lesson.checkIds.length };
      result.passedChecks += count;
      if (lesson.checkIds.length > 0 && count === lesson.checkIds.length) result.completedLessons.push(evidence);
      else if (reviews.has(lesson.id)) result.reviewLessons.push(evidence);
    }
  }
  return result;
}
