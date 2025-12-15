// AI 服务统一出口（向后兼容旧的导入路径 `../services/ai`）
// 实际实现全部在 `src/services/ai/` 目录下的各子模块中。

export { analyzeProductImage } from './ai/imageAnalysis'
export { generateMarketingCopy } from './ai/marketingCopy'
export { generateStyledImage, generatePageImage, generateImageFromPrompt } from './ai/imageGeneration'
export { generateOutline } from './ai/outline'
export { isMockMode } from './ai/mock'
export { generateImagePromptFromTemplate, generateImagePromptsBatch } from './ai/promptTemplate'
export { generatePromptBatchPlan } from './ai/promptBatch'
