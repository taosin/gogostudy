import assert from "node:assert/strict";
import { test } from "node:test";
import { claimLearningPlayback, createLearningSpeechPlayer, LEARNING_PLAYBACK_EVENT, selectLearningVoice, splitLearningSpeech, type LearningSpeechSnapshot } from "../lib/learning-playback";

const chineseVoice = { lang: "zh-CN", localService: true, default: false } as SpeechSynthesisVoice;
const englishVoice = { lang: "en-GB", localService: true, default: false } as SpeechSynthesisVoice;

function fixture({ startImmediately = true, claim = () => {} } = {}) {
  const changes: LearningSpeechSnapshot[] = [];
  const spoken: SpeechSynthesisUtterance[] = [];
  const engine = {
    voices: [chineseVoice, englishVoice],
    cancellations: 0,
    pauses: 0,
    resumes: 0,
    throwOnSpeak: 0,
    getVoices() { return this.voices; },
    cancel() { this.cancellations++; },
    pause() { this.pauses++; },
    resume() { this.resumes++; },
    speak(utterance: SpeechSynthesisUtterance) {
      spoken.push(utterance);
      if (this.throwOnSpeak === spoken.length) throw new Error("device failure");
      if (startImmediately) utterance.onstart?.call(utterance, {} as SpeechSynthesisEvent);
    },
  };
  const player = createLearningSpeechPlayer({
    synthesis: engine,
    createUtterance: (text) => ({ text } as SpeechSynthesisUtterance),
    claim,
    onChange: (snapshot) => changes.push(snapshot),
  });
  return { player, engine, spoken, changes, latest: () => changes.at(-1)! };
}

test("voice selection uses Mandarin for Chinese and prefers the requested English locale", () => {
  const cantonese = { lang: "zh-HK", localService: true };
  const cantoneseScript = { lang: "zh-Hant-HK", localService: true };
  const remoteChinese = { lang: "zh_CN", localService: false };
  const american = { lang: "en-US", localService: true };
  assert.equal(selectLearningVoice([cantonese, cantoneseScript], "zh-CN"), undefined);
  assert.equal(selectLearningVoice([american], "zh-CN"), undefined);
  assert.equal(selectLearningVoice([remoteChinese, chineseVoice], "zh-CN"), chineseVoice);
  assert.equal(selectLearningVoice([american, englishVoice], "en-GB"), englishVoice);
  assert.equal(selectLearningVoice([american], "en-GB"), american);
});

test("long narration is split without dropping punctuation or content", () => {
  const text = "地球绕着太阳公转。" + "水滴".repeat(170) + "！";
  const chunks = splitLearningSpeech(text);
  assert.ok(chunks.length > 2);
  assert.ok(chunks.every((part) => part.length <= 160));
  assert.equal(chunks.join(""), text);
  assert.deepEqual(splitLearningSpeech("  \n  "), []);
});

test("a missing voice never starts or claims audio, and late voices are picked up on the next click", () => {
  let claims = 0;
  const f = fixture({ claim: () => { claims++; } });
  f.engine.voices = [];
  f.player.play("你好", "zh-CN", 1);
  assert.equal(f.spoken.length, 0);
  assert.equal(claims, 0);
  assert.match(f.latest().message, /暂时没有普通话.*继续看文字/);
  f.engine.voices = [chineseVoice];
  f.player.play("你好", "zh-CN", 0.78);
  assert.equal(f.spoken.length, 1);
  assert.equal(f.spoken[0].voice, chineseVoice);
  assert.equal(f.spoken[0].rate, 0.78);
  assert.equal(claims, 1);
  f.player.dispose();
});

test("pause and resume retain the same utterance, while stop detaches delayed device events", () => {
  const f = fixture();
  f.player.play("地球在转动。", "zh-CN", 1);
  const first = f.spoken[0];
  const lateEnd = first.onend;
  f.player.pause();
  assert.equal(f.latest().state, "paused");
  assert.equal(f.engine.pauses, 1);
  f.player.resume();
  assert.equal(f.latest().state, "playing");
  assert.equal(f.spoken.length, 1);
  f.player.stop();
  assert.equal(f.latest().state, "idle");
  assert.equal(first.onend, null);
  f.player.play("Hello!", "en-GB", 1);
  const count = f.changes.length;
  lateEnd?.call(first, {} as SpeechSynthesisEvent);
  assert.equal(f.changes.length, count);
  assert.equal(f.spoken.length, 2);
  f.player.dispose();
});

test("a later sentence failure falls back to text without throwing from the device event", () => {
  const f = fixture();
  f.engine.throwOnSpeak = 2;
  f.player.play("先观察地球。再看看太阳。", "zh-CN", 1);
  const first = f.spoken[0];
  assert.doesNotThrow(() => first.onend?.call(first, {} as SpeechSynthesisEvent));
  assert.equal(f.latest().state, "idle");
  assert.match(f.latest().message, /继续看文字/);
  assert.equal(f.spoken[1].onend, null);
  f.player.dispose();
});

test("an unstarted voice still times out after a pause and resume", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture({ startImmediately: false });
  f.player.play("等待声音", "zh-CN", 1);
  t.mock.timers.tick(4000);
  f.player.pause();
  t.mock.timers.tick(12000);
  assert.equal(f.latest().state, "paused");
  f.player.resume();
  t.mock.timers.tick(8001);
  assert.equal(f.latest().state, "idle");
  assert.match(f.latest().message, /声音没有启动/);
  f.player.dispose();
});

test("disposing an inactive reader does not cancel someone else's audio or emit updates", () => {
  const f = fixture();
  f.player.play("你好", "zh-CN", 1);
  f.player.stop();
  const cancellations = f.engine.cancellations;
  const updates = f.changes.length;
  f.player.dispose();
  f.player.play("再见", "zh-CN", 1);
  assert.equal(f.engine.cancellations, cancellations);
  assert.equal(f.changes.length, updates);
  assert.equal(f.spoken.length, 1);
});

test("the shared claim event synchronously hands playback to the next audio or video", () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const target = new EventTarget();
  Object.defineProperty(globalThis, "window", { value: target, configurable: true });
  try {
    let firstStopped = false;
    target.addEventListener(LEARNING_PLAYBACK_EVENT, (event) => {
      assert.equal((event as CustomEvent).detail.id, "video-water");
      firstStopped = true;
    });
    claimLearningPlayback("video-water");
    assert.equal(firstStopped, true);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
