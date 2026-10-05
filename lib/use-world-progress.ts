"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { beginWorldTrail, emptyWorldProgress, leaveWorldTrail, normalizeWorldProgress, parseWorldProgress, selectWorldPlace, toggleWorldQuestion, visitWorldDestination, WORLD_PROGRESS_EVENT, WORLD_STORAGE_KEY, type WorldProgress } from "./world-progress";

// Keep one shared fallback through client-side navigation if browser storage is blocked.
// It is only written in browser callbacks, never during server rendering.
let unsavedProgress: WorldProgress | null = null;
type WorldProgressEventDetail = { progress: WorldProgress; storageError: boolean };

export function useWorldProgress() {
  const [progress, setProgress] = useState(emptyWorldProgress);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const progressRef = useRef(progress);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let restored = unsavedProgress ?? emptyWorldProgress();
      try { if (!unsavedProgress) restored = parseWorldProgress(localStorage.getItem(WORLD_STORAGE_KEY)); }
      catch { setStorageError(true); }
      if (unsavedProgress) setStorageError(true);
      progressRef.current = restored;
      setProgress(restored);
      setReady(true);
    });
    const sync = (event: StorageEvent) => {
      if ((event.key !== WORLD_STORAGE_KEY && event.key !== null) || unsavedProgress) return;
      const restored = parseWorldProgress(event.newValue);
      progressRef.current = restored;
      setProgress(restored);
    };
    const syncThisTab = (event: Event) => {
      const detail = (event as CustomEvent<WorldProgressEventDetail>).detail;
      const restored = normalizeWorldProgress(detail.progress);
      progressRef.current = restored;
      setProgress(restored);
      setStorageError(detail.storageError);
    };
    window.addEventListener("storage", sync);
    window.addEventListener(WORLD_PROGRESS_EVENT, syncThisTab);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", sync);
      window.removeEventListener(WORLD_PROGRESS_EVENT, syncThisTab);
    };
  }, []);

  const update = useCallback((change: (current: WorldProgress) => WorldProgress) => {
    let latest = unsavedProgress ?? progressRef.current;
    try { if (!unsavedProgress) latest = parseWorldProgress(localStorage.getItem(WORLD_STORAGE_KEY)); }
    catch { /* Preserve this visit in memory when storage is unavailable. */ }
    const next = change(latest);
    progressRef.current = next;
    setProgress(next);
    try {
      localStorage.setItem(WORLD_STORAGE_KEY, JSON.stringify(next));
      unsavedProgress = null;
      setStorageError(false);
    } catch { unsavedProgress = next; setStorageError(true); }
    // Arrival, next-stop and backpack views remain in agreement even without storage.
    window.dispatchEvent(new CustomEvent<WorldProgressEventDetail>(WORLD_PROGRESS_EVENT, { detail: { progress: next, storageError: !!unsavedProgress } }));
  }, []);

  const selectPlace = useCallback((id: string) => update((current) => selectWorldPlace(current, id)), [update]);
  const begin = useCallback((id: string) => update((current) => beginWorldTrail(current, id)), [update]);
  const visit = useCallback((id: string) => update((current) => visitWorldDestination(current, id)), [update]);
  const toggleSaved = useCallback((id: string) => update((current) => toggleWorldQuestion(current, id)), [update]);
  const leaveTrail = useCallback(() => update(leaveWorldTrail), [update]);
  return { progress, ready, storageError, selectPlace, begin, visit, toggleSaved, leaveTrail };
}
