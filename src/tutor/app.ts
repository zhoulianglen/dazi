import {
  Session,
  readData,
  writeData,
  parseData,
  validResult,
  sameMode,
  lessonUnlocked,
  type Result,
  type Settings,
} from "./model";
import { makeExercise, COURSES } from "./content";
import { renderKeyboard, renderHands, updateKeyboard } from "./keyboard";
import { icon } from "./icons";
import { applyLocaleMetadata } from "./seo";
import { renderOnboarding, type TourStep } from "./onboarding";
const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
type Panel = "settings" | "help" | null;
export function mountTutor(root: HTMLElement) {
  let data = readData();
  let panel: Panel = null;
  let tourStep: TourStep | null = data.onboarding === "pending" ? 1 : null;
  let tourCorrectStart = 0;
  let statistics = false;
  let exercise = makeExercise(data.settings.course, data.settings, {}, () => 0);
  let session = new Session(exercise.text, 0, isIME(), true);
  let lastResult: Result | null = null;
  let composing = false;
  let rendering = false;
  let compositionCommit = "";
  let unsaved = false;
  let focused = true;
  let audio: AudioContext | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let errorTimer: ReturnType<typeof setTimeout> | undefined;
  let autoContinue = false;
  let selectedBar: string | null = null;
  const s = () => data.settings;
  const t = (zh: string, en: string) => (s().locale === "zh" ? zh : en);
  function isIME() {
    return (
      data.settings.language === "zh" && data.settings.chineseMode === "ime"
    );
  }
  const history = () => data.history.filter((r) => sameMode(r, s()));
  const typoCount = () =>
    Object.values(session.errors).reduce((n, v) => n + v, 0);
  const unit = () =>
    isIME() || s().speedUnit === "characters"
      ? t("字 / 分钟", "char/min")
      : t("词 / 分钟", "words/min");
  const displayedSpeed = (speed: number) =>
    Math.round(speed * (isIME() || s().speedUnit === "words" ? 1 : 5));
  const tourBlocking = () => tourStep === 1 || tourStep === 2;
  const guideSettings = (): Settings =>
    tourStep === 2 || tourStep === 3
      ? { ...s(), keyboard: true, hands: true, keyHints: true }
      : s();
  function focusTour() {
    requestAnimationFrame(() =>
      root.querySelector<HTMLButtonElement>("[data-tour-primary]")?.focus(),
    );
  }
  function beginTour() {
    panel = null;
    statistics = false;
    tourStep = 1;
    tourCorrectStart = session.correct;
    if (session.done) restart();
    session.pause(performance.now());
    render();
    focusTour();
  }
  function finishTour(completed: boolean) {
    const inline = tourStep === 3 && !session.done;
    tourStep = null;
    if (completed || data.onboarding !== "complete")
      data.onboarding = completed ? "complete" : "skipped";
    save();
    session.resume(performance.now());
    focused = true;
    if (inline) {
      // Keep the native input/composition target mounted while the user types.
      root.querySelector(".typing-coach")?.remove();
      if (!s().keyboard) {
        root.querySelector(".keyboard-stage")?.remove();
        root
          .querySelector(".practice-screen")
          ?.classList.add("without-keyboard");
      } else if (!s().hands) root.querySelector(".hand-overlay")?.remove();
      const warning = root.querySelector(".storage-warning");
      if (unsaved && !warning) {
        const button = document.createElement("button");
        button.className = "storage-warning";
        button.dataset.action = "export";
        button.textContent = t(
          "未保存 · 导出备份",
          "Not saved · export a backup",
        );
        button.onclick = exportBackup;
        root.append(button);
      } else if (!unsaved) warning?.remove();
      update();
    } else render();
    focusInput();
    if (completed)
      notify(
        t(
          "已经上手！继续照着屏幕练习，先准确，再提速。",
          "You’ve got it. Keep typing the text above. Accuracy before speed.",
        ),
      );
  }
  function nextTourStep() {
    if (tourStep === 1) {
      tourStep = 2;
      render();
      focusTour();
    } else if (tourStep === 2) {
      tourStep = 3;
      tourCorrectStart = session.correct;
      session.resume(performance.now());
      focused = true;
      render();
      focusInput();
    }
  }
  function save() {
    unsaved = !writeData(data);
  }
  function notify(message: string) {
    let el = root.querySelector<HTMLElement>(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      root.append(el);
    }
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el?.remove(), 4000);
  }
  function weakKeys() {
    const out: Record<string, number> = {};
    history()
      .filter((r) => r.course === s().course)
      .slice(-5)
      .forEach((r) =>
        Object.entries(r.errors).forEach(
          ([k, n]) => (out[k] = (out[k] || 0) + n),
        ),
      );
    return out;
  }
  function focusInput() {
    requestAnimationFrame(() =>
      root
        .querySelector<HTMLTextAreaElement>("#typing-input")
        ?.focus({ preventScroll: true }),
    );
  }
  function restart(course = s().course) {
    s().course = course;
    save();
    exercise = makeExercise(course, s(), weakKeys());
    session = new Session(exercise.text, 0, isIME(), true);
    composing = false;
    compositionCommit = "";
    lastResult = null;
    focused = true;
    if (!panel && !statistics) autoContinue = false;
    if (tourStep === 3) tourCorrectStart = 0;
    if (panel || statistics || tourBlocking()) session.pause(performance.now());
    render();
    if (!panel && !statistics && !tourBlocking()) focusInput();
  }
  function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    s()[key] = value;
    if (
      [
        "language",
        "chineseMode",
        "capitals",
        "numbers",
        "punctuation",
        "duration",
        "course",
      ].includes(key)
    ) {
      if (s().automatic && !lessonUnlocked(s().course, history(), s()))
        s().course = 0;
      restart();
    } else {
      if (
        key === "automatic" &&
        s().automatic &&
        !lessonUnlocked(s().course, history(), s())
      ) {
        restart(0);
        return;
      }
      save();
      render();
    }
  }
  function openPanel(next: Panel) {
    if (next) {
      autoContinue = !session.paused;
      session.pause(performance.now());
    }
    panel = next;
    render();
    if (panel)
      requestAnimationFrame(() =>
        root
          .querySelector<HTMLElement>(".drawer button, .help-dialog button")
          ?.focus(),
      );
    else if (autoContinue && !session.done) {
      session.resume(performance.now());
      focused = true;
      update();
      focusInput();
    }
  }
  function closePanel() {
    panel = null;
    if (autoContinue && !session.done) {
      session.resume(performance.now());
      focused = true;
    }
    render();
    if (!session.paused && !session.done) focusInput();
  }
  function openStatistics() {
    autoContinue = !session.paused;
    session.pause(performance.now());
    panel = null;
    statistics = true;
    selectedBar = null;
    render();
    requestAnimationFrame(() =>
      root
        .querySelector<HTMLButtonElement>('[data-action="close-statistics"]')
        ?.focus(),
    );
  }
  function closeStatistics() {
    statistics = false;
    if (session.done) {
      restart();
      return;
    }
    if (autoContinue) session.resume(performance.now());
    focused = !session.paused;
    render();
    if (!session.paused) focusInput();
  }
  function pauseToggle() {
    if (session.done || panel || statistics) return;
    if (session.paused) {
      session.resume(performance.now());
      focused = true;
    } else {
      session.pause(performance.now());
      focused = false;
    }
    render();
    if (!session.paused) focusInput();
  }
  function sound(wrong: boolean) {
    if (!s().sound || !wrong) return;
    try {
      audio ||= new AudioContext();
      if (audio.state === "suspended") void audio.resume();
      const duration = 0.045;
      const noise = audio.createBuffer(
        1,
        Math.floor(audio.sampleRate * duration),
        audio.sampleRate,
      );
      const channel = noise.getChannelData(0);
      for (let i = 0; i < channel.length; i++)
        channel[i] =
          (Math.random() * 2 - 1) * Math.exp((-i / channel.length) * 9);
      const source = audio.createBufferSource();
      source.buffer = noise;
      const filter = audio.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 950;
      const gain = audio.createGain();
      gain.gain.value = 0.13;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(audio.destination);
      source.start();
    } catch {
      /* Audio is optional. */
    }
  }
  function complete() {
    const m = session.metrics(performance.now());
    lastResult = {
      id: crypto.randomUUID(),
      course: s().course,
      language: s().language,
      mode: s().chineseMode,
      speed: isIME() ? m.speed : m.charactersPerMinute / 5,
      accuracy: m.accuracy,
      seconds: m.seconds,
      at: Date.now(),
      errors: { ...session.errors },
      count: session.position,
      extras: {
        capitals: s().capitals,
        numbers: s().numbers,
        punctuation: s().punctuation,
      },
    };
    data.history.push(lastResult);
    data.history = data.history.slice(-2000);
    save();
    render();
  }
  function accept(value: string) {
    if (
      !value ||
      session.paused ||
      panel ||
      statistics ||
      tourBlocking() ||
      session.done
    )
      return;
    const old = session.position;
    const ok = session.input(value, performance.now());
    sound(!ok);
    if (!ok && s().keyHints) {
      root.querySelector(".keyboard-stage")?.classList.add("wrong-key");
      clearTimeout(errorTimer);
      errorTimer = setTimeout(
        () =>
          root.querySelector(".keyboard-stage")?.classList.remove("wrong-key"),
        180,
      );
    }
    updateLetters(old);
    if (session.done) complete();
    else update();
    if (tourStep === 3 && session.correct - tourCorrectStart >= 3)
      finishTour(true);
  }
  function render() {
    rendering = true;
    document.documentElement.lang = s().locale === "zh" ? "zh-CN" : "en";
    applyLocaleMetadata(s().locale);
    root.innerHTML = `${statistics ? renderStatistics() : renderPractice()}${panel ? `<div class="panel-scrim" data-action="close-panel"></div>${panel === "settings" ? renderSettings() : renderHelp()}` : ""}${tourStep && !panel && !statistics ? renderOnboarding(tourStep, s(), Math.min(3, Math.max(0, session.correct - tourCorrectStart)), session.done) : ""}${unsaved ? `<button class="storage-warning" data-action="export">${t("未保存 · 导出备份", "Not saved · export a backup")}</button>` : ""}<input id="import-file" type="file" accept="application/json,.json" hidden>`;
    bind();
    if (!statistics) {
      update();
      requestAnimationFrame(updateTextPosition);
    }
    rendering = false;
    if (tourBlocking() && !panel && !statistics) focusTour();
  }
  function renderPractice() {
    const metric = (glyph: string, id: string, label: string, suffix = "") =>
      `<div class="metric"><span class="metric-glyph">${icon(glyph)}</span><div class="metric-value"><div><span id="${id}">${id === "accuracy" ? 100 : 0}</span>${suffix}</div><span class="metric-label">${label}</span></div></div>`;
    return `<main class="app-shell practice-screen ${guideSettings().keyboard ? "" : "without-keyboard"} ${tourBlocking() ? "tour-blocking" : ""}" ${panel || tourBlocking() ? "inert" : ""}>
      <h1 class="sr-only">${t("在线打字练习与标准十指盲打训练", "Free online touch typing practice")}</h1><button class="corner-button settings-button" data-action="settings" aria-label="${t("设置", "Settings")}" title="${t("设置", "Settings")}">${icon("settings")}</button>
      <section class="metrics" aria-label="${t("实时练习统计", "Live statistics")}">${metric("wind", "speed", unit())}${metric("award", "accuracy", t("准确率", "accuracy"), "<small>%</small>")}${metric("skull", "typos", t("错字", "typos"))}</section>
      <section class="practice-strip ${s().textLines === 2 ? "two-lines" : ""} ${isIME() ? "ime-practice" : ""}" aria-label="${t("打字练习", "Typing practice")}">
        ${exercise.source && !isIME() ? `<div class="chinese-source">${esc(exercise.source)}</div>` : ""}
        <div class="typing-window"><div id="typing-text" class="typing-text ${isIME() ? "chinese-text" : ""}" aria-hidden="true">${renderLetters()}</div></div>
        <label class="sr-only" for="typing-input">${t("输入练习文字", "Type the practice text")}: ${esc(exercise.text)}</label><textarea id="typing-input" class="typing-input ${isIME() ? "ime-input" : ""}" autocomplete="off" autocapitalize="off" spellcheck="false" rows="1" ${session.paused || session.done || panel || tourBlocking() ? "disabled" : ""} placeholder="${isIME() ? t("使用中文输入法输入上方文字", "Use your Chinese IME to type the text above") : ""}"></textarea>
        ${session.done && tourStep !== 3 ? renderCompletion() : ""}
        <p class="start-guidance ${session.started !== null || tourStep || session.done ? "is-hidden" : ""}">${isIME() ? t("点击这里，使用中文输入法输入上方汉字。", "Click here and type the text above with your Chinese IME.") : t("直接敲击上方文字开始 · 蓝色提示下一个键与对应手指", "Type the text above to begin · Blue shows the next key and finger")}<span>${t("右上角设置可选语言 · 左下角 ? 可重看引导", "Choose language in Settings · Replay the guide from ?")}</span></p>
        <div id="practice-overlay" class="practice-overlay ${session.paused ? "" : "is-hidden"}"><button class="resume-button" data-action="resume">${icon("play")}<span>${t("点击继续练习", "Click to resume")}</span></button></div><span class="sr-only" id="typed-count">${session.position}</span>
      </section>
      ${guideSettings().keyboard ? `<section class="keyboard-stage" aria-label="${t("键盘与双手指法提示", "Keyboard and finger hints")}">${renderKeyboard(guideSettings())}${guideSettings().hands ? renderHands() : ""}</section>` : ""}
      <div class="screen-controls"><button class="corner-button help-button" data-action="help" aria-label="${t("帮助", "Help")}" title="${t("帮助", "Help")}">${icon("circle-help")}</button><button class="corner-button restart-button" data-action="restart" aria-label="${t("重新开始", "Restart")}" title="${t("重新开始 [Return]", "Restart lesson [Return key]")}">${icon("rotate-cw")}</button><button class="corner-button statistics-button" data-action="statistics" aria-label="${t("学习统计", "Statistics")}" title="${t("学习统计", "Statistics")}">${icon("chart-pie")}</button></div>
    </main>`;
  }
  function renderLetters() {
    return [...exercise.text]
      .map(
        (c, i) =>
          `<span class="letter ${i < session.position ? "typed" : i === session.position ? "current" : ""} ${session.mistakes[i] ? "mistyped" : ""}" data-index="${i}">${esc(c)}</span>`,
      )
      .join("");
  }
  function updateLetters(start: number) {
    const letters = root.querySelectorAll<HTMLElement>(".letter");
    for (let i = Math.max(0, start - 1); i <= session.position; i++) {
      const el = letters[i];
      if (el)
        el.className = `letter ${i < session.position ? "typed" : i === session.position ? "current" : ""} ${session.mistakes[i] ? "mistyped" : ""}`;
    }
  }
  function updateTextPosition() {
    const text = root.querySelector<HTMLElement>("#typing-text");
    const current = text?.querySelector<HTMLElement>(".current");
    const viewport = root.querySelector<HTMLElement>(".typing-window");
    if (!text || !viewport || !current) return;
    if (s().textLines === 1) {
      const offset =
        text.scrollWidth <= viewport.clientWidth
          ? 0
          : Math.max(0, current.offsetLeft - viewport.clientWidth * 0.8);
      text.style.transform = `translateX(-${offset}px)`;
    } else {
      const height = parseFloat(getComputedStyle(text).lineHeight) || 40;
      text.style.transform = `translateY(-${Math.max(0, current.offsetTop - height)}px)`;
    }
  }
  function update() {
    if (statistics) return;
    const m = session.metrics(performance.now());
    for (const [id, value] of Object.entries({
      speed:
        isIME() || s().speedUnit === "characters"
          ? m.charactersPerMinute
          : m.speed,
      accuracy: m.accuracy,
      typos: typoCount(),
      "typed-count": session.position,
    })) {
      const el = root.querySelector("#" + id);
      if (el) el.textContent = String(value);
    }
    root
      .querySelector("#practice-overlay")
      ?.classList.toggle(
        "is-hidden",
        !session.paused || session.done || !!panel || tourBlocking(),
      );
    updateKeyboard(
      root,
      guideSettings(),
      exercise.text[session.position] || "",
      session.done,
    );
    if (tourStep === 2) {
      updateKeyboard(root, s(), "", true);
      root
        .querySelectorAll<SVGGElement>('[data-key="f"],[data-key="j"]')
        .forEach((el) => el.classList.add("home-guide-key"));
      root
        .querySelectorAll('[data-hand-finger="3"],[data-hand-finger="6"]')
        .forEach((el) => el.classList.add("active-finger"));
    }
    root
      .querySelector(".start-guidance")
      ?.classList.toggle(
        "is-hidden",
        session.started !== null || !!tourStep || session.done,
      );
    const progress = root.querySelector("#tour-typed-progress");
    if (progress)
      progress.textContent = `${Math.min(3, Math.max(0, session.correct - tourCorrectStart))} / 3`;
    updateTextPosition();
  }
  function renderCompletion() {
    const passed = typoCount() === 0;
    return `<div class="lesson-complete" role="status"><div class="completion-stars">${stars(passed ? lastResult?.speed || 0 : 0)}</div><h2 id="result-title">${passed ? t("课程完成", "Lesson complete") : t("练习完成", "Practice complete")}</h2><span>${t("按 Return 继续", "Press Return to continue")}</span><button data-action="continue">${t("继续", "Continue")}</button><button data-action="statistics">${t("查看统计", "Statistics")}</button></div>`;
  }
  function stars(speed: number) {
    const halves = Math.min(6, Math.floor((isIME() ? speed : speed * 5) / 50));
    return [0, 1, 2]
      .map(
        (i) =>
          `<span class="rating-star ${halves >= (i + 1) * 2 ? "full" : halves > i * 2 ? "half" : ""}" aria-hidden="true">☆<span>★</span></span>`,
      )
      .join("");
  }
  function select(
    id: string,
    value: string | number,
    options: Array<[string | number, string]>,
    label: string,
  ) {
    return `<label class="select-wrap"><select id="${id}" aria-label="${label}">${options.map(([v, title]) => `<option value="${v}" ${value === v ? "selected" : ""}>${title}</option>`).join("")}</select><span class="select-chevron" aria-hidden="true">⌄</span></label>`;
  }
  function settingRow(label: string, control: string) {
    return `<div class="setting-row"><span>${label}</span>${control}</div>`;
  }
  function toggle(
    key:
      | "capitals"
      | "numbers"
      | "punctuation"
      | "keyHints"
      | "hands"
      | "keyboard"
      | "sound",
    label: string,
  ) {
    return settingRow(
      label,
      `<button class="switch ${s()[key] ? "on" : ""}" ${key === "capitals" && isIME() ? `disabled title="${t("中文输入法模式不使用大写字母", "Capital letters do not apply to Chinese IME")}"` : ""} role="switch" aria-label="${label}" aria-checked="${s()[key]}" data-toggle="${key}"><span></span></button>`,
    );
  }
  function renderSettings() {
    const current = s().course;
    const courseLabel =
      current === 6
        ? t("专家", "Expert")
        : `${t("第", "Lesson ")}${current + 1}${t(" 课", "")}<small>${t("共 6 课", "from 6")}</small>`;
    return `<aside class="drawer" role="dialog" aria-modal="true" aria-label="${t("设置", "Settings")}"><button class="drawer-close" data-action="close-panel" aria-label="${t("关闭设置", "Close settings")}">${icon("x")}</button>
      <section class="drawer-section selection-section"><h2>${t("课程选择", "LESSON SELECTION")}</h2><div class="segmented"><button data-action="automatic" class="${s().automatic ? "selected" : ""}" aria-pressed="${s().automatic}">${t("自动", "Automatic")}</button><button data-action="manual" class="${!s().automatic ? "selected" : ""}" aria-pressed="${!s().automatic}">${t("手动", "Manual")}</button></div><div class="lesson-selection"><div class="lesson-current">${courseLabel}</div><p>${s().language === "en" ? t("字母：", "Letters: ") + COURSES[current].keys.toLowerCase().replaceAll("+ ", "") : isIME() ? t("中文输入法练习", "Chinese IME practice") : t("中文拼音指法练习", "Chinese pinyin practice")}</p>${!s().automatic ? `<div class="manual-lessons" aria-label="${t("选择课程", "Select lesson")}">${COURSES.map((_, i) => `<button data-course="${i}" class="${current === i ? "selected" : ""}" ${current === i ? 'aria-current="true"' : ""}>${i === 6 ? t("专家", "Expert") : i + 1}</button>`).join("")}</div>` : ""}</div></section>
      <section class="drawer-section"><h2>${t("添加到课程", "ADD TO THE LESSON")}</h2>${toggle("capitals", t("大写字母", "Capital letters"))}${toggle("numbers", t("数字", "Numbers"))}${toggle("punctuation", t("标点符号", "Punctuation"))}</section>
      <section class="drawer-section"><h2>${t("设置", "SETTINGS")}</h2>${settingRow(
        t("界面语言", "Interface language"),
        select(
          "interface-language",
          s().locale,
          [
            ["zh", "简体中文"],
            ["en", "English"],
          ],
          t("界面语言", "Interface language"),
        ),
      )}${settingRow(
        t("练习语言", "Language"),
        select(
          "content-language",
          s().language,
          [
            ["en", "🇺🇸 EN"],
            ["zh", "🇨🇳 中文"],
          ],
          t("练习内容语言", "Practice content language"),
        ),
      )}${
        s().language === "zh"
          ? settingRow(
              t("中文模式", "Chinese mode"),
              select(
                "chinese-mode",
                s().chineseMode,
                [
                  ["pinyin", t("拼音", "Pinyin")],
                  ["ime", t("输入法", "IME")],
                ],
                t("中文输入模式", "Chinese input mode"),
              ),
            )
          : ""
      }${settingRow(
        t("键盘类型", "Keyboard type"),
        select(
          "keyboard-type",
          s().keyboardType,
          [
            ["iso", "ISO"],
            ["ansi", "ANSI"],
          ],
          t("键盘类型", "Keyboard type"),
        ),
      )}${settingRow(t("布局", "Layout"), '<span class="layout-label">QWERTY (US)</span>')}${settingRow(
        t("打字速度", "Typing speed"),
        select(
          "speed-unit",
          s().speedUnit,
          [
            ["characters", t("字符", "characters")],
            ["words", t("单词", "words")],
          ],
          t("速度单位", "Speed unit"),
        ),
      )}</section>
      <section class="drawer-section"><h2>${t("打字设置", "TYPING SETTINGS")}</h2>${settingRow(
        t("文本显示", "Text behavior"),
        select(
          "text-lines",
          s().textLines,
          [
            [1, t("单行", "One line")],
            [2, t("双行", "Two lines")],
          ],
          t("文本显示", "Text behavior"),
        ),
      )}${toggle("keyHints", t("显示按键提示", "Show key hints"))}${toggle("hands", t("显示双手提示", "Show hands hints"))}${toggle("keyboard", t("显示键盘", "Show keyboard"))}${toggle("sound", t("错误音效", "Error sound"))}</section>
      <section class="drawer-section data-section"><h2>${t("学习数据", "LEARNING DATA")}</h2><p>${t("保存在当前浏览器。界面语言与练习语言独立设置。", "Saved in this browser. Interface and practice languages are independent.")}</p><div class="backup-actions"><button data-action="export">${t("导出进度", "Export progress")}</button><button data-action="import">${t("导入备份", "Import backup")}</button></div><button class="clear-history" data-action="request-reset">${t("清除学习记录", "Clear history")}</button><div class="reset-confirm is-hidden"><p>${t("确认清除？无法撤销，请先导出备份。", "Clear history? This cannot be undone. Export a backup first.")}</p><button data-action="confirm-reset">${t("确认清除", "Clear history")}</button><button data-action="cancel-reset">${t("取消", "Cancel")}</button></div></section>
    </aside>`;
  }
  function renderStatistics() {
    const records = history();
    const recent = records.slice(-40);
    const best = (course: number) =>
      Math.max(
        0,
        ...records
          .filter(
            (r) =>
              r.course === course &&
              r.accuracy === 100 &&
              Object.values(r.errors).every((n) => n === 0),
          )
          .map((r) => r.speed),
      );
    const high = Math.max(
      150,
      Math.ceil(
        Math.max(0, ...recent.map((r) => displayedSpeed(r.speed))) / 75,
      ) * 75,
    );
    const selected = recent.find((r) => r.id === selectedBar);
    const barErrors = (r: Result) =>
      Object.values(r.errors).reduce((a, n) => a + n, 0);
    return `<main class="statistics-screen" ${panel ? "inert" : ""}><button class="corner-button close-statistics" data-action="close-statistics" aria-label="${t("关闭统计", "Close statistics")}">${icon("circle-x")}</button><div class="statistics-content"><h1>${t("学习进度与速度记录", "Progress and speed records")}</h1><div class="statistics-filters"><span>${t("语言", "for")}</span>${select(
      "content-language",
      s().language,
      [
        ["en", t("英语", "English")],
        ["zh", t("中文", "Chinese")],
      ],
      t("练习内容语言", "Practice content language"),
    )}${
      s().language === "zh"
        ? select(
            "chinese-mode",
            s().chineseMode,
            [
              ["pinyin", t("拼音", "Pinyin")],
              ["ime", t("输入法", "IME")],
            ],
            t("中文输入模式", "Chinese input mode"),
          )
        : ""
    }<span>${t("布局", "layout")}</span><span class="blue-label">QWERTY (US)</span></div>
      <div class="progress-ribbon" aria-label="${t("各课最佳成绩与星级", "Lesson records and ratings")}"><div class="main-lessons">${COURSES.map((_, i) => `<button class="ribbon-lesson lesson-${i}" data-stats-course="${i}"><span>${i === 6 ? t("专家", "Expert") : t(`第 ${i + 1} 课`, `Lesson ${i + 1}`)}</span><strong>${s().course === i && !records.some((r) => r.course === i && r.accuracy === 100 && Object.values(r.errors).every((n) => n === 0)) ? t("学习中", "learning") : displayedSpeed(best(i))}</strong><div class="stars" aria-label="${Math.min(3, Math.floor((isIME() ? best(i) : best(i) * 5) / 50) / 2)} ${t("星", "stars")}">${stars(best(i))}</div></button>`).join("")}</div><div class="extra-lessons">${[
        ["numbers", t("数字", "Numbers")],
        ["capitals", t("大写", "Capitals")],
        ["punctuation", t("标点", "Punctuation")],
      ]
        .map(
          ([key, name]) =>
            `<button class="ribbon-lesson extra-lesson" data-special-course="${key}"><span>${name}</span><strong>${displayedSpeed(Math.max(0, ...records.filter((r) => r.course === 6 && r.accuracy === 100 && Object.values(r.errors).every((n) => n === 0) && r.extras?.[key as "numbers" | "capitals" | "punctuation"]).map((r) => r.speed)))}</strong><div class="stars">${stars(Math.max(0, ...records.filter((r) => r.course === 6 && r.accuracy === 100 && Object.values(r.errors).every((n) => n === 0) && r.extras?.[key as "numbers" | "capitals" | "punctuation"]).map((r) => r.speed)))}</div></button>`,
        )
        .join("")}</div></div>
      <section class="activity-chart" aria-label="${t("练习速度与错字柱状图", "Session speed and typo chart")}"><div class="chart-grid"><div class="grid-line top"><span>${high}</span></div><div class="grid-line middle"><span>${Math.round(high / 2)}</span></div><div class="grid-line baseline"><span>${t("速度", "Speed")}<b>0</b>${t("错字", "Typos")}</span></div></div><div class="chart-bars">${recent.map((r) => `<button class="chart-column ${selectedBar === r.id ? "selected" : ""}" data-record="${esc(r.id)}" aria-label="${new Date(r.at).toLocaleString(s().locale)} · ${displayedSpeed(r.speed)} ${unit()} · ${barErrors(r)} ${t("错字", "typos")}"><span class="speed-bar" style="height:${Math.max(1, (displayedSpeed(r.speed) / high) * 100)}%"></span><span class="typo-bar" style="height:${Math.min(22, barErrors(r) * 2 + 1)}%"></span><span class="chart-tooltip">${displayedSpeed(r.speed)} ${unit()}<br>${r.accuracy}% · ${barErrors(r)} ${t("错字", "typos")}</span></button>`).join("")}</div>${!recent.length ? renderEmptyChart() : ""}</section>
      <div class="chart-caption">${t("近期练习结果", "Results for recent activities")}</div>
      ${selected ? `<div class="record-details"><strong>${new Date(selected.at).toLocaleString(s().locale)}</strong><span>${selected.course === 6 ? t("专家", "Expert") : t(`第 ${selected.course + 1} 课`, `Lesson ${selected.course + 1}`)}</span><span>${displayedSpeed(selected.speed)} ${unit()}</span><span>${selected.accuracy}% ${t("准确率", "accuracy")}</span><span>${barErrors(selected)} ${t("错字", "typos")}</span></div>` : ""}
      </div></main>`;
  }
  function renderEmptyChart() {
    // The reference app uses a muted chart illustration before the first session.
    // This is an illustration, not recorded sessions or fabricated results.
    const heights = [
      23, 76, 151, 94, 38, 65, 118, 17, 102, 89, 44, 155, 13, 71, 108, 24, 91,
      129, 53, 167, 39, 82, 113, 31, 95, 142, 66, 12, 89, 135, 47, 158, 105, 27,
      73, 119, 58, 146, 84, 21,
    ];
    return `<svg class="empty-chart-illustration" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">${Array.from(
      { length: 80 },
      (_, i) => {
        const h = heights[i % heights.length];
        return `<rect x="${i * 12.5}" y="${160 - h * 0.9}" width="11.2" height="${h * 0.9}"/><rect x="${i * 12.5}" y="164" width="11.2" height="${7 + h * 0.16}"/>`;
      },
    ).join(
      "",
    )}</svg><span class="sr-only">${t("暂无练习记录；图表为占位示意。", "No recorded sessions yet. Chart is a placeholder illustration.")}</span>`;
  }
  function renderHelp() {
    return `<div class="help-backdrop"><section class="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title"><button class="dialog-close" data-action="close-panel" aria-label="${t("关闭", "Close")}">${icon("circle-x")}</button><h1 id="help-title">${t("学习触摸打字", "Learn to touch type")}</h1><div class="help-hands">${renderHands()}</div><button class="replay-onboarding" data-action="replay-onboarding">${t("重新查看新手引导", "Replay getting started")}</button><div class="help-copy"><h2>${t("双手回到基准键", "Find your home keys")}</h2><p>${t("左手 A S D F，右手 J K L ;。食指找到 F 和 J 的凸起，拇指轻放空格键。按键时只移动对应的手指。", "Left hand: A S D F. Right hand: J K L ;. Find the bumps on F and J with your index fingers. Rest your thumbs on the space bar.")}</p><h2>${t("放松，保持自然坐姿", "Keep a relaxed posture")}</h2><p>${t("肩膀放松，手腕保持自然。双脚平放，屏幕与眼睛保持舒适距离。尽量看屏幕，不要低头找键。", "Relax your shoulders and keep your wrists neutral. Put your feet flat on the floor. Look at the screen instead of down at your keyboard.")}</p><h2>${t("准确优先，循序渐进", "Accuracy comes first")}</h2><p>${t("自动模式下，完整且无错地完成课程后进阶；手动模式可自由选课。错误会显示为红色。每 15–20 分钟休息一次。", "In Automatic mode, finish a lesson without mistakes to advance. Manual mode lets you choose any lesson. Typos appear in red. Take a break every 15–20 minutes.")}</p><div class="shortcuts"><span><kbd>Return</kbd>${t("重新练习 / 继续", "Restart / continue")}</span><span><kbd>Esc</kbd>${t("暂停 / 关闭设置", "Pause / close settings")}</span></div><p class="help-note">${t("手指提示用于指引，不会检测你的实际姿势。中文全拼不带声调，ü 用 v 表示。", "Hand hints guide you; they do not detect your actual posture. Pinyin uses no tone marks, and v for ü.")}</p></div><button class="help-start" data-action="close-panel">${t("开始练习", "Start practicing")}</button></section></div>`;
  }
  async function importBackup(file: File) {
    try {
      if (file.size > 5_000_000) throw new Error("size");
      const raw: unknown = JSON.parse(await file.text());
      if (!raw || typeof raw !== "object") throw new Error("shape");
      const obj = raw as Record<string, unknown>;
      if (
        obj.version !== 1 ||
        !obj.settings ||
        !Array.isArray(obj.history) ||
        !obj.history.every(validResult)
      )
        throw new Error("shape");
      const incoming = parseData(raw);
      data.history = [
        ...new Map(
          [...data.history, ...incoming.history].map((r) => [r.id, r]),
        ).values(),
      ]
        .sort((a, b) => a.at - b.at)
        .slice(-2000);
      data.settings = incoming.settings;
      restart();
      notify(t("备份已导入，记录已合并。", "Backup imported. History merged."));
    } catch {
      notify(
        t(
          "无法导入，请选择有效的 DAZI 备份（不超过 5 MB）。",
          "Could not import. Choose a valid DAZI backup under 5 MB.",
        ),
      );
    }
  }
  function continueLesson() {
    const passed = session.done && typoCount() === 0;
    restart(s().automatic && passed ? Math.min(6, s().course + 1) : s().course);
  }
  function exportBackup() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `dazi-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(t("进度备份已导出。", "Your progress backup has been exported."));
  }
  function bind() {
    root.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(
      (el) =>
        (el.onclick = () => {
          switch (el.dataset.action) {
            case "tour-next":
              nextTourStep();
              break;
            case "tour-back":
              tourStep = 1;
              render();
              focusTour();
              break;
            case "skip-onboarding":
              finishTour(false);
              break;
            case "replay-onboarding":
              beginTour();
              break;
            case "tour-locale":
              setSetting("locale", s().locale === "zh" ? "en" : "zh");
              break;
            case "settings":
              openPanel("settings");
              break;
            case "help":
              openPanel("help");
              break;
            case "close-panel":
              closePanel();
              break;
            case "statistics":
              openStatistics();
              break;
            case "close-statistics":
              closeStatistics();
              break;
            case "restart":
              restart();
              break;
            case "continue":
              continueLesson();
              break;
            case "resume":
              session.resume(performance.now());
              focused = true;
              render();
              focusInput();
              break;
            case "automatic":
              setSetting("automatic", true);
              break;
            case "manual":
              setSetting("automatic", false);
              break;
            case "export":
              exportBackup();
              break;
            case "import":
              root.querySelector<HTMLInputElement>("#import-file")?.click();
              break;
            case "request-reset":
              root
                .querySelector(".reset-confirm")
                ?.classList.remove("is-hidden");
              break;
            case "cancel-reset":
              root.querySelector(".reset-confirm")?.classList.add("is-hidden");
              break;
            case "confirm-reset":
              data.history = [];
              save();
              restart(0);
              notify(t("学习记录已清除。", "Learning history cleared."));
              break;
          }
        }),
    );
    root.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach(
      (el) =>
        (el.onclick = () => {
          const key = el.dataset.toggle as
            | "sound"
            | "keyboard"
            | "hands"
            | "keyHints"
            | "capitals"
            | "numbers"
            | "punctuation";
          setSetting(key, !s()[key]);
        }),
    );
    root
      .querySelectorAll<HTMLButtonElement>("[data-course]")
      .forEach(
        (el) =>
          (el.onclick = () => setSetting("course", Number(el.dataset.course))),
      );
    root.querySelectorAll<HTMLButtonElement>("[data-stats-course]").forEach(
      (el) =>
        (el.onclick = () => {
          const course = Number(el.dataset.statsCourse);
          if (s().automatic && !lessonUnlocked(course, history(), s())) {
            notify(
              t(
                "先完成上一课，或在设置中选择手动模式。",
                "Finish the previous lesson, or choose Manual mode in settings.",
              ),
            );
            return;
          }
          statistics = false;
          restart(course);
        }),
    );
    root.querySelectorAll<HTMLButtonElement>("[data-special-course]").forEach(
      (el) =>
        (el.onclick = () => {
          const key = el.dataset.specialCourse as
            | "capitals"
            | "numbers"
            | "punctuation";
          s()[key] = true;
          s().automatic = false;
          statistics = false;
          restart(6);
        }),
    );
    root.querySelectorAll<HTMLButtonElement>("[data-record]").forEach(
      (el) =>
        (el.onclick = () => {
          selectedBar = el.dataset.record || null;
          render();
        }),
    );
    const onSelect = (id: string, cb: (v: string) => void) => {
      const el = root.querySelector<HTMLSelectElement>("#" + id);
      if (el) el.onchange = () => cb(el.value);
    };
    onSelect("onboarding-language", (v) => {
      s().language = v === "en" ? "en" : "zh";
      if (v !== "en") s().chineseMode = v === "zh-ime" ? "ime" : "pinyin";
      if (s().automatic && !lessonUnlocked(s().course, history(), s()))
        s().course = 0;
      restart();
    });
    onSelect("interface-language", (v) =>
      setSetting("locale", v as "zh" | "en"),
    );
    onSelect("content-language", (v) =>
      setSetting("language", v as "zh" | "en"),
    );
    onSelect("chinese-mode", (v) =>
      setSetting("chineseMode", v as "pinyin" | "ime"),
    );
    onSelect("keyboard-type", (v) =>
      setSetting("keyboardType", v as "iso" | "ansi"),
    );
    onSelect("speed-unit", (v) =>
      setSetting("speedUnit", v as "characters" | "words"),
    );
    onSelect("text-lines", (v) => setSetting("textLines", Number(v) as 1 | 2));
    const file = root.querySelector<HTMLInputElement>("#import-file");
    if (file)
      file.onchange = () => {
        if (file.files?.[0]) void importBackup(file.files[0]);
      };
    const input = root.querySelector<HTMLTextAreaElement>("#typing-input");
    if (input) {
      input.onfocus = () => {
        focused = true;
        update();
      };
      input.onblur = (e) => {
        if (rendering || !input.isConnected) return;
        if (session.done || panel || statistics) return;
        if (
          e.relatedTarget instanceof HTMLElement &&
          root.contains(e.relatedTarget) &&
          e.relatedTarget.closest("button,select,a,input")
        )
          return;
        focused = false;
        session.pause(performance.now());
        input.disabled = true;
        update();
      };
      input.addEventListener("compositionstart", () => {
        composing = true;
      });
      input.addEventListener("compositionend", (e) => {
        composing = false;
        compositionCommit = e.data;
        if (isIME()) accept(e.data);
        else
          notify(
            t(
              "请切换到英文输入法练习字母。",
              "Switch to an English keyboard to practice individual letters.",
            ),
          );
        input.value = "";
        setTimeout(() => {
          compositionCommit = "";
        }, 0);
      });
      input.oninput = (e) => {
        const event = e as InputEvent;
        if (composing || event.isComposing) return;
        if (compositionCommit && event.data === compositionCommit) {
          input.value = "";
          compositionCommit = "";
          return;
        }
        if (event.inputType === "insertFromPaste") {
          input.value = "";
          return;
        }
        accept(input.value);
        input.value = "";
      };
      input.onpaste = (e) => {
        e.preventDefault();
        notify(
          t(
            "请用键盘亲手输入练习文字。",
            "Type the exercise with your keyboard.",
          ),
        );
      };
      input.onkeydown = (e) => {
        if (composing || e.isComposing || e.keyCode === 229) return;
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          pauseToggle();
        } else if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          restart();
        } else if (e.key === "Backspace") {
          e.preventDefault();
          const old = session.position;
          session.backspace();
          updateLetters(session.position);
          if (old !== session.position) update();
        }
      };
    }
    const strip = root.querySelector<HTMLElement>(".practice-strip");
    if (strip)
      strip.onclick = (e) => {
        if (
          (e.target as HTMLElement).closest("button") ||
          session.done ||
          session.paused
        )
          return;
        focusInput();
      };
  }
  function documentKey(e: KeyboardEvent) {
    if (e.isComposing) return;
    if (tourBlocking() && !panel && !statistics) {
      if (e.key === "Escape") {
        e.preventDefault();
        finishTour(false);
        return;
      }
      if (e.key === "Tab") {
        const elements = [
          ...root.querySelectorAll<HTMLElement>(
            ".intro-tour button,.intro-tour select",
          ),
        ].filter((el) => !(el as HTMLButtonElement).disabled);
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      return;
    }
    if (panel) {
      if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
      }
      if (e.key === "Tab") {
        const elements = [
          ...root.querySelectorAll<HTMLElement>(
            ".drawer button,.drawer select,.help-dialog button",
          ),
        ];
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      return;
    }
    if (statistics) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeStatistics();
      }
      return;
    }
    if (e.target === root.querySelector("#typing-input")) return;
    const interactive =
      e.target instanceof HTMLElement &&
      e.target.closest("button,select,input,a");
    if (e.key === "Enter" && !interactive) {
      e.preventDefault();
      session.done ? continueLesson() : restart();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      pauseToggle();
    }
  }
  const blur = () => {
    if (!statistics && !panel && !session.done && !session.paused) {
      focused = false;
      session.pause(performance.now());
      render();
    }
  };
  const visibility = () => {
    if (document.hidden) blur();
  };
  document.addEventListener("keydown", documentKey);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  const interval = setInterval(() => {
    if (!statistics && !panel && !session.done && !session.paused && focused)
      update();
  }, 200);
  const resize = () => updateTextPosition();
  window.addEventListener("resize", resize);
  if (tourBlocking()) session.pause(performance.now());
  render();
  if (tourBlocking()) focusTour();
  else focusInput();
  return () => {
    clearInterval(interval);
    clearTimeout(toastTimer);
    clearTimeout(errorTimer);
    document.removeEventListener("keydown", documentKey);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("resize", resize);
    void audio?.close();
  };
}
