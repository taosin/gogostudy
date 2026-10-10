import assert from "node:assert/strict";
import { test } from "node:test";
import { learningStorageKey } from "../lib/learning-progress";
import { WORLD_STORAGE_KEY } from "../lib/world-progress";
import { createWorldNotebookStore, notebookDraftKey, notebookEntryKey, normalizeNotebookDraft, normalizeNotebookEntry, type NotebookDraft, type NotebookStorage } from "../lib/world-notebook";

class MemoryStorage implements NotebookStorage {
  data = new Map<string, string>();
  failRead = false;
  failWrite = false;
  failRemove = false;
  getItem(key: string) { if (this.failRead) throw new Error("blocked"); return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.failWrite) throw new Error("quota"); this.data.set(key, value); }
  removeItem(key: string) { if (this.failRemove) throw new Error("blocked"); this.data.delete(key); }
}
const math = "math:count";
const geography = "geography:geography-relative";
const draft = (text = "点过一个，就把它挪到旁边。", baseRevision: number | null = null): NotebookDraft => ({ kind: "discovery", text, baseRevision });
function setup(storage = new MemoryStorage(), draftStorage = new MemoryStorage()) {
  let now = "2026-10-10T02:00:00.000Z";
  const store = createWorldNotebookStore({ storage: () => storage, draftStorage: () => draftStorage, now: () => new Date(now) });
  store.refresh();
  return { store, storage, draftStorage, setNow: (value: string) => { now = value; } };
}

test("notebook accepts only real places, known marks, bounded personal text and a matching route", () => {
  assert.ok(normalizeNotebookDraft(math, draft("")), "empty text may be an unfinished draft");
  assert.ok(normalizeNotebookDraft(math, draft("字".repeat(300))));
  for (const bad of [null, [], { ...draft(), kind: "completed" }, { ...draft(), baseRevision: -1 }, { ...draft(), baseRevision: "1" }, { ...draft(), text: "字".repeat(301) }, { ...draft(), trailId: "water-trip" }]) assert.equal(normalizeNotebookDraft(math, bad), null);
  assert.equal(normalizeNotebookDraft("javascript:alert(1)", draft()), null);
  assert.ok(normalizeNotebookDraft(math, { ...draft(), trailId: "first-journey" }));
  const normalized = normalizeNotebookDraft(math, { ...draft(), href: "https://untrusted.invalid", passedCheckIds: ["count-understand"] });
  assert.ok(normalized && !("href" in normalized) && !("passedCheckIds" in normalized));
});

test("saving creates one current thought per destination, preserves original creation time and records no achievement", () => {
  const { store, storage, setNow } = setup();
  storage.setItem(WORLD_STORAGE_KEY, "existing route");
  storage.setItem(learningStorageKey("math"), "existing check evidence");
  assert.deepEqual(store.save(math, draft("  我数了五个。  ")), { ok: true, persisted: true });
  const first = store.getSnapshot().entries[0];
  assert.equal(first.text, "我数了五个。");
  assert.equal(first.revision, 1);
  setNow("2026-10-10T03:00:00.000Z");
  assert.equal(store.save(math, { ...draft("我想再换个顺序数。", 1), kind: "retry", trailId: "first-journey" }).ok, true);
  const updated = store.getSnapshot().entries[0];
  assert.equal(store.getSnapshot().entries.length, 1);
  assert.equal(updated.createdAt, first.createdAt);
  assert.equal(updated.updatedAt, "2026-10-10T03:00:00.000Z");
  assert.equal(updated.revision, 2);
  assert.equal(updated.trailId, "first-journey");
  assert.ok(!("completedLessonIds" in updated));
  assert.equal(storage.getItem(WORLD_STORAGE_KEY), "existing route");
  assert.equal(storage.getItem(learningStorageKey("math")), "existing check evidence");
});

