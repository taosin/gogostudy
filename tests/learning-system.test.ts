import { test } from "node:test";
import assert from "node:assert/strict";
import { getSubjectCurriculum } from "../lib/curricula";
import { mathLessons } from "../lib/math-curriculum";
import { learningSubjects } from "../lib/learning-subjects";
import {
  createLearningEngine,
  learningStorageKey,
  type LearningEngine,
  type LearningProgress,
  type ProgressLesson,
} from "../lib/learning-progress";
import type { SubjectId } from "../lib/learning-types";

const subjectIds: SubjectId[] = ["math", "chinese", "history", "geography", "english"];
const previewLessons = [
  { id: "first", title: "第一课", prerequisites: [], checks: [{ id: "first-understand" }, { id: "first-transfer" }] },
  { id: "next", title: "下一课", prerequisites: ["first"], checks: [{ id: "next-understand" }, { id: "next-transfer" }] },
] as const;

function completeLesson<T extends ProgressLesson>(engine: LearningEngine<T>, progress: LearningProgress, lesson: T) {
  return lesson.checks.reduce((current, check) => engine.recordLearningCheck(current, lesson.id, check.id, true), progress);
}

test("all five subjects have different storage keys and mathematics retains its existing key", () => {
  assert.deepEqual(learningSubjects.map((subject) => subject.id).sort(), [...subjectIds].sort());
  assert.equal(learningStorageKey("math"), "gogostudy:math-learning:v1");
  const keys = subjectIds.map(learningStorageKey);
  assert.equal(new Set(keys).size, subjectIds.length);
  for (const key of keys) assert.ok(!["gogostudy:geometry:v1", "gogostudy:v1"].includes(key));
});

test("the engine accepts readonly lesson summaries and preserves their extra fields", () => {
  const engine = createLearningEngine(previewLessons);
  const progress = engine.emptyLearningProgress();
  const recommended = engine.getRecommendedLesson(progress);
  assert.equal(recommended?.title, "第一课");
  const completed = completeLesson(engine, progress, previewLessons[0]);
  assert.equal(engine.getRecommendedLesson(completed)?.title, "下一课");
  assert.deepEqual(progress.completedLessonIds, []);
});

test("a lightweight overview interprets stored progress exactly like the full curriculum", () => {
  const full = createLearningEngine(mathLessons);
  const summary = createLearningEngine(mathLessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    prerequisites: lesson.prerequisites,
    checks: lesson.checks.map((check) => ({ id: check.id })),
  })));
  let progress = completeLesson(full, full.emptyLearningProgress(), mathLessons[0]);
  progress = full.setLessonStep(progress, mathLessons[0].id, "connect");
  progress = full.recordLearningCheck(progress, mathLessons[1].id, mathLessons[1].checks[0].id, false);
  progress = full.setLessonStep(progress, mathLessons[1].id, "check");
  const raw = JSON.stringify(progress);
  assert.deepEqual(summary.parseLearningProgress(raw), full.parseLearningProgress(raw));
  assert.equal(summary.getRecommendedLesson(progress)?.title, full.getRecommendedLesson(progress)?.title);
  for (const lesson of mathLessons) {
    assert.deepEqual(summary.getLessonReadiness(progress, lesson.id), full.getLessonReadiness(progress, lesson.id));
  }
});

test("independent engines reject another subject's lessons and completion evidence", () => {
  const left = createLearningEngine(previewLessons);
  const rightLessons = previewLessons.map((lesson) => ({
    ...lesson,
    id: `other-${lesson.id}`,
    prerequisites: lesson.prerequisites.map((id) => `other-${id}`),
    checks: lesson.checks.map((check) => ({ id: `other-${check.id}` })),
  }));
  const right = createLearningEngine(rightLessons);
  const leftCompleted = completeLesson(left, left.emptyLearningProgress(), previewLessons[0]);
  assert.deepEqual(right.parseLearningProgress(JSON.stringify(leftCompleted)), right.emptyLearningProgress());
  const rightInitial = right.emptyLearningProgress();
  assert.strictEqual(right.selectLesson(rightInitial, previewLessons[0].id), rightInitial);
  assert.strictEqual(right.recordLearningCheck(rightInitial, previewLessons[0].id, previewLessons[0].checks[0].id, true), rightInitial);
  const rightCompleted = completeLesson(right, rightInitial, rightLessons[0]);
  assert.deepEqual(left.parseLearningProgress(JSON.stringify(rightCompleted)), left.emptyLearningProgress());
  assert.deepEqual(leftCompleted.completedLessonIds, [previewLessons[0].id]);
});

