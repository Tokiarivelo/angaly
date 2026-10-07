// ============================================================
// ANGALY — Types Fournisseurs d'IA (apps/web, apps/api, apps/ai-service)
// Spécifié dans docs/features/ai-providers.md
// ============================================================

export enum AiProviderId {
  ANTHROPIC = 'ANTHROPIC',
  GEMINI = 'GEMINI',
  OPENAI = 'OPENAI',
  META_MUSE = 'META_MUSE',
  MISTRAL = 'MISTRAL',
  GROQ = 'GROQ',
  OPENROUTER = 'OPENROUTER',
  DEEPSEEK = 'DEEPSEEK',
  TOGETHER = 'TOGETHER',
  CEREBRAS = 'CEREBRAS',
  CUSTOM_OPENAI = 'CUSTOM_OPENAI',
  LOCAL_STATISTICAL = 'LOCAL_STATISTICAL',
}

export enum AiProviderStatus {
  UNTESTED = 'UNTESTED',
  OK = 'OK',
  INVALID = 'INVALID',
}

export enum AiUsage {
  MEASUREMENT_ESTIMATION = 'MEASUREMENT_ESTIMATION',
  PATTERN_SUGGESTION = 'PATTERN_SUGGESTION',
}

export enum AiProviderBillingTier {
  FREE = 'FREE',
  FREEMIUM = 'FREEMIUM',
  PAID = 'PAID',
  SELF_HOSTED = 'SELF_HOSTED',
}

/** Entrée du catalogue statique de fournisseurs IA */
export interface AiProviderCatalogEntry {
  id: AiProviderId;
  name: string;
  tier: AiProviderBillingTier;
  tierLabel: string;
  description: string;
  monogram: string;
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
  defaultBaseUrl?: string | undefined;
  defaultModel: string;
  suggestedModels: string[];
  isSelfHosted?: boolean | undefined;
}

/** Vue sécurisée de la configuration d'un fournisseur (SANS secret / apiKeyCipher) */
export interface AiProviderConfigView {
  provider: AiProviderId;
  model: string;
  baseUrl: string | null;
  apiKeyMasked: string | null;
  status: AiProviderStatus;
  lastTestedAt: string | null;
  lastLatencyMs: number | null;
  enabled: boolean;
  updatedAt: string;
}

/** Payload de création / modification d'un fournisseur par l'ADMIN */
export interface UpsertAiProviderDto {
  model: string;
  baseUrl?: string | null | undefined;
  apiKey?: string | undefined;
  enabled?: boolean | undefined;
}

/** Routage des modèles d'IA par usage d'atelier */
export interface AiRoutingSetting {
  measurementProvider: AiProviderId;
  patternSuggestionProvider: AiProviderId;
  updatedAt: string;
  updatedById: string | null;
}

/** Modification du routage d'atelier */
export interface UpdateAiRoutingDto {
  measurementProvider?: AiProviderId | undefined;
  patternSuggestionProvider?: AiProviderId | undefined;
}

/** Identifiants envoyés à apps/ai-service via le réseau interne pour un appel */
export interface ProviderCredentials {
  provider: AiProviderId;
  model: string;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
}

/** Résultat d'un test de connectivité */
export interface TestAiProviderResponse {
  provider: AiProviderId;
  status: AiProviderStatus;
  latencyMs: number;
  testedAt: string;
  message?: string | undefined;
}


/** Modèle sélectionnable pour un fournisseur (non obsolète) */
export interface AiProviderModelOption {
  id: string;
}

/** Liste filtrée des modèles disponibles d'un fournisseur (clé déjà enregistrée) */
export interface AiProviderModelsResponse {
  provider: AiProviderId;
  models: AiProviderModelOption[];
  /** `remote` = interrogé chez le fournisseur ; `fallback` = suggestions du catalogue */
  source: 'remote' | 'fallback';
  message?: string | undefined;
}

/** Fournisseur proposé à l'utilisateur dans Pattern Studio (jamais de clé ni d'URL interne) */
export interface SelectableAiProvider {
  provider: AiProviderId;
  name: string;
  model: string;
}

/** Fournisseurs sélectionnables + choix par défaut de l'atelier (`null` = repli automatique) */
export interface SelectableAiProvidersResponse {
  providers: SelectableAiProvider[];
  defaultProvider: AiProviderId | null;
}
