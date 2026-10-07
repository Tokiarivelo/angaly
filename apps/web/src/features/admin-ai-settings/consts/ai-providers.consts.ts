export const AI_SETTINGS_QUERY_KEYS = {
  providers: ['admin', 'ai-settings', 'providers'] as const,
  routing: ['admin', 'ai-settings', 'routing'] as const,
  availableModels: ['admin', 'ai-settings', 'available-models'] as const,
};

export interface ProviderVisualMeta {
  monogram: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const PROVIDER_VISUAL_MAP: Record<string, ProviderVisualMeta> = {
  ANTHROPIC: {
    monogram: 'AN',
    bgClass: 'bg-[#061938]',
    textClass: 'text-[#F6F2E9]',
    borderClass: 'border-[#C5B190]/50',
  },
  GEMINI: {
    monogram: 'GO',
    bgClass: 'bg-[#0C2650]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#18375D]',
  },
  OPENAI: {
    monogram: 'OA',
    bgClass: 'bg-[#18375D]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#18375D]',
  },
  META_MUSE: {
    monogram: 'MS',
    bgClass: 'bg-[#D8D3C8]',
    textClass: 'text-[#061938]',
    borderClass: 'border-[#D9D4CA]',
  },
  MISTRAL: {
    monogram: 'MI',
    bgClass: 'bg-[#061938]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#936C3E]/40',
  },
  GROQ: {
    monogram: 'GQ',
    bgClass: 'bg-[#0C2650]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#C5B190]/30',
  },
  OPENROUTER: {
    monogram: 'OR',
    bgClass: 'bg-[#18375D]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#18375D]',
  },
  DEEPSEEK: {
    monogram: 'DS',
    bgClass: 'bg-[#061938]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#D9D4CA]',
  },
  TOGETHER: {
    monogram: 'TG',
    bgClass: 'bg-[#D8D3C8]',
    textClass: 'text-[#061938]',
    borderClass: 'border-[#D9D4CA]',
  },
  CEREBRAS: {
    monogram: 'CB',
    bgClass: 'bg-[#0C2650]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#C5B190]/40',
  },
  CUSTOM_OPENAI: {
    monogram: 'OL',
    bgClass: 'bg-[#18375D]',
    textClass: 'text-[#FFFFFF]',
    borderClass: 'border-[#C5B190]/50',
  },
  LOCAL_STATISTICAL: {
    monogram: 'LC',
    bgClass: 'bg-[#061938]',
    textClass: 'text-[#C5B190]',
    borderClass: 'border-[#936C3E]',
  },
};

export const BILLING_TIER_LABELS: Record<string, string> = {
  FREE: 'Gratuit',
  FREEMIUM: 'Gratuit avec quota',
  PAID: 'Payant',
  SELF_HOSTED: 'Auto-hébergé',
};