test("matching lesson names cannot import check evidence from different check IDs", () => {
  const original = createLearningEngine(previewLessons);
  const changed = createLearningEngine(previewLessons.map((lesson) => ({
    ...lesson,
    checks: lesson.checks.map((check) => ({ id: `new-${check.id}` })),
  })));
  const completed = completeLesson(original, original.emptyLearningProgress(), previewLessons[0]);
  const restored = changed.parseLearningProgress(JSON.stringify(completed));
  assert.deepEqual(restored.completedLessonIds, []);
  assert.deepEqual(restored.passedCheckIds[previewLessons[0].id], []);
  assert.strictEqual(changed.recordLearningCheck(restored, previewLessons[0].id, previewLessons[0].checks[0].id, true), restored);
});

test("damaged data cannot forge completion in the shared engine", () => {
  const engine = createLearningEngine(previewLessons);
  for (const raw of [null, "{", "null", "[]", "{}", JSON.stringify({ version: 2 })]) {
    assert.deepEqual(engine.parseLearningProgress(raw), engine.emptyLearningProgress());
  }
  const restored = engine.parseLearningProgress(JSON.stringify({
    version: 1,
    activeLessonId: "unknown",
    completedLessonIds: ["first", "next"],
    reviewLessonIds: ["first", "first", "unknown"],
    lessonSteps: { first: "connect", next: "invalid", unknown: "check" },
    passedCheckIds: { first: ["first-understand", "first-understand", "next-transfer", null], next: {} },
  }));
  assert.deepEqual(restored.completedLessonIds, []);
  assert.deepEqual(restored.reviewLessonIds, ["first"]);
  assert.equal(restored.activeLessonId, "first");
  assert.equal(restored.lessonSteps.first, "connect");
  assert.equal(restored.lessonSteps.next, "observe");
  assert.deepEqual(restored.passedCheckIds.first, ["first-understand"]);
  assert.deepEqual(restored.passedCheckIds.next, []);
});

test("a missing foundation or dependency cycle never appears ready to learn", () => {
  const missing = createLearningEngine([{ id: "lesson", prerequisites: ["missing"], checks: [{ id: "check" }] }]);
  assert.deepEqual(missing.getLessonReadiness(missing.emptyLearningProgress(), "lesson"), { ready: false, missingPrerequisiteIds: ["missing"] });
  assert.equal(missing.getRecommendedLesson(missing.emptyLearningProgress()), null);
  const cyclic = createLearningEngine([
    { id: "one", prerequisites: ["two"], checks: [{ id: "one-check" }] },
    { id: "two", prerequisites: ["one"], checks: [{ id: "two-check" }] },
  ]);
  assert.equal(cyclic.getRecommendedLesson(cyclic.emptyLearningProgress()), null);
  assert.equal(cyclic.getLessonReadiness(cyclic.emptyLearningProgress(), "one").ready, false);
});

test("an empty curriculum has no recommendation and empty checks cannot imply completion", () => {
  const empty = createLearningEngine([]);
  assert.equal(empty.getRecommendedLesson(empty.emptyLearningProgress()), null);
  assert.deepEqual(empty.parseLearningProgress(JSON.stringify({ version: 1, activeLessonId: "old", completedLessonIds: ["old"] })), empty.emptyLearningProgress());
  const draft = createLearningEngine([{ id: "draft", prerequisites: [], checks: [] }]);
  const progress = draft.setLessonStep(draft.emptyLearningProgress(), "draft", "connect");
  assert.deepEqual(progress.completedLessonIds, []);
});

