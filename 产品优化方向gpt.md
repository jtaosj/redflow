## 1) 目标方案总览：全自动“风格锁定 + 无字底图 + 自动排版渲染 + QC 重试”

### 1.1 核心流水线（建议命名为 `AutoPosterPipeline`）
1. **Style Lock（一次/每套图文）**  
   选择 `style_pack`，生成（或直接内置）一套：`palette + motif + bg_recipe + seed_master`
2. **Background Generation（每页）**  
   用 T2I 生成“无文字背景底图”，强制留白（标题安全区/正文安全区）
3. **Deterministic Render（每页）**  
   系统用固定模板把文字、图标、编号、卡片组件渲染上去（用户不可编辑）
4. **QC（每页）**  
   不过则自动重试：改 seed、降低复杂度、换背景 recipe、换底图候选

> 关键点：模型不负责中文排版；一致性由 `style_pack + seed_master + 后处理` 保证。

---

## 2) 风格一致性怎么做：`seed_master` + 复用底图策略 + 统一后期

你允许复用底图是“降成本+提一致性”的关键。建议每套图文采用：

### 2.1 Seed 策略（同套一致性）
- 为每套图文生成/固定一个 `seed_master`
- 每页 seed 从 `seed_master` 推导，保证“同源风格、略有变化”：

$$seed(page_i)=seed\_master + 97 \times i$$

（97 取质数只是为了避免规律重复；你也可以用 hash）

### 2.2 底图复用策略（显著降成本）
对一篇 $6\sim10$ 页的图文，不需要每页都调用一次 T2I：

- **封面**：生成 2 张候选底图（取最优）
- **内容页**：只生成 2 张“通用内容底图”，剩余页面用变体合成
- **总结页**：生成 1 张底图（或从内容底图变体）

变体手段（不增加模型成本）：
- 裁切（保持 $3:4$）
- 轻微旋转 $1^\circ\sim2^\circ$（避免机械重复）
- 叠加统一纹理（纸张颗粒、暗角）
- 叠加统一装饰组件（角标、分隔线、卡片底）

---

## 3) 不做“排版工具”的实现方式：只做“自动排版引擎（不可见）”

### 3.1 你要实现的是“模板渲染器”，不是编辑器
- 用户输入主题/大纲、选风格
- 系统自动选模板、自动 fit 字号、自动断行、自动渲染
- 用户不进入排版界面，不提供拖拽能力

### 3.2 最小渲染能力清单（即可消灭你现在的可控性问题）
- `fitText`：标题最多 2 行，超出自动降字号或换行
- 固定栅格：统一边距、卡片圆角、阴影
- 固定层级：标题/副标题/正文/列表点的字号与行距可配置

---

## 4) 可直接使用的 `style_pack` 字段规范（建议存本地 JSON）

```json
{
  "style_id": "xhs_warm_editorial_v1",
  "palette": {
    "bg": ["#F6EFE4", "#FFF7EE"],
    "primary": "#D9B48F",
    "accent": "#2A2A2A",
    "highlight": "#FF6B6B"
  },
  "bg_recipe": {
    "pattern": "soft_gradient + subtle_paper_grain",
    "lighting": "soft daylight",
    "complexity": "low",
    "clean_space_top": 0.35,
    "clean_space_bottom": 0.15
  },
  "motif_set": ["tape", "paper_cut", "minimal_sticker_icons"],
  "post_fx": {
    "grain": 0.12,
    "vignette": 0.08,
    "contrast": 1.02,
    "saturation": 0.98
  },
  "layout": {
    "margin": 96,
    "radius": 28,
    "shadow": "soft",
    "grid_cols": 6,
    "gutter": 24
  },
  "typography": {
    "title_font": "SourceHanSansCN-Bold",
    "body_font": "SourceHanSansCN-Regular",
    "title_max_lines": 2
  }
}
```

---

## 5) 无字底图 Prompt 模板（可直接替换你现在的长 Prompt）

你现在 Prompt 太长且互相冲突。改成“无字底图模式”后，模板应短且硬约束明确。

### 5.1 通用无字底图 Prompt（封面/内容通用骨架）
```text
You are generating a background image for a Chinese mobile vertical poster.

Hard constraints:
- 3:4 vertical composition, generate at 1024x1365 (will upscale later)
- NO text, NO letters, NO Chinese characters, NO numbers
- NO watermark, NO logo, NO brand marks, NO UI screenshots
- clean negative space reserved for overlayed title and body text

Style lock (must follow):
- color palette: {{PALETTE_HEX_LIST}}
- background recipe: {{BG_RECIPE}}
- motif set: {{MOTIF_SET}}
- visual complexity: low to medium, not busy
- soft modern editorial aesthetic, high-quality, realistic textures

Layout constraints:
- reserve clean space at top {{CLEAN_SPACE_TOP_PERCENT}}% for title
- reserve clean space at bottom {{CLEAN_SPACE_BOTTOM_PERCENT}}% for captions
- center area can contain subtle decorative elements but must not reduce readability

Topic hint (do not write any text):
{{TOPIC_HINT}}

Negative:
text, typography, watermark, logo, QR code, signature, UI, app interface, blurry, low quality, distorted, overexposed, cluttered
Seed: {{SEED}}
```

