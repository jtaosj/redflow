/**
 * 风格提示词配置服务
 * 管理所有风格的默认提示词和用户自定义提示词
 */

import { STORAGE_KEYS } from './constants'

export interface StylePromptConfig {
  id: string
  name: string
  description: string
  defaultPrompt: string // 默认的详细提示词
  customPrompt?: string // 用户自定义的提示词（可选）
}

/**
 * 所有可用风格的默认详细提示词
 */
export const DEFAULT_STYLE_PROMPTS: Record<string, Omit<StylePromptConfig, 'customPrompt'>> = {
  xiaohongshu: {
    id: 'xiaohongshu',
    name: '小红书爆款风格',
    description: '一眼像刷到爆款封面，随手一发就想上热门的那种。',
    defaultPrompt: `A XiaoHongShu viral-style vertical poster, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Clean modern layout with dynamic color palette
- Strong visual hierarchy with large title and subtitle
- Readable Chinese text with proper typography
- Natural lighting with subtle gradients
- Minimal decorative icons and elements
- Professional and trendy aesthetic suitable for young audience
- Paper texture with subtle noise for authentic feel

【视觉元素】
- Background: Simple but not monotonous, can have subtle patterns or gradients
- Typography: Clear hierarchy, important information highlighted
- Color scheme: Harmonious tones matching content theme, visually appealing
- Layout: Grid-based structure with generous white space, balanced composition
- Decorative elements: Subtle icons or illustrations to support content

【技术规格】
- Vertical 3:4 aspect ratio (小红书标准)
- 2K resolution (2048x2730 pixels), ultra-high definition
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Layout split: Top 30% for Title Area, Bottom 70% for Content Grid
- Title text: Clear, bold, large font size, strictly legible
- Subtitle text: Medium weight, positioned below title
- Body content: Listed clearly with custom bullet points
- Text clear and readable, appropriate font size
- Important information prominently displayed
- Beautiful typography with reasonable white space
- Support for emoji and symbols
- If cover page, title should be large and eye-catching

【风格一致性】
- Maintain consistent color scheme and design style throughout
- Visual elements should be unified
- Layout style should be consistent across all pages`
  },
  poster_2k: {
    id: 'poster_2k',
    name: '海报风格（2K）',
    description: '自带电影感的竖版海报，让你的内容看起来像在宣传大片。',
    defaultPrompt: `A 3D diorama movie-poster style, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Bold cinematic composition with dramatic lighting
- Clear focal point with strong visual impact
- Chinese headline and subheadline at the top
- Space for short synopsis at the bottom
- Rich textures and high contrast
- Isometric view of 3D miniature scene on square base
- Film grain for cinematic feel

【视觉元素】
- 3D rendered isometric diorama with miniature style
- Iconic scene selection with maximum dramatic tension
- Miniature figures with rich details and dynamic poses
- Environment details overflowing the base (dust, smoke, light effects)
- Dramatic localized lighting (car lights, fire, sunset)
- Clean, blurred background coordinated with main subject tones

【技术规格】
- Vertical 3:4 aspect ratio (2048x2730 pixels, 2K resolution)
- Ultra-high definition quality
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers (except specified watermarks)
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Large title at the top occupying main position
- Subtitle centered or below the title
- Director/release date information
- Two-sentence synopsis at the bottom
- Professional typography with strong visual hierarchy

【风格一致性】
- Maintain consistent cinematic style throughout
- Unified color scheme and lighting effects
- Consistent visual elements and composition style`
  },
  ins_minimal: {
    id: 'ins_minimal',
    name: 'INS 极简',
    description: '留白很多、东西不多，但每一笔都刚刚好，很「高级的小清爽」。',
    defaultPrompt: `Minimalist INS aesthetic, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Clean white or neutral background
- Soft natural lighting with gentle shadows
- Plenty of white space for breathing room
- Refined typography for Chinese text
- Product-centered or content-focused composition
- High-end editorial look with Instagram aesthetic
- Subtle paper texture for authentic feel

【视觉元素】
- Background: Pure white, light gray, or neutral tones
- Lighting: Soft natural light, avoiding harsh shadows
- Composition: Centered or rule-of-thirds layout with grid structure
- Minimal decorative elements, focus on content
- Subtle textures or gradients if needed
- Clean and airy feeling

【技术规格】
- Vertical 3:4 aspect ratio (2048x2730 pixels, 2K resolution)
- Ultra-high definition quality
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Minimalist typography with clear hierarchy
- Layout split: Top 25% for Title, Bottom 75% for Content
- Generous spacing between elements
- Elegant font choices
- Subtle color accents if needed
- Focus on readability and simplicity

【风格一致性】
- Maintain consistent minimalist aesthetic
- Unified color palette (neutral tones)
- Consistent spacing and layout principles
- Clean visual elements throughout`
  },
  tech_future: {
    id: 'tech_future',
    name: '科技未来',
    description: '冷色霓虹 + 科技线条，适合一切「看起来要很厉害」的内容。',
    defaultPrompt: `Futuristic tech style, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Cool color tones with neon accents
- Sleek gradients and smooth transitions
- HUD/glow elements for tech feel
- Crisp edges and sharp details
- Chinese text blocks with clear hierarchy
- High-resolution sharpness with modern aesthetic
- Subtle digital noise for authentic tech feel

【视觉元素】
- Background: Dark or cool-toned with tech patterns
- Lighting: Neon glows, LED effects, digital light
- Composition: Dynamic tech-inspired layouts with grid structure
- Elements: Geometric shapes, circuit patterns, holographic effects
- Color scheme: Blues, purples, cyans, with neon highlights
- Futuristic and innovative feeling

【技术规格】
- Vertical 3:4 aspect ratio (2048x2730 pixels, 2K resolution)
- Ultra-high definition quality
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Modern tech-inspired typography
- Layout split: Top 30% for Title, Middle 50% for Content, Bottom 20% for Details
- Clear information hierarchy
- Neon or glowing text effects if appropriate
- Digital-style font choices
- Strong contrast for readability

【风格一致性】
- Maintain consistent futuristic aesthetic
- Unified cool color palette
- Consistent tech elements and effects
- Modern visual language throughout`
  },
  nature_fresh: {
    id: 'nature_fresh',
    name: '自然清新',
    description: '像把绿植搬进了图片里，看着就很会呼吸的那种清爽感。',
    defaultPrompt: `Fresh nature style, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Soft daylight with natural lighting
- Greenery elements and natural textures
- Airy composition with open feeling
- Color palette matching natural theme
- Gentle depth of field
- Chinese text readable and balanced
- Fresh and clean feeling
- Natural film grain for authentic look

【视觉元素】
- Background: Natural scenes, greenery, or organic textures
- Lighting: Soft daylight, natural shadows
- Composition: Open and airy, breathing space with grid structure
- Elements: Plants, leaves, natural materials
- Color scheme: Greens, earth tones, natural colors matching content
- Organic and fresh feeling

【技术规格】
- Vertical 3:4 aspect ratio (2048x2730 pixels, 2K resolution)
- Ultra-high definition quality
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Natural and friendly typography
- Layout split: Top 30% for Title, Bottom 70% for Content with natural flow
- Clear information hierarchy
- Balanced spacing with natural elements
- Color accents matching content theme
- Readable and approachable

【风格一致性】
- Maintain consistent natural aesthetic
- Unified color palette matching content theme
- Consistent natural elements
- Fresh visual language throughout`
  },
  dopamine: {
    id: 'dopamine',
    name: '多巴胺风格',
    description: '高饱和撞色，快乐写在脸上，远远一眼就知道是你的那张图。',
    defaultPrompt: `A vibrant dopamine-style vertical poster, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Bold, high-saturation color palette with contrasting colors
- Dynamic, energetic composition with playful elements
- Strong visual hierarchy with large, eye-catching title
- Readable Chinese text with proper typography
- Bright, natural lighting
- Paper texture with subtle noise for authentic feel

【视觉元素】
- Background: Colorful gradients or patterns matching content theme
- Typography: Bold, modern fonts with clear hierarchy
- Color scheme: Bright pink, green, purple, yellow, blue - high contrast combinations
- Layout: Grid-based structure with dynamic elements
- Decorative elements: Playful icons, geometric shapes, stickers

【技术规格】
- Vertical 3:4 aspect ratio
- 2K resolution (2048x2730 pixels), ultra-high definition
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Layout split: Top 30% for Title Area, Bottom 70% for Content Grid
- Title text: Massive, bold, colorful font, strictly legible
- Subtitle text: Medium weight, positioned below title
- Body content: Listed clearly with custom bullet points (stars or checkmarks)
- High contrast between text and background for readability

【风格一致性】
- Maintain consistent high-saturation color palette
- Unified playful aesthetic
- Consistent dynamic elements and composition style`
  },
  morandi: {
    id: 'morandi',
    name: '莫兰迪风格',
    description: '低饱和奶灰调，淡淡的却很上头，怎么摆都显得很有品。',
    defaultPrompt: `A sophisticated Morandi-style vertical poster, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Soft, low-saturation color palette (muted tones)
- Elegant, minimalist composition
- Strong visual hierarchy with refined typography
- Soft, diffused lighting
- High-end aesthetic with artistic feel
- Subtle paper texture with film grain for authentic look

【视觉元素】
- Background: Muted, harmonious colors with soft gradients
- Typography: Elegant, clean fonts with clear hierarchy
- Color scheme: Soft pastels, muted blues, greens, pinks with gray undertones
- Layout: Grid-based structure with generous white space
- Decorative elements: Minimal, sophisticated illustrations or patterns

【技术规格】
- Vertical 3:4 aspect ratio
- 2K resolution (2048x2730 pixels), ultra-high definition
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Layout split: Top 25% for Title, Middle 50% for Content, Bottom 25% for Additional Info
- Title text: Elegant, medium-bold font, strictly legible
- Subtitle text: Light weight, positioned below title
- Body content: Clean, organized layout with proper spacing
- Soft contrast between text and background

【风格一致性】
- Maintain consistent low-saturation color palette
- Unified elegant aesthetic
- Consistent refined elements and composition style`
  },
  black_gold: {
    id: 'black_gold',
    name: '黑金风格',
    description: '深色底配金色点缀，一眼就是「尊贵的你」，自带高奢氛围感。',
    defaultPrompt: `A luxurious black and gold vertical poster, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Dark background with gold accents
- Luxurious, elegant composition
- Strong visual hierarchy with sophisticated typography
- Dramatic lighting with gold highlights
- High-end aesthetic suitable for luxury brands
- Subtle texture (velvet or metallic) for authentic feel

【视觉元素】
- Background: Deep black, dark gray, or navy blue
- Typography: Elegant, serif or script fonts with gold accents
- Color scheme: Black, dark tones with gold, bronze, or copper highlights
- Layout: Grid-based structure with balanced composition
- Decorative elements: Gold patterns, geometric shapes, minimalist illustrations

【技术规格】
- Vertical 3:4 aspect ratio
- 2K resolution (2048x2730 pixels), ultra-high definition
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Layout split: Top 30% for Title Area with gold accents, Bottom 70% for Content
- Title text: Large, elegant font with gold color, strictly legible
- Subtitle text: Medium weight, gold or light gray color
- Body content: Clean, organized layout with proper spacing
- High contrast between text and dark background

【风格一致性】
- Maintain consistent black and gold color scheme
- Unified luxurious aesthetic
- Consistent elegant elements and composition style`
  },
  minimal_white: {
    id: 'minimal_white',
    name: '极简白',
    description: '几乎全是白，但一点都不空，主角是谁一眼就看得见。',
    defaultPrompt: `An ultra-minimalist white vertical poster, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Pure white background with minimal elements
- Extreme simplicity with focus on content
- Strong visual hierarchy with clean typography
- Soft, natural lighting
- High-end, editorial aesthetic
- Subtle paper texture for authentic feel

【视觉元素】
- Background: 100% pure white
- Typography: Clean, sans-serif fonts with clear hierarchy
- Color scheme: White with minimal accent colors matching content
- Layout: Grid-based structure with maximum white space
- Decorative elements: None or extremely minimal

【技术规格】
- Vertical 3:4 aspect ratio
- 2K resolution (2048x2730 pixels), ultra-high definition
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Layout split: Top 20% for Title, Middle 60% for Content, Bottom 20% for Additional Info
- Title text: Clean, bold font, strictly legible
- Subtitle text: Light weight, positioned below title
- Body content: Simple, organized layout with generous spacing
- High contrast between text and white background

【风格一致性】
- Maintain consistent pure white background
- Unified minimalist aesthetic
- Consistent clean elements and composition style`
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: '赛博朋克',
    description: '城市夜景 + 霓虹灯，酷到发光，适合一切赛博、AI、潮酷主题。',
    defaultPrompt: `A cyberpunk-style vertical poster, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Dark background with neon accents (blue, purple, pink)
- Futuristic, dystopian composition
- Strong visual hierarchy with tech-inspired typography
- Dramatic lighting with neon glows
- High-tech aesthetic with digital elements
- Subtle digital noise for authentic cyberpunk feel

【视觉元素】
- Background: Dark urban or digital landscapes
- Typography: Futuristic, angular fonts with neon accents
- Color scheme: Black, dark blues with neon pink, purple, blue highlights
- Layout: Grid-based structure with dynamic, asymmetric elements
- Decorative elements: Neon signs, holographic effects, circuit patterns

【技术规格】
- Vertical 3:4 aspect ratio
- 2K resolution (2048x2730 pixels), ultra-high definition
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Layout split: Top 30% for Title with neon glow, Bottom 70% for Content
- Title text: Large, futuristic font with neon color, strictly legible
- Subtitle text: Medium weight, neon or light color
- Body content: Tech-inspired layout with digital elements
- High contrast between text and dark background

【风格一致性】
- Maintain consistent cyberpunk color scheme
- Unified futuristic aesthetic
- Consistent digital elements and composition style`
  },
  retro_vintage: {
    id: 'retro_vintage',
    name: '复古怀旧',
    description: '像从旧相册里翻出来的那张，很适合讲故事、讲回忆。',
    defaultPrompt: `A retro vintage-style vertical poster, 3:4 aspect ratio, 2048x2730 pixels, 2K resolution.

【整体风格要求】
- Warm, vintage color palette (sepia, faded tones)
- Nostalgic composition with retro elements
- Strong visual hierarchy with classic typography
- Soft, warm lighting
- Film grain texture for authentic vintage feel
- High-end, artistic aesthetic

【视觉元素】
- Background: Faded textures, vintage patterns, or old photographs
- Typography: Classic serif or retro script fonts
- Color scheme: Warm browns, sepia, faded reds, oranges, yellows
- Layout: Grid-based structure with classic composition
- Decorative elements: Vintage illustrations, old paper textures, retro icons

【技术规格】
- Vertical 3:4 aspect ratio
- 2K resolution (2048x2730 pixels), ultra-high definition
- Suitable for mobile screen viewing
- All text content must be fully presented
- No watermarks, logos, or brand identifiers
- Correct vertical orientation, no rotation or inversion

【文字排版】
- Layout split: Top 30% for Title Area, Bottom 70% for Content Grid
- Title text: Classic, elegant font with vintage color, strictly legible
- Subtitle text: Medium weight, positioned below title
- Body content: Clean, organized layout with retro styling
- Warm contrast between text and background

【风格一致性】
- Maintain consistent vintage color palette
- Unified nostalgic aesthetic
- Consistent retro elements and composition style`
  }
}

