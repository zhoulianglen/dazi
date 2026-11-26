import type { Settings } from "./model";
export type TourStep = 1 | 2 | 3;
export function renderOnboarding(
  step: TourStep,
  settings: Settings,
  progress: number,
  needsRetry = false,
) {
  const t = (zh: string, en: string) => (settings.locale === "zh" ? zh : en);
  const ime = settings.language === "zh" && settings.chineseMode === "ime";
  const chosen =
    settings.language === "en" ? "en" : `zh-${settings.chineseMode}`;
  if (step === 3)
    return `<aside class="typing-coach ${ime ? "ime-coach" : ""}" data-tour-step="3" aria-label="${t("新手试打", "Your first keystrokes")}"><div><strong>${needsRetry ? t("再试一次，打对 3 个字符就好。", "Try again. Three correct characters is all it takes.") : ime ? t("用中文输入法，输入上方汉字", "Use your Chinese IME to type the text above") : t("照着上方文字，跟随蓝色提示输入", "Type the text above. Follow the blue hints.")}</strong><p>${needsRetry ? t("没关系，准确比速度更重要。点“再试一次”，跟着上方文字慢慢输入。", "Accuracy comes before speed. Choose Try again and follow the text at your own pace.") : ime ? t("组词时不计错，提交汉字后检查。正确输入 3 个字即可完成引导。", "Composition isn’t a mistake. Commit 3 correct characters to finish the guide.") : t("蓝色按键告诉你按哪里，蓝色手指告诉你用哪根手指。先打对 3 个字符，不用追求速度。", "Blue shows the next key and the finger to use. Type 3 correct characters; take your time.")}</p></div><span id="tour-typed-progress" aria-live="polite">${progress} / 3</span>${needsRetry ? `<button class="coach-retry" data-action="continue">${t("再试一次", "Try again")}</button>` : ""}<button data-action="skip-onboarding">${t("结束引导", "End guide")}</button></aside>`;
  const stepper = `<ol class="tour-stepper" aria-label="${t("新手引导进度", "Getting started progress")}">${[t("选语言", "Language"), t("放好双手", "Hand position"), t("试打", "Try typing")].map((name, i) => `<li ${step === i + 1 ? 'aria-current="step"' : ""} class="${step > i + 1 ? "done" : ""}"><span>${i + 1}</span>${name}</li>`).join("")}</ol>`;
  return `<div class="tour-shade ${step === 2 ? "placement-shade" : ""}"></div><section class="intro-tour ${step === 2 ? "placement-tour" : ""}" data-tour-step="${step}" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-description"><div class="tour-topline"><span>${t("新手引导 · 约 30 秒", "GETTING STARTED · ABOUT 30 SECONDS")}</span><button data-action="tour-locale" aria-label="${t("Switch interface to English", "切换界面为中文")}">${settings.locale === "zh" ? "English" : "简体中文"}</button></div>${stepper}
  ${
    step === 1
      ? `<h1 id="onboarding-title">${t("从这里开始，学习十指打字。", "Learn to type without looking down.")}</h1><p id="onboarding-description">${t("选好练习内容，找到双手的位置，再跟着屏幕试打。无需注册，进度保存在当前浏览器。", "Choose what to practice, find your home keys, then try a few keystrokes. No account needed; progress stays in this browser.")}</p><label class="tour-language-label" for="onboarding-language">${t("你想练习哪种内容？", "What would you like to practice?")}</label><select id="onboarding-language">${[
          [
            "en",
            t(
              "英文 · 从基础键位开始（推荐）",
              "English · start with the basics (recommended)",
            ),
          ],
          [
            "zh-pinyin",
            t("中文 · 拼音指法", "Chinese · pinyin finger practice"),
          ],
          ["zh-ime", t("中文 · 使用系统输入法", "Chinese · use your own IME")],
        ]
          .map(
            ([value, name]) =>
              `<option value="${value}" ${chosen === value ? "selected" : ""}>${name}</option>`,
          )
          .join(
            "",
          )}</select><p class="tour-language-note">${ime ? t("用你自己的中文输入法练习汉字；组词时不会计错。", "Practice Chinese characters with your own IME. Composition is never counted as a mistake.") : settings.language === "zh" ? t("看中文，敲无声调拼音。练习时请使用英文输入法。", "Read Chinese, type pinyin without tones. Use an English keyboard for this mode.") : t("跟着逐键提示，先学习字母，再逐步增加难度。", "Follow the key-by-key hints. Start with letters and build up gradually.")}</p><p class="tour-independent-note">${t("练习内容与界面语言独立，之后都可在右上角设置中切换。", "Practice and interface languages are independent. Change either later in Settings.")}</p>`
      : `<h1 id="onboarding-title">${t("食指找到 F 和 J 的凸起。", "Find the bumps on F and J.")}</h1><p id="onboarding-description">${t("左手放在 A S D F，右手放在 J K L ;，拇指负责空格。肩膀和手腕放松，敲击后回到原位。", "Left: A S D F. Right: J K L ;. Thumbs on space. Relax your wrists; return home after each key.")}</p><div class="tour-home-row" aria-hidden="true"><span>${t("左手", "LEFT")}</span>${["A", "S", "D", "F"].map((k) => `<kbd class="${k === "F" ? "home" : ""}">${k}</kbd>`).join("")}<i></i>${["J", "K", "L", ";"].map((k) => `<kbd class="${k === "J" ? "home" : ""}">${k}</kbd>`).join("")}<span>${t("右手", "RIGHT")}</span></div>`
  }
  <div class="tour-actions">${step === 2 ? `<button class="tour-back" data-action="tour-back">${t("上一步", "Back")}</button>` : ""}<button class="tour-skip" data-action="skip-onboarding">${t("跳过，直接练习", "Skip and practice")}</button><button class="tour-primary" data-action="tour-next" data-tour-primary>${step === 1 ? t("下一步：放好双手", "Next: find your home keys") : t("已找到，试打一下", "Ready to try typing")}</button></div></section>`;
}
