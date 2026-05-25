# DAZI · 打字训练驾驶舱 — 设计文档

- 日期：2026-05-25
- 状态：已通过 brainstorming，待 writing-plans
- 仓库：https://github.com/zhoulianglen/dazi

## 1. 产品定位

一句话：**给习惯了"两指啄食"的程序员/办公族，一个一打开就忍不住练上 10 分钟、并真的能让你的 10 根手指各就各位的训练驾驶舱。**

### 1.1 目标用户
- 已有键盘使用经验，但手势不规范（俗称 hunt-and-peck、四指流）的成人用户
- 主要在 PC（带实体键盘）上训练；手机端用于碎片时间的拇指节奏训练

### 1.2 成功标准（30 天后衡量）
- 连续训练 7 天的用户中，≥ 60% 的人在 home row 测试里达到 ≥ 30 WPM、错误率 ≤ 5%
- 用户对"我现在用错手指会很难受"的主观自评 ≥ 7/10
- 移动端用户中 ≥ 30% 至少完成 1 次 PC 端训练（手机是入口，PC 是主战场）

### 1.3 关键差异化
区别于 monkeytype / typing.com 等现有产品：
- **视觉教练型手势矫正**：双手指法图与键盘共用色彩分区，按到错手指会有节奏惩罚
- **Sci-Fi HUD 美学**：一屏沉浸式驾驶舱，告别教育站点的"网页表单感"
- **零账号、零网络**：数据全部本地，可导出 JSON 跨设备

## 2. 范围

### 2.1 v1 包含
- 美式 QWERTY 键位的英文打字训练
- 9 级渐进课程（home row → top → bottom → numbers → punctuation → free text）
- 视觉教练（手指/键位色彩分区 + 实时高亮 + 错键反馈）
- 节奏分析（每个键有理论用时上限，超时则在课后小结里标黄）
- PC 端：完整键盘 + 双手指法图 + HUD 面板
- 移动端：模拟软键盘 + 双拇指分区视图
- 本地数据持久化（localStorage）+ JSON 导入/导出
- 可关闭的合成键击音（Web Audio）

### 2.2 v1 明确不做
- ❌ 账户系统、登录、云端同步
- ❌ 多键位（Dvorak / Colemak / 五笔 / 双拼）
- ❌ 中文拼音输入
- ❌ 多人对战 / 全球排行榜
- ❌ 摄像头手指识别（MediaPipe）
- ❌ 多主题切换（v1 只一个 Sci-Fi HUD 主题，做到极致）
- ❌ PWA 离线缓存
- ❌ 后端

## 3. 信息架构

整页固定一屏（移动端可竖滑），**无路由跳转**，所有切换 = 同页面内的面板状态变化。

### 3.1 PC 布局

```
┌─────────────────────────────────────────────────────────────┐
│  DAZI    [lesson:home-row ▾]  [practice]      ●●●● HUD ◯    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│       the quick brown fox jumps over▮the lazy dog           │
│                                                             │
│       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 67%                   │
│                                                             │
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│   [Q][W][E][R][T] [Y][U][I][O][P]│   WPM   54  ▁▂▄▅▇       │
│    [A][S][D][F][G] [H][J][K][L][;]│   ACC   97% ◼◼◼◼◻       │
│     [Z][X][C][V][B] [N][M][,][.][/]│  ERR  ['p','q']         │
│        [───── space ─────]       │   ⌬ session  03:42      │
│                                  │                          │
│   👈🏻 ─ 双手指法图 ─ 👉🏻                                   │
└─────────────────────────────────────────────────────────────┘
```

布局栅格（CSS Grid）：
- 顶栏 64px
- 训练文本区域 自适应（min 200px）
- 键盘+指法图 区域 + HUD 面板：左右栏 = 2fr / 1fr
- 移动端：栏拆解为单列，可竖滑

### 3.2 移动端布局
- 顶栏折叠为汉堡按钮
- 训练文本占满上半屏
- 下半屏 = 模拟软键盘（双拇指视图）：左右半键 + 中线，左半键按下时左拇指对应区高亮、右半键反之
- 不显示桌面端的"双手指法图"（无意义）

