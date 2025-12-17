/**
 * 图片生成服务
 */

import { ProductAnalysis, GenerationSettings, TokenUsage } from '../../types'
import { logger } from '../../composables/useLogger'
import { callGoogleGenAIAPI } from './google'
import { fileToGenerativePart } from '../../utils'
import { generateId } from '../../utils'
import { isMockMode, mockGenerateStyledImage, mockGeneratePageImage } from './mock'
import { STORAGE_KEYS, API_CONFIG } from '../../config/constants'
import { useApi } from '../../composables/useApi'
import { getStylePrompt } from '../../config/stylePrompts'
import { VisualStyleGuide, Page } from '../../stores/textGenerator'
import {
  getRecommendedColorPalette,
  getRecommendedLayoutStyle,
  getRandomMaterialKeywords,
  getRandomLightingKeywords
} from '@/config/aestheticParams'

const { getApiKey: getApiKeyFromStorage } = useApi()

/**
 * 构建负面提示词（禁止的元素）
 */
function buildNegativePrompt(style?: string): string {
  const baseNegative = [
    'watermark',
    'logo',
    'text overlay',
    'brand name',
    'low quality',
    'blurry',
    'distorted',
    'cropped',
    'horizontal layout',
    'landscape orientation',
    'upside down',
    'rotated',
    'Xiaohongshu logo',
    'user ID',
    'brand identifier',
    // 去AI味的负面提示词
    'artificial look',
    'plastic texture',
    'too perfect',
    'computer generated',
    'AI generated',
    'digital artifact',
    'smooth plastic appearance',
    'unnatural lighting',
    'perfectly symmetrical',
    'overprocessed',
    'pure yellow background',
    'amateur design',
    'messy text',
    'illegible characters',
    'distorted visuals',
    'monochrome',
    'flat lighting',
    'lack of depth',
    'no texture',
    'generic stock photo style'
  ]
  
  // 根据风格添加特定的负面提示
  if (style === 'ins_minimal') {
    baseNegative.push(
      'cluttered',
      'busy background',
      'vibrant colors',
      'complex patterns',
      'excessive decorative elements',
      'warm tones',
      'colorful'
    )
  } else if (style === 'tech_future') {
    baseNegative.push(
      'warm tones',
      'natural lighting',
      'organic shapes',
      'soft colors',
      'pastel',
      'vintage look'
    )
  } else if (style === 'nature_fresh') {
    baseNegative.push(
      'artificial',
      'synthetic',
      'neon',
      'dark background',
      'urban',
      'industrial',
      'cold tones'
    )
  } else if (style === 'dopamine') {
    baseNegative.push(
      'muted colors',
      'dark background',
      'minimalist',
      'dull',
      'boring'
    )
  } else if (style === 'morandi') {
    baseNegative.push(
      'vibrant colors',
      'high contrast',
      'neon',
      'busy background',
      'cluttered'
    )
  } else if (style === 'black_gold') {
    baseNegative.push(
      'vibrant colors',
      'pastel',
      'natural lighting',
      'cluttered',
      'busy background'
    )
  }
  
  return baseNegative.join(', ')
}

/**
 * 计算动态温度值
 */
function calculateTemperature(style?: string, hasCustomPrompt?: boolean): number {
  // 有明确风格要求时，降低温度以提高一致性
  if (style) return 0.7
  // 有自定义 prompt 时，使用中等温度
  if (hasCustomPrompt) return 0.9
  // 默认情况
  return 1.0
}


/**
 * 生成风格化图片（图生图模式）
 */