/**
 * 获取所有可用风格的配置
 */
export function getAllStyleConfigs(): StylePromptConfig[] {
  const customPrompts = loadCustomPrompts()
  
  return Object.values(DEFAULT_STYLE_PROMPTS).map(config => ({
    ...config,
    customPrompt: customPrompts[config.id]?.customPrompt
  }))
}

/**
 * 获取指定风格的提示词（优先使用用户自定义，否则使用默认）
 */
export function getStylePrompt(styleId: string): string {
  const config = getStyleConfig(styleId)
  return config?.customPrompt || config?.defaultPrompt || ''
}

/**
 * 获取指定风格的完整配置
 */
export function getStyleConfig(styleId: string): StylePromptConfig | undefined {
  const defaultConfig = DEFAULT_STYLE_PROMPTS[styleId]
  if (!defaultConfig) return undefined
  
  const customPrompts = loadCustomPrompts()
  return {
    ...defaultConfig,
    customPrompt: customPrompts[styleId]?.customPrompt
  }
}

/**
 * 保存用户自定义的提示词
 */
export function saveCustomPrompt(styleId: string, customPrompt: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  
  const customPrompts = loadCustomPrompts()
  if (customPrompt.trim()) {
    customPrompts[styleId] = { customPrompt: customPrompt.trim() }
  } else {
    // 如果为空，删除自定义提示词，恢复默认
    delete customPrompts[styleId]
  }
  
  localStorage.setItem(STORAGE_KEYS.STYLE_PROMPTS_CONFIG, JSON.stringify(customPrompts))
}

/**
 * 删除用户自定义的提示词（恢复默认）
 */
export function resetCustomPrompt(styleId: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  
  const customPrompts = loadCustomPrompts()
  delete customPrompts[styleId]
  
  localStorage.setItem(STORAGE_KEYS.STYLE_PROMPTS_CONFIG, JSON.stringify(customPrompts))
}

/**
 * 从 localStorage 加载用户自定义提示词
 */
function loadCustomPrompts(): Record<string, { customPrompt: string }> {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STYLE_PROMPTS_CONFIG)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load custom style prompts:', e)
  }
  
  return {}
}

