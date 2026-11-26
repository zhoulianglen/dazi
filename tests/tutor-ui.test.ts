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
describe("complete tutor flows", () => {
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
  it("really pauses on field blur and resumes with a single click", () => {
    mount();
    const input = document.querySelector<HTMLTextAreaElement>("#typing-input")!;
    type(document.querySelector("#typing-text")!.textContent![0]);
    input.dispatchEvent(new FocusEvent("blur"));
    expect(input.disabled).toBe(true);
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
  it("preserves typed progress when switching interface language", () => {
    mount();
    const text = document.querySelector("#typing-text")!.textContent!;
    type(text.slice(0, 3));
    click('[data-action="locale"]');
    expect(document.documentElement.lang).toBe("en");
    expect(document.querySelector("#typed-count")!.textContent).toBe("3");
    expect(
      document.querySelector("#content-language")!.getAttribute("aria-label"),
    ).toBe("Practice content language");
    expect(
      (document.querySelector("#content-language") as HTMLSelectElement).value,
    ).toBe("en");
  });
  it("ignores composing text and counts a Chinese commit only once", () => {
    mount();
    choose("#content-language", "zh");
    choose("#chinese-mode", "ime");
    const text = document.querySelector("#typing-text")!.textContent!;
    const input = document.querySelector<HTMLTextAreaElement>("#typing-input")!;
    input.dispatchEvent(new CompositionEvent("compositionstart"));
    input.value = "ni";
    input.dispatchEvent(
      new InputEvent("input", { data: "ni", isComposing: true }),
    );
    expect(document.querySelector("#typed-count")!.textContent).toBe("0");
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
    expect(document.querySelector("#typed-count")!.textContent).toBe("2");
    expect(document.querySelector("#accuracy")!.textContent).toBe("100");
  });
  it("records completed exercises and exposes results in statistics", () => {
    mount();
    type(document.querySelector("#typing-text")!.textContent!);
    expect(document.querySelector("#result-title")).not.toBeNull();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.history).toHaveLength(1);
    click('dialog [data-view="statistics"]');
    expect(document.querySelector(".history-row")).not.toBeNull();
    expect(document.querySelector(".chart-bar")).not.toBeNull();
  });
  it("requires closing a modal before keyboard interaction with background controls", () => {
    mount();
    click('[data-action="guide"]');
    expect(document.querySelector(".app-shell")!.hasAttribute("inert")).toBe(
      true,
    );
    expect(document.querySelector("dialog")!.getAttribute("aria-modal")).toBe(
      "true",
    );
    click('dialog [data-action="close-dialog"]');
    expect(document.querySelector(".app-shell")!.hasAttribute("inert")).toBe(
      false,
    );
  });
  it("starts a fresh exercise when returning from statistics after completion", () => {
    mount();
    type(document.querySelector("#typing-text")!.textContent!);
    click('dialog [data-view="statistics"]');
    click('[data-view="practice"]');
    expect(document.querySelector("#typed-count")!.textContent).toBe("0");
    expect(document.querySelectorAll(".letter.current")).toHaveLength(1);
    const first = document.querySelector("#typing-text")!.textContent![0];
    type(first);
    expect(document.querySelector("#typed-count")!.textContent).toBe("1");
  });
  it("keeps a visible export warning after a failed preference save and rerender", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    mount();
    click('[data-action="locale"]');
    expect(document.querySelector(".storage-warning")!.textContent).toContain(
      "Not saved",
    );
    expect(
      document.querySelector(".storage-warning")!.getAttribute("data-action"),
    ).toBe("export");
    click('[data-view="settings"]');
    expect(document.querySelector(".storage-warning")).not.toBeNull();
  });
  it("keeps the finger marker correctly positioned after returning from another view", () => {
    mount();
    type(document.querySelector("#typing-text")!.textContent!.slice(0, 40));
    click('[data-view="statistics"]');
    click('[data-view="practice"]');
    expect(document.querySelectorAll(".letter.current")).toHaveLength(1);
    expect(document.querySelectorAll(".letter.typed")).toHaveLength(40);
  });
});
