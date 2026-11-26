import { COURSES, SHIFTED, fingerFor, physicalKey } from "./content";
import type { Settings } from "./model";
const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
type Key = { key: string; label?: string; units?: number; special?: boolean };
const keys = (chars: string): Key[] => [...chars].map((key) => ({ key }));
export function renderKeyboard(settings: Settings) {
  const rows: Key[][] = [
    [
      { key: "`", label: settings.keyboardType === "iso" ? "§" : "`" },
      ...keys("1234567890-="),
      { key: "Backspace", label: "delete", units: 2, special: true },
    ],
    [
      { key: "Tab", label: "tab", units: 1.5, special: true },
      ...keys("qwertyuiop[]"),
      ...(settings.keyboardType === "ansi" ? [{ key: "\\", units: 1.5 }] : []),
    ],
    [
      { key: "CapsLock", label: "caps lock", units: 1.75, special: true },
      ...keys("asdfghjkl;'"),
      ...(settings.keyboardType === "iso"
        ? [{ key: "\\" }]
        : [{ key: "Enter", label: "return", units: 2.25, special: true }]),
    ],
    [
      {
        key: "ShiftLeft",
        label: "shift",
        units: settings.keyboardType === "iso" ? 1.25 : 2.25,
        special: true,
      },
      ...(settings.keyboardType === "iso"
        ? [{ key: "IntlBackslash", label: "`" }]
        : []),
      ...keys("zxcvbnm,./"),
      { key: "ShiftRight", label: "shift", units: 2.75, special: true },
    ],
    [
      { key: "Fn", label: "fn", special: true },
      { key: "ControlLeft", label: "control", special: true },
      { key: "AltLeft", label: "option", special: true },
      { key: "MetaLeft", label: "command", units: 1.25, special: true },
      { key: "Space", label: "", units: 4.9 },
      { key: "MetaRight", label: "command", units: 1.25, special: true },
      { key: "AltRight", label: "option", special: true },
    ],
  ];
  const allowed =
    settings.language === "zh" || settings.course === 6
      ? "abcdefghijklmnopqrstuvwxyz"
      : COURSES[settings.course].chars;
  let markup = "";
  rows.forEach((row, n) => {
    let x = 0;
    row.forEach((k) => {
      const width = (k.units || 1) * (1000 / 15) - 9;
      const y = n * 70;
      const label = k.label ?? k.key.toUpperCase();
      const taught =
        allowed.includes(k.key) ||
        (settings.numbers && /\d/.test(k.key)) ||
        (settings.punctuation && /[;,'./\[\]\\=-]/.test(k.key));
      markup += `<g class="keyboard-key ${k.special ? "modifier-key" : ""} ${taught ? "taught-key" : ""}" data-key="${esc(k.key)}"><rect x="${x}" y="${y}" width="${width}" height="60" rx="7"/><text x="${k.special ? x + 8 : x + width / 2}" y="${k.special ? y + 49 : y + 37}" text-anchor="${k.special ? "start" : "middle"}">${esc(label)}</text>${k.key === "f" || k.key === "j" ? `<path class="key-bump" d="M${x + width / 2 - 7} ${y + 54}h14"/>` : ""}</g>`;
      x += width + 9;
    });
  });
  if (settings.keyboardType === "iso")
    markup +=
      '<g class="keyboard-key modifier-key iso-enter" data-key="Enter"><path class="enter-outline" d="M907 70H984Q991 70 991 77V193Q991 200 984 200H924Q917 200 917 193V130H907Q900 130 900 123V77Q900 70 907 70Z"/><text x="958" y="107" text-anchor="middle">↵</text></g>';
  const ax = 836;
  markup += `<g class="keyboard-key arrow-key"><rect x="${ax + 55}" y="280" width="54" height="27" rx="6"/><text x="${ax + 82}" y="299" text-anchor="middle">▴</text></g>`;
  ["◂", "▾", "▸"].forEach(
    (label, i) =>
      (markup += `<g class="keyboard-key arrow-key"><rect x="${ax + i * 55}" y="311" width="54" height="29" rx="6"/><text x="${ax + i * 55 + 27}" y="331" text-anchor="middle">${label}</text></g>`),
  );
  return `<svg class="keyboard-drawing" viewBox="-2 -2 1004 346" aria-label="${settings.keyboardType.toUpperCase()} QWERTY" role="img">${markup}</svg>`;
}
const FINGERS = [
  "M73 365C76 295 86 237 108 185C118 160 132 150 145 155C163 162 159 184 149 211L128 278L121 360",
  "M137 365C147 296 161 224 187 177C204 145 219 137 234 145C249 154 242 180 231 204L201 281L189 362",
  "M202 365C212 291 231 214 257 170C269 151 282 142 295 149C313 158 307 181 295 207L267 281L251 365",
  "M262 365C277 302 298 238 319 188C328 167 339 155 352 162C370 170 364 193 356 217L330 282L318 365",
  "M322 367C327 342 339 320 356 305C372 290 393 285 403 297C414 309 401 324 390 338L375 365",
];
export function renderHands() {
  const oneHand = (right: boolean) =>
    `<g ${right ? 'transform="translate(894 0) scale(-1 1)"' : ""}>${FINGERS.map((d, i) => `<path d="${d}" class="finger-shape" data-hand-finger="${right ? 9 - i : i}"/>`).join("")}</g>`;
  return `<svg class="hand-overlay" viewBox="-2 -2 1004 346" aria-hidden="true"><defs><linearGradient id="hand-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white"/><stop offset=".62" stop-color="white" stop-opacity=".8"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="hand-mask"><rect x="0" y="0" width="1000" height="346" fill="url(#hand-fade)"/></mask></defs><g mask="url(#hand-mask)">${oneHand(false)}${oneHand(true)}</g></svg>`;
}
export function updateKeyboard(
  root: HTMLElement,
  settings: Settings,
  char: string,
  done: boolean,
) {
  const ime = settings.language === "zh" && settings.chineseMode === "ime";
  const physical = physicalKey(char);
  const target =
    settings.keyboardType === "iso" && physical === "`"
      ? "IntlBackslash"
      : physical;
  const finger = fingerFor(char);
  const shift = char !== char.toLowerCase() || !!SHIFTED[char];
  root.querySelectorAll<SVGGElement>("[data-key]").forEach((el) => {
    el.classList.toggle(
      "target-key",
      !ime && !done && settings.keyHints && el.dataset.key === target,
    );
    el.classList.toggle(
      "shift-key",
      !ime &&
        !done &&
        settings.keyHints &&
        shift &&
        el.dataset.key === (finger < 5 ? "ShiftRight" : "ShiftLeft"),
    );
  });
  root
    .querySelectorAll("[data-hand-finger]")
    .forEach((el) =>
      el.classList.toggle(
        "active-finger",
        !ime && !done && Number(el.getAttribute("data-hand-finger")) === finger,
      ),
    );
}
