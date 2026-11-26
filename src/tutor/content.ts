import type { Settings } from "./model";
export const COURSES = [
  {
    zh: "回到基准键",
    en: "Find your home row",
    keys: "ASDF JKL;",
    chars: "asdfjkl; ",
    words: "a sad lad asks dad all lads fall flask salad lass ask dad fall",
    hintZh: "食指轻放 F 和 J，其余手指自然落在基准键上。",
    hintEn:
      "Rest your index fingers on F and J. Let the other fingers find their home keys.",
  },
  {
    zh: "食指的延伸",
    en: "A little further",
    keys: "+ E I R U",
    chars: "asdfjkl;eiru ",
    words:
      "a sure rule is ideal ride sure fire like rural air said dear lake side file idea slide",
    hintZh: "手指向上伸出后，记得回到自己的基准键。",
    hintEn: "Reach gently for the upper keys, then return to the home row.",
  },
  {
    zh: "连接左右手",
    en: "Bring your hands together",
    keys: "+ G H T Y",
    chars: "asdfjkl;eirughty ",
    words:
      "the light is right a great day a little fresh air right here stay true share the light",
    hintZh: "G、H 分别由左右食指负责，保持手腕放松。",
    hintEn:
      "Use your left index finger for G and your right index finger for H.",
  },
  {
    zh: "掌握上排键",
    en: "Explore the top row",
    keys: "+ Q W O P",
    chars: "asdfjkl;qwertyuiopgh ",
    words:
      "quiet words flow with ease write your story take the way to grow a happy little world",
    hintZh: "小指负责 Q 和 P，手掌保持稳定，不必抬起整个手臂。",
    hintEn: "Your pinkies handle Q and P. Keep your hands relaxed and steady.",
  },
  {
    zh: "完整的字母表",
    en: "The whole alphabet",
    keys: "+ Z X C V B N M",
    chars: "abcdefghijklmnopqrstuvwxyz ",
    words:
      "small steps make a big difference practice brings progress the quick brown fox jumps over the lazy dog keep moving with a calm mind",
    hintZh: "练习下排键时，保持指尖弯曲，敲击后回到基准键。",
    hintEn:
      "Keep your fingers curved as you reach down. Always come back home.",
  },
  {
    zh: "自然地表达",
    en: "Let the words flow",
    keys: "Aa , . ! ?",
    chars: "all",
    words:
      "Small steps make a big difference. Give yourself time to learn. A quiet mind helps your fingers find their way. Progress begins with a little practice, every day. What will you create today?",
    hintZh: "优先保持准确和节奏，速度会随着练习自然提升。",
    hintEn: "Focus on accuracy and a steady rhythm. Speed will follow.",
  },
  {
    zh: "从容应对每个键",
    en: "Make every key yours",
    keys: "123 @ # : ;",
    chars: "all",
    words:
      "Set a goal: practice for 15 minutes, 5 days a week. On day 7, take a break! A journey of 1,000 miles begins with a single step. Write 3 ideas before 9:30, then choose your favorite.",
    hintZh: "数字与符号也有对应手指；大写字母使用另一只手的 Shift。",
    hintEn:
      "Use the opposite hand for Shift. Give numbers and symbols the same care as letters.",
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
    const source = selected.map((x) => x[0]).join(i < 4 ? "，" : "");
    const pinyin = selected.map((x) => x[1]).join(" ");
    return { source, text: settings.chineseMode === "ime" ? source : pinyin };
  }
  const courseData = COURSES[i];
  if (i < 5) {
    const words = courseData.words.split(" ");
    const preferred = weak ? words.filter((w) => w.includes(weak)) : [];
    const pool = preferred.length ? preferred : words;
    const start = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
    return {
      source: "",
      text: Array.from(
        { length: 24 * settings.duration },
        (_, n) => pool[(start + n) % pool.length],
      ).join(" "),
    };
  }
  const sentences = courseData.words.match(/[^.!?]+[.!?]/g) || [
    courseData.words,
  ];
  const preferred = weak
    ? sentences.filter((x) => x.toLowerCase().includes(weak))
    : [];
  const pool = preferred.length ? preferred : sentences;
  const start = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return {
    source: "",
    text: Array.from({ length: 2 * settings.duration }, (_, n) =>
      pool[(start + n) % pool.length].trim(),
    ).join(" "),
  };
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
