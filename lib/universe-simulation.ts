/**
 * Educational diagrams, not ephemerides or numerical gravity/weather solvers.
 * Sources checked 2026-10-05:
 * https://science.nasa.gov/earth/facts/ — Earth year ≈ 365.25 Earth days.
 * https://science.nasa.gov/mars/facts/ — Mars year ≈ 687 Earth days.
 * https://spaceplace.nasa.gov/orbits/en/ — forward motion with continuing gravity.
 * https://science.nasa.gov/learn/basics-of-space-flight/chapter2-1/ — solar vs sidereal day.
 * https://www.usgs.gov/special-topics/water-science-school/water-cycle
 * https://www.usgs.gov/water-science-school/science/condensation-and-water-cycle
 * https://www.usgs.gov/water-science-school/science/precipitation-and-water-cycle
 */

export type OrbitPlanet = "earth" | "mars";
export const ORBIT_PERIOD_DAYS: Record<OrbitPlanet, number> = { earth: 365.25, mars: 687 };

export function normalizeDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0;
  return ((degrees % 360) + 360) % 360;
}

/** Noon is angle 0; the north-pole view rotates counterclockwise on screen. */
export function getDayNightState(degrees: number) {
  const angle = normalizeDegrees(degrees);
  const radians = angle * Math.PI / 180;
  const x = -Math.cos(radians);
  const y = Math.sin(radians);
  const phase: "day" | "night" | "sunset" | "sunrise" = Math.abs(angle - 90) < 1e-7 ? "sunset"
    : Math.abs(angle - 270) < 1e-7 ? "sunrise"
      : x < 0 ? "day" : "night";
  const minutes = Math.round(((12 + angle / 15) % 24) * 60) % 1440;
  return {
    angle, x, y, phase,
    clock: `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`,
  };
}

/** Uniform circular-orbit comparison. Units are elapsed Earth days. */
export function getOrbitState(elapsedEarthDays: number, planet: OrbitPlanet) {
  const days = Number.isFinite(elapsedEarthDays) ? Math.max(0, elapsedEarthDays) : 0;
  const turns = days / ORBIT_PERIOD_DAYS[planet];
  const completedOrbits = Math.floor(turns + 1e-10);
  const rawFraction = turns - Math.floor(turns);
  const fraction = rawFraction < 1e-10 || 1 - rawFraction < 1e-10 ? 0 : rawFraction;
  const radians = fraction * Math.PI * 2;
  return { days, turns, completedOrbits, fraction, x: Math.cos(radians), y: -Math.sin(radians) };
}

export const WATER_STAGE_SECONDS = 4;
export const WATER_STAGES = [
  { title: "蒸发", short: "水变成水蒸气", description: "太阳提供能量，海洋、湖泊等地方的液态水可以蒸发成水蒸气，进入空气。水蒸气是看不见的气体，图上的虚线只表示运动方向。", connection: "太阳的能量 → 液态水变成气态水" },
  { title: "凝结与成云", short: "空气中出现小水滴", description: "水蒸气遇冷可以凝结成小水滴；寒冷条件下也会形成冰晶。看得见的云由许多小水滴或冰晶组成，不是一团看得见的水蒸气。", connection: "气态水遇冷 → 小水滴或冰晶组成云" },
  { title: "降水", short: "水回到地面", description: "云中的小水滴或冰晶长到一定程度，在重力作用下落下，形成雨、雪等降水。不是每一片云都会立刻下雨。", connection: "水滴或冰晶长大 + 重力 → 降水" },
  { title: "汇流", short: "沿地势流向低处", description: "部分水在重力作用下顺着地势流动，汇入溪流、河流和海洋。也有水渗入地下、留在湖泊，或被植物利用；它们不必都走同一条路。", connection: "重力 + 地面起伏 → 水流连接不同地方" },
] as const;

export function getWaterCycleState(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const position = safeSeconds / WATER_STAGE_SECONDS;
  const stage = Math.floor(position) % WATER_STAGES.length;
  return { stage, fraction: position - Math.floor(position), completedCycles: Math.floor(position / WATER_STAGES.length) };
}

export function pointAlongPolyline(points: readonly (readonly [number, number])[], fraction: number) {
  if (!points.length) return { x: 0, y: 0 };
  if (points.length === 1) return { x: points[0][0], y: points[0][1] };
  const t = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  const lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * t;
  for (let index = 0; index < lengths.length; index++) {
    if (remaining <= lengths[index] || index === lengths.length - 1) {
      const ratio = lengths[index] ? remaining / lengths[index] : 0;
      return { x: points[index][0] + (points[index + 1][0] - points[index][0]) * ratio, y: points[index][1] + (points[index + 1][1] - points[index][1]) * ratio };
    }
    remaining -= lengths[index];
  }
  return { x: points.at(-1)![0], y: points.at(-1)![1] };
}
