import { test } from "node:test";
import assert from "node:assert/strict";
import { mathLessons, type MathLesson } from "../lib/math-curriculum";
import {
  LEARNING_STORAGE_KEY,
  emptyLearningProgress,
  getLessonReadiness,
  getRecommendedLesson,
  learningSteps,
  parseLearningProgress,
  recordLearningCheck,
  selectLesson,
  setLessonStep,
  type LearningProgress,
  type LearningStep,
} from "../lib/math-learning-progress";

const first = mathLessons[0];
const second = mathLessons[1];
const lessonsById = new Map(mathLessons.map((lesson) => [lesson.id, lesson]));

function completeLesson(progress: LearningProgress, lesson: MathLesson): LearningProgress {
  return lesson.checks.reduce((current, check) => recordLearningCheck(current, lesson.id, check.id, true), progress);
}

function completePrerequisites(progress: LearningProgress, lesson: MathLesson): LearningProgress {
  let current = progress;
  for (const id of lesson.prerequisites) {
    const prerequisite = lessonsById.get(id)!;
    current = completePrerequisites(current, prerequisite);
    current = completeLesson(current, prerequisite);
  }
  return current;
}

test("guided learning starts with independent, fresh per-lesson progress", () => {
  assert.equal(LEARNING_STORAGE_KEY, "gogostudy:math-learning:v1");
  const progress = emptyLearningProgress();
  const fresh = emptyLearningProgress();
  assert.equal(progress.version, 1);
  assert.equal(progress.activeLessonId, first.id);
  assert.deepEqual(progress.completedLessonIds, []);
  assert.deepEqual(progress.reviewLessonIds, []);
  for (const lesson of mathLessons) {
    assert.equal(progress.lessonSteps[lesson.id], "observe");
    assert.deepEqual(progress.passedCheckIds[lesson.id], []);
  }
  progress.passedCheckIds[first.id].push(first.checks[0].id);
  progress.lessonSteps[first.id] = "connect";
  assert.deepEqual(fresh.passedCheckIds[first.id], []);
  assert.equal(fresh.lessonSteps[first.id], "observe");
});

test("reading every lesson step cannot mark the lesson completed", () => {
  let progress = emptyLearningProgress();
  for (const step of learningSteps) progress = setLessonStep(progress, first.id, step);
  assert.equal(progress.lessonSteps[first.id], "connect");
  assert.deepEqual(progress.completedLessonIds, []);
  assert.deepEqual(progress.passedCheckIds[first.id], []);
});

test("both understanding and transfer checks must pass before completing a lesson", () => {
  let progress = recordLearningCheck(emptyLearningProgress(), first.id, first.checks[0].id, true);
  assert.deepEqual(progress.completedLessonIds, []);
  assert.deepEqual(progress.passedCheckIds[first.id], [first.checks[0].id]);
  progress = recordLearningCheck(progress, first.id, first.checks[1].id, true);
  assert.deepEqual(progress.completedLessonIds, [first.id]);
  assert.deepEqual(progress.reviewLessonIds, []);
  assert.equal(progress.lessonSteps[first.id], "observe");
});

test("wrong answers revoke that check and completion, then correction restores them", () => {
  const completed = completeLesson(emptyLearningProgress(), first);
  const wrong = recordLearningCheck(completed, first.id, first.checks[1].id, false);
  assert.deepEqual(wrong.completedLessonIds, []);
  assert.deepEqual(wrong.reviewLessonIds, [first.id]);
  assert.deepEqual(wrong.passedCheckIds[first.id], [first.checks[0].id]);
  const corrected = recordLearningCheck(wrong, first.id, first.checks[1].id, true);
  assert.deepEqual(corrected, completed);
});

