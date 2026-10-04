import { test } from "node:test";
import assert from "node:assert/strict";
import { geometryNodes, geometryStages } from "../lib/geometry-graph";
import {
  GEOMETRY_STORAGE_KEY,
  emptyGeometryProgress,
  parseGeometryProgress,
  recordGeometryAnswer,
  selectGeometryNode,
  type GeometryProgress,
} from "../lib/geometry-progress";

const firstId = geometryNodes[0].id;
const secondId = geometryNodes[1].id;
const thirdId = geometryNodes[2].id;

test("geometry exploration has its own local storage and fresh initial state", () => {
  assert.equal(GEOMETRY_STORAGE_KEY, "gogostudy:geometry:v1");
  const first = emptyGeometryProgress();
  const second = emptyGeometryProgress();
  assert.deepEqual(first, {
    version: 1,
    activeNodeId: firstId,
    completedNodeIds: [],
    reviewNodeIds: [],
  });
  first.completedNodeIds.push(firstId);
  assert.deepEqual(second.completedNodeIds, []);
});

test("damaged storage and unsupported schemas recover without throwing", () => {
  for (const raw of [
    null, "", "{", "null", "true", "4", '"progress"', "[]", "{}",
    JSON.stringify({ version: "1", completedNodeIds: [firstId] }),
    JSON.stringify({ version: 2, completedNodeIds: [firstId] }),
  ]) {
    assert.deepEqual(parseGeometryProgress(raw), emptyGeometryProgress());
  }
  assert.deepEqual(
    parseGeometryProgress(JSON.stringify({
      version: 1,
      activeNodeId: { id: firstId },
      completedNodeIds: "not-an-array",
      reviewNodeIds: null,
    })),
    emptyGeometryProgress(),
  );
});

test("stored progress removes unknown and duplicate IDs, with review taking priority", () => {
  const parsed = parseGeometryProgress(JSON.stringify({
    version: 1,
    activeNodeId: "unknown-node",
    completedNodeIds: [firstId, firstId, secondId, thirdId, null, 42, "unknown-node"],
    reviewNodeIds: [secondId, secondId, "unknown-node", false],
    courseScore: 999,
  }));
  assert.deepEqual(parsed, {
    version: 1,
    activeNodeId: firstId,
    completedNodeIds: [firstId, thirdId],
    reviewNodeIds: [secondId],
  });
});

test("valid progress survives JSON storage without changing its active node", () => {
  const progress = {
    version: 1 as const,
    activeNodeId: thirdId,
    completedNodeIds: [firstId],
    reviewNodeIds: [secondId],
  };
  assert.deepEqual(parseGeometryProgress(JSON.stringify(progress)), progress);
});

test("answers move a node from new to completed, review, and corrected", () => {
  const initial = emptyGeometryProgress();
  const completed = recordGeometryAnswer(initial, secondId, true);
  assert.deepEqual(completed, {
    version: 1,
    activeNodeId: secondId,
    completedNodeIds: [secondId],
    reviewNodeIds: [],
  });
  const review = recordGeometryAnswer(completed, secondId, false);
  assert.deepEqual(review.completedNodeIds, []);
  assert.deepEqual(review.reviewNodeIds, [secondId]);
  const corrected = recordGeometryAnswer(review, secondId, true);
  assert.deepEqual(corrected, completed);
  assert.deepEqual(initial, emptyGeometryProgress());
});

test("repeated answers stay unique and preserve other nodes", () => {
  let progress = recordGeometryAnswer(emptyGeometryProgress(), firstId, true);
  progress = recordGeometryAnswer(progress, secondId, false);
  progress = recordGeometryAnswer(progress, secondId, false);
  assert.deepEqual(progress.completedNodeIds, [firstId]);
  assert.deepEqual(progress.reviewNodeIds, [secondId]);
  progress = recordGeometryAnswer(progress, secondId, true);
  progress = recordGeometryAnswer(progress, secondId, true);
  assert.deepEqual(progress.completedNodeIds, [firstId, secondId]);
  assert.deepEqual(progress.reviewNodeIds, []);
});

test("changing the active node does not mark it completed", () => {
  const progress = recordGeometryAnswer(emptyGeometryProgress(), firstId, false);
  const selected = selectGeometryNode(progress, thirdId);
  assert.equal(selected.activeNodeId, thirdId);
  assert.deepEqual(selected.completedNodeIds, []);
  assert.deepEqual(selected.reviewNodeIds, [firstId]);
  assert.equal(progress.activeNodeId, firstId);
});

