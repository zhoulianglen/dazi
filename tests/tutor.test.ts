import { describe, it, expect } from "vitest";
import {
  Session,
  defaultSettings,
  readData,
  writeData,
  lessonUnlocked,
  summarize,
} from "../src/tutor/model";
import { makeExercise, COURSES } from "../src/tutor/content";

describe("desktop tutor learning behavior", () => {
  it("keeps interface and content languages independent", () => {
    const settings = defaultSettings();
    settings.locale = "en";
    expect(settings.language).toBe("en");
    settings.language = "zh";
    expect(settings.locale).toBe("en");
    expect(makeExercise(0, settings, {}, () => 0).source).toMatch(
      /[\u4e00-\u9fff]/,
    );
  });
  it("counts mistakes even when the student subsequently types correctly", () => {
    const s = new Session("asdf", 0);
    s.input("x", 1000);
    expect(s.position).toBe(0);
    s.input("asdf", 13000);
    expect(s.done).toBe(true);
    expect(s.metrics(13000).accuracy).toBe(80);
    expect(s.errors).toEqual({ a: 1 });
    expect(s.metrics(13000).speed).toBe(4);
  });
  it("allows backspace without deleting error history", () => {
    const s = new Session("asdf", 0);
    s.input("ax", 1000);
    s.backspace();
    expect(s.position).toBe(0);
    expect(s.errors).toEqual({ s: 1 });
  });
  it("does not count paused time and remains unstarted until typing", () => {
    const s = new Session("asdf", 0);
    expect(s.metrics(10000).seconds).toBe(0);
    s.input("a", 10000);
    s.pause(12000);
    s.resume(22000);
    s.input("sdf", 24000);
    expect(s.metrics(24000).seconds).toBe(4);
  });
  it("handles committed Chinese text and uses characters per minute", () => {
    const s = new Session("你好世界", 0, true);
    s.input("你好", 1000);
    s.input("世界", 61000);
    expect(s.done).toBe(true);
    expect(s.metrics(61000).speed).toBe(4);
  });
  it("builds real language exercises and pinyin without ambiguous tone marks", () => {
    const zh = makeExercise(
      5,
      { ...defaultSettings(), language: "zh" },
      {},
      () => 0,
    );
    expect(zh.text).toMatch(/^[a-z ,.!?;]+$/);
    expect(zh.source).toMatch(/[\u4e00-\u9fff]/);
    const ime = makeExercise(
      5,
      { ...defaultSettings(), language: "zh", chineseMode: "ime" },
      {},
      () => 0,
    );
    expect(ime.text).toBe(ime.source);
    expect(COURSES.length).toBeGreaterThanOrEqual(6);
  });
  it("keeps every introductory English exercise inside the taught keys", () => {
    COURSES.slice(0, 5).forEach((course, index) => {
      const text = makeExercise(index, defaultSettings(), {}, () => 0).text;
      expect([...text].every((char) => course.chars.includes(char))).toBe(true);
    });
  });
  it("adds practice for weak keys using words valid for the lesson", () => {
    const baseline = makeExercise(0, defaultSettings(), {}, () => 0).text;
    const adapted = makeExercise(0, defaultSettings(), { k: 8 }, () => 0).text;
    expect(
      adapted.split(" ").filter((word) => word.includes("k")).length,
    ).toBeGreaterThan(
      baseline.split(" ").filter((word) => word.includes("k")).length,
    );
    expect(adapted).toMatch(/^[asdfjkl; ]+$/);
  });
  it("adapts Chinese pinyin practice to recently missed letters", () => {
    const settings = { ...defaultSettings(), language: "zh" as const };
    const regular = makeExercise(0, settings, {}, () => 0).text;
    const adaptive = makeExercise(0, settings, { x: 5 }, () => 0).text;
    expect(
      adaptive.split(" ").filter((word) => word.includes("x")).length,
    ).toBeGreaterThan(
      regular.split(" ").filter((word) => word.includes("x")).length,
    );
  });
  it("unlocks only from passing results in the matching content mode", () => {
    const history = [
      {
        id: "1",
        course: 0,
        language: "en" as const,
        mode: "pinyin" as const,
        speed: 30,
        accuracy: 98,
        seconds: 60,
        at: 1,
        errors: {},
        count: 150,
      },
    ];
    expect(lessonUnlocked(1, history, defaultSettings())).toBe(true);
    expect(lessonUnlocked(2, history, defaultSettings())).toBe(false);
    expect(
      lessonUnlocked(1, history, { ...defaultSettings(), language: "zh" }),
    ).toBe(false);
    expect(summarize(history).sessions).toBe(1);
  });
});

describe("resilient local data", () => {
  it("recovers malformed storage and ignores invalid settings/history", () => {
    const storage = { getItem: () => "{broken", setItem: () => {} };
    expect(readData(storage).history).toEqual([]);
    storage.getItem = () =>
      JSON.stringify({
        settings: { locale: "xx", language: "zh", sound: "yes" },
        history: [{ speed: -99 }],
      });
    const data = readData(storage);
    expect(data.settings.locale).toBe("zh");
    expect(data.settings.language).toBe("zh");
    expect(data.settings.sound).toBe(false);
    expect(data.history).toEqual([]);
  });
  it("round trips preferences without failing when storage is full", () => {
    let value = "";
    const storage = {
      getItem: () => value,
      setItem: (_k: string, v: string) => {
        value = v;
      },
    };
    const data = readData(storage);
    data.settings.locale = "en";
    data.settings.language = "zh";
    expect(writeData(data, storage)).toBe(true);
    expect(readData(storage).settings).toEqual(data.settings);
    expect(
      writeData(data, {
        setItem: () => {
          throw new Error("quota");
        },
      }),
    ).toBe(false);
  });
});
