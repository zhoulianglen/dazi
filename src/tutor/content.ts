import type { Settings } from "./model";
// Six cumulative frequency-based lessons followed by the Expert exercise.
// E T A O is the first letter group observed in the installed reference app.
export const COURSES = [
  {
    zh: "第 1 课",
    en: "Lesson 1",
    keys: "E T A O",
    chars: "etao ",
    words:
      "toe aette toe tata too tattoo tea t toe e et toe at eat tate tee toto tattoo ate o tattoo tee at ate",
    hintZh: "",
    hintEn: "",
  },
  {
    zh: "第 2 课",
    en: "Lesson 2",
    keys: "E T A O I N",
    chars: "etaoin ",
    words:
      "into note nation tone notion attention innate atone annotation attain intonation anoint ion one nine ten",
    hintZh: "",
    hintEn: "",
  },
  {
    zh: "第 3 课",
    en: "Lesson 3",
    keys: "E T A O I N S H R",
    chars: "etaoinshr ",
    words:
      "there is another reason to share stories in the rain the star shines on the eastern shore a star is in the air",
    hintZh: "",
    hintEn: "",
  },
  {
    zh: "第 4 课",
    en: "Lesson 4",
    keys: "E T A O I N S H R D L U",
    chars: "etaoinshrdlu ",
    words:
      "little red shoes in the sun the road leads to a silent house learn to read and understand listen to the sound around us",
    hintZh: "",
    hintEn: "",
  },
  {
    zh: "第 5 课",
    en: "Lesson 5",
    keys: "+ C M F W Y G P B",
    chars: "etaoinshrdlucmfwygpb ",
    words:
      "practice brings progress a calm mind finds a way forward the bright morning brings a new beginning small steps become great things",
    hintZh: "",
    hintEn: "",
  },
  {
    zh: "第 6 课",
    en: "Lesson 6",
    keys: "+ V K X J Q Z",
    chars: "abcdefghijklmnopqrstuvwxyz ",
    words:
      "the quick brown fox jumps over the lazy dog every small step brings a fresh perspective practice your skills with patience and keep moving forward",
    hintZh: "",
    hintEn: "",
  },
  {
    zh: "专家",
    en: "Expert",
    keys: "A–Z",
    chars: "all",
    words:
      "the rhythm of the rain settles into a quiet afternoon a new chapter begins with a single word let your fingers find their own familiar path across the keys",
    hintZh: "",
    hintEn: "",
  },
];
const CHINESE: Array<Array<[string, string]>> = [
  [
    ["你好", "ni hao"],
    ["世界", "shi jie"],
    ["学习", "xue xi"],
    ["每天", "mei tian"],
    ["开始", "kai shi"],
    ["双手", "shuang shou"],
    ["放松", "fang song"],
    ["练习", "lian xi"],
  ],
  [
    ["春天", "chun tian"],
    ["微风", "wei feng"],
    ["阳光", "yang guang"],
    ["清晨", "qing chen"],
    ["生活", "sheng huo"],
    ["朋友", "peng you"],
    ["喜欢", "xi huan"],
    ["温暖", "wen nuan"],
  ],
  [
    ["每天进步一点点", "mei tian jin bu yi dian dian"],
    ["慢慢找到自己的节奏", "man man zhao dao zi ji de jie zou"],
    ["让双手保持放松", "rang shuang shou bao chi fang song"],
  ],
  [
    ["清晨的阳光洒在窗前", "qing chen de yang guang sa zai chuang qian"],
    ["微风带来了春天的消息", "wei feng dai lai le chun tian de xiao xi"],
    ["认真练习让进步自然发生", "ren zhen lian xi rang jin bu zi ran fa sheng"],
  ],
  [
    [
      "把目光留在屏幕上，让手指记住每一个位置。",
      "ba mu guang liu zai ping mu shang, rang shou zhi ji zhu mei yi ge wei zhi.",
    ],
    [
      "从容地敲下每一个字，慢慢找到自己的节奏。",
      "cong rong de qiao xia mei yi ge zi, man man zhao dao zi ji de jie zou.",
    ],
  ],
  [
    [
      "学习是一段旅程，每一次小小的进步都值得珍惜。",
      "xue xi shi yi duan lv cheng, mei yi ci xiao xiao de jin bu dou zhi de zhen xi.",
    ],
    [
      "窗外的树叶随风摇动，桌前的我们专注于此刻。",
      "chuang wai de shu ye sui feng yao dong, zhuo qian de wo men zhuan zhu yu ci ke.",
    ],
    [
      "把复杂的事情拆成简单的小步，然后耐心地走下去。",
      "ba fu za de shi qing chai cheng jian dan de xiao bu, ran hou nai xin de zou xia qu.",
    ],
  ],
  [
    [
      "每天留出十五分钟，认真练习，让正确的指法成为习惯。",
      "mei tian liu chu shi wu fen zhong, ren zhen lian xi, rang zheng que de zhi fa cheng wei xi guan.",
    ],
    [
      "不必追赶别人的速度，按照自己的节奏，走好脚下的每一步。",
      "bu bi zhui gan bie ren de su du, an zhao zi ji de jie zou, zou hao jiao xia de mei yi bu.",
    ],
  ],
];
export const CHINESE_TITLES = [
  ["初识拼音", "First words"],
  ["日常词语", "Everyday words"],
  ["连词成句", "Short phrases"],
  ["发现节奏", "Find your rhythm"],
  ["自然表达", "Natural expression"],
  ["专注此刻", "Stay in the flow"],
  ["从容书写", "Write with confidence"],
];
export function courseName(i: number, settings: Settings) {
  return settings.language === "zh"
    ? CHINESE_TITLES[i][settings.locale === "zh" ? 0 : 1]
    : COURSES[i][settings.locale];
}
export function makeExercise(
  course: number,
  settings: Settings,
  errors: Record<string, number> = {},
  rng = Math.random,
) {
  const i = Math.max(0, Math.min(COURSES.length - 1, course));
  const weak = Object.entries(errors).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (settings.language === "zh") {
    const preferred = weak
      ? CHINESE[i].filter((entry) =>
          entry[settings.chineseMode === "ime" ? 0 : 1].includes(weak),
        )
      : [];
    const pool = preferred.length ? preferred : CHINESE[i];
    const start = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
    const selected = Array.from(
      { length: i < 2 ? 8 * settings.duration : settings.duration + 1 },
      (_, n) => pool[(start + n) % pool.length],
    );
    const decorated = selected.map(([han, latin], n) => {
      let source = settings.punctuation
        ? han
        : han.replace(/[，。！？；：、,.!?;]/g, "");
      let pinyin = settings.punctuation ? latin : latin.replace(/[,.;!?]/g, "");
      if (settings.capitals)
        pinyin = pinyin.charAt(0).toUpperCase() + pinyin.slice(1);
      if (settings.numbers && n % 3 === 0) {
        const number = String((n * 17 + 3) % 100);
        source += number;
        pinyin += " " + number;
      }
      if (settings.punctuation && !/[。！？]$/.test(source)) {
        source += n === selected.length - 1 ? "。" : "，";
        pinyin += n === selected.length - 1 ? "." : ",";
      }
      return { source, pinyin };
    });
    const source = decorated.map((x) => x.source).join("");
    return {
      source,
      text:
        settings.chineseMode === "ime"
          ? source
          : decorated.map((x) => x.pinyin).join(" "),
    };
  }

  const courseData = COURSES[i];
  const words = courseData.words.split(" ");
  const preferred = weak
    ? words.filter((w) => w.includes(weak.toLowerCase()))
    : [];
  const pool = preferred.length ? preferred : words;
  const start = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  const selected = Array.from(
    { length: 24 * settings.duration },
    (_, n) => pool[(start + n) % pool.length],
  );
  const decorated = selected.map((word, n) => {
    let result =
      settings.capitals && n % 5 === 0
        ? word[0].toUpperCase() + word.slice(1)
        : word;
    if (settings.numbers && n % 7 === 3) result += " " + ((n * 17 + 3) % 100);
    if (settings.punctuation && n % 6 === 4)
      result += [",", ".", ";", "?", "!"][Math.floor(n / 6) % 5];
    return result;
  });
  return { source: "", text: decorated.join(" ") };
}

export const KEY_ROWS = [
  [
    "`",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "-",
    "=",
    "Backspace",
  ],
  ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
  ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "ShiftRight"],
  ["Ctrl", "Win", "Alt", "Space", "AltRight", "Fn", "Menu", "CtrlRight"],
];
export const SHIFTED: Record<string, string> = {
  "~": "`",
  "!": "1",
  "@": "2",
  "#": "3",
  $: "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  _: "-",
  "+": "=",
  "{": "[",
  "}": "]",
  "|": "\\",
  ":": ";",
  '"': "'",
  "<": ",",
  ">": ".",
  "?": "/",
};
export function physicalKey(char: string) {
  return char === " " ? "Space" : SHIFTED[char] || char.toLowerCase();
}
export function fingerFor(char: string): number {
  const key = physicalKey(char);
  if (key === "Space") return 4;
  const groups = [
    "`1qaz",
    "2wsx",
    "3edc",
    "45rtfgvb",
    "",
    "",
    "67yuhjnm",
    "8ik,",
    "9ol.",
    "0p;/-=[]\\'",
  ];
  return Math.max(
    0,
    groups.findIndex((g) => g.includes(key)),
  );
}
