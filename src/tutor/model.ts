export type Locale = "zh" | "en";
export type Settings = {
  locale: Locale;
  keyboardType: "iso" | "ansi";
  speedUnit: "characters" | "words";
  textLines: 1 | 2;
  capitals: boolean;
  numbers: boolean;
  punctuation: boolean;
  keyHints: boolean;
  language: Locale;
  chineseMode: "pinyin" | "ime";
  sound: boolean;
  keyboard: boolean;
  hands: boolean;
  automatic: boolean;
  course: number;
  goal: number;
  duration: number;
};
export type Result = {
  extras?: { capitals: boolean; numbers: boolean; punctuation: boolean };
  id: string;
  course: number;
  language: Locale;
  mode: "pinyin" | "ime";
  speed: number;
  accuracy: number;
  seconds: number;
  at: number;
  errors: Record<string, number>;
  count: number;
};
export type Data = { version: 1; settings: Settings; history: Result[] };
export const STORAGE_KEY = "dazi.tutor.v1";
export const defaultSettings = (): Settings => ({
  locale: "zh",
  keyboardType: "iso",
  speedUnit: "characters",
  textLines: 1,
  capitals: false,
  numbers: false,
  punctuation: false,
  keyHints: true,
  language: "en",
  chineseMode: "pinyin",
  sound: true,
  keyboard: true,
  hands: true,
  automatic: true,
  course: 0,
  goal: 15,
  duration: 1,
});
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function validResult(v: unknown): v is Result {
  if (!isObject(v)) return false;
  return (
    (v.extras === undefined ||
      (isObject(v.extras) &&
        ["capitals", "numbers", "punctuation"].every(
          (key) =>
            typeof (v.extras as Record<string, unknown>)[key] === "boolean",
        ))) &&
    typeof v.id === "string" &&
    Number.isInteger(v.course) &&
    (v.course as number) >= 0 &&
    (v.course as number) < 7 &&
    ["zh", "en"].includes(v.language as string) &&
    ["ime", "pinyin"].includes(v.mode as string) &&
    finite(v.speed) &&
    v.speed >= 0 &&
    v.speed < 10000 &&
    finite(v.accuracy) &&
    v.accuracy >= 0 &&
    v.accuracy <= 100 &&
    finite(v.seconds) &&
    v.seconds >= 0 &&
    finite(v.at) &&
    v.at > 0 &&
    finite(v.count) &&
    v.count >= 0 &&
    isObject(v.errors) &&
    Object.entries(v.errors).every(
      ([k, n]) => k.length === 1 && finite(n) && n >= 0,
    )
  );
}
export function parseData(value: unknown): Data {
  const settings = defaultSettings();
  if (isObject(value) && isObject(value.settings)) {
    const s = value.settings;
    for (const key of ["locale", "language"] as const)
      if (s[key] === "en" || s[key] === "zh") settings[key] = s[key];
    if (s.chineseMode === "ime" || s.chineseMode === "pinyin")
      settings.chineseMode = s.chineseMode;
    for (const key of [
      "sound",
      "keyboard",
      "hands",
      "automatic",
      "keyHints",
      "capitals",
      "numbers",
      "punctuation",
    ] as const)
      if (typeof s[key] === "boolean") settings[key] = s[key];
    if (s.keyboardType === "iso" || s.keyboardType === "ansi")
      settings.keyboardType = s.keyboardType;
    if (s.speedUnit === "characters" || s.speedUnit === "words")
      settings.speedUnit = s.speedUnit;
    if (s.textLines === 1 || s.textLines === 2)
      settings.textLines = s.textLines;
    if (
      Number.isInteger(s.course) &&
      (s.course as number) >= 0 &&
      (s.course as number) < 7
    )
      settings.course = s.course as number;
    if ([5, 10, 15, 20, 30].includes(s.goal as number))
      settings.goal = s.goal as number;
    if ([1, 2, 3].includes(s.duration as number))
      settings.duration = s.duration as number;
  }
  return {
    version: 1,
    settings,
    history:
      isObject(value) && Array.isArray(value.history)
        ? value.history.filter(validResult).slice(-2000)
        : [],
  };
}
export function readData(storage?: Pick<Storage, "getItem">): Data {
  try {
    return parseData(
      JSON.parse((storage ?? localStorage).getItem(STORAGE_KEY) || "null"),
    );
  } catch {
    return parseData(null);
  }
}
export function writeData(
  data: Data,
  storage?: Pick<Storage, "setItem">,
): boolean {
  try {
    (storage ?? localStorage).setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export const sameMode = (r: Result, s: Settings) =>
  r.language === s.language &&
  (s.language === "en" || r.mode === s.chineseMode);
export function lessonUnlocked(
  course: number,
  history: Result[],
  settings: Settings,
): boolean {
  return (
    course === 0 ||
    history.some(
      (r) =>
        sameMode(r, settings) &&
        r.course === course - 1 &&
        r.accuracy === 100 &&
        Object.values(r.errors).every((n) => n === 0),
    )
  );
}
export function summarize(history: Result[]) {
  return {
    sessions: history.length,
    best: Math.max(0, ...history.map((r) => r.speed)),
    accuracy: history.length
      ? Math.round(history.reduce((n, r) => n + r.accuracy, 0) / history.length)
      : 0,
    seconds: history.reduce((n, r) => n + r.seconds, 0),
    characters: history.reduce((n, r) => n + r.count, 0),
  };
}
export class Session {
  position = 0;
  mistakes: Record<number, string> = {};
  attempts = 0;
  correct = 0;
  errors: Record<string, number> = {};
  started: number | null = null;
  ended: number | null = null;
  paused = false;
  private accumulated = 0;
  private segment = 0;
  constructor(
    public text: string,
    _now = 0,
    public chinese = false,
    public advanceOnError = false,
  ) {}
  get done() {
    return this.position === this.text.length;
  }
  input(value: string, now: number): boolean {
    if (this.paused || this.done || !value) return false;
    if (this.started === null) {
      this.started = now;
      this.segment = now;
    }
    let ok = true;
    for (const char of value) {
      if (this.done) break;
      this.attempts++;
      if (char === this.text[this.position]) {
        this.position++;
        this.correct++;
      } else {
        const expected = this.text[this.position];
        this.errors[expected] = (this.errors[expected] || 0) + 1;
        ok = false;
        if (this.advanceOnError) {
          this.mistakes[this.position] = char;
          this.position++;
        } else break;
      }
    }
    if (this.done) {
      this.accumulated += now - this.segment;
      this.ended = now;
    }
    return ok;
  }
  backspace() {
    if (!this.paused && !this.done) {
      this.position = Math.max(0, this.position - 1);
      delete this.mistakes[this.position];
    }
  }
  pause(now: number) {
    if (this.paused || this.done) return;
    if (this.started !== null) this.accumulated += now - this.segment;
    this.paused = true;
  }
  resume(now: number) {
    if (!this.paused) return;
    this.segment = now;
    this.paused = false;
  }
  metrics(now: number) {
    const ms =
      this.accumulated +
      (this.started !== null && !this.paused && !this.done
        ? now - this.segment
        : 0);
    const seconds = Math.max(0, ms / 1000);
    return {
      seconds,
      speed:
        seconds > 0
          ? Math.round(
              this.position /
                (this.chinese ? 1 : 5) /
                (Math.max(seconds, 1) / 60),
            )
          : 0,
      charactersPerMinute:
        seconds > 0
          ? Math.round(this.position / (Math.max(seconds, 1) / 60))
          : 0,
      accuracy: this.attempts
        ? Math.round((this.correct / this.attempts) * 100)
        : 100,
    };
  }
}
