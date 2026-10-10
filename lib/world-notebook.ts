import { getWorldDestination, getWorldTrail, worldDestinations } from "./world-content";

export const NOTEBOOK_ENTRY_PREFIX = "gogostudy:notebook:v1:entry:";
export const NOTEBOOK_DRAFT_PREFIX = "gogostudy:notebook:v1:draft:";
export const NOTEBOOK_EVENT = "gogostudy:notebook-change";
export const NOTEBOOK_MAX_TEXT_LENGTH = 300;
export const NOTEBOOK_KIND_LABELS = { discovery: "我发现了", question: "我还想问", retry: "我想再试" } as const;
export type NotebookKind = keyof typeof NOTEBOOK_KIND_LABELS;
export type NotebookDraft = { kind: NotebookKind; text: string; trailId?: string | null; baseRevision: number | null };
export type NotebookEntry = { destinationId: string; kind: NotebookKind; text: string; createdAt: string; updatedAt: string; trailId?: string | null; revision: number };
export type NotebookMutationResult = { ok: boolean; persisted: boolean; error?: string };
export type NotebookSnapshot = { entries: NotebookEntry[]; drafts: Record<string, NotebookDraft>; ready: boolean; storageError: boolean };
export type NotebookStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const EMPTY_NOTEBOOK_SNAPSHOT: NotebookSnapshot = { entries: [], drafts: {}, ready: false, storageError: false };
const validKinds = new Set(Object.keys(NOTEBOOK_KIND_LABELS));
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const revision = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;
const isoDate = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
export const notebookEntryKey = (destinationId: string) => NOTEBOOK_ENTRY_PREFIX + destinationId;
export const notebookDraftKey = (destinationId: string) => NOTEBOOK_DRAFT_PREFIX + destinationId;

function validTrail(destinationId: string, trailId: unknown): trailId is string | null | undefined {
  return trailId === undefined || trailId === null || (typeof trailId === "string" && !!getWorldTrail(trailId)?.stops.some((stop) => stop.destinationId === destinationId));
}

export function normalizeNotebookDraft(destinationId: string, value: unknown): NotebookDraft | null {
  if (!getWorldDestination(destinationId) || !record(value) || !validKinds.has(value.kind as string) || typeof value.text !== "string" || value.text.length > NOTEBOOK_MAX_TEXT_LENGTH || !validTrail(destinationId, value.trailId) || (value.baseRevision !== null && !revision(value.baseRevision))) return null;
  return { kind: value.kind as NotebookKind, text: value.text, trailId: value.trailId, baseRevision: value.baseRevision as number | null };
}

export function normalizeNotebookEntry(destinationId: string, value: unknown): NotebookEntry | null {
  if (!record(value) || value.destinationId !== destinationId || !revision(value.revision) || !isoDate(value.createdAt) || !isoDate(value.updatedAt) || value.updatedAt < value.createdAt) return null;
  const draft = normalizeNotebookDraft(destinationId, { ...value, baseRevision: value.revision });
  if (!draft || !draft.text.trim()) return null;
  return { destinationId, kind: draft.kind, text: draft.text.trim(), trailId: draft.trailId, createdAt: value.createdAt, updatedAt: value.updatedAt, revision: value.revision };
}

type ReadResult<T> = { status: "empty"; deletedRevision?: number } | { status: "valid"; value: T } | { status: "blocked" | "unavailable"; error: string };
function readRecord<T>(getStorage: () => NotebookStorage, key: string, normalize: (value: unknown) => T | null, allowDeleted = false): ReadResult<T> {
  let raw: string | null;
  try { raw = getStorage().getItem(key); }
  catch { return { status: "unavailable", error: "这个浏览器暂时无法读取记录。文字还在本页，请稍后再试。" }; }
  if (raw === null) return { status: "empty" };
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.version !== 1) return { status: "blocked", error: "这里有无法识别的旧记录，暂时不能覆盖。你的文字仍留在草稿里。" };
    if (allowDeleted && value.deleted === true && revision(value.revision) && !("data" in value)) return { status: "empty", deletedRevision: value.revision };
    const normalized = normalize(value.data);
    return normalized ? { status: "valid", value: normalized } : { status: "blocked", error: "这条记录暂时读不完整，为了保留它，暂时不能覆盖。" };
  } catch { return { status: "blocked", error: "这条记录暂时读不完整，为了保留它，暂时不能覆盖。" }; }
}

