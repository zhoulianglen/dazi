import type { Locale } from "./model";
export const SITE_URL = "https://typing.zhoulianglen.com/";
export const PAGE_META = {
  zh: {
    title: "DAZI 在线打字练习｜免费盲打与十指指法训练",
    description:
      "免费在线学习标准十指盲打，支持英文、中文拼音和中文输入法练习。DAZI 提供新手引导、键盘与双手指法提示、渐进课程及速度和准确率统计；无需注册，进度保存在本地浏览器。",
    keywords:
      "在线打字练习,盲打练习,十指打字,标准指法,英文打字练习,中文拼音打字,typing tutor,touch typing",
    locale: "zh_CN",
  },
  en: {
    title: "DAZI Typing Tutor | Free Online Touch Typing Practice",
    description:
      "Learn touch typing with guided finger positions, a visual keyboard, progressive lessons and speed and accuracy tracking. Practice English, Chinese pinyin or Chinese IME. Free, no account required; progress stays in your browser.",
    keywords:
      "touch typing,typing practice,typing tutor,learn to type,ten finger typing,English typing,Chinese pinyin typing",
    locale: "en_US",
  },
} as const;
const escapeAttribute = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function renderSeoHead(indexable = true) {
  const m = PAGE_META.zh;
  const meta = (kind: "name" | "property", key: string, value: string) =>
    `<meta ${kind}="${key}" content="${escapeAttribute(value)}">`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": SITE_URL + "#website",
        name: "DAZI 打字练习",
        alternateName: "DAZI Typing Tutor",
        url: SITE_URL,
        inLanguage: ["zh-CN", "en"],
      },
      {
        "@type": "WebApplication",
        "@id": SITE_URL + "#app",
        name: "DAZI 打字练习",
        alternateName: "DAZI Typing Tutor",
        url: SITE_URL,
        description: m.description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Windows, macOS, Linux",
        browserRequirements:
          "JavaScript enabled; physical keyboard recommended",
        inLanguage: ["zh-CN", "en"],
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        isPartOf: { "@id": SITE_URL + "#website" },
      },
    ],
  };
  return [
    `<title>${escapeAttribute(m.title)}</title>`,
    meta("name", "description", m.description),
    // Retained for descriptive completeness; Google does not rank by meta keywords.
    meta("name", "keywords", m.keywords),
    meta(
      "name",
      "robots",
      indexable
        ? "index, follow, max-image-preview:large"
        : "noindex, nofollow",
    ),
    `<link rel="canonical" href="${SITE_URL}">`,
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", "DAZI Typing Tutor"),
    meta("property", "og:title", m.title),
    meta("property", "og:description", m.description),
    meta("property", "og:url", SITE_URL),
    meta("property", "og:locale", m.locale),
    meta("property", "og:locale:alternate", "en_US"),
    meta("property", "og:image", SITE_URL + "og-image.png"),
    meta("property", "og:image:width", "1200"),
    meta("property", "og:image:height", "630"),
    meta(
      "property",
      "og:image:alt",
      "DAZI 在线打字练习：标准指法、键盘提示与中英文练习",
    ),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", m.title),
    meta("name", "twitter:description", m.description),
    meta("name", "twitter:image", SITE_URL + "og-image.png"),
    meta(
      "name",
      "twitter:image:alt",
      "DAZI touch typing practice with keyboard and finger guidance",
    ),
    '<link rel="icon" type="image/svg+xml" href="./favicon.svg">',
    '<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png">',
    `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, "\\u003c")}</script>`,
  ].join("\n");
}
export function applyLocaleMetadata(locale: Locale) {
  const m = PAGE_META[locale];
  document.title = m.title;
  const set = (kind: "name" | "property", key: string, value: string) => {
    let node = document.head.querySelector<HTMLMetaElement>(
      `meta[${kind}="${key}"]`,
    );
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(kind, key);
      document.head.append(node);
    }
    node.content = value;
  };
  set("name", "description", m.description);
  set("name", "keywords", m.keywords);
  set("property", "og:title", m.title);
  set("property", "og:description", m.description);
  set("property", "og:locale", m.locale);
  set("property", "og:locale:alternate", locale === "zh" ? "en_US" : "zh_CN");
  set("name", "twitter:title", m.title);
  set("name", "twitter:description", m.description);
}