test("blank thoughts and oversized text cannot become saved cards or replace an existing card", () => {
  const { store } = setup();
  for (const text of ["", " \n\t ", "字".repeat(301)]) assert.equal(store.save(math, draft(text)).ok, false);
  assert.deepEqual(store.getSnapshot().entries, []);
  store.save(math, draft());
  assert.equal(store.save(math, draft(" ", 1)).ok, false);
  assert.equal(store.getSnapshot().entries[0].text, draft().text);
});

test("drafts restore after reload in the same tab while another tab keeps its own unfinished text", () => {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const first = setup(local, session);
  first.store.saveDraft(math, draft("我还没数完。"));
  first.store.saveDraft(geography, { ...draft("椅子在谁的左边？"), kind: "question" });
  const reloaded = setup(local, session);
  assert.equal(reloaded.store.getSnapshot().drafts[math].text, "我还没数完。");
  assert.equal(reloaded.store.getSnapshot().drafts[geography].kind, "question");
  const otherTab = setup(local);
  assert.deepEqual(otherTab.store.getSnapshot().drafts, {});
  assert.deepEqual(first.store.getSnapshot().entries, []);
});

test("independent destinations written in different tabs survive without replacing the whole notebook", () => {
  const local = new MemoryStorage();
  const left = setup(local).store;
  const right = setup(local).store;
  left.save(math, draft());
  right.save(geography, draft("先说清站在谁的位置。"));
  left.refresh(); right.refresh();
  assert.equal(left.getSnapshot().entries.length, 2);
  assert.deepEqual(left.getSnapshot().entries, right.getSnapshot().entries);
});

test("an incoming edit never overwrites a local draft and an old revision cannot save or delete the new record", () => {
  const local = new MemoryStorage();
  const left = setup(local).store;
  left.save(math, draft());
  const right = setup(local).store;
  left.saveDraft(math, draft("我的未完成想法", 1));
  right.save(math, draft("另一个页面已补充的新观察", 1));
  left.refresh();
  assert.equal(left.getSnapshot().entries[0].revision, 2);
  assert.equal(left.getSnapshot().drafts[math].text, "我的未完成想法");
  assert.equal(left.getSnapshot().drafts[math].baseRevision, 1);
  assert.equal(left.save(math, left.getSnapshot().drafts[math]).ok, false);
  assert.equal(left.remove(math, 1).ok, false);
  assert.equal(left.getSnapshot().entries[0].text, "另一个页面已补充的新观察");
  assert.equal(left.save(math, { ...left.getSnapshot().drafts[math], baseRevision: 2 }).ok, true, "only an explicit rebase can replace the newer record");
});

test("a newly created record elsewhere prevents an older blank-start draft from overwriting it", () => {
  const local = new MemoryStorage();
  const left = setup(local).store;
  const right = setup(local).store;
  left.saveDraft(math, draft("还没存的观察"));
  right.save(math, draft("已经存的观察"));
  assert.equal(left.save(math, left.getSnapshot().drafts[math]).ok, false);
  assert.equal(left.getSnapshot().entries[0].text, "已经存的观察");
  assert.equal(left.getSnapshot().drafts[math].text, "还没存的观察");
});

test("unknown versions and corrupt existing entries stay byte-for-byte intact and do not block other places", () => {
  for (const raw of ["{broken", '{"version":2,"data":{"future":"keep me"}}', '{"version":1,"data":{}}']) {
    const local = new MemoryStorage();
    local.setItem(notebookEntryKey(math), raw);
    const { store } = setup(local);
    assert.equal(store.getSnapshot().storageError, true);
    assert.equal(store.save(math, draft()).ok, false);
    assert.equal(store.remove(math, 1).ok, false);
    assert.equal(local.getItem(notebookEntryKey(math)), raw);
    assert.equal(store.getSnapshot().drafts[math].text, draft().text);
    assert.equal(store.save(geography, draft()).ok, true);
  }
});