const fail = (error: string): NotebookMutationResult => ({ ok: false, persisted: false, error });
const success = (): NotebookMutationResult => ({ ok: true, persisted: true });
const conflictMessage = "另一个页面刚更新了这里的记录。你的草稿还在，请先回看新记录，再决定怎样修改。";

/** One storage key per destination prevents unrelated additions in other tabs from replacing each other. */
export function createWorldNotebookStore(options: { storage: () => NotebookStorage; draftStorage: () => NotebookStorage; now?: () => Date }) {
  let snapshot = EMPTY_NOTEBOOK_SNAPSHOT;
  const entries = new Map<string, NotebookEntry>();
  const drafts = new Map<string, NotebookDraft>();
  // Failed draft writes survive client navigation. Null represents a discarded draft awaiting removal.
  const pendingDrafts = new Map<string, NotebookDraft | null>();
  const entryErrors = new Set<string>();
  const draftErrors = new Set<string>();
  const listeners = new Set<() => void>();
  const readEntry = (id: string) => readRecord(options.storage, notebookEntryKey(id), (value) => normalizeNotebookEntry(id, value), true);
  const readDraft = (id: string) => readRecord(options.draftStorage, notebookDraftKey(id), (value) => normalizeNotebookDraft(id, value));

  function emit() {
    const next: NotebookSnapshot = {
      ready: true,
      entries: [...entries.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.destinationId.localeCompare(b.destinationId)),
      drafts: Object.fromEntries(drafts),
      storageError: entryErrors.size > 0 || draftErrors.size > 0 || pendingDrafts.size > 0,
    };
    // Storage/pageshow events can report state already seen. Keep React's snapshot stable.
    if (snapshot.ready && snapshot.storageError === next.storageError && JSON.stringify(snapshot.entries) === JSON.stringify(next.entries) && JSON.stringify(snapshot.drafts) === JSON.stringify(next.drafts)) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
  }

  function refresh() {
    for (const { id } of worldDestinations) {
      const entry = readEntry(id);
      if (entry.status === "valid") { entries.set(id, entry.value); entryErrors.delete(id); }
      else if (entry.status === "empty") { entries.delete(id); entryErrors.delete(id); }
      else { entryErrors.add(id); if (entry.status === "blocked") entries.delete(id); }
      if (pendingDrafts.has(id)) {
        const pending = pendingDrafts.get(id);
        if (pending) drafts.set(id, pending); else drafts.delete(id);
        continue;
      }
      const draft = readDraft(id);
      if (draft.status === "valid") { drafts.set(id, draft.value); draftErrors.delete(id); }
      else if (draft.status === "empty") { drafts.delete(id); draftErrors.delete(id); }
      else { draftErrors.add(id); if (draft.status === "blocked") drafts.delete(id); }
    }
    emit();
  }

  function saveDraft(destinationId: string, value: NotebookDraft): NotebookMutationResult {
    const draft = normalizeNotebookDraft(destinationId, value);
    if (!draft) return fail("这段文字暂时不能保存，请确认地点、标记，并写在 300 字以内。");
    drafts.set(destinationId, draft);
    const existing = readDraft(destinationId);
    if (existing.status === "blocked") {
      pendingDrafts.set(destinationId, draft); draftErrors.add(destinationId); emit();
      return fail(existing.error);
    }
    try {
      options.draftStorage().setItem(notebookDraftKey(destinationId), JSON.stringify({ version: 1, data: draft }));
      pendingDrafts.delete(destinationId); draftErrors.delete(destinationId); emit(); return success();
    } catch {
      pendingDrafts.set(destinationId, draft); draftErrors.add(destinationId); emit();
      return fail("草稿暂时只留在本页，刷新或关掉页面可能丢失。请先保留文字，再试一次。");
    }
  }

  function discardDraft(destinationId: string): NotebookMutationResult {
    if (!getWorldDestination(destinationId)) return fail("找不到这个地点。");
    try {
      options.draftStorage().removeItem(notebookDraftKey(destinationId));
      pendingDrafts.delete(destinationId); drafts.delete(destinationId); draftErrors.delete(destinationId); emit(); return success();
    } catch {
      // Keep the visible draft when deletion fails, so the child can retry or copy it.
      draftErrors.add(destinationId); emit();
      return fail("暂时不能清除草稿，文字还留着。可以稍后再试。");
    }
  }

  function save(destinationId: string, value: NotebookDraft): NotebookMutationResult {
    const draft = normalizeNotebookDraft(destinationId, value);
    if (!draft || !draft.text.trim()) return fail("先用自己的话写一句发现或问题吧，最多 300 字。");
    // Preserve input even when storage or an optimistic revision check prevents saving.
    saveDraft(destinationId, draft);
    const latest = readEntry(destinationId);
    if (latest.status === "blocked" || latest.status === "unavailable") { entryErrors.add(destinationId); emit(); return fail(latest.error); }
    const current = latest.status === "valid" ? latest.value : null;
    if ((current?.revision ?? null) !== draft.baseRevision) { refresh(); return fail(conflictMessage); }
    const lastRevision = current?.revision ?? (latest.status === "empty" ? latest.deletedRevision : 0) ?? 0;
    if (lastRevision === Number.MAX_SAFE_INTEGER) return fail("这条记录暂时不能继续更新，文字仍留在草稿里。");
    const now = (options.now?.() ?? new Date()).toISOString();
    const entry: NotebookEntry = { destinationId, kind: draft.kind, text: draft.text.trim(), trailId: draft.trailId, createdAt: current?.createdAt ?? now, updatedAt: current && current.updatedAt > now ? current.updatedAt : now, revision: lastRevision + 1 };
    try { options.storage().setItem(notebookEntryKey(destinationId), JSON.stringify({ version: 1, data: entry })); }
    catch { entryErrors.add(destinationId); emit(); return fail("还没能存进浏览器，文字已保留在草稿里。请稍后再试，先不要关闭页面。"); }
    entries.set(destinationId, entry); entryErrors.delete(destinationId);
    // Remove only this destination's draft; other unfinished thoughts stay intact.
    const cleared = discardDraft(destinationId);
    if (!cleared.ok) {
      // A persisted entry is a real success even if a stale draft could not be removed.
      pendingDrafts.set(destinationId, null); drafts.delete(destinationId); emit();
      return { ...success(), error: "发现已保存，但旧草稿暂时清除不了；下次打开时请以已保存的发现为准。" };
    }
    return success();
  }

  function remove(destinationId: string, expectedRevision: number): NotebookMutationResult {
    if (!getWorldDestination(destinationId) || !revision(expectedRevision)) return fail("找不到这条记录。");
    const latest = readEntry(destinationId);
    if (latest.status === "blocked" || latest.status === "unavailable") { entryErrors.add(destinationId); emit(); return fail(latest.error); }
    if (latest.status !== "valid" || latest.value.revision !== expectedRevision) { refresh(); return fail(conflictMessage); }
    // Erase the child's text but retain the counter. A recreated card must not reuse an old revision.
    try { options.storage().setItem(notebookEntryKey(destinationId), JSON.stringify({ version: 1, deleted: true, revision: latest.value.revision })); }
    catch { entryErrors.add(destinationId); emit(); return fail("还没能删除这条记录，请稍后再试。"); }
    entries.delete(destinationId); entryErrors.delete(destinationId); emit(); return success();
  }

  return { getSnapshot: () => snapshot, subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, refresh, save, saveDraft, discardDraft, remove };
}