test("review stays active until every check in that lesson has passed", () => {
  let progress = recordLearningCheck(emptyLearningProgress(), first.id, first.checks[0].id, false);
  progress = recordLearningCheck(progress, first.id, first.checks[0].id, true);
  assert.deepEqual(progress.reviewLessonIds, [first.id]);
  assert.deepEqual(progress.completedLessonIds, []);
  progress = recordLearningCheck(progress, first.id, first.checks[1].id, true);
  assert.deepEqual(progress.reviewLessonIds, []);
});

test("repeated answers remain unique and cannot pass a different lesson's check", () => {
  let progress = recordLearningCheck(emptyLearningProgress(), first.id, first.checks[0].id, true);
  progress = recordLearningCheck(progress, first.id, first.checks[0].id, true);
  assert.deepEqual(progress.passedCheckIds[first.id], [first.checks[0].id]);
  assert.strictEqual(recordLearningCheck(progress, first.id, second.checks[0].id, true), progress);
  progress = recordLearningCheck(progress, second.id, second.checks[0].id, false);
  progress = recordLearningCheck(progress, second.id, second.checks[0].id, false);
  assert.deepEqual(progress.reviewLessonIds, [second.id]);
  assert.deepEqual(progress.passedCheckIds[first.id], [first.checks[0].id]);
  assert.deepEqual(progress.passedCheckIds[second.id], []);
});

test("switching lessons preserves each lesson's reading position and checks", () => {
  let progress = setLessonStep(emptyLearningProgress(), first.id, "understand");
  progress = recordLearningCheck(progress, first.id, first.checks[0].id, true);
  progress = setLessonStep(progress, second.id, "explore");
  progress = selectLesson(progress, first.id);
  assert.equal(progress.activeLessonId, first.id);
  assert.equal(progress.lessonSteps[first.id], "understand");
  assert.equal(progress.lessonSteps[second.id], "explore");
  assert.deepEqual(progress.passedCheckIds[first.id], [first.checks[0].id]);
  assert.deepEqual(progress.completedLessonIds, []);
});

test("valid progress survives saving and refreshing", () => {
  let progress = completeLesson(emptyLearningProgress(), first);
  progress = setLessonStep(progress, first.id, "connect");
  progress = recordLearningCheck(progress, second.id, second.checks[1].id, false);
  progress = setLessonStep(progress, second.id, "check");
  assert.deepEqual(parseLearningProgress(JSON.stringify(progress)), progress);
});

test("malformed storage and unknown schema versions safely recover", () => {
  for (const raw of [null, "", "{", "null", "true", "42", '"progress"', "[]", "{}",
    JSON.stringify({ version: "1" }), JSON.stringify({ version: 2 }),
    JSON.stringify({ version: 1, activeLessonId: {}, lessonSteps: [], passedCheckIds: false, reviewLessonIds: {} }),
  ]) {
    assert.deepEqual(parseLearningProgress(raw), emptyLearningProgress());
  }
});

test("restoring progress filters unknown, duplicate, and misplaced IDs", () => {
  const progress = parseLearningProgress(JSON.stringify({
    version: 1,
    activeLessonId: "unknown",
    lessonSteps: { [first.id]: "understand", [second.id]: "teleport", unknown: "check" },
    passedCheckIds: {
      [first.id]: [first.checks[0].id, first.checks[0].id, second.checks[0].id, "unknown", null, 3],
      [second.id]: "not-an-array",
      unknown: [first.checks[1].id],
    },
    completedLessonIds: [first.id, second.id, "unknown"],
    reviewLessonIds: [second.id, second.id, "unknown", false],
  }));
  assert.equal(progress.activeLessonId, first.id);
  assert.equal(progress.lessonSteps[first.id], "understand");
  assert.equal(progress.lessonSteps[second.id], "observe");
  assert.ok(!("unknown" in progress.lessonSteps));
  assert.ok(!("unknown" in progress.passedCheckIds));
  assert.deepEqual(progress.passedCheckIds[first.id], [first.checks[0].id]);
  assert.deepEqual(progress.passedCheckIds[second.id], []);
  assert.deepEqual(progress.completedLessonIds, []);
  assert.deepEqual(progress.reviewLessonIds, [second.id]);
});

