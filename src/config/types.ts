/**
 * Configuration types for js-to-ts-converter
 */

/**
 * AI provider options
 */
export type AIProvider = 'openai' | 'anthropic' | 'local';

/**
 * AI configuration for enhanced type inference
 */
export interface AIConfig {
  /** AI provider to use */
  provider: AIProvider;
  /** API key for the AI provider (optional for local) */
  apiKey?: string;
  /** Model name to use */
  model?: string;
  /** Maximum tokens for AI responses */
  maxTokens?: number;
}

/**
 * Main configuration interface for the converter
 */
export interface Config {
  /** Enable strict mode (avoid 'any' types) */
  strict: boolean;
  /** Prefer interfaces over type aliases */
  preferInterfaces: boolean;
  /** Target TypeScript version */
  targetTSVersion: string;
  /** Enable AI-powered type inference */
  aiMode: boolean;
  /** AI configuration (required when aiMode is true) */
  aiConfig?: AIConfig;
  /** Patterns to exclude from conversion */
  excludePatterns: string[];
}

/**
 * Partial configuration that can be provided by users
 */
export type PartialConfig = Partial<Config>;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Config = {
  strict: true,
  preferInterfaces: true,
  targetTSVersion: '5.0',
  aiMode: false,
  aiConfig: undefined,
  excludePatterns: ['**/*.test.js', '**/*.spec.js', '**/node_modules/**'],
};

/**
 * Default AI configuration values
 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  model: 'gpt-4',
  maxTokens: 1000,
};