export async function generateStyledImage(
  originalFile: File,
  analysis: ProductAnalysis,
  style: string,
  settings?: GenerationSettings
): Promise<{ imageUrl: string | null; usage: TokenUsage }> {
  if (isMockMode()) {
    logger.debug('🧪 [模拟模式] 生成风格化图片')
    return await mockGenerateStyledImage(originalFile, analysis, style, settings)
  }

  const emptyUsage: TokenUsage = { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 }
  if (style === 'none') return { imageUrl: null, usage: emptyUsage }

  // 根据风格生成对应的 prompt（统一从配置获取）
  let stylePrompt = getStylePrompt(style)
  if (!stylePrompt) {
    logger.warn(`风格 ${style} 不存在，使用默认提示词`)
    stylePrompt = '专业产品摄影，干净背景，良好光线，清晰可读的中文文字，无水印、logo或标识。'
  }

  const { mimeType, data } = await fileToGenerativePart(originalFile)
  const additionalContext = settings?.additionalContext || ''

  let imagePrompt = ''
  if (settings?.customPrompts?.enable && settings.customPrompts.imageGenerationTemplate) {
    // 使用自定义模板
    imagePrompt = settings.customPrompts.imageGenerationTemplate
      .replace(/\{\{stylePrompt\}\}/g, stylePrompt)
      .replace(/\{\{name\}\}/g, analysis.name)
      .replace(/\{\{colors\}\}/g, analysis.colors.join(', '))
      .replace(/\{\{materials\}\}/g, analysis.materials.join(', '))
      .replace(/\{\{features\}\}/g, analysis.features.join(', '))
      .replace(/\{\{additionalContext\}\}/g, additionalContext)
  } else {
    // 使用默认模板，优先强调风格要求
    imagePrompt = `【风格要求 - 必须严格遵守】
${stylePrompt}

【CRITICAL一致性约束 - 必须严格遵守】
1. 产品主体100%保持一致：
   - 颜色：必须完全匹配参考图中的${analysis.colors.join(', ')}色，不得有任何色差或变色
   - 形状：产品的外形、轮廓、尺寸比例必须与参考图完全一致，不得变形、拉伸或扭曲
   - 材质：${analysis.materials.join(', ')}的质感、纹理、反光特性必须与参考图一致
   - 细节：产品的所有细节特征（${analysis.features.join(', ')}）必须完整保留，不得缺失或改变
   
2. 允许修改的内容（仅限以下）：
   - 背景：可以更换为符合${stylePrompt}风格的背景
   - 布光：可以调整光线角度和强度，但必须保持产品的真实质感
   - 构图：可以微调产品位置以适应3:4竖版格式，但产品本身不得变形

3. 严格禁止的修改：
   - 禁止改变产品的任何物理属性（颜色、形状、材质、纹理、尺寸比例）
   - 禁止添加或删除产品的任何部分或细节
   - 禁止添加水印、文字、logo或任何标记

【格式要求】严格使用小红书3:4竖版格式，超高清分辨率，产品主体居中，顶部和底部留出文案空间。确保中文文字清晰可读。注意：上述格式要求为技术规格说明，不应渲染为图片中的文字内容。

${additionalContext}`
  }

  // 构建负面提示词（添加到 prompt 末尾）
  const negativePrompt = buildNegativePrompt(style)
  const finalPrompt = `${imagePrompt}\n\n【禁止元素】${negativePrompt}`
  
  // 计算动态温度
  const temperature = calculateTemperature(style, !!(settings?.customPrompts?.enable))
  
  const requestId = generateId('styled')
  logger.debug(`[${requestId}] 开始生成风格化图片`, {
    style,
    hasAnalysis: !!analysis,
    stylePromptPreview: stylePrompt.slice(0, 120),
    temperature,
    negativePrompt: negativePrompt.slice(0, 100)
  })

  try {
    const result = await callGoogleGenAIAPI(finalPrompt, [{ mimeType, data }], {
      model: getApiKeyFromStorage(STORAGE_KEYS.GOOGLE_MODEL) || API_CONFIG.DEFAULT_GOOGLE_MODEL,
      temperature: temperature,
      responseFormat: 'image'
    })

    if (!result.imageData) {
      logger.error(`[${requestId}] ❌ 图片生成失败: 未找到图片数据`)
      throw new Error('No image generated')
    }

    logger.debug(`[${requestId}] ✅ 风格化图片生成成功`)
    return {
      imageUrl: result.imageData,
      usage: result.usage
    }
  } catch (error) {
    logger.error(`[${requestId}] Image generation failed:`, error)
    return { imageUrl: null, usage: emptyUsage }
  }
}

/**
 * 生成页面图片（文本生成图文模式）
 * @param pageContent 页面内容
 * @param pageIndex 页面索引
 * @param totalPages 总页数
 * @param fullOutline 完整大纲
 * @param topic 主题
 * @param pageType 页面类型
 * @param customPrompt 自定义提示词
 * @param imagePrompt 配图建议
 * @param style 风格选择（可选）
 */