test("completion is derived from valid check evidence and clears stale review flags", () => {
  const progress = parseLearningProgress(JSON.stringify({
    version: 1,
    passedCheckIds: { [first.id]: first.checks.map((check) => check.id).reverse() },
    completedLessonIds: [],
    reviewLessonIds: [first.id],
  }));
  assert.deepEqual(progress.completedLessonIds, [first.id]);
  assert.deepEqual(progress.reviewLessonIds, []);
  assert.deepEqual(progress.passedCheckIds[first.id], first.checks.map((check) => check.id));
});

test("unknown lesson, check, and step IDs leave existing progress untouched", () => {
  const progress = emptyLearningProgress();
  assert.strictEqual(selectLesson(progress, "unknown"), progress);
  assert.strictEqual(setLessonStep(progress, "unknown", "check"), progress);
  assert.strictEqual(setLessonStep(progress, first.id, "invalid" as LearningStep), progress);
  assert.strictEqual(recordLearningCheck(progress, "unknown", first.checks[0].id, true), progress);
  assert.strictEqual(recordLearningCheck(progress, first.id, "unknown", true), progress);
  assert.deepEqual(getLessonReadiness(progress, "unknown"), { ready: false, missingPrerequisiteIds: [] });
});

test("progress functions work with frozen inputs without mutating nested state", () => {
  const progress = recordLearningCheck(emptyLearningProgress(), first.id, first.checks[0].id, true);
  Object.values(progress.passedCheckIds).forEach(Object.freeze);
  Object.freeze(progress.passedCheckIds);
  Object.freeze(progress.lessonSteps);
  Object.freeze(progress.completedLessonIds);
  Object.freeze(progress.reviewLessonIds);
  Object.freeze(progress);
  const original = JSON.stringify(progress);
  selectLesson(progress, second.id);
  setLessonStep(progress, first.id, "check");
  const completed = recordLearningCheck(progress, first.id, first.checks[1].id, true);
  assert.deepEqual(completed.completedLessonIds, [first.id]);
  assert.equal(JSON.stringify(progress), original);
});

test("higher lessons can be previewed and passed without silently completing their foundations", () => {
  const advanced = mathLessons.find((lesson) => lesson.prerequisites.length > 0)!;
  assert.ok(advanced);
  const preview = selectLesson(emptyLearningProgress(), advanced.id);
  assert.equal(preview.activeLessonId, advanced.id);
  assert.equal(getLessonReadiness(preview, advanced.id).ready, false);
  assert.deepEqual(preview.completedLessonIds, []);
  const passed = completeLesson(preview, advanced);
  assert.deepEqual(passed.completedLessonIds, [advanced.id]);
  const recommended = getRecommendedLesson(passed)!;
  assert.ok(recommended);
  assert.ok(!passed.completedLessonIds.includes(recommended.id));
  assert.equal(getLessonReadiness(passed, recommended.id).ready, true);
});

test("readiness includes missing ancestor foundations even when the immediate prerequisite passed", () => {
  const advanced = mathLessons.find((lesson) => lesson.prerequisites.some((id) => lessonsById.get(id)!.prerequisites.length > 0))!;
  assert.ok(advanced, "the curriculum has a multi-step learning path");
  let progress = emptyLearningProgress();
  for (const id of advanced.prerequisites) progress = completeLesson(progress, lessonsById.get(id)!);
  const readiness = getLessonReadiness(progress, advanced.id);
  assert.equal(readiness.ready, false);
  assert.ok(readiness.missingPrerequisiteIds.length > 0);
  assert.ok(readiness.missingPrerequisiteIds.every((id) => !progress.completedLessonIds.includes(id)));
  progress = completePrerequisites(progress, advanced);
  assert.deepEqual(getLessonReadiness(progress, advanced.id), { ready: true, missingPrerequisiteIds: [] });
});

