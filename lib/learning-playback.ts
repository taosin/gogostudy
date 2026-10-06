export const LEARNING_PLAYBACK_EVENT = "gogostudy:learning-playback";

export function claimLearningPlayback(id: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LEARNING_PLAYBACK_EVENT, { detail: { id } }));
  }
}

export type LearningSpeechLanguage = "zh-CN" | "en-GB";
export type LearningSpeechState = "idle" | "playing" | "paused";
export type LearningSpeechSnapshot = { state: LearningSpeechState; message: string };

type Voice = { lang: string; localService?: boolean; default?: boolean };

export function selectLearningVoice<T extends Voice>(voices: readonly T[], lang: LearningSpeechLanguage): T | undefined {
  const normalized = (value: string) => value.toLowerCase().replaceAll("_", "-");
  const target = normalized(lang);
  const candidates = voices.filter((voice) => {
    const language = normalized(voice.lang);
    if (lang === "en-GB") return language === "en" || language.startsWith("en-");
    // Cantonese voices are not a Mandarin fallback. Taiwan and Singapore voices are Mandarin.
    return language === "zh" || language.startsWith("cmn") ||
      /^zh-(cn|sg|tw)(-|$)/.test(language) || /^zh-(hans|hant)(-|$)/.test(language) && !/-(hk|mo)(-|$)/.test(language);
  });
  const rank = (voice: T) => (normalized(voice.lang) === target ? 4 : 0) + (voice.localService ? 2 : 0) + (voice.default ? 1 : 0);
  return candidates.reduce<T | undefined>((best, voice) => !best || rank(voice) > rank(best) ? voice : best, undefined);
}

// Short utterances avoid long-text limits on mobile speech engines. Punctuation stays audible.
export function splitLearningSpeech(text: string): string[] {
  const sentences = text.trim().match(/[^。！？!?\n]+[。！？!?\n]*|[。！？!?\n]+/g) ?? [];
  return sentences.flatMap((sentence) => {
    const chunks: string[] = [];
    let remaining = sentence.trim();
    while (remaining.length > 160) {
      const prefix = remaining.slice(0, 160);
      const boundary = Math.max(prefix.lastIndexOf("，"), prefix.lastIndexOf(","), prefix.lastIndexOf(" "));
      const end = boundary >= 80 ? boundary + 1 : 160;
      chunks.push(remaining.slice(0, end));
      remaining = remaining.slice(end).trimStart();
    }
    if (remaining) chunks.push(remaining);
    return chunks;
  });
}

type SpeechEngine = Pick<SpeechSynthesis, "getVoices" | "speak" | "cancel" | "pause" | "resume">;
type SpeechPlayerOptions = {
  synthesis: SpeechEngine;
  createUtterance: (text: string) => SpeechSynthesisUtterance;
  claim: () => void;
  onChange: (snapshot: LearningSpeechSnapshot) => void;
};

export function createLearningSpeechPlayer({ synthesis, createUtterance, claim, onChange }: SpeechPlayerOptions) {
  let utterance: SpeechSynthesisUtterance | null = null;
  let state: LearningSpeechState = "idle";
  let disposed = false;
  let hasStarted = false;
  let startTimer: ReturnType<typeof setTimeout> | null = null;
  const report = (next: LearningSpeechState, message: string) => {
    state = next;
    if (!disposed) onChange({ state: next, message });
  };
  const clearTimer = () => { if (startTimer !== null) clearTimeout(startTimer); startTimer = null; };
  const cancel = () => { try { synthesis.cancel(); } catch { /* Ownership is released even if the device fails. */ } };
  const detach = () => {
    clearTimer();
    if (!utterance) return false;
    utterance.onstart = null; utterance.onend = null; utterance.onerror = null;
    utterance.onpause = null; utterance.onresume = null;
    utterance = null;
    return true;
  };
  const stop = (message = "已停止。想听的时候，再点一次。") => {
    if (!detach()) return;
    cancel();
    report("idle", message);
  };
  const waitForStart = (current: SpeechSynthesisUtterance) => {
    clearTimer();
    startTimer = setTimeout(() => { if (utterance === current) stop("设备声音没有启动。可以再试一次，或继续看文字。"); }, 8000);
  };
  const play = (text: string, lang: LearningSpeechLanguage, rate: number) => {
    if (disposed) return;
    stop();
    const chunks = splitLearningSpeech(text);
    if (!chunks.length) { report("idle", "这段还没有可朗读的文字。"); return; }
    let voice: SpeechSynthesisVoice | undefined;
    try { voice = selectLearningVoice(synthesis.getVoices(), lang); }
    catch { report("idle", "设备声音暂时不可用。可以继续看文字，或请家人陪读。"); return; }
    if (!voice) {
      report("idle", `这台设备暂时没有${lang === "zh-CN" ? "普通话" : "英语"}朗读声音。可以继续看文字，或请家人陪读。`);
      return;
    }
    claim();
    const next = (index: number) => {
      if (disposed) return;
      try {
        const current = createUtterance(chunks[index]);
        utterance = current;
        hasStarted = false;
        current.lang = lang; current.voice = voice; current.rate = rate;
        current.onstart = () => {
          if (utterance !== current) return;
          hasStarted = true; clearTimer(); report("playing", "正在朗读。你可以跟着文字看一看。");
        };
        current.onpause = () => { if (utterance === current) report("paused", "停下来想一想，准备好了再继续。"); };
        current.onresume = () => { if (utterance === current) report("playing", "继续听一听。"); };
        current.onend = () => {
          if (utterance !== current) return;
          detach();
          if (index + 1 < chunks.length) next(index + 1);
          else report("idle", "听完了。现在试着用自己的话说一说。");
        };
        current.onerror = () => {
          if (utterance !== current) return;
          stop("这次声音没能播出来。可以再试一次，或继续看文字。");
        };
        report("playing", "正在准备声音…");
        waitForStart(current);
        synthesis.speak(current);
      } catch {
        detach(); cancel();
        report("idle", "朗读暂时不可用。可以继续看文字，或请家人陪读。");
      }
    };
    try {
      cancel();
      // A cancelled paused utterance can leave the device engine paused for the next reader.
      synthesis.resume();
      next(0);
    } catch {
      detach(); cancel();
      report("idle", "朗读暂时不可用。可以继续看文字，或请家人陪读。");
    }
  };
  return {
    play,
    stop,
    pause() {
      if (!utterance || state !== "playing") return;
      try { clearTimer(); synthesis.pause(); report("paused", "停下来想一想，准备好了再继续。"); }
      catch { stop("这台设备暂时不能暂停。已停止，想听的时候可以重新开始。"); }
    },
    resume() {
      if (!utterance || state !== "paused") return;
      try {
        claim();
        if (!hasStarted) waitForStart(utterance);
        synthesis.resume();
        report("playing", "继续听一听。");
      }
      catch { stop("暂时不能继续朗读。你可以从头再听一次。"); }
    },
    dispose() { disposed = true; stop(); },
  };
}
