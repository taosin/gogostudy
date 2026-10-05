import assert from "node:assert/strict";
import { test } from "node:test";
import { getSubjectCurriculum } from "../lib/curricula";
import { learningStorageKey } from "../lib/learning-progress";
import { learningSubjects } from "../lib/learning-subjects";
import { universeNodes, universeScales } from "../lib/universe-content";
import { getWorldDestination, getWorldDestinationHref, worldDestinations, worldPlaces, worldQuestions, worldStopHref, worldTrails } from "../lib/world-content";
import { worldLessonIndex } from "../lib/world-lesson-index";
import { beginWorldTrail, emptyWorldProgress, leaveWorldTrail, parseWorldProgress, readWorldLearningEvidence, selectWorldPlace, toggleWorldQuestion, visitWorldDestination, WORLD_STORAGE_KEY } from "../lib/world-progress";

test("the lightweight world index matches all existing lesson titles and check evidence", async () => {
  const curricula = await Promise.all(learningSubjects.map((subject) => getSubjectCurriculum(subject.id)));
  const expected = curricula.flatMap((curriculum) => curriculum.lessons.map((lesson) => ({ id: lesson.id, subjectId: curriculum.id, title: lesson.title, goal: lesson.goal, checkIds: lesson.checks.map((check) => check.id) })));
  assert.deepEqual(worldLessonIndex, expected);
  assert.equal(worldLessonIndex.length, 80);
  assert.equal(new Set(worldDestinations.map((item) => item.id)).size, worldDestinations.length);
  for (const destination of worldDestinations) assert.ok(worldQuestions.find((question) => question.id === `destination:${destination.id}`)?.question, `${destination.id} has its own relevant question`);
  for (const scale of universeScales) assert.equal(worldQuestions.find((question) => question.id === `destination:universe:scale:${scale.id}`)?.question, scale.question);
  for (const node of universeNodes) assert.equal(worldQuestions.find((question) => question.id === `destination:universe:relations:${node.id}`)?.question, node.question);
});

test("all six regions, saved questions and cross-subject route stops lead to real internal destinations", () => {
  assert.equal(worldPlaces.length, 6);
  assert.equal(worldTrails.length, 3);
  assert.equal(new Set(worldQuestions.map((item) => item.id)).size, worldQuestions.length);
  for (const place of worldPlaces) assert.equal(getWorldDestination(place.destinationId)?.placeId, place.id);
  for (const question of worldQuestions) assert.ok(getWorldDestination(question.destinationId), `${question.id} has a real destination`);
  for (const trail of worldTrails) {
    assert.ok(trail.stops.length > 1 && trail.stops.length <= 4);
    assert.equal(new Set(trail.stops.map((item) => item.id)).size, trail.stops.length);
    assert.equal(new Set(trail.stops.map((item) => item.destinationId)).size, trail.stops.length);
    const subjects = new Set(trail.stops.map((stop) => getWorldDestination(stop.destinationId)?.placeId));
    assert.ok(subjects.size >= 2, `${trail.id} connects more than one area`);
    for (const stop of trail.stops) {
      const destination = getWorldDestination(stop.destinationId);
      assert.ok(destination);
      assert.ok(destination.href.startsWith("/knowledge/"));
      assert.ok(stop.question.trim() && stop.connection.trim());
    }
  }
});

test("resumable route URLs put the explicit route before the lesson or simulation hash", () => {
  assert.equal(worldStopHref("first-journey", "find"), "/knowledge/geography?trail=first-journey&stop=find#geography-relative");
  assert.equal(worldStopHref("water-trip", "cycle"), "/knowledge/universe?trail=water-trip&stop=cycle#lab-water-cycle");
  assert.equal(getWorldDestinationHref("math:count", "water-trip"), "/knowledge/math#count");
  assert.equal(getWorldDestinationHref("math:count", "untrusted-trail"), "/knowledge/math#count");
  assert.equal(getWorldDestinationHref("https://untrusted.example"), "/");
  assert.equal(worldStopHref("first-journey", "untrusted-stop"), "/");
});

test("selecting a place or starting a trail does not claim a visit or learning achievement", () => {
  const initial = emptyWorldProgress();
  const selected = selectWorldPlace(initial, "chinese");
  const started = beginWorldTrail(selected, "first-journey");
  assert.equal(started.selectedPlaceId, "chinese");
  assert.equal(started.activeTrailId, "first-journey");
  assert.equal(started.lastDestinationId, null);
  assert.equal(started.lastTrailDestinationId, null);
  assert.deepEqual(started.visitedDestinationIds, []);
  assert.ok(!("completedLessonIds" in started));
  assert.ok(!("passedCheckIds" in started));
  assert.equal(initial.selectedPlaceId, "universe", "updates must not mutate the prior snapshot");
  assert.ok(!learningSubjects.some((subject) => learningStorageKey(subject.id) === WORLD_STORAGE_KEY));
});

