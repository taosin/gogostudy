import { test } from "node:test";
import assert from "node:assert/strict";
import { practiceHref, practiceTargetFromHash, practiceViewForTarget, type PracticeTarget } from "../lib/practice-navigation";

test("practice destinations can be opened directly and restored from browser history", () => {
  const destinations: PracticeTarget[] = ["home", "practice", "mistakes", "review", "settings", "parent"];
  for (const destination of destinations) {
    const url = new URL(practiceHref(destination), "https://example.test");
    assert.equal(url.pathname, "/practice");
    assert.equal(practiceTargetFromHash(url.hash), destination);
  }
  assert.equal(practiceViewForTarget("settings"), "home");
  assert.equal(practiceViewForTarget("parent"), "home");
  assert.equal(practiceViewForTarget("mistakes"), "mistakes");
  assert.equal(practiceViewForTarget("review"), "review");
});

test("unrecognized fragments restore camp without interpreting them as destinations", () => {
  for (const hash of ["", "#unknown", "#main-content", "##parent", "#%70arent", "#parent?next=https://example.org", "#javascript:alert(1)", "#https://example.org", "#../parent", "#PARENT"]) {
    assert.equal(practiceTargetFromHash(hash), "home", hash);
  }
});