export async function generatePageImage(
  pageContent: string,
  pageIndex: number,
  totalPages: number,
  fullOutline: string,
  topic: string,
  pageType: 'cover' | 'content' | 'summary' = 'content',
  customPrompt?: string,
  imagePrompt?: string,
  style?: string,
  visualGuide?: VisualStyleGuide,
  pageVisualMetadata?: Page['visualMetadata']
): Promise<{ imageUrl: string; usage: TokenUsage }> {
  if (isMockMode()) {
    logger.debug(`🧪 [模拟模式] 生成第 ${pageIndex + 1} 页图片`)
    return await mockGeneratePageImage(pageContent, pageIndex)
  }

  // 判断是否为头图模式：第0页（封面）且总页数为1时，视为头图模式
  const isHeadImageMode = totalPages === 1 && pageIndex === 0 && pageType === 'cover'

  // 如果当前页内容为空，使用兜底内容，避免空 prompt 导致模型拒绝或报错
  let safePageContent = pageContent
  if (!safePageContent || !safePageContent.trim()) {
    if (imagePrompt && imagePrompt.trim()) {
      safePageContent = `配图建议：${imagePrompt.trim()}`
    } else {
      safePageContent = `本页为${pageType === 'cover' ? '封面' : pageType === 'summary' ? '总结' : '内容'}页，主题：${topic}。请根据整体大纲生成一张适配的小红书风格图片。`
    }
  }

  // 从配置服务获取风格提示词（优先使用用户自定义，否则使用默认）
  let stylePrompt = ''
  if (style) {
    stylePrompt = getStylePrompt(style)
    logger.debug(`[风格提示词] 风格ID: ${style}, 获取到的提示词长度: ${stylePrompt?.length || 0}`)
    if (!stylePrompt || !stylePrompt.trim()) {
      // 如果风格不存在，使用默认提示词
      logger.warn(`风格 ${style} 不存在或为空，使用默认提示词`)
      stylePrompt = '专业、干净、现代设计，清晰可读的中文文字，无水印、logo或标识。'
    } else {
      logger.debug(`[风格提示词] 成功获取风格提示词，前100字符: ${stylePrompt.slice(0, 100)}`)
    }
  } else {
    logger.debug(`[风格提示词] 未提供风格参数，跳过风格提示词`)
  }

  // 动态生成美学参数（配色方案、布局风格、材质和光影效果）
  const recommendedPalette = getRecommendedColorPalette(safePageContent)
  const recommendedLayout = getRecommendedLayoutStyle(pageType)
  const materialKeywords = getRandomMaterialKeywords(isHeadImageMode ? 3 : 2) // 头图模式下使用更多材质关键词
  const lightingKeywords = getRandomLightingKeywords(isHeadImageMode ? 3 : 2) // 头图模式下使用更多光影关键词
  
  logger.debug(`[动态美学参数] 生成的参数:`, {
    recommendedPalette,
    recommendedLayout,
    materialKeywords,
    lightingKeywords,
    isHeadImageMode
  })

  // 构建美学参数提示词，添加到风格提示词中
  const aestheticParams = `

【动态美学参数】
- 推荐配色方案: ${recommendedPalette}
- 推荐布局风格: ${recommendedLayout}
- 材质效果: ${materialKeywords.join(', ')}
- 光影效果: ${lightingKeywords.join(', ')}`

  // 构建用户配图建议（高优先级，放在前面）
  let userImageSuggestion = ''
  if (imagePrompt && imagePrompt.trim()) {
    userImageSuggestion = `【用户配图建议 - 高优先级】\n${imagePrompt.trim()}\n\n`
  } else {
    // 如果没有用户配图建议，尝试从内容中提取
    const match = safePageContent.match(/(?:配图建议|图片建议|建议配图)[：:\s]+\s*(.+?)(?=\n\n|\n$|$)/is)
    if (match && match[1]) {
      userImageSuggestion = `【配图建议 - 高优先级】\n${match[1].trim()}\n\n`
    }
  }

  // 构建合规提醒（在所有分支中都需要）
  const complianceNote = `【合规要求】
- 禁止包含任何小红书的logo、用户ID或品牌标识
- 禁止包含水印、logo或任何标记（尤其是右下角、左上角）
- 如果参考图片中有水印或logo，必须完全去除\n\n`

  // 使用自定义 prompt 或默认内置模板
  let prompt = customPrompt || ''
  
  // 定义 styleSection 变量，确保在所有分支中都可访问
  let styleSection = ''
  
  if (!prompt) {
    // 构建技术规格（所有情况都需要）
    // 头图模式下：提高生成质量要求，优化构图
    const technicalSpecs = isHeadImageMode 
      ? `【技术规格 - 必须严格遵守】
- 竖版 3:4 比例，超高清2K分辨率
- 超高清画质，8K级细节，确保中文文字清晰可读
- 适合手机屏幕查看，特别优化小红书首图展示效果
- 所有文字内容必须完整呈现，字号适中易读
- 无水印、logo或品牌标识
- 正确的竖屏观看排版，不能旋转或倒置
- 构图饱满，视觉冲击力强，适合作为封面首图使用
- 重要：上述技术规格为图片生成参数说明，禁止将这些参数数值（如分辨率、像素数等）渲染为图片中的文字内容`
      : `【技术规格 - 必须严格遵守】
- 竖版 3:4 比例，超高清2K分辨率
- 超高清画质，确保中文文字清晰可读
- 适合手机屏幕查看
- 所有文字内容必须完整呈现
- 无水印、logo或品牌标识
- 正确的竖屏观看排版，不能旋转或倒置
- 重要：上述技术规格为图片生成参数说明，禁止将这些参数数值（如分辨率、像素数等）渲染为图片中的文字内容`

    // 构建页面设计要求（根据页面类型）
    const pageDesignRequirements = isHeadImageMode 
      ? `【头图设计要求】
- 标题占据主要位置，字号最大，突出主题
- 副标题居中或在标题下方，简洁有力
- 整体设计要有强烈的视觉吸引力和冲击力
- 背景丰富有层次，有明确的视觉焦点
- 配色和谐统一，符合主题氛围
- 确保在小红书信息流中能脱颖而出
- 构图均衡，避免元素拥挤
- 可以适当添加装饰性元素增强视觉效果`
      : (pageType === 'cover' 
        ? `【封面页设计要求】
- 标题占据主要位置，字号最大
- 副标题居中或在标题下方
- 整体设计要有吸引力和冲击力
- 背景可以更丰富，有视觉焦点`
        : `【内容页设计要求】
- 信息层次分明
- 列表项清晰展示
- 重点内容用颜色或粗体强调
- 可以有小图标辅助说明`)

    // 构建风格一致性要求（非封面页需要参考封面）
    // 如果提供了风格参数，所有页面都应该使用相同的用户选择风格
    let styleConsistencyNote = ''
    if (style && stylePrompt) {
      // 有用户选择的风格时，强调所有页面必须使用相同的风格
      if (pageType === 'cover') {
        styleConsistencyNote = `【风格一致性要求】这是封面页，后续所有内容页必须严格遵守本页的风格设定（${style}），保持整体风格统一。\n\n`
      } else {
        styleConsistencyNote = `【风格一致性要求】必须与封面页使用完全相同的风格（${style}），确保所有页面风格统一。配色、布局、视觉元素都应保持一致。\n\n`
      }
    } else if (pageType !== 'cover') {
      // 没有明确风格时，参考封面页
      styleConsistencyNote = `【风格一致性要求】参考封面页的风格，保持所有页面风格统一。\n\n`
    }

    // 构建通用设计要求（仅在无风格要求时使用，避免冲突）
    let genericDesignGuidance = ''
    if (!stylePrompt) {
      genericDesignGuidance = `【设计指导】
- 文字清晰可读，字号适中，重要信息突出显示
- 排版美观，留白合理，支持 emoji 和符号
- 背景简洁但不单调，可以有装饰性元素（如图标、插画）
- 保持专业感和视觉吸引力\n\n`
    } else {
      // 有风格要求时，只保留不冲突的通用要求
      genericDesignGuidance = `【设计指导】
- 文字清晰可读，字号适中，重要信息突出显示
- 排版美观，留白合理，支持 emoji 和符号\n\n`
    }

    // 按优先级组织 prompt：全局视觉指南 > 当前页视觉约束 > 风格要求 > 用户配图建议 > 技术规格 > 内容 > 设计要求
    
    // 构建全局视觉指南部分（最高优先级）
    const globalVisualGuide = visualGuide 
      ? `【全局视觉指南 - 所有页面必须严格遵守】
主色调：${visualGuide.colorPalette.primary}
辅助色调：${visualGuide.colorPalette.secondary.join('、')}
字体风格：${visualGuide.typographyStyle}
布局风格：${visualGuide.layoutStyle}
装饰元素：${visualGuide.decorativeElements}
整体美学：${visualGuide.overallAesthetic}

【配色统一性要求 - 必须严格遵守】
- 所有内容页必须使用上述主色调，不允许任何变体
- 总结页必须使用与内容页完全相同的主色调
- 封面页可以使用上述主色调或兼容配色（建议使用上述主色调）
- 违反此要求将导致帖子整体性被破坏

`
      : ''
    
    // 构建当前页视觉约束
    let pageVisualConstraint = ''
    if (pageVisualMetadata || visualGuide) {
      const constraintLines: string[] = []
      
      // 关键优化：内容页和总结页必须使用全局主色调，不允许变体
      let primaryColor: string | undefined
      if (pageType === 'content' || pageType === 'summary') {
        // 内容页和总结页：强制使用全局主色调
        primaryColor = visualGuide?.colorPalette.primary
        if (primaryColor) {
          constraintLines.push(`主色调：${primaryColor}（全局统一主色调，必须严格遵守）`)
        }
      } else {
        // 封面页：可以使用页面元数据中的主色调，或回退到全局主色调
        primaryColor = pageVisualMetadata?.primaryColor || visualGuide?.colorPalette.primary
        if (primaryColor) {
          constraintLines.push(`主色调：${primaryColor}${pageVisualMetadata?.primaryColor ? '' : '（遵循全局主色调）'}`)
        }
      }
      
      const visualFocus = pageVisualMetadata?.visualFocus || (visualGuide ? `遵循全局布局风格（${visualGuide.layoutStyle}）` : undefined)
      if (visualFocus) {
        constraintLines.push(`视觉重点：${visualFocus}`)
      }
      
      const layoutPattern = pageVisualMetadata?.layoutPattern || (visualGuide ? `遵循全局布局风格（${visualGuide.layoutStyle}）` : undefined)
      if (layoutPattern) {
        constraintLines.push(`布局模式：${layoutPattern}`)
      }
      
      const decorativeStyle = pageVisualMetadata?.decorativeStyle || visualGuide?.decorativeElements
      if (decorativeStyle) {
        constraintLines.push(`装饰风格：${decorativeStyle}`)
      }
      
      if (constraintLines.length > 0) {
        pageVisualConstraint = `【当前页视觉约束】
${constraintLines.join('\n')}

`
      }
    }
    
    // 构建风格要求部分（如果有风格提示词）
    styleSection = (stylePrompt && stylePrompt.trim()) 
      ? `【风格要求 - 必须严格遵守】
${stylePrompt.trim()}${aestheticParams}

` 
      : ''
    
    // 调试日志：检查风格提示词是否正确获取
    if (style) {
      logger.debug(`[Prompt构建] 风格ID: ${style}, 风格提示词存在: ${!!stylePrompt}, 长度: ${stylePrompt?.length || 0}`)
      if (styleSection) {
        logger.debug(`[Prompt构建] 风格部分已添加，前150字符: ${styleSection.slice(0, 150)}`)
      } else {
        logger.warn(`[Prompt构建] ⚠️ 风格 ${style} 的提示词为空，未添加到 prompt 中`)
      }
    }
    
    prompt = `${complianceNote}${globalVisualGuide}${pageVisualConstraint}${styleSection}${userImageSuggestion}${technicalSpecs}\n\n【页面内容】\n${safePageContent}\n\n【页面类型】${isHeadImageMode ? '头图页' : (pageType === 'cover' ? '封面页' : pageType === 'summary' ? '总结页' : '内容页')}\n\n${styleConsistencyNote}${genericDesignGuidance}${pageDesignRequirements}\n\n【上下文参考】\n用户原始需求：${topic}\n完整内容大纲：\n---\n${fullOutline}\n---`
  } else {
    // 使用自定义 prompt，但需要确保风格提示词被正确注入
    
    // 构建全局视觉指南部分（如果存在）
    const globalVisualGuideForCustom = visualGuide 
      ? `【全局视觉指南 - 所有页面必须严格遵守】
主色调：${visualGuide.colorPalette.primary}
辅助色调：${visualGuide.colorPalette.secondary.join('、')}
字体风格：${visualGuide.typographyStyle}
布局风格：${visualGuide.layoutStyle}
装饰元素：${visualGuide.decorativeElements}
整体美学：${visualGuide.overallAesthetic}

【配色统一性要求 - 必须严格遵守】
- 所有内容页必须使用上述主色调，不允许任何变体
- 总结页必须使用与内容页完全相同的主色调
- 封面页可以使用上述主色调或兼容配色（建议使用上述主色调）
- 违反此要求将导致帖子整体性被破坏

`
      : ''
    
    // 构建当前页视觉约束（如果存在）
    let pageVisualConstraintForCustom = ''
    if (pageVisualMetadata || visualGuide) {
      const constraintLines: string[] = []
      
      // 关键优化：内容页和总结页必须使用全局主色调，不允许变体
      let primaryColor: string | undefined
      if (pageType === 'content' || pageType === 'summary') {
        // 内容页和总结页：强制使用全局主色调
        primaryColor = visualGuide?.colorPalette.primary
        if (primaryColor) {
          constraintLines.push(`主色调：${primaryColor}（全局统一主色调，必须严格遵守）`)
        }
      } else {
        // 封面页：可以使用页面元数据中的主色调，或回退到全局主色调
        primaryColor = pageVisualMetadata?.primaryColor || visualGuide?.colorPalette.primary
        if (primaryColor) {
          constraintLines.push(`主色调：${primaryColor}${pageVisualMetadata?.primaryColor ? '' : '（遵循全局主色调）'}`)
        }
      }
      
      const visualFocus = pageVisualMetadata?.visualFocus || (visualGuide ? `遵循全局布局风格（${visualGuide.layoutStyle}）` : undefined)
      if (visualFocus) {
        constraintLines.push(`视觉重点：${visualFocus}`)
      }
      
      const layoutPattern = pageVisualMetadata?.layoutPattern || (visualGuide ? `遵循全局布局风格（${visualGuide.layoutStyle}）` : undefined)
      if (layoutPattern) {
        constraintLines.push(`布局模式：${layoutPattern}`)
      }
      
      const decorativeStyle = pageVisualMetadata?.decorativeStyle || visualGuide?.decorativeElements
      if (decorativeStyle) {
        constraintLines.push(`装饰风格：${decorativeStyle}`)
      }
      
      if (constraintLines.length > 0) {
        pageVisualConstraintForCustom = `【当前页视觉约束】
${constraintLines.join('\n')}

`
      }
    }
    
    // 替换自定义prompt中的变量
    prompt = (customPrompt || '')
      .replace(/\{\{page_content\}\}/g, pageContent)
      .replace(/\{\{page_type\}\}/g, pageType)
      .replace(/\{\{page_index\}\}/g, String(pageIndex + 1))
      .replace(/\{\{total_pages\}\}/g, String(totalPages))
      .replace(/\{\{topic\}\}/g, topic)
      .replace(/\{\{full_outline\}\}/g, fullOutline)
      .replace(/\{\{style_prompt\}\}/g, stylePrompt || '')
      .replace(/\{\{image_prompt\}\}/g, imagePrompt || '')
      .replace(/\{\{title_color\}\}/g, '')
    
    // 如果提供了全局视觉指南，且自定义 prompt 中没有包含，则在开头添加
    if (globalVisualGuideForCustom && !prompt.includes('全局视觉指南')) {
      prompt = globalVisualGuideForCustom + prompt
      logger.debug(`[自定义Prompt] 检测到全局视觉指南，已添加到开头`)
    }
    
    // 如果提供了当前页视觉约束，且自定义 prompt 中没有包含，则在全局视觉指南后添加
    if (pageVisualConstraintForCustom && !prompt.includes('当前页视觉约束')) {
      // 找到全局视觉指南的位置，在其后插入
      const guideIndex = prompt.indexOf('全局视觉指南')
      if (guideIndex !== -1) {
        // 找到全局视觉指南的结束位置（下一个空行或下一个章节）
        const nextSectionMatch = prompt.substring(guideIndex).match(/\n\n/)
        if (nextSectionMatch) {
          const insertIndex = guideIndex + nextSectionMatch.index! + 2
          prompt = prompt.slice(0, insertIndex) + pageVisualConstraintForCustom + prompt.slice(insertIndex)
        } else {
          prompt = prompt + '\n' + pageVisualConstraintForCustom
        }
      } else {
        prompt = pageVisualConstraintForCustom + prompt
      }
      logger.debug(`[自定义Prompt] 检测到当前页视觉约束，已添加`)
    }
    
    // 如果自定义 prompt 中没有包含风格要求，且提供了风格提示词，则在视觉约束后添加
    if (stylePrompt && stylePrompt.trim() && !prompt.includes('风格要求') && !prompt.includes('style')) {
      styleSection = `【风格要求 - 必须严格遵守】\n${stylePrompt.trim()}${aestheticParams}\n\n`
      // 在视觉约束后添加，如果没有视觉约束则在开头添加
      const constraintIndex = prompt.indexOf('当前页视觉约束')
      if (constraintIndex !== -1) {
        const nextSectionMatch = prompt.substring(constraintIndex).match(/\n\n/)
        if (nextSectionMatch) {
          const insertIndex = constraintIndex + nextSectionMatch.index! + 2
          prompt = prompt.slice(0, insertIndex) + styleSection + prompt.slice(insertIndex)
        } else {
          prompt = prompt + '\n' + styleSection
        }
      } else {
        prompt = styleSection + prompt
      }
      logger.debug(`[自定义Prompt] 检测到风格提示词但自定义prompt中未包含，已添加`)
    }
    
    // 如果自定义 prompt 中没有包含用户配图建议，在开头添加
    if (userImageSuggestion && !prompt.includes('用户配图建议') && !prompt.includes('配图建议')) {
      prompt = userImageSuggestion + prompt
    }
    
    // 头图模式下，在自定义prompt中添加头图特定要求
    if (isHeadImageMode && !prompt.includes('头图') && !prompt.includes('head image')) {
      const headImageRequirements = `\n\n【头图模式要求】\n- 提高生成质量，确保细节丰富\n- 优化构图，增强视觉冲击力\n- 适合作为小红书首图展示\n- 突出主题，吸引用户点击`
      prompt += headImageRequirements
    }
  }

  // 构建负面提示词（添加到 prompt 末尾）
  // 头图模式下：添加更多负面提示词，确保头图质量
  let negativePrompt = buildNegativePrompt(style)
  if (isHeadImageMode) {
    const headImageNegative = [
      'simple background',
      'lack of detail',
      'dull colors',
      'low contrast',
      'poor composition',
      'unattractive',
      'boring',
      'flat design',
      'no visual hierarchy',
      'small text',
      'hard to read text',
      'cluttered layout'
    ]
    negativePrompt = `${negativePrompt}, ${headImageNegative.join(', ')}`
  }
  const finalPrompt = `${prompt}\n\n【禁止元素】${negativePrompt}`
  
  // 调试日志：输出完整的提示词（仅前500字符，避免日志过长）
  logger.debug(`[Prompt构建完成] 风格: ${style || '无'}, 页面类型: ${pageType}, 提示词长度: ${prompt.length}`, {
    styleSection: styleSection ? styleSection.slice(0, 200) : '无',
    promptPreview: prompt.slice(0, 500),
    negativePromptPreview: negativePrompt.slice(0, 200)
  })
  
  // 计算动态温度
  // 头图模式下：降低温度，提高一致性和质量
  const temperature = isHeadImageMode 
    ? 0.6 
    : calculateTemperature(style, !!customPrompt)
  
  // 调试模式：如果启用了调试模式，在控制台输出原始prompt
  const isDebugMode = localStorage.getItem(STORAGE_KEYS.PROMPT_DEBUG_MODE) === 'true'
  if (isDebugMode) {
    logger.debug(`[图片生成 Prompt 调试] 第 ${pageIndex + 1} 页 (${pageType})`, {
      style,
      stylePromptPreview: stylePrompt ? stylePrompt.slice(0, 120) : '',
      temperature,
      negativePrompt: negativePrompt.slice(0, 100),
      prompt: finalPrompt,
      isHeadImageMode
    })
  }

  const requestId = generateId(`page_${pageIndex}`)
  logger.debug(`[${requestId}] 开始生成第 ${pageIndex + 1} 页图片`, {
    pageType,
    hasCustomPrompt: !!customPrompt,
    hasImagePrompt: !!imagePrompt,
    isHeadImageMode
  })

  try {
    const result = await callGoogleGenAIAPI(finalPrompt, [], {
      model: getApiKeyFromStorage(STORAGE_KEYS.GOOGLE_MODEL) || API_CONFIG.DEFAULT_GOOGLE_MODEL,
      temperature: temperature,
      responseFormat: 'image'
    })

    if (!result.imageData) {
      logger.error(`[${requestId}] ❌ 第 ${pageIndex + 1} 页图片生成失败: 未找到图片数据`)
      throw new Error('No image generated')
    }

    // 确保 imageData 是有效的字符串
    const imageUrl = typeof result.imageData === 'string' ? result.imageData : String(result.imageData)
    
    logger.debug(`[${requestId}] ✅ 第 ${pageIndex + 1} 页图片生成成功`)

    // 检查是否启用调试模式，如果启用则返回调试信息
    const isDebugMode = localStorage.getItem(STORAGE_KEYS.PROMPT_DEBUG_MODE) === 'true'
    if (isDebugMode) {
      logger.debug(`[调试信息] 第 ${pageIndex + 1} 页图片生成完成`, {
        style,
        temperature,
        negativePrompt: negativePrompt.slice(0, 200),
        stylePromptPreview: stylePrompt ? stylePrompt.slice(0, 200) : undefined
      })
    }

    return {
      imageUrl: imageUrl,
      usage: result.usage
    }
  } catch (error) {
    logger.error(`[${requestId}] Page image generation failed:`, error)
    throw error
  }
}

