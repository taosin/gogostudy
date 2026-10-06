import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";
import { test } from "node:test";
import { learningVideos } from "../lib/learning-media";

const publicRoot = resolve(process.cwd(), "public");
const videos = Object.values(learningVideos);
const mib = 1024 * 1024;

function resource(url: string, extension: string) {
  assert.match(url, new RegExp(`^/media/learning/v[1-9][0-9]*/[a-z0-9-]+(?:\\.zh)?\\.${extension}$`));
  const path = resolve(publicRoot, `.${url}`);
  assert.ok(path.startsWith(publicRoot + sep), `${url} must stay inside public`);
  assert.ok(statSync(path).isFile(), `${url} must be a published file`);
  return readFileSync(path);
}

type Box = { type: string; start: number; content: number; end: number };

function boxes(bytes: Buffer, start = 0, end = bytes.length): Box[] {
  const found: Box[] = [];
  for (let position = start; position < end;) {
    assert.ok(position + 8 <= end, "MP4 box header must not be truncated");
    const shortSize = bytes.readUInt32BE(position);
    const headerSize = shortSize === 1 ? 16 : 8;
    assert.ok(position + headerSize <= end, "MP4 extended box header must be complete");
    const size = shortSize === 0 ? end - position : shortSize === 1 ? Number(bytes.readBigUInt64BE(position + 8)) : shortSize;
    assert.ok(Number.isSafeInteger(size) && size >= headerSize && position + size <= end, "MP4 box must fit its parent");
    found.push({ type: bytes.toString("ascii", position + 4, position + 8), start: position, content: position + headerSize, end: position + size });
    position += size;
  }
  return found;
}

function seconds(timestamp: string) {
  assert.match(timestamp, /^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  const [hour, minute, second] = timestamp.split(":").map(Number);
  assert.ok(minute < 60 && second < 60, "VTT minutes and seconds must be in range");
  return hour * 3600 + minute * 60 + second;
}

test("media catalog uses unique versioned local assets and complete readable alternatives", () => {
  assert.ok(videos.length > 0);
  assert.equal(new Set(videos.map((video) => video.id)).size, videos.length);
  const urls = new Set<string>();
  for (const [id, video] of Object.entries(learningVideos)) {
    assert.equal(video.id, id);
    assert.ok(Number.isInteger(video.durationSeconds) && video.durationSeconds > 0 && video.durationSeconds <= 90, `${id} must remain a short optional clip`);
    for (const text of [video.title, video.description, video.note, ...video.transcript]) {
      assert.ok(text.trim().length > 0 && text.length <= 500, `${id} needs readable, bounded text`);
      assert.ok(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/u.test(text), `${id} has invalid text encoding`);
    }
    assert.ok(video.transcript.length >= 2 && video.transcript.length <= 24, `${id} needs a usable text alternative`);
    for (const url of [video.src, video.poster, video.captions]) {
      assert.ok(!urls.has(url), `${url} must not accidentally point to another clip's asset`);
      urls.add(url);
      assert.equal(url.split("/")[3], video.src.split("/")[3], `${id} must publish its video and alternatives in one version`);
    }
  }
});

test("published MP4s stay small and place playback metadata before frame data", () => {
  let totalBytes = 0;
  for (const video of videos) {
    const bytes = resource(video.src, "mp4");
    totalBytes += bytes.length;
    assert.ok(bytes.length > 1024 && bytes.length <= 2 * mib, `${video.id} exceeds its 2 MiB mobile video budget`);
    const top = boxes(bytes);
    assert.equal(top[0]?.type, "ftyp", `${video.id} must be an MP4 container`);
    const movie = top.find((box) => box.type === "moov");
    const frames = top.find((box) => box.type === "mdat");
    assert.ok(movie && frames, `${video.id} must contain metadata and encoded frames`);
    assert.ok(movie.end <= frames.start, `${video.id} needs faststart metadata before frames`);
    const header = boxes(bytes, movie.content, movie.end).find((box) => box.type === "mvhd");
    assert.ok(header, `${video.id} needs movie duration metadata`);
    const version = bytes[header.content];
    assert.ok(version === 0 || version === 1);
    const timeScaleOffset = header.content + (version === 1 ? 20 : 12);
    const durationOffset = header.content + (version === 1 ? 24 : 16);
    assert.ok(durationOffset + (version === 1 ? 8 : 4) <= header.end);
    const timeScale = bytes.readUInt32BE(timeScaleOffset);
    const duration = version === 1 ? Number(bytes.readBigUInt64BE(durationOffset)) : bytes.readUInt32BE(durationOffset);
    assert.ok(timeScale > 0);
    assert.ok(Math.abs(duration / timeScale - video.durationSeconds) < 0.1, `${video.id} duration does not match the child's displayed time`);
  }
  assert.ok(totalBytes <= 5 * mib, "the initial video collection must fit its 5 MiB budget");
});

test("every caption cue is ordered, fits the clip and matches its text alternative", () => {
  for (const video of videos) {
    const bytes = resource(video.captions, "vtt");
    assert.ok(bytes.length <= 32 * 1024, `${video.id} captions exceed their size budget`);
    const text = bytes.toString("utf8").replace(/\r\n/g, "\n");
    assert.ok(text.startsWith("WEBVTT\n\n"), `${video.id} captions must have a WebVTT header`);
    assert.ok(!text.includes("\uFFFD"), `${video.id} captions must be valid UTF-8`);
    const cues = text.trim().split(/\n\n+/).slice(1);
    let previousEnd = 0;
    const transcript: string[] = [];
    for (const cue of cues) {
      const [timing, ...lines] = cue.split("\n");
      const match = timing.match(/^(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})$/);
      assert.ok(match, `${video.id} has an invalid caption timestamp`);
      const start = seconds(match[1]), end = seconds(match[2]);
      assert.ok(start >= previousEnd && end > start && end <= video.durationSeconds, `${video.id} caption must not overlap or run past the clip`);
      const line = lines.join("").trim();
      assert.ok(line.length > 0, `${video.id} has an empty caption`);
      transcript.push(line);
      previousEnd = end;
    }
    assert.deepEqual(transcript, video.transcript, `${video.id} captions and readable transcript must stay in sync`);
  }
});

test("all video posters are bounded WebP files", () => {
  for (const video of videos) {
    const bytes = resource(video.poster, "webp");
    assert.ok(bytes.length > 20 && bytes.length <= 200 * 1024, `${video.id} poster exceeds its 200 KiB budget`);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, `${video.id} poster must not be truncated`);
  }
});