for (const subjectId of subjectIds) {
  test(`${subjectId}: every lesson has valid foundations and the graph has no cycles`, async () => {
    const curriculum = await getSubjectCurriculum(subjectId);
    const { lessons, stages, domains } = curriculum;
    assert.equal(curriculum.id, subjectId);
    assert.ok(lessons.length >= 12);
    assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
    assert.equal(new Set(stages.map((stage) => stage.id)).size, stages.length);
    assert.equal(new Set(domains.map((domain) => domain.id)).size, domains.length);
    const positions = new Map(lessons.map((lesson, index) => [lesson.id, index]));
    const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const visit = (id: string) => {
      assert.ok(!visiting.has(id), `${subjectId}: a cycle reaches ${id}`);
      if (visited.has(id)) return;
      const lesson = byId.get(id);
      assert.ok(lesson, `${subjectId}: unknown foundation ${id}`);
      assert.equal(new Set(lesson.prerequisites).size, lesson.prerequisites.length);
      assert.ok(stages.some((stage) => stage.id === lesson.stageId), `${id} needs a known stage`);
      assert.ok(domains.some((domain) => domain.id === lesson.domainId), `${id} needs a known domain`);
      visiting.add(id);
      for (const prerequisite of lesson.prerequisites) {
        assert.ok(byId.has(prerequisite), `${id} refers to missing ${prerequisite}`);
        assert.ok(positions.get(prerequisite)! < positions.get(id)!, `${prerequisite} must precede ${id}`);
        visit(prerequisite);
      }
      visiting.delete(id);
      visited.add(id);
    };
    lessons.forEach((lesson) => visit(lesson.id));
    assert.equal(visited.size, lessons.length);
    assert.deepEqual(lessons[0].prerequisites, []);
  });

  test(`${subjectId}: every lesson can be reached through ready recommendations and correct answers`, async () => {
    const { lessons } = await getSubjectCurriculum(subjectId);
    const engine = createLearningEngine(lessons);
    let progress = engine.emptyLearningProgress();
    const visited = new Set<string>();
    let lesson = engine.getRecommendedLesson(progress);
    while (lesson) {
      assert.ok(!visited.has(lesson.id), `${lesson.id} was recommended twice`);
      assert.equal(engine.getLessonReadiness(progress, lesson.id).ready, true);
      visited.add(lesson.id);
      progress = engine.setLessonStep(progress, lesson.id, "check");
      progress = engine.recordLearningCheck(progress, lesson.id, lesson.checks[0].id, false);
      assert.ok(progress.reviewLessonIds.includes(lesson.id));
      assert.ok(!progress.completedLessonIds.includes(lesson.id));
      progress = completeLesson(engine, progress, lesson);
      assert.ok(!progress.reviewLessonIds.includes(lesson.id));
      assert.ok(progress.completedLessonIds.includes(lesson.id));
      assert.deepEqual(engine.parseLearningProgress(JSON.stringify(progress)), progress);
      lesson = engine.getRecommendedLesson(progress);
    }
    assert.equal(visited.size, lessons.length);
    assert.equal(progress.completedLessonIds.length, lessons.length);
    assert.equal(engine.getRecommendedLesson(progress), null);
  });

  test(`${subjectId}: every lesson has teaching content and two well-formed checks`, async () => {
    const { lessons } = await getSubjectCurriculum(subjectId);
    const ids = new Set<string>();
    for (const lesson of lessons) {
      for (const field of ["title", "goal", "why", "takeaway"] as const) {
        assert.ok(lesson[field].trim(), `${lesson.id} needs ${field}`);
      }
      assert.ok(lesson.story.title.trim());
      assert.ok(lesson.story.text.trim());
      assert.ok(lesson.explanation.length > 0);
      assert.ok(lesson.explanation.every((line) => line.trim()));
      assert.equal(lesson.checks.length, 2, `${lesson.id} needs an understanding and transfer check`);
      for (const check of lesson.checks) {
        assert.ok(check.id.trim());
        assert.ok(!ids.has(check.id), `${check.id} must be unique`);
        ids.add(check.id);
        assert.ok(check.prompt.trim());
        assert.ok(check.explanation.trim());
        assert.ok(check.options.length >= 2);
        assert.ok(check.options.every((option) => option.trim()));
        assert.equal(new Set(check.options).size, check.options.length);
        assert.ok(Number.isInteger(check.answer) && check.answer >= 0 && check.answer < check.options.length);
      }
    }
  });

  test(`${subjectId}: discovery activities have complete and valid interactive data`, async () => {
    const { lessons } = await getSubjectCurriculum(subjectId);
    for (const lesson of lessons) {
      const activity = lesson.activity;
      assert.ok(activity.instruction.trim());
      switch (activity.kind) {
        case "sequence": {
          const ids = activity.items.map((item) => item.id);
          assert.ok(ids.length >= 2);
          assert.equal(new Set(ids).size, ids.length);
          assert.deepEqual([...activity.order].sort(), [...ids].sort());
          assert.ok(activity.items.every((item) => item.text.trim()));
          assert.ok(activity.success.trim());
          break;
        }
        case "pairs":
          assert.ok(activity.pairs.length >= 2);
          assert.equal(new Set(activity.pairs.map((pair) => pair.left)).size, activity.pairs.length);
          assert.equal(new Set(activity.pairs.map((pair) => pair.right)).size, activity.pairs.length);
          assert.ok(activity.pairs.every((pair) => pair.left.trim() && pair.right.trim() && pair.explanation.trim()));
          break;
        case "sort":
          assert.ok(activity.categories.length >= 2);
          assert.equal(new Set(activity.categories).size, activity.categories.length);
          assert.ok(activity.items.length > 0);
          assert.ok(activity.items.every((item) => item.text.trim() && item.explanation.trim() && Number.isInteger(item.category) && item.category >= 0 && item.category < activity.categories.length));
          assert.ok(activity.success.trim());
          break;
        case "evidence":
          assert.ok(activity.passage.trim());
          assert.ok(activity.clues.some((clue) => clue.correct));
          assert.ok(activity.clues.every((clue) => clue.text.trim() && clue.explanation.trim()));
          assert.ok(activity.conclusion.trim());
          break;
        case "map":
          assert.equal(activity.cells.length, 9);
          assert.ok(activity.cells.every((cell) => cell.trim()));
          assert.ok(Number.isInteger(activity.start) && activity.start >= 0 && activity.start < activity.cells.length);
          assert.ok(Number.isInteger(activity.target) && activity.target >= 0 && activity.target < activity.cells.length);
          assert.notEqual(activity.start, activity.target);
          assert.ok(activity.success.trim());
          break;
        case "listen":
          assert.ok(["en-GB", "zh-CN"].includes(activity.lang));
          assert.ok(activity.items.length > 0);
          assert.ok(activity.items.every((item) => item.text.trim() && item.meaning.trim()));
          break;
      }
    }
  });
}

