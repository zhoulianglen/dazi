import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountTutor } from "../src/tutor/app";
import { readData, STORAGE_KEY } from "../src/tutor/model";
const click = (selector: string) =>
  document.querySelector<HTMLButtonElement>(selector)!.click();
const choose = (selector: string, value: string) => {
  const e = document.querySelector<HTMLSelectElement>(selector)!;
  e.value = value;
  e.dispatchEvent(new Event("change"));
};
const type = (text: string) => {
  const e = document.querySelector<HTMLTextAreaElement>("#typing-input")!;
  e.value = text;
  e.dispatchEvent(
    new InputEvent("input", { inputType: "insertText", data: text }),
  );
};
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
describe("first-run onboarding", () => {
  it("explains the product on first visit and makes skipping visible", () => {
    mount();
    expect(document.querySelector('[data-tour-step="1"]')).not.toBeNull();
    expect(document.querySelector("#onboarding-title")!.textContent).toContain(
      "十指打字",
    );
    expect(
      document.querySelector('[data-action="skip-onboarding"]'),
    ).not.toBeNull();
    expect(
      (document.querySelector("#typing-input") as HTMLTextAreaElement).disabled,
    ).toBe(true);
  });
  it("lets users choose practice language independently of interface language", () => {
    mount();
    choose("#onboarding-language", "zh-pinyin");
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(readData().settings.language).toBe("zh");
    click('[data-action="tour-locale"]');
    expect(document.documentElement.lang).toBe("en");
    expect(readData().settings.language).toBe("zh");
  });
  it("guides F/J placement then completes after actual correct typing", () => {
    mount();
    click('[data-action="tour-next"]');
    expect(document.querySelector('[data-tour-step="2"]')).not.toBeNull();
    expect(document.querySelectorAll(".home-guide-key")).toHaveLength(2);
    click('[data-action="tour-next"]');
    expect(document.querySelector('[data-tour-step="3"]')).not.toBeNull();
    const prefix = document
      .querySelector("#typing-text")!
      .textContent!.slice(0, 3);
    type(prefix);
    expect(document.querySelector("[data-tour-step]")).toBeNull();
    expect(document.querySelector("#typed-count")!.textContent).toBe("3");
    expect(readData().onboarding).toBe("complete");
    expect(readData().history).toHaveLength(0);
  });
  it("does not treat mistakes as the three correct practice keystrokes", () => {
    mount();
    click('[data-action="tour-next"]');
    click('[data-action="tour-next"]');
    type("xxx");
    expect(document.querySelector('[data-tour-step="3"]')).not.toBeNull();
    expect(document.querySelector("#tour-typed-progress")!.textContent).toBe(
      "0 / 3",
    );
  });
  it("remembers skipping and shows an immediate start hint on later visits", () => {
    mount();
    click('[data-action="skip-onboarding"]');
    expect(readData().onboarding).toBe("skipped");
    dispose?.();
    mount();
    expect(document.querySelector("[data-tour-step]")).toBeNull();
    expect(document.querySelector(".start-guidance")).not.toBeNull();
    type(document.querySelector("#typing-text")!.textContent![0]);
    expect(
      document
        .querySelector(".start-guidance")!
        .classList.contains("is-hidden"),
    ).toBe(true);
  });
  it("allows replay from Help without losing current typing progress", () => {
    mount();
    click('[data-action="skip-onboarding"]');
    type(document.querySelector("#typing-text")!.textContent!.slice(0, 4));
    click('[data-action="help"]');
    click('[data-action="replay-onboarding"]');
    expect(document.querySelector('[data-tour-step="1"]')).not.toBeNull();
    click('[data-action="skip-onboarding"]');
    expect(document.querySelector("#typed-count")!.textContent).toBe("4");
  });
  it("does not interrupt returning learners whose older backups include history", () => {
    const record = {
      id: "old",
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ history: [record] }));
    mount();
    expect(document.querySelector("[data-tour-step]")).toBeNull();
    expect(readData().onboarding).toBe("complete");
  });
  it("makes Escape skip optional onboarding and remembers the dismissal", () => {
    mount();
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.querySelector("[data-tour-step]")).toBeNull();
    expect(readData().onboarding).toBe("skipped");
  });
});

it("ignores a detached input blur after restarting and restores focus", () => {
  mount();
  click('[data-action="skip-onboarding"]');
  const oldInput =
    document.querySelector<HTMLTextAreaElement>("#typing-input")!;
  click('[data-action="restart"]');
  oldInput.dispatchEvent(new FocusEvent("blur"));
  expect(
    document
      .querySelector("#practice-overlay")!
      .classList.contains("is-hidden"),
  ).toBe(true);
  type(document.querySelector("#typing-text")!.textContent![0]);
  expect(document.querySelector("#typed-count")!.textContent).toBe("1");
});

it("temporarily restores key and hand hints for a replay without changing preferences", () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      onboarding: "complete",
      settings: { keyboard: false, hands: false, keyHints: false },
    }),
  );
  mount();
  click('[data-action="help"]');
  click('[data-action="replay-onboarding"]');
  click('[data-action="tour-next"]');
  expect(document.querySelector(".keyboard-drawing")).not.toBeNull();
  expect(document.querySelector(".hand-overlay")).not.toBeNull();
  click('[data-action="tour-next"]');
  expect(document.querySelector(".target-key")).not.toBeNull();
  type(document.querySelector("#typing-text")!.textContent!.slice(0, 3));
  expect(readData().settings.keyboard).toBe(false);
  expect(document.querySelector(".keyboard-drawing")).toBeNull();
});

it("does not celebrate an entirely mistyped exercise and allows another try", () => {
  mount();
  click('[data-action="tour-next"]');
  click('[data-action="tour-next"]');
  const length = document.querySelector("#typing-text")!.textContent!.length;
  type("x".repeat(length));
  expect(readData().onboarding).toBe("pending");
  expect(document.querySelector('[data-tour-step="3"]')).not.toBeNull();
  click('.typing-coach [data-action="continue"]');
  type(document.querySelector("#typing-text")!.textContent!.slice(0, 3));
  expect(readData().onboarding).toBe("complete");
});

it("keeps the active textarea mounted when three correct keys finish the guide", () => {
  mount();
  click('[data-action="tour-next"]');
  click('[data-action="tour-next"]');
  const input = document.querySelector("#typing-input");
  type(document.querySelector("#typing-text")!.textContent!.slice(0, 3));
  expect(document.querySelector("#typing-input")).toBe(input);
});
