import { geometryNodes } from "./geometry-graph";

// Geometry exploration stays on this browser and is separate from course scores.
export const GEOMETRY_STORAGE_KEY = "gogostudy:geometry:v1";

export type GeometryProgress = {
  version: 1;
  activeNodeId: string;
  completedNodeIds: string[];
  reviewNodeIds: string[];
};

const knownNodeIds = new Set(geometryNodes.map((node) => node.id));

export function emptyGeometryProgress(): GeometryProgress {
  return {
    version: 1,
    activeNodeId: geometryNodes[0].id,
    completedNodeIds: [],
    reviewNodeIds: [],
  };
}

function validNodeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(
    (id): id is string => typeof id === "string" && knownNodeIds.has(id),
  ))];
}

function normalizeProgress(value: unknown): GeometryProgress {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("version" in value) ||
    value.version !== 1
  ) {
    return emptyGeometryProgress();
  }

  const stored = value as Record<string, unknown>;
  const reviewNodeIds = validNodeIds(stored.reviewNodeIds);
  const reviewIds = new Set(reviewNodeIds);
  return {
    version: 1,
    activeNodeId:
      typeof stored.activeNodeId === "string" && knownNodeIds.has(stored.activeNodeId)
        ? stored.activeNodeId
        : geometryNodes[0].id,
    completedNodeIds: validNodeIds(stored.completedNodeIds).filter(
      (id) => !reviewIds.has(id),
    ),
    reviewNodeIds,
  };
}

export function parseGeometryProgress(raw: string | null): GeometryProgress {
  if (!raw) return emptyGeometryProgress();
  try {
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return emptyGeometryProgress();
  }
}

export function recordGeometryAnswer(
  progress: GeometryProgress,
  nodeId: string,
  correct: boolean,
): GeometryProgress {
  if (!knownNodeIds.has(nodeId)) return progress;
  const current = normalizeProgress(progress);
  const completedNodeIds = current.completedNodeIds.filter((id) => id !== nodeId);
  const reviewNodeIds = current.reviewNodeIds.filter((id) => id !== nodeId);
  if (correct) completedNodeIds.push(nodeId);
  else reviewNodeIds.push(nodeId);
  return {
    version: 1,
    activeNodeId: nodeId,
    completedNodeIds,
    reviewNodeIds,
  };
}

export function selectGeometryNode(
  progress: GeometryProgress,
  nodeId: string,
): GeometryProgress {
  if (!knownNodeIds.has(nodeId)) return progress;
  return { ...progress, activeNodeId: nodeId };
}
