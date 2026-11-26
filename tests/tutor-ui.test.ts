import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountTutor } from "../src/tutor/app";
import { STORAGE_KEY } from "../src/tutor/model";
const click = (selector: string) =>
  document.querySelector<HTMLButtonElement>(selector)!.click();
const choose = (selector: string, value: string) => {
  const el = document.querySelector<HTMLSelectElement>(selector)!;
  el.value = value;
  el.dispatchEvent(new Event("change"));
};
const type = (text: string) => {
  const el = document.querySelector<HTMLTextAreaElement>("#typing-input")!;
  el.value = text;
  el.dispatchEvent(
    new InputEvent("input", { inputType: "insertText", data: text }),
  );
};
const openSettings = () => click('[data-action="settings"]');
const closeSettings = () => click('.drawer [data-action="close-panel"]');
const count = () => document.querySelector("#typed-count")!.textContent;
let dispose: (() => void) | undefined;
const mount = () => {
  dispose = mountTutor(document.querySelector("#app")!);
};
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  document.body.innerHTML = '<div id="app"></div>';
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});
afterEach(() => {
  dispose?.();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("KeyKey reference product flows", () => {
  it("opens on a single canvas with three metrics and hands over the keyboard", () => {
    mount();
    expect(document.querySelectorAll(".metric")).toHaveLength(3);
    expect(document.querySelector(".sidebar")).toBeNull();
    expect(document.querySelector(".practice-card")).toBeNull();
    expect(
      document.querySelector(".keyboard-stage > .keyboard-drawing"),
    ).not.toBeNull();
    expect(
      document.querySelector(".keyboard-stage > .hand-overlay"),
    ).not.toBeNull();
    expect(document.querySelector(".drawer")).toBeNull();
    expect(document.querySelector(".iso-enter")).not.toBeNull();
  });
  it("pauses exactly once when Escape bubbles from the typing field", () => {
    mount();
    document
      .querySelector("#typing-input")!
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    expect(
      (document.querySelector("#typing-input") as HTMLTextAreaElement).disabled,
    ).toBe(true);
    expect(
      document
        .querySelector("#practice-overlay")!
        .classList.contains("is-hidden"),
    ).toBe(false);
    click('[data-action="resume"]');
    expect(
      (document.querySelector("#typing-input") as HTMLTextAreaElement).disabled,
    ).toBe(false);
  });
  it("pauses on blur and resumes with a single click", () => {
    mount();
    const input = document.querySelector<HTMLTextAreaElement>("#typing-input")!;
    type(document.querySelector("#typing-text")!.textContent![0]);
    input.dispatchEvent(new FocusEvent("blur"));
    expect(input.disabled).toBe(true);
    click('[data-action="resume"]');
    expect(
      (document.querySelector("#typing-input") as HTMLTextAreaElement).disabled,
    ).toBe(false);
  });
  it("preserves content language and progress across an interface-language change in the drawer", () => {
    mount();
    const text = document.querySelector("#typing-text")!.textContent!;
    type(text.slice(0, 3));
    openSettings();
    choose("#interface-language", "en");
    expect(document.documentElement.lang).toBe("en");
    expect(count()).toBe("3");
    expect(
      (document.querySelector("#content-language") as HTMLSelectElement).value,
    ).toBe("en");
    closeSettings();
    expect(count()).toBe("3");
    expect(
      (document.querySelector("#typing-input") as HTMLTextAreaElement).disabled,
    ).toBe(false);
  });
  it("ignores in-progress composition and counts a Chinese commit once", () => {
    mount();
    openSettings();
    choose("#content-language", "zh");
    choose("#chinese-mode", "ime");
    closeSettings();
    const text = document.querySelector("#typing-text")!.textContent!;
    const input = document.querySelector<HTMLTextAreaElement>("#typing-input")!;
    input.dispatchEvent(new CompositionEvent("compositionstart"));
    input.value = "ni";
    input.dispatchEvent(
      new InputEvent("input", { data: "ni", isComposing: true }),
    );
    expect(count()).toBe("0");
    const chunk = text.slice(0, 2);
    input.dispatchEvent(
      new CompositionEvent("compositionend", { data: chunk }),
    );
    input.dispatchEvent(
      new InputEvent("input", {
        data: chunk,
        inputType: "insertCompositionText",
      }),
    );
    expect(count()).toBe("2");
    expect(document.querySelector("#accuracy")!.textContent).toBe("100");
  });
  it("shows typos in red, advances, and counts the mistake", () => {
    mount();
    type("x");
    expect(count()).toBe("1");
    expect(document.querySelectorAll(".letter.mistyped")).toHaveLength(1);
    expect(document.querySelector("#typos")!.textContent).toBe("1");
    expect(document.querySelector("#accuracy")!.textContent).toBe("0");
  });
  it("records completed exercises and shows only real activity bars", () => {
    mount();
    type(document.querySelector("#typing-text")!.textContent!);
    expect(document.querySelector("#result-title")).not.toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).history).toHaveLength(
      1,
    );
    click('.lesson-complete [data-action="statistics"]');
    expect(document.querySelectorAll(".chart-column")).toHaveLength(1);
    expect(document.querySelector(".speed-bar")).not.toBeNull();
  });
  it("isolates help from the practice canvas and closes with Escape", () => {
    mount();
    click('[data-action="help"]');
    expect(document.querySelector(".app-shell")!.hasAttribute("inert")).toBe(
      true,
    );
    expect(
      document.querySelector('[role="dialog"]')!.getAttribute("aria-modal"),
    ).toBe("true");
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(document.querySelector(".app-shell")!.hasAttribute("inert")).toBe(
      false,
    );
  });
  it("starts a fresh exercise when returning from statistics after completion", () => {
    mount();
    type(document.querySelector("#typing-text")!.textContent!);
    click('.lesson-complete [data-action="statistics"]');
    click('[data-action="close-statistics"]');
    expect(count()).toBe("0");
    expect(document.querySelectorAll(".letter.current")).toHaveLength(1);
    type(document.querySelector("#typing-text")!.textContent![0]);
    expect(count()).toBe("1");
  });
  it("keeps a visible export warning after storage failure and redraw", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    mount();
    openSettings();
    choose("#interface-language", "en");
    expect(document.querySelector(".storage-warning")!.textContent).toContain(
      "Not saved",
    );
    expect(
      document.querySelector(".storage-warning")!.getAttribute("data-action"),
    ).toBe("export");
    closeSettings();
    expect(document.querySelector(".storage-warning")).not.toBeNull();
  });
  it("preserves the marker when returning from statistics mid-exercise", () => {
    mount();
    type(document.querySelector("#typing-text")!.textContent!.slice(0, 40));
    click('[data-action="statistics"]');
    click('[data-action="close-statistics"]');
    expect(document.querySelectorAll(".letter.current")).toHaveLength(1);
    expect(document.querySelectorAll(".letter.typed")).toHaveLength(40);
  });
  it("allows manual selection of all six lessons and Expert", () => {
    mount();
    openSettings();
    click('[data-action="manual"]');
    expect(document.querySelectorAll("[data-course]")).toHaveLength(7);
    click('[data-course="6"]');
    expect(document.querySelector(".lesson-current")!.textContent).toContain(
      "专家",
    );
    closeSettings();
    expect(document.querySelector("#typing-text")!.textContent).toMatch(
      /[b-z]/,
    );
  });
  it("switches keyboard shape, text rows and hand hints independently", () => {
    mount();
    openSettings();
    choose("#keyboard-type", "ansi");
    choose("#text-lines", "2");
    click('[data-toggle="hands"]');
    closeSettings();
    expect(document.querySelector(".iso-enter")).toBeNull();
    expect(document.querySelector(".two-lines")).not.toBeNull();
    expect(document.querySelector(".hand-overlay")).toBeNull();
    expect(document.querySelector(".keyboard-drawing")).not.toBeNull();
  });
  it("restarts with actual capitals, numbers and punctuation when enabled", () => {
    mount();
    openSettings();
    click('[data-toggle="capitals"]');
    click('[data-toggle="numbers"]');
    click('[data-toggle="punctuation"]');
    closeSettings();
    const text = document.querySelector("#typing-text")!.textContent!;
    expect(text).toMatch(/[A-Z]/);
    expect(text).toMatch(/\d/);
    expect(text).toMatch(/[,.;?!]/);
  });
  it("stops key highlights while preserving hand hints when key hints are off", () => {
    mount();
    openSettings();
    click('[data-toggle="keyHints"]');
    closeSettings();
    expect(document.querySelector(".target-key")).toBeNull();
    expect(document.querySelector(".active-finger")).not.toBeNull();
  });
  it("keeps the single-line behavior as the default instead of a paragraph block", () => {
    mount();
    expect(document.querySelector(".two-lines")).toBeNull();
    expect(document.querySelectorAll(".letter")).toHaveLength(
      document.querySelector("#typing-text")!.textContent!.length,
    );
  });
});

