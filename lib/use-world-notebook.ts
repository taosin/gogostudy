"use client";

import { useSyncExternalStore } from "react";
import { createWorldNotebookStore, EMPTY_NOTEBOOK_SNAPSHOT, NOTEBOOK_DRAFT_PREFIX, NOTEBOOK_ENTRY_PREFIX, NOTEBOOK_EVENT, type NotebookDraft } from "./world-notebook";

// Created only from browser subscriptions/actions. Every mounted view shares one tab-local store.
let browserStore: ReturnType<typeof createWorldNotebookStore> | null = null;
let subscriberCount = 0;
function getStore() {
  if (!browserStore) browserStore = createWorldNotebookStore({ storage: () => window.localStorage, draftStorage: () => window.sessionStorage });
  return browserStore;
}
function sync(event: StorageEvent) {
  if (event.key === null || event.key.startsWith(NOTEBOOK_ENTRY_PREFIX) || event.key.startsWith(NOTEBOOK_DRAFT_PREFIX)) browserStore?.refresh();
}
function refresh() { browserStore?.refresh(); }
function subscribe(listener: () => void) {
  const store = getStore();
  if (subscriberCount++ === 0) {
    window.addEventListener("storage", sync);
    window.addEventListener(NOTEBOOK_EVENT, refresh);
    window.addEventListener("pageshow", refresh);
    store.refresh();
  }
  const unsubscribe = store.subscribe(listener);
  return () => {
    unsubscribe();
    if (--subscriberCount === 0) {
      window.removeEventListener("storage", sync);
      window.removeEventListener(NOTEBOOK_EVENT, refresh);
      window.removeEventListener("pageshow", refresh);
    }
  };
}
const getSnapshot = () => browserStore?.getSnapshot() ?? EMPTY_NOTEBOOK_SNAPSHOT;
const getServerSnapshot = () => EMPTY_NOTEBOOK_SNAPSHOT;
const save = (id: string, draft: NotebookDraft) => getStore().save(id, draft);
const saveDraft = (id: string, draft: NotebookDraft) => getStore().saveDraft(id, draft);
const discardDraft = (id: string) => getStore().discardDraft(id);
const remove = (id: string, expectedRevision: number) => getStore().remove(id, expectedRevision);

export function useWorldNotebook() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { ...snapshot, save, saveDraft, discardDraft, remove };
}