### 5.2 针对“装修/家居流程”场景的额外提示（可选）
```text
Add subtle home renovation related motifs (e.g., minimal line icons of ruler, cabinet silhouette, blueprint texture) WITHOUT any text.
```

> 你示例“岛台定制流程”这种题材，用“蓝图纹理 + 家居线稿 + 胶带拼贴”会天然更网感，也更不容易全变成奶油黄。

---

## 6) 页面模板细分与自动选择（不增加交互）

### 6.1 内容页先落地 6 种模板（覆盖大部分运营稿）
- `LIST_5`：$3\sim7$ 条要点清单
- `STEP_N`：第 $1/2/3$ 步
- `DO_DONT`：避坑对比
- `BEFORE_AFTER`：前后对比（含 VS）
- `CARD_3`：1 句结论 + 3 个支撑点
- `QA_3`：3 组问答

### 6.2 纯规则自动选模板（示例）
```ts
function pickTemplate(pageText: string): TemplateId {
  if (/第[一二三四五六七八九十]+步|步骤|流程/.test(pageText)) return "STEP_N";
  if (/避坑|别|不要|雷区|错误/.test(pageText)) return "DO_DONT";
  if (/对比|VS|前后|图纸到落地/.test(pageText)) return "BEFORE_AFTER";
  if (/问|Q:|A:|FAQ/.test(pageText)) return "QA_3";
  if (countBulletLines(pageText) >= 3) return "LIST_5";
  return "CARD_3";
}
```

---

## 7) 自动排版模板 DSL（示例，供渲染器直接用）

下面给一个 `STEP_N` 的 DSL 示例（你可以按此扩展其他模板）：

```json
{
  "template_id": "STEP_N",
  "safe_areas": {
    "title": { "x": 96, "y": 96, "w": 856, "h": 360 },
    "body":  { "x": 96, "y": 480, "w": 856, "h": 720 }
  },
  "layers": [
    { "type": "title", "maxLines": 2, "fontSize": 120, "minFontSize": 72, "lineHeight": 1.12 },
    { "type": "subtitle", "fontSize": 56, "lineHeight": 1.2, "opacity": 0.9 },
    { "type": "step_list", "itemFontSize": 52, "lineHeight": 1.35, "bulletStyle": "numbered_badge" },
    { "type": "tip_box", "fontSize": 46, "radius": 24, "bgOpacity": 0.86 }
  ]
}
```

> 有了这个 DSL，你的“字号不协调”会被 `minFontSize + maxLines + fitText` 彻底兜住。

---

## 8) QC（自动质检）与自动重试：提升成功率/一次通过率的关键开关

### 8.1 建议先做的 QC（MVP 版，够用）
- **文字污染检测**：OCR 扫一遍底图，若识别出任何字符则判失败（因为要求底图无字）
- **可读性安全区检测**：对标题安全区做边缘密度/对比度检测，过“花”则失败
- **清晰度**：模糊检测（拉普拉斯方差阈值）
- **合规**：检测 watermark/logo 特征（先用 OCR + 关键词，再逐步增强）

### 8.2 自动重试策略（按失败原因定向修 prompt）
- 安全区太花：`visual complexity -> low`，`increase clean space`，减少 `motif_set`
- 颜色跑偏：重申 `palette hex`，加一句 “strictly use palette”
- 图像模糊：提高生成 steps（若可控）或换 seed
- 出现文字：加强 negative，增加 “no letters/no typography” 权重，换 seed

重试上限建议：每页最多 $2$ 次；整套最多 $6$ 次，避免成本失控。

---

## 9) 分辨率与成本：推荐的生成与放大策略

- 生成：$1024\times1365$ 或 $1536\times2048$（看 banana 成本与速度）
- 放大到交付：$2048\times2730$
- 放大后统一 `post_fx`（颗粒、暗角、轻微曲线）来拉齐一致性

---

## 10) 你可以立刻排期的两周迭代清单（按 ROI 排序）

### Week 1（把“可控性 + 一致性”打到位）
- [ ] 落地 `style_pack` 与 `seed_master` 机制
- [ ] 改为“无字底图生成”Prompt（替换现有长 Prompt）
- [ ] 接入自动排版渲染器（Canvas/SVG 任选）
- [ ] 做 3 个模板：封面、LIST、STEP
- [ ] 做 OCR 检测底图是否含字（这是成功率提升最快的一刀）

### Week 2（把“一次通过率”做上去）
- [ ] QC：安全区边缘密度检测 + 模糊检测
- [ ] 自动重试：按失败原因改参数/seed
- [ ] 底图复用：内容页只生成 2 张底图，其余做变体合成
- [ ] 上线 3 套非米黄色 palette（立刻解决审美疲劳）

---