describe("replica review regressions", () => {
  it("keeps Enter available to activate completion buttons normally", () => {
    mount();
    type(document.querySelector("#typing-text")!.textContent!);
    const button = document.querySelector<HTMLButtonElement>(
      '.lesson-complete [data-action="statistics"]',
    )!;
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(document.querySelector("#result-title")).not.toBeNull();
  });
  it("escapes backup record identifiers before rendering them as attributes", () => {
    const settings = { locale: "zh", language: "en" };
    const record = {
      id: '" onclick="alert(1)',
      course: 0,
      language: "en",
      mode: "pinyin",
      speed: 30,
      accuracy: 100,
      seconds: 60,
      at: 1,
      errors: {},
      count: 150,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings, history: [record] }),
    );
    mount();
    click('[data-action="statistics"]');
    expect(
      document.querySelector(".chart-column")!.getAttribute("onclick"),
    ).toBeNull();
    expect(
      document.querySelector(".chart-column")!.getAttribute("data-record"),
    ).toBe(record.id);
  });
  it("does not award specialty records to a mistyped Expert exercise", () => {
    const record = {
      id: "imperfect",
      course: 6,
      language: "en",
      mode: "pinyin",
      speed: 80,
      accuracy: 99,
      seconds: 60,
      at: 1,
      errors: { a: 1 },
      count: 400,
      extras: { numbers: true, capitals: true, punctuation: true },
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings: { language: "en" }, history: [record] }),
    );
    mount();
    click('[data-action="statistics"]');
    expect(
      [...document.querySelectorAll(".extra-lesson>strong")].map(
        (e) => e.textContent,
      ),
    ).toEqual(["0", "0", "0"]);
    expect(
      document.querySelectorAll(".lesson-6 .rating-star.full"),
    ).toHaveLength(0);
  });
});