test("returning to a lesson keeps one visit, the last position and the chosen trail through a reload", () => {
  let progress = beginWorldTrail(emptyWorldProgress(), "first-journey");
  progress = visitWorldDestination(progress, "geography:geography-relative");
  progress = visitWorldDestination(progress, "chinese:chinese-listen");
  progress = visitWorldDestination(progress, "geography:geography-relative");
  const restored = parseWorldProgress(JSON.stringify(progress));
  assert.equal(restored.selectedPlaceId, "geography");
  assert.equal(restored.lastDestinationId, "geography:geography-relative");
  assert.equal(restored.activeTrailId, "first-journey");
  assert.equal(restored.lastTrailDestinationId, "geography:geography-relative");
  assert.deepEqual(restored.visitedDestinationIds, ["geography:geography-relative", "chinese:chinese-listen"]);
  const left = leaveWorldTrail(restored);
  assert.equal(left.activeTrailId, null);
  assert.equal(left.lastTrailDestinationId, null);
  assert.equal(left.lastDestinationId, restored.lastDestinationId);
  assert.deepEqual(left.visitedDestinationIds, restored.visitedDestinationIds);
});

test("a foundation detour keeps the unfinished river stop as the route return point", () => {
  let progress = beginWorldTrail(emptyWorldProgress(), "water-trip");
  for (const destination of ["universe:scale:earth", "universe:lab:water-cycle", "geography:geography-river", "geography:geography-relative"]) progress = visitWorldDestination(progress, destination);
  assert.equal(progress.lastDestinationId, "geography:geography-relative", "general resume should continue the foundation lesson");
  assert.equal(progress.lastTrailDestinationId, "geography:geography-river", "route resume must return to the stop before the detour");
  assert.ok(!progress.visitedDestinationIds.includes("chinese:chinese-describe"));
  const restored = parseWorldProgress(JSON.stringify(progress));
  assert.equal(restored.lastTrailDestinationId, "geography:geography-river");
  assert.equal(getWorldDestinationHref(restored.lastTrailDestinationId, restored.activeTrailId), "/knowledge/geography?trail=water-trip&stop=river#geography-river");
  progress = visitWorldDestination(restored, "geography:geography-river");
  assert.equal(progress.lastTrailDestinationId, "geography:geography-river");
  progress = visitWorldDestination(progress, "chinese:chinese-describe");
  assert.equal(progress.lastTrailDestinationId, "chinese:chinese-describe", "only actually visiting the next stop advances the return point");
});

test("resuming the same trail retains its position while choosing another trail or leaving clears it", () => {
  const water = visitWorldDestination(beginWorldTrail(emptyWorldProgress(), "water-trip"), "geography:geography-river");
  assert.equal(beginWorldTrail(water, "water-trip").lastTrailDestinationId, "geography:geography-river");
  const friends = beginWorldTrail(water, "first-journey");
  assert.equal(friends.lastTrailDestinationId, null);
  assert.equal(friends.lastDestinationId, "geography:geography-river", "choosing a route does not fake a new visit");
  assert.equal(visitWorldDestination(friends, "universe:lab:water-cycle").lastTrailDestinationId, null, "visiting another route cannot set this route's position");
  const hello = visitWorldDestination(friends, "english:english-greetings");
  assert.equal(hello.lastTrailDestinationId, "english:english-greetings");
  const free = leaveWorldTrail(hello);
  assert.equal(free.lastTrailDestinationId, null);
  assert.equal(visitWorldDestination(free, "math:count").lastTrailDestinationId, null);
  assert.equal(beginWorldTrail(free, "first-journey").lastTrailDestinationId, null);
});