### 3.3 浮窗 / 状态
单页内的状态机：
- `idle` — 初始/上一次训练结束，显示"按任意键开始"+ 上次成绩
- `practicing` — 训练进行中
- `summary` — 当前 lesson 完成，弹出小结面板（含节奏分析慢键标黄）
- `picker` — 课程选择浮窗

## 4. 核心训练机制

### 4.1 视觉教练（按键 → 多处同步高亮）

| 信号 | 行为 |
|------|------|
| 当前应按的键 | 键盘上该键脉冲发光（cyan glow，约 1.2s 循环），对应手指在双手指法图上同色发光 |
| 8 根手指 + 双拇指共 10 个色彩分区 | 全屏共用同一套色彩 token：每根手指一个颜色，键盘、指法图、HUD 同步着色 |
| 按下错键 | 键盘红光闪烁（200ms） + 屏幕红色 vignette 一次 + 文字光标**不前进** |
| 按对键 | 键盘 cyan 闪烁（80ms），光标前进，HUD WPM/ACC 实时更新 |

**手指色彩分区（10 色）**
- 左小指：[Q, A, Z, `]
- 左无名指：[W, S, X]
- 左中指：[E, D, C]
- 左食指：[R, T, F, G, V, B]
- 左拇指：[Space 左半]
- 右拇指：[Space 右半]
- 右食指：[Y, U, H, J, N, M]
- 右中指：[I, K, ","]
- 右无名指：[O, L, "."]
- 右小指：[P, ";", "/", "'"]

### 4.2 节奏门槛（用时间惩罚不当手势）

由于浏览器无法感知"哪根手指"，我们用按键间时间 (interval) 推断手势是否合理。

**机制**：
- 为每个 (前一键, 当前键) pair 计算"理论合理用时上限"`maxOkInterval`，依据：
  - 是否同手 / 同指：同指连按 → 上限较高（300ms）；换手 → 上限较低（180ms）；同手不同指 → 中（220ms）
  - 是否需要伸展（如食指够到 T、B）：上限 +40ms
- 每次按对键时，记录该 pair 的实际 interval
- 课后小结中：列出实际 > 上限的"慢 pair"，并对涉及的键标黄
- 不强制中断训练，只在 summary 里提示："你按 P 一直偏慢——它该用右手小拇指，确认手指位置"

**为什么不实时阻拦**：节奏分析有统计噪声，单次慢不代表错；只看趋势。实时阻拦会让用户烦躁。

### 4.3 课程结构（9 级，固定）

```
01 home row             asdf jkl;
02 + e i                左右食指上排核心
03 + r u                左右食指外侧
04 + g h                左右食指内侧
05 top row 完整         q w e r t y u i o p
06 bottom row           z x c v b n m , . /
07 数字行               1 2 3 4 5 6 7 8 9 0
08 标点 + Shift         (大写、常见标点)
09 自由文本（程序员）   含代码片段、常见英文段落
```

**通过条件**：单次训练 WPM ≥ 该级阈值（递增：22→24→26...→40）且准确率 ≥ 95%。

**解锁规则**：必须按顺序通过，但可重练任何已解锁级别。

### 4.4 训练文本来源
- L01-L08：根据该级覆盖的字符集，预生成的常用词/字母组合（写死在 `lessons.ts`）
- L09：内置一组英文文本片段（pangram、Lorem Ipsum 变体、常见编程关键字组合）
- 每次开始训练随机抽取一段，长度约 60-120 字符

## 5. 数据与持久化

### 5.1 全部本地
仅使用 `localStorage`，三个键：
- `dazi.progress.v1` — 课程解锁进度 + 每级历史最佳成绩
- `dazi.stats.v1` — 历史训练 session 数组（用于成绩页趋势，**v1 暂不渲染，但要存**）
- `dazi.settings.v1` — 用户偏好（音效开关、键击音音量等）

### 5.2 数据结构

```ts
type LessonId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type Progress = {
  unlockedLesson: LessonId;            // 最高已解锁
  perLessonBest: Record<LessonId, { wpm: number; acc: number; at: number }>;
};

type SessionStats = {
  lessonId: LessonId;
  wpm: number;
  acc: number;                          // 0..1
  durationMs: number;
  charsTyped: number;
  errorKeys: Record<string, number>;    // 错键 → 次数
  slowPairs: Array<{ from: string; to: string; meanMs: number; thresholdMs: number }>;
  timestamp: number;
};

type Settings = {
  audioEnabled: boolean;
  audioVolume: number;                  // 0..1
  reducedMotion: boolean;
};
```

### 5.3 导入/导出
- 设置面板提供"导出 JSON"按钮 → 触发下载 `dazi-backup-YYYYMMDD.json`，包含上面三个键的合并对象
- "导入 JSON" → 文件选择 → 校验 schema 版本 → 覆盖写入 localStorage
- 用于跨设备搬数据（无需后端）

### 5.4 schema 版本演进
所有 key 带 `.v1` 后缀；未来 schema 变化时引入 migration 函数读旧版。

## 6. 视觉与动效

### 6.1 视觉风格：Sci-Fi HUD
- 背景：极深黑（#05080d）+ 极轻噪点纹理
- 主色：cyan glow（#5af2ff）
- 警告色：magenta（#ff3a8c）
- 强调色：electric green（#5cff9d）（用于成功 / 解锁等正反馈）
- 文字：等宽字体（JetBrains Mono，开源、Google Fonts 可托管），主标题用 Orbitron（开源、Google Fonts）增强 HUD 气质
- 容器：1px cyan 描边 + 内发光 + 微透明深色填充

### 6.2 关键动效
- 当前应按键的脉冲呼吸（1.2s 周期）
- 按对键的快速闪烁（80ms）
- 错键的红色 vignette（200ms）
- 课程切换时键盘整体重新色彩着色（300ms 过渡）
- 顶栏 HUD 数据条 / 波形条（WPM 实时小波形）
- 全局可关闭：`prefers-reduced-motion` + 设置开关

### 6.3 声音
- 键击音：Web Audio 合成（短促 click，~30ms），不引入采样素材
- 错键音：略低频的 thud
- 默认关闭，设置里可开

## 7. 模块划分

```
src/
  main.ts                       // 入口，挂载到 #app
  state/
    store.ts                    // 全局状态（轻量自写 reactive；订阅/通知）
    persistence.ts              // localStorage 读写 + schema 版本
  engine/
    typing-engine.ts            // 输入流 → 状态变化（纯逻辑，不碰 DOM）
    rhythm-analyzer.ts          // §4.2 节奏门槛（订阅 engine 事件，纯计算）
    lessons.ts                  // 9 级课程内容 + 解锁规则 + 文本池
    finger-map.ts               // 键 → 手指的映射 + 色彩 token
  ui/
    topbar.ts                   // 顶栏（课程切换、设置入口、HUD 总览）
    typing-area.ts              // 文本 + 光标 + 进度条
    keyboard.ts                 // 虚拟键盘（PC 视图）
    hands.ts                    // 双手指法图（PC 视图）
    softkeyboard-mobile.ts      // 移动端拇指模式键盘
    hud-panel.ts                // 右侧数据面板（WPM / ACC / 慢键 / 计时）
    summary-modal.ts            // 课程结束小结
    settings-modal.ts           // 设置（音效、导入导出、reduced motion）
    lesson-picker.ts            // 课程选择浮窗
  styles/
    tokens.css                  // 颜色、阴影、动画时长变量
    layout.css                  // 网格、响应式断点
    components.css              // 通用组件样式
    fx.css                      // glow / scanline / particle 动画
  audio/
    click.ts                    // 可关闭的键击音（Web Audio 合成）
index.html
vite.config.ts
tsconfig.json
package.json
```

### 7.1 模块边界（依赖方向）
```
ui/* ──depends on──> state/store, engine/*, audio/*
engine/* ──depends on──> (nothing in UI)
state/store ──depends on──> state/persistence
```

UI 永远是单向消费者；engine 永远不引用 DOM。

### 7.2 关键接口

```ts
// engine/typing-engine.ts
type EngineEvent =
  | { type: 'correct'; key: string; intervalMs: number; at: number }
  | { type: 'wrong'; expected: string; actual: string; at: number }
  | { type: 'finished'; stats: SessionStats };

class TypingEngine {
  loadText(text: string, lessonId: LessonId): void;
  handleKeydown(key: string): void;
  subscribe(fn: (e: EngineEvent) => void): () => void;
  getState(): { cursor: number; wpm: number; acc: number; errors: number };
}

// state/store.ts
type AppState = {
  view: 'idle' | 'practicing' | 'summary' | 'picker' | 'settings';
  currentLesson: LessonId;
  progress: Progress;
  settings: Settings;
  // ...
};
```

### 7.3 响应式渲染（自写而非框架）
- store 用观察者模式：`subscribe(selector, callback)`
- 每个 UI 模块在 mount 时订阅它关心的状态切片
- 单 DOM 节点直接 mutate textContent / classList（无 diff），简单够用
- 避免引入 React/Vue 增加包体和动效复杂度

## 8. 响应式 / 平台判定

- 媒体查询 + JS 双重判定：`min-width: 900px && pointer: fine` → PC 视图
- 否则 → 移动视图
- 同一 store，UI 模块互斥渲染（PC 渲染 `keyboard + hands`，移动渲染 `softkeyboard-mobile`）
- 旋转 / 缩放 → 重新判定并切换

## 9. 错误处理

- localStorage 写失败（隐私模式 / 配额满）→ 顶栏提示 "数据未保存（私密模式？）"，继续运行
- 导入 JSON schema 不匹配 → 拒绝并提示版本不兼容
- 用户切走标签页（visibilitychange） → 暂停计时器，回来时不计入暂停时长
- 物理键盘断连 → 无感知（无需处理）
- 移动端误触键盘外区域 → 忽略

## 10. 测试

### 10.1 单元
- `engine/typing-engine.ts` 全覆盖：正确/错误输入、WPM/ACC 计算、edge cases（空文本、非常长文本、Unicode 输入应忽略）
- `engine/rhythm-analyzer.ts` 全覆盖：阈值计算、慢键判定、噪声样本数据
- `engine/lessons.ts` 解锁规则：通过条件、不可越级
- `state/persistence.ts` schema 校验、迁移（v1 暂无迁移，但留接口）

### 10.2 集成（少量）
- 完整一次 lesson 流程的 happy path（mock 键盘事件 → store 状态 → 持久化）

### 10.3 视觉 / 手动
- PC 视图、Mobile 视图各一次完整手动通关
- `prefers-reduced-motion` 开启时验证动效降级

### 10.4 不做的测试
- E2E 浏览器自动化（v1 不引入 Playwright/Cypress；手动 + 单元够）

## 11. 部署

- GitHub Pages + GitHub Actions：`main` 分支推送时自动 `vite build` 并发布到 `gh-pages` 分支
- 构建产物纯静态，零环境依赖
- 部署后 URL：`https://zhoulianglen.github.io/dazi/`
- 自定义域名留到 v2

## 12. 开放问题（不阻塞 v1）

- 是否引入"打字时禁用某些不该用的键的视觉反馈"（如训练 home row 时其他键灰掉）—— 倾向做，但作为 polish 阶段
- L09 自由文本是否支持用户自定义粘贴 —— 倾向 v1.1 加，v1 先用内置
- 双拇指模式的色彩分区精度（左手拇指对应键盘哪些键？只 space 左半？还是要把 B 也算进去？）—— 设计阶段定为：仅 space 双半切

## 13. 里程碑

1. **M1 骨架**：Vite + TS 项目初始化、布局栅格、空 store、空 engine
2. **M2 引擎**：`typing-engine` + `lessons`（L01-L02）+ 最简 UI 跑通流程
3. **M3 视觉**：键盘 + 双手指法图 + 色彩分区 + 关键动效
4. **M4 课程**：L03-L09 内容 + 解锁规则 + summary modal
5. **M5 移动端**：软键盘组件 + 响应式切换
6. **M6 节奏 & 数据**：rhythm-analyzer + 导入导出 + 设置面板
7. **M7 打磨**：动效、音效、错误处理、手动通关

每个里程碑结束后可独立 demo。