/**
 * 直接根据提示词生成图片（提示词生成图片模式）
 * @param prompt 图片生成提示词
 * @param aspectRatio 图片比例，默认3:4（小红书标准）
 */
export async function generateImageFromPrompt(
  prompt: string,
  aspectRatio: '3:4' = '3:4'
): Promise<{ imageUrl: string; usage: TokenUsage }> {
  if (isMockMode()) {
    logger.debug('🧪 [模拟模式] 根据提示词生成图片')
    return {
      imageUrl: 'data:image/png;base64,mock_image_data',
      usage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 }
    }
  }

  if (!prompt || !prompt.trim()) {
    throw new Error('提示词不能为空')
  }

  // 根据比例确定尺寸（2K分辨率）
  const dimensions = aspectRatio === '3:4' ? '2048x2730' : '2048x2048'
  
  // 构建完整的图片生成提示词，明确指定比例和尺寸
  const fullPrompt = `${prompt}

【格式要求】
- 严格使用 ${aspectRatio} 比例（${dimensions} 像素，2K分辨率）
- 超高清画质，确保中文文字清晰可读
- 适合手机屏幕查看`

  const requestId = generateId('prompt_image')
  logger.debug(`[${requestId}] 开始根据提示词生成图片`, {
    promptLength: prompt.length,
    aspectRatio,
    dimensions
  })

  try {
    const result = await callGoogleGenAIAPI(fullPrompt, [], {
      model: getApiKeyFromStorage(STORAGE_KEYS.GOOGLE_MODEL) || API_CONFIG.DEFAULT_GOOGLE_MODEL,
      temperature: 1.0,
      responseFormat: 'image'
    })

    if (!result.imageData) {
      logger.error(`[${requestId}] ❌ 图片生成失败: 未找到图片数据`)
      throw new Error('No image generated')
    }

    const imageUrl = typeof result.imageData === 'string' ? result.imageData : String(result.imageData)
    
    logger.debug(`[${requestId}] ✅ 图片生成成功`)
    return {
      imageUrl,
      usage: result.usage
    }
  } catch (error) {
    logger.error(`[${requestId}] Image generation from prompt failed:`, error)
    throw error
  }
}