test("older world records remain compatible and cannot restore a return point outside the active trail", () => {
  const old = { version: 1, selectedPlaceId: "geography", lastDestinationId: "geography:geography-relative", activeTrailId: "water-trip", visitedDestinationIds: ["geography:geography-river"], savedQuestionIds: ["place:geography"] };
  const restored = parseWorldProgress(JSON.stringify(old));
  assert.equal(restored.lastTrailDestinationId, null);
  assert.equal(restored.activeTrailId, "water-trip");
  assert.deepEqual(restored.savedQuestionIds, ["place:geography"]);
  for (const lastTrailDestinationId of ["math:count", "geography:geography-relative", "fake", 7, null]) {
    assert.equal(parseWorldProgress(JSON.stringify({ ...old, lastTrailDestinationId })).lastTrailDestinationId, null);
  }
  assert.equal(parseWorldProgress(JSON.stringify({ ...old, lastTrailDestinationId: "geography:geography-river" })).lastTrailDestinationId, "geography:geography-river");
  assert.equal(parseWorldProgress(JSON.stringify({ ...old, activeTrailId: null, lastTrailDestinationId: "geography:geography-river" })).lastTrailDestinationId, null);
});

test("saving and removing a question preserves travel state and does not accept unknown items", () => {
  const visited = visitWorldDestination(emptyWorldProgress(), "universe:lab:water-cycle");
  const saved = toggleWorldQuestion(visited, "trail:water-trip:cycle");
  assert.deepEqual(saved.savedQuestionIds, ["trail:water-trip:cycle"]);
  assert.equal(saved.lastDestinationId, "universe:lab:water-cycle");
  assert.deepEqual(toggleWorldQuestion(saved, "trail:water-trip:cycle").savedQuestionIds, []);
  assert.strictEqual(toggleWorldQuestion(saved, "injected-question"), saved);
  assert.strictEqual(visitWorldDestination(saved, "javascript:alert(1)"), saved);
  assert.strictEqual(beginWorldTrail(saved, "invented-trail"), saved);
  assert.strictEqual(selectWorldPlace(saved, "unlisted-region"), saved);
});

test("corrupt, old and injected browser state is normalized to the declared travel catalog", () => {
  for (const raw of [null, "", "{broken", "[]", "null", '{"version":2}']) assert.deepEqual(parseWorldProgress(raw), emptyWorldProgress());
  const restored = parseWorldProgress(JSON.stringify({
    version: 1, selectedPlaceId: "wrong", activeTrailId: "fake", lastDestinationId: "https://untrusted.example",
    visitedDestinationIds: ["math:count", "math:count", "invented", null, 22],
    savedQuestionIds: ["place:math", "place:math", "made-up"],
    href: "javascript:alert(1)", completedLessonIds: ["count"],
  }));
  assert.equal(restored.selectedPlaceId, "universe");
  assert.equal(restored.lastDestinationId, null);
  assert.equal(restored.activeTrailId, null);
  assert.deepEqual(restored.visitedDestinationIds, ["math:count"]);
  assert.deepEqual(restored.savedQuestionIds, ["place:math"]);
  assert.ok(!("href" in restored));
  assert.ok(!("completedLessonIds" in restored));
});

test("the backpack derives completed lessons from known check IDs and keeps unfinished corrections separate", () => {
  const state = new Map<string, string>([[learningStorageKey("math"), JSON.stringify({
    version: 1,
    completedLessonIds: ["compare", "shape"],
    passedCheckIds: { count: ["count-understand", "count-transfer", "count-understand", "invented"], match: ["match-understand"], compare: ["invented"] },
    reviewLessonIds: ["count", "match", "compare", "unknown"],
  })]]);
  const evidence = readWorldLearningEvidence((key) => state.get(key) ?? null);
  assert.deepEqual(evidence.completedLessons.map((item) => item.destinationId), ["math:count"]);
  assert.deepEqual(evidence.reviewLessons.map((item) => item.destinationId), ["math:match", "math:compare"]);
  assert.equal(evidence.passedChecks, 3);
  assert.equal(evidence.reviewLessons[0].passedChecks, 1);
  assert.equal(evidence.completedLessons[0].totalChecks, 2);
  assert.equal(evidence.storageError, false);
});

test("one unreadable subject does not hide valid evidence from other subjects", () => {
  const evidence = readWorldLearningEvidence((key) => {
    if (key === learningStorageKey("math")) throw new Error("storage unavailable");
    if (key === learningStorageKey("history")) return "broken JSON";
    if (key === learningStorageKey("english")) return JSON.stringify({ version: 1, passedCheckIds: { "english-greetings": ["english-greetings-understand", "english-greetings-transfer"] } });
    return null;
  });
  assert.equal(evidence.storageError, true);
  assert.deepEqual(evidence.completedLessons.map((item) => item.destinationId), ["english:english-greetings"]);
  assert.equal(evidence.passedChecks, 2);
});