test("a ready review lesson is recommended before other ready new lessons", () => {
  const fixture = mathLessons.map((lesson) => {
    const progress = completePrerequisites(emptyLearningProgress(), lesson);
    const earlierNew = mathLessons.slice(0, mathLessons.indexOf(lesson)).find((candidate) =>
      !progress.completedLessonIds.includes(candidate.id) && getLessonReadiness(progress, candidate.id).ready);
    return { lesson, progress, earlierNew };
  }).find(({ earlierNew }) => earlierNew);
  assert.ok(fixture, "independent branches allow a review and a new lesson to be ready together");
  const progress = recordLearningCheck(fixture.progress, fixture.lesson.id, fixture.lesson.checks[0].id, false);
  assert.equal(getRecommendedLesson(progress)?.id, fixture.lesson.id);
});

test("review returns to missing foundations without erasing dependent lesson evidence", () => {
  const advanced = mathLessons.find((lesson) => lesson.prerequisites.length > 0)!;
  const foundation = lessonsById.get(advanced.prerequisites[0])!;
  let progress = completePrerequisites(emptyLearningProgress(), advanced);
  progress = completeLesson(progress, advanced);
  progress = recordLearningCheck(progress, foundation.id, foundation.checks[0].id, false);
  assert.ok(progress.completedLessonIds.includes(advanced.id));
  assert.equal(getLessonReadiness(progress, advanced.id).ready, false);
  assert.equal(getRecommendedLesson(progress)?.id, foundation.id);
  progress = recordLearningCheck(progress, advanced.id, advanced.checks[0].id, false);
  assert.equal(getRecommendedLesson(progress)?.id, foundation.id);
});

test("the recommended route remains ready at every step and ends after all lessons pass", () => {
  let progress = emptyLearningProgress();
  const visited = new Set<string>();
  let lesson = getRecommendedLesson(progress);
  while (lesson) {
    assert.ok(!visited.has(lesson.id), "a completed lesson must not be recommended again");
    assert.equal(getLessonReadiness(progress, lesson.id).ready, true);
    visited.add(lesson.id);
    progress = completeLesson(progress, lesson);
    lesson = getRecommendedLesson(progress);
  }
  assert.equal(visited.size, mathLessons.length);
  assert.equal(progress.completedLessonIds.length, mathLessons.length);
  assert.equal(getRecommendedLesson(progress), null);
});

test("curriculum prerequisites exist, come earlier, and form an acyclic graph", () => {
  assert.equal(new Set(mathLessons.map((lesson) => lesson.id)).size, mathLessons.length);
  const positions = new Map(mathLessons.map((lesson, index) => [lesson.id, index]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string) => {
    assert.ok(!visiting.has(id), `cycle reaches ${id}`);
    if (visited.has(id)) return;
    const lesson = lessonsById.get(id);
    assert.ok(lesson, `unknown prerequisite ${id}`);
    assert.equal(new Set(lesson.prerequisites).size, lesson.prerequisites.length);
    visiting.add(id);
    for (const prerequisite of lesson.prerequisites) {
      assert.ok(positions.get(prerequisite)! < positions.get(id)!, `${prerequisite} must precede ${id}`);
      visit(prerequisite);
    }
    visiting.delete(id);
    visited.add(id);
  };
  mathLessons.forEach((lesson) => visit(lesson.id));
  assert.equal(visited.size, mathLessons.length);
});

test("every lesson supplies two distinct checks with globally unique stable IDs", () => {
  const checkIds = new Set<string>();
  for (const lesson of mathLessons) {
    assert.equal(lesson.checks.length, 2, `${lesson.id} needs understanding and transfer checks`);
    for (const check of lesson.checks) {
      assert.ok(check.id.trim());
      assert.ok(!checkIds.has(check.id), `${check.id} must be globally unique`);
      checkIds.add(check.id);
    }
  }
});