test("quota failure retains a recoverable draft, never reports saved, and can be retried after storage recovers", () => {
  const { store, storage, draftStorage } = setup();
  storage.failWrite = true;
  const failed = store.save(math, draft());
  assert.equal(failed.ok, false);
  assert.equal(failed.persisted, false);
  assert.deepEqual(store.getSnapshot().entries, []);
  assert.equal(store.getSnapshot().drafts[math].text, draft().text);
  assert.ok(draftStorage.getItem(notebookDraftKey(math)));
  storage.failWrite = false;
  assert.equal(store.save(math, store.getSnapshot().drafts[math]).persisted, true);
  assert.equal(store.getSnapshot().entries.length, 1);
  assert.equal(store.getSnapshot().drafts[math], undefined);
  assert.equal(store.getSnapshot().storageError, false);
});

test("blocked browser storage retains this tab's draft through refresh and recovers without faking a saved record", () => {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  local.failRead = true; local.failWrite = true; session.failRead = true; session.failWrite = true;
  const { store } = setup(local, session);
  assert.equal(store.save(math, draft("仍想保留的一句话")).ok, false);
  store.refresh();
  assert.equal(store.getSnapshot().drafts[math].text, "仍想保留的一句话");
  assert.equal(store.getSnapshot().storageError, true);
  local.failRead = false; local.failWrite = false; session.failRead = false; session.failWrite = false;
  store.refresh();
  assert.equal(store.save(math, store.getSnapshot().drafts[math]).ok, true);
  assert.equal(store.getSnapshot().entries[0].text, "仍想保留的一句话");
  assert.equal(store.getSnapshot().storageError, false);
});

test("failed deletions keep the card, successful deletions remove only that card and leave unfinished drafts", () => {
  const { store, storage } = setup();
  store.save(math, draft()); store.save(geography, draft());
  store.saveDraft(math, draft("想接着说的内容", 1));
  storage.failWrite = true;
  assert.equal(store.remove(math, 1).ok, false);
  assert.equal(store.getSnapshot().entries.length, 2);
  storage.failWrite = false;
  assert.equal(store.remove(math, 1).ok, true);
  assert.equal(store.getSnapshot().entries[0].destinationId, geography);
  assert.equal(store.getSnapshot().drafts[math].text, "想接着说的内容");
  assert.equal(store.save(math, store.getSnapshot().drafts[math]).ok, false, "deleted-entry drafts need an explicit fresh start");
  assert.equal(store.save(math, { ...store.getSnapshot().drafts[math], baseRevision: null }).ok, true);
});

test("discard is isolated to one draft and unsuccessful clearing keeps the child's text visible", () => {
  const { store, draftStorage } = setup();
  store.saveDraft(math, draft()); store.saveDraft(geography, draft("方向的草稿"));
  draftStorage.failRemove = true;
  assert.equal(store.discardDraft(math).ok, false);
  assert.ok(store.getSnapshot().drafts[math]);
  draftStorage.failRemove = false;
  assert.equal(store.discardDraft(math).ok, true);
  assert.equal(store.getSnapshot().drafts[math], undefined);
  assert.equal(store.getSnapshot().drafts[geography].text, "方向的草稿");
});

test("invalid saved timestamps and mismatched destinations never become rendered entries", () => {
  const { store } = setup(); store.save(math, draft());
  const valid = store.getSnapshot().entries[0];
  for (const changed of [{ createdAt: "yesterday" }, { updatedAt: "2020-01-01T00:00:00.000Z" }, { revision: 0 }, { destinationId: geography }, { kind: "passed" }, { text: " " }]) assert.equal(normalizeNotebookEntry(math, { ...valid, ...changed }), null);
  assert.deepEqual(normalizeNotebookEntry(math, valid), valid);
});