test("unknown nodes leave the original progress unchanged", () => {
  const progress = emptyGeometryProgress();
  assert.strictEqual(recordGeometryAnswer(progress, "unknown-node", true), progress);
  assert.strictEqual(recordGeometryAnswer(progress, "unknown-node", false), progress);
  assert.strictEqual(selectGeometryNode(progress, "unknown-node"), progress);
});

test("answer and selection functions work with frozen state without mutations", () => {
  const progress: GeometryProgress = {
    version: 1,
    activeNodeId: firstId,
    completedNodeIds: [firstId],
    reviewNodeIds: [secondId],
  };
  Object.freeze(progress.completedNodeIds);
  Object.freeze(progress.reviewNodeIds);
  Object.freeze(progress);
  const original = JSON.stringify(progress);
  const answered = recordGeometryAnswer(progress, secondId, true);
  const selected = selectGeometryNode(progress, thirdId);
  assert.notStrictEqual(answered.completedNodeIds, progress.completedNodeIds);
  assert.notStrictEqual(answered.reviewNodeIds, progress.reviewNodeIds);
  assert.equal(selected.activeNodeId, thirdId);
  assert.equal(JSON.stringify(progress), original);
});

test("the learning graph covers point, line, plane, and solid with three nodes each", () => {
  assert.deepEqual(geometryStages.map((stage) => stage.id), [
    "point", "line", "plane", "solid",
  ]);
  assert.equal(geometryNodes.length, 12);
  assert.equal(new Set(geometryNodes.map((node) => node.id)).size, 12);
  const stageIds = new Set(geometryStages.map((stage) => stage.id));
  for (const stage of geometryStages) {
    assert.equal(geometryNodes.filter((node) => node.stageId === stage.id).length, 3);
  }
  for (const node of geometryNodes) {
    assert.ok(stageIds.has(node.stageId), `${node.id} has a known stage`);
    for (const field of ["title", "summary", "example", "takeaway", "activity"] as const) {
      assert.ok(node[field].trim(), `${node.id} needs ${field}`);
    }
  }
});

test("every prerequisite exists, comes earlier, and the learning graph has no cycles", () => {
  const byId = new Map(geometryNodes.map((node) => [node.id, node]));
  const positions = new Map(geometryNodes.map((node, index) => [node.id, index]));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string) => {
    assert.ok(!visiting.has(id), `cycle reaches ${id}`);
    if (visited.has(id)) return;
    const node = byId.get(id);
    assert.ok(node, `unknown prerequisite ${id}`);
    visiting.add(id);
    assert.equal(new Set(node.prerequisites).size, node.prerequisites.length);
    for (const prerequisite of node.prerequisites) {
      assert.ok(byId.has(prerequisite), `${id} refers to unknown ${prerequisite}`);
      assert.ok(positions.get(prerequisite)! < positions.get(id)!, `${prerequisite} must precede ${id}`);
      visit(prerequisite);
    }
    visiting.delete(id);
    visited.add(id);
  };
  for (const node of geometryNodes) visit(node.id);
  assert.equal(visited.size, geometryNodes.length);
  assert.deepEqual(geometryNodes[0].prerequisites, []);
  assert.ok(geometryNodes.slice(1).every((node) => node.prerequisites.length > 0));
});

test("every exploration quiz has distinct choices and one valid answer", () => {
  const prompts = new Set<string>();
  for (const node of geometryNodes) {
    const question = node.question;
    assert.ok(question.prompt.trim(), `${node.id} needs a question`);
    assert.ok(!prompts.has(question.prompt), `${node.id} repeats a question`);
    prompts.add(question.prompt);
    assert.equal(question.options.length, 3, `${node.id} has three choices`);
    assert.ok(question.options.every((option) => option.trim().length > 0));
    assert.equal(new Set(question.options).size, question.options.length);
    assert.ok(Number.isInteger(question.answer), `${node.id} has an integer answer index`);
    assert.ok(question.answer >= 0 && question.answer < question.options.length, `${node.id} has a valid answer`);
    assert.equal(question.options.filter((option) => option === question.options[question.answer]).length, 1);
    assert.ok(question.explanation.trim(), `${node.id} explains its answer`);
  }
});
