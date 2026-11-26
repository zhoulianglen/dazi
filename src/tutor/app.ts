import {
  Session,
  readData,
  writeData,
  parseData,
  validResult,
  sameMode,
  lessonUnlocked,
  summarize,
  type Result,
  type Settings,
} from "./model";
import {
  COURSES,
  KEY_ROWS,
  SHIFTED,
  makeExercise,
  courseName,
  physicalKey,
  fingerFor,
} from "./content";
import { icon } from "./icons";

type View = "practice" | "courses" | "statistics" | "settings";
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
export function mountTutor(root: HTMLElement) {
  let data = readData();
  let view: View = "practice";
  let exercise = makeExercise(data.settings.course, data.settings);
  let session = new Session(
    exercise.text,
    0,
    data.settings.language === "zh" && data.settings.chineseMode === "ime",
  );
  let showGuide = false;
  let showResult = false;
  let composing = false;
  let suppressCompositionInput = "";
  let saveWarning = false;
  let lastResult: Result | null = null;
  let toastTimeout: ReturnType<typeof setTimeout>;
  let audio: AudioContext | null = null;
  let focused = true;
  let lastPosition = 0;
  let statsFilter: "all" | "week" = "all";
  let restoreFocus: HTMLElement | null = null;
  const s = () => data.settings;
  const t = (zh: string, en: string) => (s().locale === "zh" ? zh : en);
  const isIME = () => s().language === "zh" && s().chineseMode === "ime";
  const unit = () => (isIME() ? t("字 / 分钟", "chars / min") : "WPM");
  const relevant = () => data.history.filter((r) => sameMode(r, s()));
  const modeLabel = () =>
    s().language === "en"
      ? t("英文", "English")
      : s().chineseMode === "ime"
        ? t("中文 · 输入法", "Chinese · IME")
        : t("中文 · 拼音", "Chinese · Pinyin");
  const persist = () => {
    saveWarning = !writeData(data);
  };
  function notify(message: string) {
    let toast = root.querySelector<HTMLElement>(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      root.append(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast?.classList.remove("visible"), 4200);
  }
  function weakKeys() {
    const errors: Record<string, number> = {};
    relevant()
      .filter((r) => r.course === s().course)
      .slice(-5)
      .forEach((r) =>
        Object.entries(r.errors).forEach(([k, n]) => {
          errors[k] = (errors[k] || 0) + n;
        }),
      );
    return errors;
  }
  function newSession(course = s().course) {
    s().course = course;
    persist();
    exercise = makeExercise(course, s(), weakKeys());
    session = new Session(exercise.text, 0, isIME());
    showResult = false;
    composing = false;
    focused = true;
    lastPosition = 0;
    render();
    focusInput();
  }
  function focusInput() {
    requestAnimationFrame(() =>
      root
        .querySelector<HTMLTextAreaElement>("#typing-input")
        ?.focus({ preventScroll: true }),
    );
  }
  function changeSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    s()[key] = value;
    persist();
    if (["language", "chineseMode", "duration"].includes(key)) {
      if (s().automatic && !lessonUnlocked(s().course, relevant(), s()))
        s().course = 0;
      newSession();
    } else {
      if (
        key === "automatic" &&
        s().automatic &&
        !lessonUnlocked(s().course, relevant(), s())
      ) {
        newSession(0);
        return;
      }
      render();
      if (view === "practice" && !session.paused) focusInput();
    }
  }
  function navigate(next: View) {
    if (next !== "practice") session.pause(performance.now());
    view = next;
    showGuide = false;
    showResult = false;
    if (view === "practice" && session.done) {
      newSession();
      return;
    }
    render();
    if (view === "practice" && !session.paused) focusInput();
  }
  function sound(ok: boolean) {
    if (!s().sound) return;
    try {
      audio ||= new AudioContext();
      if (audio.state === "suspended") void audio.resume();
      const osc = audio.createOscillator(),
        gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.value = ok ? 650 : 180;
      gain.gain.setValueAtTime(0.035, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.05);
    } catch {
      /* Sound is optional when the browser blocks Web Audio. */
    }
  }
  function complete() {
    const metrics = session.metrics(performance.now());
    lastResult = {
      id: crypto.randomUUID(),
      course: s().course,
      language: s().language,
      mode: s().chineseMode,
      speed: metrics.speed,
      accuracy: metrics.accuracy,
      seconds: metrics.seconds,
      at: Date.now(),
      errors: { ...session.errors },
      count: session.position,
    };
    data.history.push(lastResult);
    data.history = data.history.slice(-2000);
    persist();
    showResult = true;
    render();
  }
  function accept(value: string) {
    if (
      view !== "practice" ||
      session.paused ||
      showGuide ||
      showResult ||
      !value
    )
      return;
    const ok = session.input(value, performance.now());
    sound(ok);
    root.querySelector(".typing-box")?.classList.toggle("mistake", !ok);
    if (session.done) complete();
    else updatePractice();
  }
  function pauseToggle() {
    if (session.done) return;
    if (session.paused) {
      session.resume(performance.now());
      focused = true;
    } else session.pause(performance.now());
    render();
    if (!session.paused) focusInput();
  }
  function heading(eyebrow: string, title: string, description: string) {
    return `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-description">${description}</p></div>${view === "practice" ? `<button class="text-button guide-button" data-action="guide">${icon("hand")}${t("正确的打字姿势", "Find your posture")}</button>` : ""}</div>`;
  }
  function render() {
    document.documentElement.lang = s().locale === "zh" ? "zh-CN" : "en";
    document.title = `${t("DAZI 打字 · 让指尖自然流动", "DAZI · Find your typing flow")}`;
    const summary = summarize(data.history);
    const today = new Date().toLocaleDateString("en-CA");
    const todaySeconds = data.history
      .filter((r) => new Date(r.at).toLocaleDateString("en-CA") === today)
      .reduce((a, r) => a + r.seconds, 0);
    const dailyProgress = Math.min(100, (todaySeconds / (s().goal * 60)) * 100);
    const nav: Array<[View, string, string]> = [
      ["practice", "keyboard", t("开始练习", "Practice")],
      ["courses", "book-open", t("课程", "Courses")],
      ["statistics", "chart-no-axes-combined", t("学习统计", "Statistics")],
      ["settings", "settings-2", t("偏好设置", "Preferences")],
    ];
    root.innerHTML = `<div class="app-shell" ${showGuide || showResult ? "inert" : ""}>
      <aside class="sidebar"><a class="brand" href="#practice" aria-label="DAZI ${t("首页", "home")}"><span class="brand-mark"><span>d</span><i></i></span><span>DAZI<span class="brand-caption">${t("让指尖自然流动", "Find your flow")}</span></span></a>
      <div class="nav-section-label">${t("你的打字空间", "YOUR TYPING SPACE")}</div>
      <nav aria-label="${t("主导航", "Main navigation")}">${nav.map(([id, i, label]) => `<button data-view="${id}" class="nav-item ${view === id ? "active" : ""}" ${view === id ? 'aria-current="page"' : ""}>${icon(i)}<span>${label}</span>${view === id ? '<span class="nav-active-dot"></span>' : ""}</button>`).join("")}</nav>
      <div class="sidebar-bottom"><div class="daily-goal"><div class="goal-heading"><span>${t("每天一点点", "A LITTLE EVERY DAY")}</span><span class="sun-symbol">☼</span></div><p>${t("好习惯，慢慢养成。", "Good habits take practice.")}</p><div class="goal-progress" role="progressbar" aria-label="${t("每日练习目标", "Daily practice goal")}" aria-valuenow="${Math.round(dailyProgress)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${dailyProgress}%"></span></div><div class="goal-numbers"><span>${Math.floor(todaySeconds / 60)} / ${s().goal} ${t("分钟", "min")}</span><span>${Math.round(dailyProgress)}%</span></div></div>
      <button class="sidebar-help" data-action="guide">${icon("circle-help")} ${t("指法与坐姿指南", "Typing & posture guide")}</button><div class="local-profile"><span class="avatar">D</span><div>${t("我的学习空间", "My learning space")}<small>${t("进度保存在此浏览器", "Progress saved in this browser")}</small></div></div></div></aside>
      <div class="workspace"><header class="topbar"><div class="breadcrumbs"><span>DAZI</span><span>/</span><strong>${nav.find((x) => x[0] === view)![2]}</strong></div><div class="topbar-right">${saveWarning ? `<button class="local-tag storage-warning" data-action="export" aria-live="polite">${icon("x")}${t("未保存 · 导出备份", "Not saved · export a backup")}</button>` : `<span class="local-tag">${icon("check")}${t("本地保存", "Saved locally")}</span>`}<span class="top-divider"></span><button class="locale-button" data-action="locale" aria-label="${t("Switch interface to English", "切换界面为中文")}">${icon("globe")}<span>${s().locale === "zh" ? "简体中文" : "English"}</span>${icon("chevron-down")}</button></div></header>
      <main id="main-content" class="main-content ${view}">${view === "practice" ? practiceView() : view === "courses" ? coursesView() : view === "statistics" ? statisticsView() : settingsView()}</main>
      <footer class="app-footer"><span>${t("不必着急。准确一点，放松一点。", "Take your time. Stay accurate. Stay relaxed.")}</span><span>DAZI <span class="footer-dot">·</span> ${t("为每一次进步而设计", "Made for your next small step")} <span class="footer-count">${summary.sessions} ${t("次练习", "sessions")}</span></span></footer></div></div>
      ${showGuide ? guideDialog() : ""}${showResult && lastResult ? resultDialog(lastResult) : ""}`;
    bind();
    if (showGuide || showResult)
      requestAnimationFrame(() =>
        root.querySelector<HTMLButtonElement>("dialog button")?.focus(),
      );
    if (view === "practice") updatePractice();
  }
  function languageControls() {
    return `<div class="language-controls"><label class="language-select">${icon("globe")}<select id="content-language" aria-label="${t("练习内容语言", "Practice content language")}"><option value="en" ${s().language === "en" ? "selected" : ""}>${t("英文练习", "English practice")}</option><option value="zh" ${s().language === "zh" ? "selected" : ""}>${t("中文练习", "Chinese practice")}</option></select>${icon("chevron-down")}</label>${s().language === "zh" ? `<label class="language-select mode-select"><select id="chinese-mode" aria-label="${t("中文输入模式", "Chinese input mode")}"><option value="pinyin" ${!isIME() ? "selected" : ""}>${t("拼音指法", "Pinyin keys")}</option><option value="ime" ${isIME() ? "selected" : ""}>${t("输入法", "Chinese IME")}</option></select>${icon("chevron-down")}</label>` : ""}</div>`;
  }
  function practiceView() {
    const course = s().course;
    return `${heading(t("把练习变成习惯", "A LITTLE PRACTICE, EVERY DAY"), t("手指归位，慢慢找到节奏。", "Find your keys. Find your flow."), t("让准确先于速度，让每一次敲击都更自然。", "A little more accuracy. A little less effort. One keystroke at a time."))}
      <section class="practice-card" aria-label="${t("打字练习", "Typing practice")}"><div class="lesson-toolbar"><button class="lesson-button" data-view="courses"><span class="lesson-number">${(course + 1).toString().padStart(2, "0")}</span><span><small>${t("当前课程", "CURRENT LESSON")}</small><strong>${courseName(course, s())}</strong></span>${icon("chevron-down")}</button>${languageControls()}</div>
      <div class="session-info"><span class="practice-mode"><span class="mode-indicator"></span>${s().automatic ? t("智能练习", "Adaptive practice") : t("自由练习", "Manual practice")}<span class="soft-divider">/</span>${s().language === "en" ? COURSES[course].keys : isIME() ? t("中文输入法", "Chinese IME") : t("无声调全拼", "Pinyin without tones")}</span><div class="live-stats"><span><b id="speed">0</b><small>${unit()}</small></span><i></i><span><b id="accuracy">100</b><small>% ${t("准确率", "accuracy")}</small></span><i></i><span class="time-stat">${icon("pause")}<b id="timer">00:00</b></span></div></div>
      <div class="typing-box" id="typing-box"><div class="source-text ${!exercise.source || isIME() ? "is-hidden" : ""}">${escape(exercise.source)}</div><div class="typing-window"><div id="typing-text" class="typing-text ${isIME() ? "chinese-text" : ""}" aria-hidden="true">${renderLetters()}</div></div><label for="typing-input" class="sr-only">${t("输入上方文字，错键后请重试，按 Esc 暂停。", "Type the text above. Retry mistakes. Press Escape to pause.")}: ${escape(exercise.text)}</label><textarea id="typing-input" class="typing-input ${isIME() ? "ime-input" : ""}" autocomplete="off" autocapitalize="off" spellcheck="false" rows="1" placeholder="${isIME() ? t("使用你的中文输入法，在这里输入上方文字…", "Use your Chinese IME to type the text above…") : ""}" ${session.paused || showResult || showGuide ? "disabled" : ""}></textarea>
      <div id="practice-overlay" class="practice-overlay ${session.paused ? "" : "is-hidden"}"><button class="resume-button" data-action="resume">${icon("play")}<strong>${t("练习已暂停", "Practice paused")}</strong><span>${t("点击继续，找回你的节奏", "Click to pick up where you left off")}</span></button></div></div>
      <div class="text-footer"><span id="start-hint">${t("直接敲击键盘开始练习", "Start typing to begin")}<span class="hint-dot">·</span>${isIME() ? t("支持系统中文输入法", "Your Chinese IME is supported") : t("请切换至英文输入法", "Use your English keyboard")}</span><span class="text-counter"><span id="typed-count">0</span> / ${exercise.text.length}</span></div><div class="session-progress"><span id="session-progress-fill"></span></div></section>
      <section class="keyboard-section" aria-label="${t("键盘与手指提示", "Keyboard and finger guidance")}"><div class="keyboard-toolbar"><div class="finger-instruction">${icon("hand")}<span id="finger-hint"></span></div><div class="practice-actions"><button class="icon-button ${s().sound ? "enabled" : ""}" data-action="sound" title="${t("按键音效", "Key sounds")}" aria-label="${t("按键音效", "Key sounds")}" aria-pressed="${s().sound}">${icon(s().sound ? "volume-2" : "volume-x")}</button><button class="icon-button" data-action="restart" title="${t("重新开始", "Restart")}" aria-label="${t("重新开始", "Restart")}">${icon("rotate-ccw")}</button><button class="icon-button" data-action="pause" title="${t("暂停 / 继续（Esc）", "Pause / resume (Esc)")}" aria-label="${t("暂停或继续", "Pause or resume")}">${icon(session.paused ? "play" : "pause")}</button><span class="action-divider"></span><button class="icon-button ${s().keyboard ? "enabled" : ""}" data-action="keyboard" title="${t("显示键盘", "Show keyboard")}" aria-label="${t("显示键盘", "Show keyboard")}" aria-pressed="${s().keyboard}">${icon("keyboard")}</button><button class="icon-button ${s().hands ? "enabled" : ""}" data-action="hands" title="${t("显示双手", "Show hands")}" aria-label="${t("显示双手", "Show hands")}" aria-pressed="${s().hands}">${icon("hand")}</button></div></div>
      ${s().keyboard ? keyboardView() : `<button class="hidden-keyboard" data-action="keyboard">${icon("keyboard")}${t("键盘已隐藏 · 点击显示提示", "Keyboard hidden · click to show hints")}</button>`}
      ${s().hands && !isIME() ? `<div class="hands-area"><span class="hand-side left">${t("左手", "LEFT HAND")}</span>${handSVG(false)}<div class="hands-center"><span class="home-keys"><kbd>F</kbd><kbd>J</kbd></span><p>${t("食指找到凸起，双手自然归位", "Find the bumps. Make yourself at home.")}</p></div>${handSVG(true)}<span class="hand-side right">${t("右手", "RIGHT HAND")}</span></div>` : ""}</section>
      <div class="coaching-note"><span class="tip-mark">${icon("focus")}</span><p><strong>${t("小提示", "A gentle reminder")}</strong>${isIME() ? t("输入法组词时不会计为错键；候选词提交后再进行检查。", "Composition is never counted as a mistake. Only committed characters are checked.") : s().language === "zh" ? t("按照标准指法输入全拼，ü 用 v 表示；不需要输入声调。", "Type full pinyin with standard finger placement. Use v for ü and omit tones.") : COURSES[course][s().locale === "zh" ? "hintZh" : "hintEn"]}</p><button data-action="guide" aria-label="${t("查看更多指法说明", "More typing guidance")}">${icon("chevron-right")}</button></div>`;
  }
  function renderLetters() {
    return [...exercise.text]
      .map(
        (c, i) =>
          `<span class="letter ${i < session.position ? "typed" : i === session.position ? "current" : ""}" data-index="${i}">${escape(c)}</span>`,
      )
      .join("");
  }
  function keyboardView() {
    return `<div class="keyboard" aria-label="QWERTY"><div class="keyboard-inner">${KEY_ROWS.map(
      (row, rowIndex) =>
        `<div class="key-row row-${rowIndex}">${row
          .map((key) => {
            const special = key.length > 1;
            const display: Record<string, string> = {
              Backspace: "delete",
              Caps: "caps lock",
              Enter: "enter",
              Shift: "shift",
              ShiftRight: "shift",
              Ctrl: "ctrl",
              CtrlRight: "ctrl",
              Alt: "alt",
              AltRight: "alt",
              Win: "win",
              Menu: "menu",
              Space: "",
              Fn: "fn",
              Tab: "tab",
            };
            const shift = Object.entries(SHIFTED).find(
              ([, base]) => base === key,
            )?.[0];
            return `<div data-key="${escape(key)}" class="key ${special ? "special key-" + key.toLowerCase() : ""} ${key === "f" || key === "j" ? "home-key" : ""}" data-finger="${fingerFor(key)}">${shift ? `<small>${escape(shift)}</small>` : ""}<span>${escape(display[key] ?? key.toUpperCase())}</span>${key === "f" || key === "j" ? '<i class="home-bump"></i>' : ""}</div>`;
          })
          .join("")}</div>`,
    ).join("")}</div></div>`;
  }
  function handSVG(right: boolean) {
    const indices = right ? [9, 8, 7, 6, 5] : [0, 1, 2, 3, 4];
    return `<svg class="hand-illustration" viewBox="0 0 180 180" fill="none" aria-hidden="true"><g ${right ? 'transform="translate(180 0) scale(-1 1)"' : ""}><path class="hand-outline" d="M45 171C43 153 29 141 27 119L24 74C23 63 38 61 40 73L44 107L41 43C40 31 57 29 58 42L62 96L62 26C62 13 79 13 80 26L81 96L86 38C87 25 103 27 102 40L99 112L124 92C135 83 145 96 136 107L111 139C105 148 105 160 104 171"/><path class="hand-line" d="M43 117Q64 111 79 119M52 137Q69 129 90 136M64 152L88 152M110 115Q94 111 91 131"/>
      ${[
        [32, 77],
        [50, 45],
        [71, 29],
        [94, 42],
        [127, 100],
      ]
        .map(
          ([x, y], i) =>
            `<circle class="finger-pad" data-hand-finger="${indices[i]}" cx="${x}" cy="${y}" r="7"/>`,
        )
        .join("")}</g></svg>`;
  }
  function updatePractice() {
    if (view !== "practice") return;
    const metrics = session.metrics(performance.now());
    const set = (id: string, value: string) => {
      const el = root.querySelector("#" + id);
      if (el) el.textContent = value;
    };
    set("speed", String(metrics.speed));
    set("accuracy", String(metrics.accuracy));
    set("timer", clock(metrics.seconds));
    set("typed-count", String(session.position));
    const fill = root.querySelector<HTMLElement>("#session-progress-fill");
    if (fill)
      fill.style.width = `${(session.position / exercise.text.length) * 100}%`;
    const letters = root.querySelectorAll<HTMLElement>(".letter");
    for (
      let i = Math.min(lastPosition, session.position);
      i <= Math.max(lastPosition, session.position);
      i++
    ) {
      const el = letters[i];
      if (el)
        el.className = `letter ${i < session.position ? "typed" : i === session.position ? "current" : ""}`;
    }
    lastPosition = session.position;
    const current = root.querySelector<HTMLElement>(".letter.current");
    const line = root.querySelector<HTMLElement>("#typing-text");
    if (current && line)
      line.style.transform = `translateY(-${Math.max(0, current.offsetTop - line.offsetTop - parseFloat(getComputedStyle(line).lineHeight))}px)`;
    const char = exercise.text[session.position] || "";
    const target = physicalKey(char);
    const finger = fingerFor(char);
    const needsShift = char !== char.toLowerCase() || !!SHIFTED[char];
    root.querySelectorAll<HTMLElement>("[data-key]").forEach((el) => {
      el.classList.toggle(
        "target",
        !isIME() && el.dataset.key === target && !session.done,
      );
      el.classList.toggle(
        "shift-target",
        !isIME() &&
          needsShift &&
          el.dataset.key === (finger < 5 ? "ShiftRight" : "Shift"),
      );
    });
    root
      .querySelectorAll("[data-hand-finger]")
      .forEach((el) =>
        el.classList.toggle(
          "active",
          !isIME() && Number(el.getAttribute("data-hand-finger")) === finger,
        ),
      );
    const fingersZh = [
      "左手小指",
      "左手无名指",
      "左手中指",
      "左手食指",
      "拇指",
      "右手拇指",
      "右手食指",
      "右手中指",
      "右手无名指",
      "右手小指",
    ];
    const fingersEn = [
      "Left pinky",
      "Left ring finger",
      "Left middle finger",
      "Left index finger",
      "Thumb",
      "Right thumb",
      "Right index finger",
      "Right middle finger",
      "Right ring finger",
      "Right pinky",
    ];
    const hint = root.querySelector("#finger-hint");
    if (hint)
      hint.innerHTML = session.done
        ? t("练习已完成", "Practice complete")
        : isIME()
          ? t(
              "使用中文输入法，提交汉字后检查",
              "Type with your Chinese IME; committed text is checked",
            )
          : `<strong>${(s().locale === "zh" ? fingersZh : fingersEn)[finger]}</strong><span class="finger-hint-separator">${t("按下", "press")}</span><kbd>${escape(char === " " ? t("空格", "space") : char.toUpperCase())}</kbd>${needsShift ? "<small> + Shift</small>" : ""}`;
    const start = root.querySelector("#start-hint");
    if (start && session.started !== null)
      start.innerHTML = `${t("保持专注，跟随自己的节奏", "Stay present. Follow your own rhythm.")}<span class="hint-dot">·</span><kbd>Esc</kbd> ${t("暂停", "to pause")}`;
    const overlay = root.querySelector("#practice-overlay");
    if (overlay)
      overlay.classList.toggle(
        "is-hidden",
        session.done || (!session.paused && focused),
      );
  }
  function coursesView() {
    const history = relevant();
    const passed = COURSES.filter((_, i) =>
      history.some(
        (r) => r.course === i && r.accuracy >= 95 && r.speed >= 15 + i * 5,
      ),
    ).length;
    return `${heading(t("从容开始，循序渐进", "BUILD YOUR MUSCLE MEMORY"), t("每一小步，都是进步。", "Small steps. Real progress."), t("从基准键开始，让正确的指法成为不假思索的习惯。", "Start with the home row. Make good technique second nature."))}<div class="section-toolbar">${languageControls()}<div class="segmented"><button data-action="auto" class="${s().automatic ? "selected" : ""}">${t("智能进阶", "Automatic")}</button><button data-action="manual" class="${!s().automatic ? "selected" : ""}">${t("自由选课", "Manual")}</button></div></div>
    <div class="course-overview"><div><span>${t("你的学习路径", "Your learning path")}</span><strong>${passed}<small> / ${COURSES.length} ${t("课程达标", "lessons passed")}</small></strong></div><div class="path-progress"><span style="width:${(passed / COURSES.length) * 100}%"></span></div><p>${s().automatic ? t("达到 95% 准确率和目标速度，自动推荐下一课。也可以选择自由选课。", "Reach 95% accuracy and the target speed to advance. Switch to Manual to explore any lesson.") : t("所有课程均可自由练习，学习成绩仍会被记录。", "Every lesson is yours to explore. Your results are still recorded.")}</p></div>
    <div class="course-list">${COURSES.map((c, i) => {
      const unlocked = !s().automatic || lessonUnlocked(i, history, s());
      const results = history.filter((r) => r.course === i);
      const best = summarize(results).best;
      const done = results.some(
        (r) => r.accuracy >= 95 && r.speed >= 15 + i * 5,
      );
      return `<button class="course-row ${s().course === i ? "current-course" : ""} ${!unlocked ? "locked-course" : ""}" data-course="${i}" ${!unlocked ? 'aria-disabled="true"' : ""}><span class="course-index ${done ? "passed" : ""}">${done ? icon("check") : (i + 1).toString().padStart(2, "0")}</span><span class="course-description"><strong>${courseName(i, s())}${s().course === i ? `<em>${t("正在学习", "CURRENT")}</em>` : ""}</strong><small>${s().language === "en" ? c.keys : t("中文词句 · ", "Chinese phrases · ") + (isIME() ? t("输入法", "IME") : t("拼音指法", "Pinyin"))}</small></span><span class="course-requirement">${t("目标", "Target")} ${15 + i * 5} ${unit()}<small>${t("准确率", "Accuracy")} ≥ 95%</small></span><span class="course-best">${best ? `${best} <small>${unit()}</small>` : "—"}<small>${t("最佳成绩", "Personal best")}</small></span><span class="course-open">${unlocked ? icon("chevron-right") : t("待解锁", "Locked")}</span></button>`;
    }).join(
      "",
    )}</div><p class="section-footnote">${t("拼音模式使用无声调全拼，ü 用 v 表示；中文课程按词句难度递进。", "Pinyin uses full syllables without tones; type v for ü. Chinese lessons progress by phrase complexity.")}</p>`;
  }
  function statisticsView() {
    const history = relevant().filter(
      (r) => statsFilter === "all" || r.at > Date.now() - 7 * 86400000,
    );
    const total = summarize(history);
    const recent = history.slice(-20);
    const max = Math.max(60, total.best + 10);
    const errors: Record<string, number> = {};
    history.forEach((r) =>
      Object.entries(r.errors).forEach(([k, n]) => {
        errors[k] = (errors[k] || 0) + n;
      }),
    );
    const weak = Object.entries(errors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return `${heading(t("看见每一次成长", "YOUR PRACTICE, OVER TIME"), t("进步，正在发生。", "Look how far you’ve come."), t("记录的不只是速度，还有越来越从容的自己。", "More than speed. A record of becoming more confident at the keyboard."))}<div class="section-toolbar">${languageControls()}<label class="language-select"><select id="stats-filter" aria-label="${t("统计时间范围", "Statistics time range")}"><option value="all" ${statsFilter === "all" ? "selected" : ""}>${t("全部时间", "All time")}</option><option value="week" ${statsFilter === "week" ? "selected" : ""}>${t("最近 7 天", "Last 7 days")}</option></select>${icon("chevron-down")}</label></div>
    <div class="stat-overview">${[
      [t("最佳速度", "Best speed"), String(total.best), unit()],
      [t("平均准确率", "Average accuracy"), String(total.accuracy), "%"],
      [
        t("累计练习", "Time practiced"),
        String(Math.floor(total.seconds / 60)),
        t("分钟", "min"),
      ],
      [
        t("完成练习", "Sessions completed"),
        String(total.sessions),
        t("次", "sessions"),
      ],
    ]
      .map(
        ([title, value, u]) =>
          `<div class="stat-block"><span>${title}</span><strong>${value}<small>${u}</small></strong></div>`,
      )
      .join("")}</div>
    <section class="chart-section"><div class="section-title"><h2>${t("你的速度曲线", "Your rhythm, visualized")}</h2><span>${modeLabel()} · ${unit()}</span></div>${recent.length ? `<div class="chart" role="img" aria-label="${t("最近练习速度，按时间排序", "Recent session speeds, oldest first")}: ${recent.map((r) => r.speed).join(", ")}"><div class="chart-grid">${[max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0].map((n) => `<div><span>${n}</span><i></i></div>`).join("")}</div><div class="chart-bars">${recent.map((r, i) => `<div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max(2, (r.speed / max) * 100)}%"><div class="chart-tooltip">${r.speed} ${unit()} · ${r.accuracy}%<small>${new Date(r.at).toLocaleDateString(s().locale)}</small></div></div><span>${i + 1}</span></div>`).join("")}</div></div>` : `<div class="empty-chart">${icon("chart-no-axes-combined")}<h3>${t("你的第一条进步曲线，从这里开始", "Your story starts with a little practice")}</h3><p>${t("完成一次练习，速度和准确率就会出现在这里。", "Finish a session to see your speed and accuracy here.")}</p><button class="primary-button" data-view="practice">${t("开始第一次练习", "Start practicing")}</button></div>`}</section>
    <div class="stats-bottom"><section class="weak-section"><h2>${t("值得多练的键", "Give these keys a little love")}</h2><p>${t("智能练习会根据最近的错键，调整后续练习。", "Adaptive practice uses recent mistakes to tailor your next exercise.")}</p><div class="weak-keys">${weak.length ? weak.map(([k, n]) => `<span><kbd>${escape(k === " " ? "space" : k.toUpperCase())}</kbd><small>${n} ${t("次", "misses")}</small></span>`).join("") : `<span class="muted">${t("还没有错键记录，保持轻松。", "No mistakes recorded. Keep it relaxed.")}</span>`}</div></section><section class="practice-history"><div class="section-title"><h2>${t("最近练习", "Recent sessions")}</h2><span>${t("最近 10 次", "Last 10")}</span></div>${
      history.length
        ? `<div class="history-table"><div class="history-head"><span>${t("课程 / 日期", "Lesson / date")}</span><span>${unit()}</span><span>${t("准确率", "Accuracy")}</span></div>${history
            .slice(-10)
            .reverse()
            .map(
              (r) =>
                `<div class="history-row"><span><strong>${courseName(r.course, s())}</strong><small>${new Date(r.at).toLocaleString(s().locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</small></span><strong>${r.speed}</strong><span>${r.accuracy}%</span></div>`,
            )
            .join("")}</div>`
        : `<p class="muted history-empty">${t("还没有完成的练习。每一次开始都值得。", "No sessions yet. Every beginning counts.")}</p>`
    }</section></div>`;
  }
  function settingsView() {
    const toggle = (
      key: "sound" | "keyboard" | "hands" | "automatic",
      title: string,
      desc: string,
    ) =>
      `<div class="setting-row"><div><strong>${title}</strong><p>${desc}</p></div><button role="switch" aria-checked="${s()[key]}" aria-label="${title}" data-toggle="${key}" class="switch ${s()[key] ? "on" : ""}"><span></span></button></div>`;
    return `${heading(t("用你喜欢的方式", "MAKE YOURSELF AT HOME"), t("属于你的练习方式。", "A space that feels like you."), t("一点小调整，让每一次练习都更舒服。设置会自动保存。", "Small adjustments for a more comfortable practice. Everything saves automatically."))}<div class="settings-content"><section class="settings-section"><h2>${t("语言与内容", "Language & content")}</h2><div class="setting-row"><div><strong>${t("界面语言", "Interface language")}</strong><p>${t("只改变菜单和提示，不会改变练习内容。", "Changes menus and guidance, independently of practice content.")}</p></div><label class="language-select"><select id="interface-language" aria-label="${t("界面语言", "Interface language")}"><option value="zh" ${s().locale === "zh" ? "selected" : ""}>简体中文</option><option value="en" ${s().locale === "en" ? "selected" : ""}>English</option></select>${icon("chevron-down")}</label></div><div class="setting-row"><div><strong>${t("练习内容语言", "Practice content language")}</strong><p>${t("选择你想练习的语言，与界面语言无关。", "Choose what you type. Your interface language stays the same.")}</p></div>${languageControls()}</div><div class="language-explainer">${icon("globe")}<p>${t("例如：可以使用英文界面练习中文，也可以使用中文界面练习英文。", "For example, practice Chinese with an English interface, or English with a Chinese interface.")}</p></div></section><section class="settings-section"><h2>${t("练习偏好", "Practice preferences")}</h2>${toggle("automatic", t("智能进阶", "Automatic progression"), t("根据速度和准确率解锁课程，并针对薄弱键位练习。", "Unlock lessons through speed and accuracy; practice your weaker keys."))}${toggle("sound", t("按键音效", "Key sounds"), t("轻柔的敲击声，不同的错误提示音。", "A gentle click for each key, with a distinct sound for mistakes."))}${toggle("keyboard", t("显示虚拟键盘", "On-screen keyboard"), t("实时高亮下一个按键及所需的 Shift。", "Highlight the next key and the Shift key when needed."))}${toggle("hands", t("显示双手提示", "Hand guidance"), t("通过手指高亮学习标准指法，输入法模式除外。", "Learn standard finger placement with highlighted fingertips, except in IME mode."))}<div class="setting-row"><div><strong>${t("练习长度", "Exercise length")}</strong><p>${t("较短的练习有助于保持专注，按内容长度估算。", "Short sessions help you focus. Longer options include more text.")}</p></div><label class="language-select"><select id="duration" aria-label="${t("练习长度", "Exercise length")}">${[1, 2, 3].map((v, i) => `<option value="${v}" ${s().duration === v ? "selected" : ""}>${[t("短篇", "Short"), t("中篇", "Medium"), t("长篇", "Long")][i]}</option>`).join("")}</select>${icon("chevron-down")}</label></div><div class="setting-row"><div><strong>${t("每日练习目标", "Daily practice goal")}</strong><p>${t("比起一次练很久，每天一点点更容易坚持。", "A little practice every day goes a long way.")}</p></div><label class="language-select"><select id="daily-goal" aria-label="${t("每日目标", "Daily goal")}">${[5, 10, 15, 20, 30].map((v) => `<option value="${v}" ${s().goal === v ? "selected" : ""}>${v} ${t("分钟", "minutes")}</option>`).join("")}</select>${icon("chevron-down")}</label></div></section><section class="settings-section"><h2>${t("你的学习数据", "Your learning data")}</h2><div class="setting-row"><div><strong>${t("本地保存，安心练习", "Local to your browser")}</strong><p>${t("进度只保存在当前浏览器。更换设备前，记得导出备份。", "Your progress stays in this browser. Export a backup before switching devices.")}</p></div></div><div class="data-actions"><button class="secondary-button" data-action="export">${icon("download")}${t("导出进度", "Export progress")}</button><button class="secondary-button" data-action="import">${icon("upload")}${t("导入备份", "Import backup")}</button><button class="danger-text" data-action="reset">${t("清除学习记录", "Clear learning history")}</button><input type="file" id="import-file" accept="application/json,.json" hidden></div><div id="reset-confirm" class="reset-confirm is-hidden"><p>${t("确定清除所有学习记录？此操作无法撤销，建议先导出备份。", "Clear all learning history? This cannot be undone. Consider exporting a backup first.")}</p><button class="danger-button" data-action="confirm-reset">${t("确认清除", "Clear history")}</button><button class="secondary-button" data-action="cancel-reset">${t("保留记录", "Keep history")}</button></div></section><p class="section-footnote">${t("标准 QWERTY 键盘 · 支持系统“减少动态效果”偏好 · 无需账户", "Standard QWERTY keyboard · Respects reduced motion · No account needed")}</p></div>`;
  }
  function guideDialog() {
    return `<div class="dialog-backdrop"><dialog open aria-modal="true" aria-labelledby="guide-title" class="guide-dialog"><div class="dialog-top"><span class="eyebrow">${t("让身体轻松一点", "GET COMFORTABLE")}</span><button class="icon-button" data-action="close-dialog" aria-label="${t("关闭", "Close")}">${icon("x")}</button></div><h2 id="guide-title">${t("好姿势，让练习事半功倍。", "Good posture. Better practice.")}</h2><p class="dialog-intro">${t("不用绷紧，也不用追求完美。先从这四件小事开始。", "No tension. No perfection. Just four little things to keep in mind.")}</p><div class="posture-illustration"><svg viewBox="0 0 450 190" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M247 52h83v62h-83zM288 114v15m-18 0h36M128 133h222M143 133v47m194-47v47"/><circle cx="181" cy="38" r="17"/><path d="M175 58l-8 56 43 9 8 53m-50-64l-27 1m36-40 23 36 39 8m-107-45v71h49m-29 0v37"/></g><path d="M211 40h35" stroke="#5c7cda" stroke-width="2" stroke-dasharray="4 5"/><path d="M169 76a27 27 0 0 0 29 29" fill="none" stroke="#5c7cda" stroke-width="2"/><text x="211" y="32" fill="#73809a" font-size="12">50–70 cm</text></svg></div><div class="posture-tips">${[
      [
        t("坐稳，肩膀放松", "Sit tall, relax your shoulders"),
        t(
          "背部自然挺直，双脚平放地面。屏幕距离约 50–70 厘米。",
          "Keep your back comfortably upright, feet flat, and screen about 50–70 cm away.",
        ),
      ],
      [
        t("双手轻放，手腕放松", "Keep your hands light"),
        t(
          "手肘约呈直角，手腕自然悬放，不要用力压在桌沿。",
          "Keep elbows roughly at a right angle and wrists neutral, without pressing on the desk.",
        ),
      ],
      [
        t("找到 F 和 J 上的凸起", "Find the bumps on F and J"),
        t(
          "左手 A S D F，右手 J K L ;，拇指负责空格。每次敲击后回到基准键。",
          "Left hand: A S D F. Right hand: J K L ;. Thumbs: space. Return home after each reach.",
        ),
      ],
      [
        t("看屏幕，给自己一点时间", "Eyes up. Take your time."),
        t(
          "尽量不低头看键盘，先准确再提速。每练习 15–20 分钟，起身休息一下。",
          "Try to look at the screen. Accuracy before speed. Take a short break every 15–20 minutes.",
        ),
      ],
    ]
      .map(
        ([a, b], i) =>
          `<div><span>${i + 1}</span><p><strong>${a}</strong><small>${b}</small></p></div>`,
      )
      .join(
        "",
      )}</div><p class="guide-disclaimer">${t("键盘与双手提示展示推荐指法，不会检测你的实际手势。", "Keyboard and hand hints show recommended technique; they do not detect your actual posture.")}</p><button class="primary-button full-width" data-action="close-dialog">${t("准备好了，开始练习", "I’m ready to practice")}</button></dialog></div>`;
  }
  function resultDialog(r: Result) {
    const passed = r.accuracy >= 95 && r.speed >= 15 + r.course * 5;
    const next =
      s().automatic && !passed ? r.course : Math.min(6, r.course + 1);
    const errors = Object.entries(r.errors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return `<div class="dialog-backdrop"><dialog open aria-modal="true" aria-labelledby="result-title" class="result-dialog"><div class="dialog-top"><span class="eyebrow">${t("又一次小小的进步", "ANOTHER STEP FORWARD")}</span><button class="icon-button" data-action="close-dialog" aria-label="${t("关闭", "Close")}">${icon("x")}</button></div><div class="result-emblem">${icon(passed ? "trophy" : "check")}</div><h2 id="result-title">${passed ? t("这一步，走得很稳。", "A little practice. A big well done.") : t("练习完成，继续积累。", "Every little practice counts.")}</h2><p>${courseName(r.course, s())} · ${modeLabel()}</p><div class="result-metrics"><div><strong>${r.speed}</strong><span>${unit()}</span></div><div><strong>${r.accuracy}<small>%</small></strong><span>${t("准确率", "accuracy")}</span></div><div><strong>${clock(r.seconds)}</strong><span>${t("专注时间", "focused time")}</span></div></div><div class="result-feedback"><strong>${passed ? t("已达到本课目标", "Lesson target achieved") : t("给自己一点时间，准确比快更重要。", "Take your time. Accuracy comes before speed.")}</strong><p>${t("本课目标：", "Lesson target: ")}${15 + r.course * 5} ${unit()} · 95% ${t("准确率", "accuracy")}</p>${errors.length ? `<div class="result-weak">${t("下次多留意：", "Keep an eye on: ")}${errors.map(([k, n]) => `<kbd>${escape(k === " " ? "space" : k.toUpperCase())}<small> ×${n}</small></kbd>`).join("")}</div>` : `<p>${t("没有错键！保持这样的专注和放松。", "No mistakes! Keep that balance of focus and ease.")}</p>`}</div><div class="result-buttons"><button class="secondary-button" data-action="restart">${icon("rotate-ccw")}${t("再练一次", "Practice again")}</button><button class="primary-button" data-next="${next}">${next > r.course ? t("开始下一课", "Next lesson") : t("继续练习", "Keep practicing")}</button></div><button class="text-button result-stats" data-view="statistics">${t("查看学习统计", "See my progress")}</button></dialog></div>`;
  }
  function closeDialog() {
    const wasGuide = showGuide;
    showGuide = false;
    showResult = false;
    render();
    if (wasGuide && view === "practice") {
      session.resume(performance.now());
      render();
      focusInput();
    } else if (session.done && view === "practice") newSession();
    else restoreFocus?.focus();
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
      const merged = new Map(
        [...data.history, ...incoming.history].map((r) => [r.id, r]),
      );
      data.history = [...merged.values()]
        .sort((a, b) => a.at - b.at)
        .slice(-2000);
      data.settings = incoming.settings;
      persist();
      newSession();
      notify(
        t(
          "备份已导入，练习记录已合并。",
          "Backup imported. Your session history has been merged.",
        ),
      );
    } catch {
      notify(
        t(
          "无法导入：请选择有效的 DAZI 进度备份（不超过 5 MB）。",
          "Could not import. Choose a valid DAZI backup under 5 MB.",
        ),
      );
    }
  }
  function bind() {
    root
      .querySelectorAll<HTMLButtonElement>("[data-view]")
      .forEach((el) => (el.onclick = () => navigate(el.dataset.view as View)));
    root.querySelector<HTMLAnchorElement>(".brand")!.onclick = (e) => {
      e.preventDefault();
      navigate("practice");
    };
    root.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(
      (el) =>
        (el.onclick = () => {
          const action = el.dataset.action;
          if (action === "locale")
            changeSetting("locale", s().locale === "zh" ? "en" : "zh");
          else if (action === "restart") newSession();
          else if (action === "pause") pauseToggle();
          else if (action === "resume") {
            session.resume(performance.now());
            focused = true;
            render();
            focusInput();
          } else if (
            action === "sound" ||
            action === "keyboard" ||
            action === "hands"
          )
            changeSetting(action, !s()[action]);
          else if (action === "guide") {
            restoreFocus = el;
            session.pause(performance.now());
            showGuide = true;
            render();
          } else if (action === "close-dialog") closeDialog();
          else if (action === "auto" || action === "manual")
            changeSetting("automatic", action === "auto");
          else if (action === "export") {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
              }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `dazi-progress-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            notify(
              t("进度备份已导出。", "Your progress backup has been exported."),
            );
          } else if (action === "import")
            root.querySelector<HTMLInputElement>("#import-file")?.click();
          else if (action === "reset" || action === "cancel-reset")
            root
              .querySelector("#reset-confirm")
              ?.classList.toggle("is-hidden", action === "cancel-reset");
          else if (action === "confirm-reset") {
            data.history = [];
            persist();
            newSession();
            notify(
              t(
                "学习记录已清除，偏好设置已保留。",
                "Learning history cleared. Your preferences are preserved.",
              ),
            );
          }
        }),
    );
    root.querySelectorAll<HTMLButtonElement>("[data-course]").forEach(
      (el) =>
        (el.onclick = () => {
          const n = Number(el.dataset.course);
          if (s().automatic && !lessonUnlocked(n, relevant(), s())) {
            notify(
              t(
                "先完成上一课，或切换到「自由选课」。",
                "Pass the previous lesson, or switch to Manual.",
              ),
            );
            return;
          }
          view = "practice";
          newSession(n);
        }),
    );
    root
      .querySelectorAll<HTMLButtonElement>("[data-next]")
      .forEach(
        (el) => (el.onclick = () => newSession(Number(el.dataset.next))),
      );
    root.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach(
      (el) =>
        (el.onclick = () => {
          const key = el.dataset.toggle as
            | "sound"
            | "keyboard"
            | "hands"
            | "automatic";
          changeSetting(key, !s()[key]);
        }),
    );
    const select = (id: string, cb: (value: string) => void) => {
      const el = root.querySelector<HTMLSelectElement>("#" + id);
      if (el) el.onchange = () => cb(el.value);
    };
    select("content-language", (v) =>
      changeSetting("language", v as "zh" | "en"),
    );
    select("interface-language", (v) =>
      changeSetting("locale", v as "zh" | "en"),
    );
    select("chinese-mode", (v) =>
      changeSetting("chineseMode", v as "pinyin" | "ime"),
    );
    select("duration", (v) => changeSetting("duration", Number(v)));
    select("daily-goal", (v) => changeSetting("goal", Number(v)));
    select("stats-filter", (v) => {
      statsFilter = v as "all" | "week";
      render();
    });
    const file = root.querySelector<HTMLInputElement>("#import-file");
    if (file)
      file.onchange = () => {
        if (file.files?.[0]) void importBackup(file.files[0]);
      };
    const input = root.querySelector<HTMLTextAreaElement>("#typing-input");
    if (input) {
      input.onfocus = () => {
        focused = true;
        updatePractice();
      };
      input.onblur = (e) => {
        if (session.done || showGuide || showResult) return;
        const next = e.relatedTarget;
        if (
          next instanceof HTMLElement &&
          root.contains(next) &&
          next.closest("button,select,a,input")
        )
          return;
        focused = false;
        session.pause(performance.now());
        input.disabled = true;
        updatePractice();
        const pause = root.querySelector('[data-action="pause"]');
        if (pause) pause.innerHTML = icon("play");
      };
      input.addEventListener("compositionstart", () => {
        composing = true;
      });
      input.addEventListener("compositionend", (e) => {
        composing = false;
        suppressCompositionInput = e.data;
        if (isIME()) accept(e.data);
        else
          notify(
            t(
              "请切换至英文输入法，直接敲击字母。",
              "Switch to your English keyboard to type individual letters.",
            ),
          );
        input.value = "";
        setTimeout(() => {
          suppressCompositionInput = "";
        }, 0);
      });
      input.oninput = (e) => {
        const event = e as InputEvent;
        if (composing || event.isComposing) return;
        if (
          suppressCompositionInput &&
          event.data === suppressCompositionInput
        ) {
          input.value = "";
          suppressCompositionInput = "";
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
            "试着亲手敲出来，让手指记住。",
            "Try typing it yourself. That’s how muscle memory grows.",
          ),
        );
      };
      input.onkeydown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          pauseToggle();
          return;
        }
        if (composing || e.isComposing || e.keyCode === 229) return;
        if (e.key === "Backspace") {
          e.preventDefault();
          session.backspace();
          updatePractice();
        } else if (e.key === "Enter" && !isIME()) e.preventDefault();
        else if (e.key === "Tab") return;
      };
    }
    const box = root.querySelector<HTMLElement>("#typing-box");
    if (box)
      box.onclick = (e) => {
        if (!(e.target as HTMLElement).closest("button") && !session.paused)
          focusInput();
      };
    const overlay = root.querySelector<HTMLElement>("#practice-overlay");
    if (overlay && !session.paused)
      overlay.onclick = () => {
        focused = true;
        focusInput();
        updatePractice();
      };
  }
  const onDocumentKey = (e: KeyboardEvent) => {
    if (showGuide || showResult) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog();
      }
      if (e.key === "Tab") {
        const buttons = [
          ...root.querySelectorAll<HTMLButtonElement>("dialog button"),
        ].filter((b) => !b.disabled);
        const first = buttons[0],
          last = buttons[buttons.length - 1];
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
    if (
      view === "practice" &&
      e.key === "Escape" &&
      e.target !== root.querySelector("#typing-input")
    ) {
      e.preventDefault();
      pauseToggle();
    }
  };
  document.addEventListener("keydown", onDocumentKey);
  const blur = () => {
    if (view === "practice" && !session.done && !session.paused) {
      session.pause(performance.now());
      render();
    }
  };
  window.addEventListener("blur", blur);
  const visibility = () => {
    if (document.hidden) blur();
  };
  document.addEventListener("visibilitychange", visibility);
  render();
  focusInput();
  const interval = setInterval(() => {
    if (
      view === "practice" &&
      session.started !== null &&
      !session.done &&
      !session.paused
    )
      updatePractice();
  }, 250);
  return () => {
    clearInterval(interval);
    clearTimeout(toastTimeout);
    document.removeEventListener("keydown", onDocumentKey);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", visibility);
    void audio?.close();
  };
}
