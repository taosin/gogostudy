import assert from "node:assert/strict";
import { test } from "node:test";
import { getWorldChallenge, worldChallenges } from "../lib/world-challenges";
import { getWorldDestination, worldPlaces } from "../lib/world-content";

test("each knowledge-world place has one distinct life challenge", () => {
  assert.equal(worldPlaces.length, 6);
  assert.equal(worldChallenges.length, worldPlaces.length);
  assert.equal(new Set(worldChallenges.map((challenge) => challenge.id)).size, worldChallenges.length);
  assert.equal(new Set(worldChallenges.map((challenge) => challenge.destinationId)).size, worldChallenges.length);
  for (const place of worldPlaces) {
    const matches = worldChallenges.filter((challenge) => challenge.placeId === place.id);
    assert.equal(matches.length, 1, `${place.id} has exactly one challenge`);
    assert.equal(getWorldChallenge({ placeId: place.id }), matches[0]);
  }
});

test("challenge learning links resolve to their own place and a different real destination", () => {
  for (const challenge of worldChallenges) {
    const destination = getWorldDestination(challenge.destinationId);
    const connection = getWorldDestination(challenge.connectionDestinationId);
    assert.ok(destination, `${challenge.id} links to a registered lesson or simulation`);
    assert.equal(destination.placeId, challenge.placeId);
    assert.ok(connection, `${challenge.id} has a real knowledge connection`);
    assert.notEqual(connection.id, destination.id, `${challenge.id} must not link back to itself as a new connection`);
    assert.ok(challenge.connectionReason.trim(), `${challenge.id} explains its connection`);
    assert.ok(challenge.steps.length >= 2 && challenge.steps.length <= 3, `${challenge.id} remains a short invitation`);
    for (const text of [challenge.title, challenge.duration, ...challenge.materials, ...challenge.steps, ...challenge.prompts]) assert.ok(text.trim(), `${challenge.id} contains usable instructions`);
    assert.ok(challenge.prompts.length > 0, `${challenge.id} offers an expression prompt`);
  }
});

test("destination placements match exactly and cannot fall back to a subject challenge", () => {
  for (const challenge of worldChallenges) {
    assert.equal(getWorldChallenge({ destinationId: challenge.destinationId }), challenge);
    assert.equal(getWorldChallenge({ placeId: challenge.placeId, destinationId: challenge.destinationId }), challenge);
    const otherPlace = worldPlaces.find((place) => place.id !== challenge.placeId);
    assert.ok(otherPlace);
    assert.equal(getWorldChallenge({ placeId: otherPlace.id, destinationId: challenge.destinationId }), undefined);
    assert.equal(getWorldChallenge({ placeId: challenge.placeId, destinationId: "missing-lesson" }), undefined);
  }
  assert.equal(getWorldChallenge({}), undefined);
  assert.equal(getWorldChallenge({ destinationId: "" }), undefined);
  assert.equal(getWorldChallenge({ placeId: "math", destinationId: "math:compare" }), undefined);
  assert.equal(getWorldChallenge({ destinationId: "https://example.com" }), undefined);
});

test("the universe challenge attaches only to the day-night experiment", () => {
  const challenge = getWorldChallenge({ placeId: "universe" });
  assert.ok(challenge);
  assert.equal(challenge.destinationId, "universe:lab:day-night");
  assert.equal(getWorldChallenge({ destinationId: "universe:lab:day-night" }), challenge);
  for (const destinationId of ["universe:scale:earth", "universe:lab:orbit", "universe:lab:water-cycle", "universe:relations:earth"]) {
    assert.equal(getWorldChallenge({ placeId: "universe", destinationId }), undefined);
  }
});
