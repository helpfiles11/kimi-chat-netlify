/**
 * Centralized Kimi AI model configuration
 * Single source of truth for all available models
 */

export interface KimiModel {
  id: string
  name: string
  description: string
  badge: string
  promotion?: boolean
  contextLength?: number
  features?: string[]
}

// Official Kimi AI models - OFFICIAL from Moonshot API /v1/models (2024-2025)
// Ordered by performance: Best K2 models first, then latest, then other models
export const KIMI_MODELS: KimiModel[] = [
  {
    id: 'kimi-k2-turbo-preview',
    name: 'Kimi K2 Turbo',
    description: 'Fastest K2 model with optimized speed and efficiency',
    badge: 'Turbo',
    promotion: true,
    contextLength: 256000,
    features: ['Tool Calling', 'Code Generation', 'Fast Response']
  },
  {
    id: 'kimi-k2-0905-preview',
    name: 'Kimi K2 (0905)',
    description: 'September 2024 K2 model with enhanced performance',
    badge: 'Enhanced',
    promotion: true,
    contextLength: 256000,
    features: ['Tool Calling', 'Advanced Reasoning', 'Multimodal']
  },
  {
    id: 'kimi-k1.5',
    name: 'Kimi K1.5',
    description: 'Latest reasoning model matching GPT-4 performance (Jan 2025)',
    badge: 'Reasoning',
    promotion: true,
    contextLength: 128000,
    features: ['Advanced Reasoning', 'Mathematics', 'Code Excellence']
  },
  {
    id: 'kimi-latest',
    name: 'Kimi Latest',
    description: 'Always the newest and most advanced Kimi model available',
    badge: 'Latest',
    promotion: true,
    contextLength: 256000,
    features: ['Auto-Update', 'Latest Features', 'Tool Calling']
  },
  {
    id: 'kimi-thinking-preview',
    name: 'Kimi Thinking',
    description: 'Advanced reasoning model with step-by-step thinking',
    badge: 'Reasoning',
    contextLength: 256000,
    features: ['Chain of Thought', 'Complex Reasoning', 'Problem Solving']
  },
  {
    id: 'moonshot-v1-auto',
    name: 'Auto-Select (Cost Optimized)',
    description: 'Automatically selects optimal model (8k/32k/128k) for cost efficiency',
    badge: 'Smart',
    contextLength: 128000,
    features: ['Cost Optimization', 'Auto-Select', 'Variable Context']
  },
  {
    id: 'moonshot-v1-32k-vision-preview',
    name: 'Moonshot V1 Vision (32K)',
    description: 'Vision model with image understanding and 32K context',
    badge: 'Vision',
    contextLength: 32000,
    features: ['Image Analysis', 'Multimodal', 'Vision Understanding']
  },
  {
    id: 'moonshot-v1-128k',
    name: 'Moonshot V1 (128K)',
    description: 'Large context model with 128K token support',
    badge: 'Large Context',
    contextLength: 128000,
    features: ['Extended Context', 'Document Analysis', 'Long Conversations']
  },
  {
    id: 'moonshot-v1-32k',
    name: 'Moonshot V1 (32K)',
    description: 'Extended context model with 32K token support',
    badge: 'Extended',
    contextLength: 32000,
    features: ['Balanced Context', 'General Purpose', 'Fast Response']
  },
  {
    id: 'moonshot-v1-8k',
    name: 'Moonshot V1 (8K)',
    description: 'Fast model with 8K context, optimized for speed',
    badge: 'Fast',
    contextLength: 8000,
    features: ['High Speed', 'Quick Response', 'Efficient']
  }
]

// Model validation - ensure all models from chat API are included
export const ALLOWED_MODEL_IDS = KIMI_MODELS.map(model => model.id)

// Additional models from API response but not in main UI (for backend validation)
const ADDITIONAL_MODELS = [
  'kimi-k2-0711-preview',
  'moonshot-v1-8k-vision-preview',
  'moonshot-v1-128k-vision-preview'
]

export const ALL_ALLOWED_MODELS = [...ALLOWED_MODEL_IDS, ...ADDITIONAL_MODELS]

/**
 * Get model information by ID
 */
export function getModelById(id: string): KimiModel | undefined {
  return KIMI_MODELS.find(model => model.id === id)
}

/**
 * Validate if a model ID is allowed
 */
export function isValidModel(modelId: string): boolean {
  return ALL_ALLOWED_MODELS.includes(modelId)
}

/**
 * Get default model (first in list)
 */
export function getDefaultModel(): KimiModel {
  return KIMI_MODELS[0]
}

/**
 * Get models by feature
 */
export function getModelsByFeature(feature: string): KimiModel[] {
  return KIMI_MODELS.filter(model =>
    model.features?.some(f => f.toLowerCase().includes(feature.toLowerCase()))
  )
}

/**
 * Badge styling configuration
 */
export function getBadgeStyles(badge: string, isPromotion: boolean = false): string {
  const styles = {
    Latest: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-300 font-bold',
    Smart: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    Turbo: 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 dark:from-red-900/30 dark:to-orange-900/30 dark:text-red-300',
    Enhanced: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Reasoning: 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-300',
    'Large Context': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    Vision: 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 dark:from-pink-900/30 dark:to-rose-900/30 dark:text-pink-300',
    Extended: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    Fast: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  } as const

  const baseStyle = styles[badge as keyof typeof styles] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  return isPromotion ? `${baseStyle} ring-2 ring-yellow-400 ring-offset-1 dark:ring-yellow-500` : baseStyle
}