test("entry order follows update time, and a clock moving backwards does not erase creation or update time", () => {
  const { store, setNow } = setup();
  store.save(math, draft());
  setNow("2026-10-10T03:00:00.000Z"); store.save(geography, draft());
  assert.equal(store.getSnapshot().entries[0].destinationId, geography);
  setNow("2026-10-10T04:00:00.000Z"); store.save(math, draft("新的数数发现", 1));
  assert.equal(store.getSnapshot().entries[0].destinationId, math);
  setNow("2020-01-01T00:00:00.000Z"); store.save(math, draft("时钟倒退后继续记录", 2));
  assert.equal(store.getSnapshot().entries[0].updatedAt, "2026-10-10T04:00:00.000Z");
  assert.equal(store.getSnapshot().entries[0].createdAt, "2026-10-10T02:00:00.000Z");
});

test("same-tab subscribers receive shared snapshots and can unsubscribe without affecting other views", () => {
  const { store } = setup();
  let left = 0; let right = 0;
  const unsubscribe = store.subscribe(() => { left++; });
  store.subscribe(() => { right++; });
  store.saveDraft(math, draft());
  assert.equal(left, 1); assert.equal(right, 1);
  unsubscribe(); store.saveDraft(math, draft("第二次想法"));
  assert.equal(left, 1); assert.equal(right, 2);
});

test("deleting and recreating a card after reload never reuses the revision held by an older tab", () => {
  const local = new MemoryStorage();
  const older = setup(local).store;
  older.save(math, draft("原先保存的发现"));
  older.saveDraft(math, draft("旧页面还在写的内容", 1));
  const deleting = setup(local).store;
  assert.equal(deleting.remove(math, 1).ok, true);
  assert.deepEqual(deleting.getSnapshot().entries, []);
  assert.deepEqual(JSON.parse(local.getItem(notebookEntryKey(math))!), { version: 1, deleted: true, revision: 1 }, "deletion retains only a counter, never the child's deleted text");
  const recreated = setup(local).store;
  assert.equal(recreated.getSnapshot().entries.length, 0);
  assert.equal(recreated.getSnapshot().storageError, false);
  assert.equal(recreated.save(math, draft("重新创建的新发现")).ok, true);
  assert.equal(recreated.getSnapshot().entries[0].revision, 2);
  assert.equal(older.save(math, older.getSnapshot().drafts[math]).ok, false);
  assert.equal(older.remove(math, 1).ok, false);
  assert.equal(older.getSnapshot().entries[0].text, "重新创建的新发现");
  assert.equal(older.getSnapshot().drafts[math].text, "旧页面还在写的内容");
  assert.equal(recreated.remove(math, 2).ok, true);
  const third = setup(local).store;
  assert.equal(third.save(math, draft("第三张新卡")).ok, true);
  assert.equal(third.getSnapshot().entries[0].revision, 3);
});

test("invalid deletion markers cannot erase data or reset the revision counter", () => {
  for (const raw of [JSON.stringify({ version: 1, deleted: true, revision: 0 }), JSON.stringify({ version: 1, deleted: true, revision: "1" }), JSON.stringify({ version: 1, deleted: true, revision: 1, data: null })]) {
    const local = new MemoryStorage(); local.setItem(notebookEntryKey(math), raw);
    const { store } = setup(local);
    assert.equal(store.getSnapshot().storageError, true);
    assert.equal(store.save(math, draft()).ok, false);
    assert.equal(local.getItem(notebookEntryKey(math)), raw);
  }
});

test("unchanged storage refreshes preserve the snapshot identity without notifying React again", () => {
  const { store } = setup();
  store.save(math, draft());
  store.saveDraft(geography, draft("还在观察的草稿"));
  const snapshot = store.getSnapshot();
  let notifications = 0;
  store.subscribe(() => { notifications++; });
  store.refresh(); store.refresh();
  assert.strictEqual(store.getSnapshot(), snapshot);
  assert.equal(notifications, 0);
  store.saveDraft(geography, draft("观察后补充的一句"));
  assert.equal(notifications, 1);
});