test("the actual curricula cannot restore or accept another subject's progress", async () => {
  const curricula = await Promise.all(subjectIds.map(getSubjectCurriculum));
  const allIds = curricula.flatMap((curriculum) => curriculum.lessons.map((lesson) => lesson.id));
  const allCheckIds = curricula.flatMap((curriculum) => curriculum.lessons.flatMap((lesson) => lesson.checks.map((check) => check.id)));
  assert.equal(new Set(allIds).size, allIds.length);
  assert.equal(new Set(allCheckIds).size, allCheckIds.length);
  for (const source of curricula) {
    const sourceEngine = createLearningEngine(source.lessons);
    const sourceLesson = source.lessons[0];
    const progress = completeLesson(sourceEngine, sourceEngine.emptyLearningProgress(), sourceLesson);
    for (const target of curricula.filter((curriculum) => curriculum.id !== source.id)) {
      const targetEngine = createLearningEngine(target.lessons);
      assert.deepEqual(targetEngine.parseLearningProgress(JSON.stringify(progress)), targetEngine.emptyLearningProgress());
      const initial = targetEngine.emptyLearningProgress();
      assert.strictEqual(targetEngine.recordLearningCheck(initial, sourceLesson.id, sourceLesson.checks[0].id, true), initial);
    }
  }
});
