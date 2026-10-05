import assert from "node:assert/strict";
import { test } from "node:test";
import {
  universeNodes,
  universeRelations,
  universeScales,
  type UniverseNodeId,
  type UniverseRelation,
} from "../lib/universe-content";
import {
  getDayNightState,
  getOrbitState,
  getWaterCycleState,
  normalizeDegrees,
  ORBIT_PERIOD_DAYS,
  pointAlongPolyline,
  WATER_STAGES,
  WATER_STAGE_SECONDS,
} from "../lib/universe-simulation";

function near(actual: number, expected: number, context: string) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${context}: expected ${expected}, received ${actual}`);
}

function reachable(from: UniverseNodeId, edges: UniverseRelation[]) {
  const found = new Set<UniverseNodeId>();
  const pending: UniverseNodeId[] = [from];
  while (pending.length) {
    const current = pending.pop()!;
    for (const edge of edges.filter((item) => item.from === current)) {
      if (found.has(edge.to)) continue;
      found.add(edge.to);
      pending.push(edge.to);
    }
  }
  return found;
}

test("the eight observation scopes and fourteen graph nodes have unique, complete teaching entries", () => {
  assert.equal(universeScales.length, 8);
  assert.equal(universeNodes.length, 14);
  assert.equal(new Set(universeScales.map((scope) => scope.id)).size, universeScales.length);
  assert.equal(new Set(universeNodes.map((node) => node.id)).size, universeNodes.length);
  assert.deepEqual(universeScales.map((scope) => scope.id), ["universe", "galaxy", "solar", "earth", "ecosystem", "cell", "molecule", "atom"]);
  for (const scope of universeScales) {
    for (const field of ["label", "kicker", "description", "detail", "question", "scaleNote"] as const) {
      assert.ok(scope[field].trim(), `${scope.id} needs ${field}`);
    }
  }
  for (const node of universeNodes) {
    assert.ok(["space", "earth", "life", "matter"].includes(node.group));
    for (const field of ["label", "summary", "detail", "question"] as const) {
      assert.ok(node[field].trim(), `${node.id} needs ${field}`);
    }
  }
});

test("every graph relation has valid endpoints, its own explanation and a recognized teaching purpose", () => {
  assert.equal(universeRelations.length, 25);
  assert.equal(new Set(universeRelations.map((edge) => edge.id)).size, universeRelations.length);
  const nodes = new Set(universeNodes.map((node) => node.id));
  const kinds = ["contains", "gravity", "energy", "matter", "cycle"];
  const links = new Set<string>();
  for (const edge of universeRelations) {
    assert.ok(nodes.has(edge.from), `${edge.id} has an unknown source`);
    assert.ok(nodes.has(edge.to), `${edge.id} has an unknown destination`);
    assert.notEqual(edge.from, edge.to, `${edge.id} cannot point back to itself`);
    assert.ok(kinds.includes(edge.kind), `${edge.id} has an unknown relation kind`);
    assert.ok(edge.label.trim() && edge.explanation.trim(), `${edge.id} needs a readable relationship`);
    const identity = `${edge.from}:${edge.kind}:${edge.to}`;
    assert.ok(!links.has(identity), `${edge.id} duplicates an existing relation`);
    links.add(identity);
  }
  assert.deepEqual([...new Set(universeRelations.map((edge) => edge.kind))].sort(), kinds.sort());
});

test("children can reach every graph node by following its visible relationships from Earth", () => {
  const traversable = universeRelations.flatMap((edge) => [edge, { ...edge, from: edge.to, to: edge.from }]);
  const visited = reachable("earth", traversable);
  visited.add("earth");
  assert.deepEqual([...visited].sort(), universeNodes.map((node) => node.id).sort());
});

test("containment cannot cycle, put the Moon inside Earth, or make water consist of cells", () => {
  const containment = universeRelations.filter((edge) => edge.kind === "contains");
  for (const node of universeNodes) {
    assert.ok(!reachable(node.id, containment).has(node.id), `containment returns to ${node.id}`);
  }
  assert.ok(reachable("universe", containment).has("sun"));
  assert.ok(reachable("water", containment).has("atom"));
  assert.ok(!reachable("earth", containment).has("moon"));
  assert.ok(!reachable("water", containment).has("cell"), "this water example must not require a cell as a level of composition");
});

test("energy can pass through food relationships but never cycles back through the graph", () => {
  const energy = universeRelations.filter((edge) => edge.kind === "energy");
  for (const node of universeNodes) {
    assert.ok(!reachable(node.id, energy).has(node.id), `energy incorrectly cycles back to ${node.id}`);
  }
  for (const id of ["plant", "animal", "decomposer"] as const) {
    assert.ok(reachable("sun", energy).has(id), `${id} needs an energy connection to sunlight in this example`);
  }
  assert.ok(!energy.some((edge) => edge.to === "sun"));
  assert.ok(!reachable("decomposer", energy).has("plant"));
});

test("matter-return routes remain distinct from gravity and energy transfer", () => {
  const material = universeRelations.filter((edge) => edge.kind === "matter" || edge.kind === "cycle");
  assert.ok(reachable("water", material).has("water"), "the illustrated water route should return water to the environment");
  assert.ok(reachable("soil", material).has("soil"), "soil, plants and decomposers should demonstrate material reuse");
  assert.ok(!material.some((edge) => edge.from === "sun" || edge.to === "sun"), "sunlight is not a material ingredient for plant growth");
  assert.ok(universeRelations.some((edge) => edge.from === "sun" && edge.to === "earth" && edge.kind === "gravity"));
  assert.ok(universeRelations.some((edge) => edge.from === "sun" && edge.to === "earth" && edge.kind === "energy"));
});

test("a fixed location moves through noon, sunset, midnight and sunrise in the north-pole view", () => {
  const examples = [
    { angle: 0, phase: "day", clock: "12:00", x: -1, y: 0 },
    { angle: 90, phase: "sunset", clock: "18:00", x: 0, y: 1 },
    { angle: 180, phase: "night", clock: "00:00", x: 1, y: 0 },
    { angle: 270, phase: "sunrise", clock: "06:00", x: 0, y: -1 },
  ];
  for (const expected of examples) {
    const actual = getDayNightState(expected.angle);
    assert.equal(actual.phase, expected.phase);
    assert.equal(actual.clock, expected.clock);
    near(actual.x, expected.x, `${expected.phase} horizontal position`);
    near(actual.y, expected.y, `${expected.phase} vertical position`);
  }
});

test("the observation point crosses into the correct lit half at both terminators", () => {
  assert.equal(getDayNightState(89.99).phase, "day");
  assert.equal(getDayNightState(90.01).phase, "night");
  assert.equal(getDayNightState(269.99).phase, "night");
  assert.equal(getDayNightState(270.01).phase, "day");
  for (const angle of [15, 45, 120, 210, 315, 345]) {
    const point = getDayNightState(angle);
    near(Math.hypot(point.x, point.y), 1, "the same location stays on Earth's edge");
    assert.equal(point.phase === "day", point.x < 0, "sunlight comes from the left");
  }
});

test("day-night seeking wraps whole rotations, handles reverse angles and safely resets invalid numbers", () => {
  assert.deepEqual(getDayNightState(360), getDayNightState(0));
  assert.deepEqual(getDayNightState(810), getDayNightState(90));
  assert.deepEqual(getDayNightState(-90), getDayNightState(270));
  assert.equal(normalizeDegrees(-450), 270);
  for (const invalid of [NaN, Infinity, -Infinity]) {
    assert.equal(normalizeDegrees(invalid), 0);
    assert.deepEqual(getDayNightState(invalid), getDayNightState(0));
  }
});

test("orbital periods use Earth days and distinguish one Earth year from one Mars year", () => {
  // Independent scientific reference values, not values calculated from the constants:
  // https://science.nasa.gov/earth/facts/ and https://science.nasa.gov/mars/facts/
  assert.equal(ORBIT_PERIOD_DAYS.earth, 365.25);
  assert.equal(ORBIT_PERIOD_DAYS.mars, 687);
  const earthYear = getOrbitState(365.25, "earth");
  const marsAfterEarthYear = getOrbitState(365.25, "mars");
  assert.equal(earthYear.completedOrbits, 1);
  assert.equal(earthYear.fraction, 0);
  assert.equal(marsAfterEarthYear.completedOrbits, 0);
  assert.ok(marsAfterEarthYear.fraction > 0.53 && marsAfterEarthYear.fraction < 0.54);
  assert.equal(getOrbitState(687, "mars").completedOrbits, 1);
  assert.equal(getOrbitState(687, "mars").fraction, 0);
  assert.equal(getOrbitState(687, "earth").completedOrbits, 1);
  assert.ok(getOrbitState(687, "earth").fraction > 0.88);
});

test("uniform orbit positions stay on the comparison circle and preserve completed laps", () => {
  for (const planet of ["earth", "mars"] as const) {
    const period = ORBIT_PERIOD_DAYS[planet];
    const quarter = getOrbitState(period / 4, planet);
    near(quarter.x, 0, `${planet} quarter orbit x`);
    near(quarter.y, -1, `${planet} quarter orbit y`);
    const half = getOrbitState(period / 2, planet);
    near(half.x, -1, `${planet} half orbit x`);
    near(half.y, 0, `${planet} half orbit y`);
    const later = getOrbitState(period * 3.25, planet);
    assert.equal(later.completedOrbits, 3);
    near(later.x, quarter.x, `${planet} repeated position x`);
    near(later.y, quarter.y, `${planet} repeated position y`);
    for (const days of [1, 30, 100, 500, 1000]) {
      const state = getOrbitState(days, planet);
      near(Math.hypot(state.x, state.y), 1, `${planet} comparison circle`);
    }
  }
});

test("switching the observed planet keeps Earth days as the shared clock", () => {
  const earth = getOrbitState(343.5, "earth");
  const mars = getOrbitState(343.5, "mars");
  assert.equal(earth.days, 343.5);
  assert.equal(mars.days, 343.5);
  assert.ok(earth.fraction > 0.94 && earth.fraction < 0.95);
  assert.equal(mars.fraction, 0.5);
  near(mars.x, -1, "Mars is halfway around after half its year");
  assert.ok(earth.x > 0.9, "Earth is already near its starting position at the same elapsed time");
});

test("negative and non-finite elapsed orbital times safely start both planets at the origin", () => {
  for (const planet of ["earth", "mars"] as const) {
    for (const invalid of [-1, -365, NaN, Infinity, -Infinity]) {
      assert.deepEqual(getOrbitState(invalid, planet), getOrbitState(0, planet));
    }
  }
});

test("the water route advances through all four processes and restarts without losing cycle count", () => {
  assert.deepEqual(WATER_STAGES.map((stage) => stage.title), ["蒸发", "凝结与成云", "降水", "汇流"]);
  assert.ok(Number.isFinite(WATER_STAGE_SECONDS) && WATER_STAGE_SECONDS > 0);
  const cycle = WATER_STAGE_SECONDS * 4;
  for (let stage = 0; stage < 4; stage++) {
    assert.deepEqual(getWaterCycleState(stage * WATER_STAGE_SECONDS), { stage, fraction: 0, completedCycles: 0 });
    assert.deepEqual(getWaterCycleState(cycle + (stage + 0.5) * WATER_STAGE_SECONDS), { stage, fraction: 0.5, completedCycles: 1 });
    for (const field of ["short", "description", "connection"] as const) {
      assert.ok(WATER_STAGES[stage][field].trim(), `water stage ${stage} needs ${field}`);
    }
  }
  assert.equal(getWaterCycleState(cycle - 0.001).stage, 3);
  assert.deepEqual(getWaterCycleState(cycle), { stage: 0, fraction: 0, completedCycles: 1 });
  assert.deepEqual(getWaterCycleState(cycle * 3), { stage: 0, fraction: 0, completedCycles: 3 });
});

test("negative or non-finite water playback time cannot select a missing stage", () => {
  for (const invalid of [-1, -100, NaN, Infinity, -Infinity]) {
    assert.deepEqual(getWaterCycleState(invalid), { stage: 0, fraction: 0, completedCycles: 0 });
  }
});

test("water tracking reaches path endpoints and moves by distance rather than vertex count", () => {
  const path = [[0, 0], [3, 0], [3, 9]] as const;
  assert.deepEqual(pointAlongPolyline(path, 0), { x: 0, y: 0 });
  assert.deepEqual(pointAlongPolyline(path, 1), { x: 3, y: 9 });
  assert.deepEqual(pointAlongPolyline(path, 0.25), { x: 3, y: 0 });
  assert.deepEqual(pointAlongPolyline(path, 0.5), { x: 3, y: 3 });
  assert.deepEqual(pointAlongPolyline(path, 0.75), { x: 3, y: 6 });
  assert.deepEqual(pointAlongPolyline(path, -10), { x: 0, y: 0 });
  assert.deepEqual(pointAlongPolyline(path, 10), { x: 3, y: 9 });
  for (const invalid of [NaN, Infinity, -Infinity]) {
    assert.deepEqual(pointAlongPolyline(path, invalid), { x: 0, y: 0 });
  }
});

test("water tracking tolerates empty routes, one-point routes and repeated vertices", () => {
  assert.deepEqual(pointAlongPolyline([], 0.5), { x: 0, y: 0 });
  assert.deepEqual(pointAlongPolyline([[2, 4]], 0.5), { x: 2, y: 4 });
  assert.deepEqual(pointAlongPolyline([[2, 4], [2, 4], [2, 4]], 1), { x: 2, y: 4 });
  const repeated = [[0, 0], [0, 0], [3, 0], [3, 0], [3, 9], [3, 9]] as const;
  assert.deepEqual(pointAlongPolyline(repeated, 0.5), { x: 3, y: 3 });
  assert.deepEqual(pointAlongPolyline(repeated, 1), { x: 3, y: 9 });
});
