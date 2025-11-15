/**
 * Configuration manager for loading and merging user configurations
 */

import * as fs from 'fs';
import * as path from 'path';
import { Config, PartialConfig, DEFAULT_CONFIG, DEFAULT_AI_CONFIG, AIConfig } from './types';

/**
 * Configuration file names to search for
 */
const CONFIG_FILE_NAMES = ['.js2tsrc.json', 'js2ts.config.json'];

/**
 * Validation error class
 */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * ConfigManager handles loading, merging, and validating configuration
 */
export class ConfigManager {
  /**
   * Load configuration from a file or search for default config files
   * @param configPath Optional path to config file
   * @returns Loaded and validated configuration
   */
  loadConfig(configPath?: string): Config {
    let userConfig: PartialConfig = {};

    if (configPath) {
      // Load from specified path
      userConfig = this.readConfigFile(configPath);
    } else {
      // Search for config files in current directory
      userConfig = this.findAndReadConfig();
    }

    // Merge with defaults and validate
    const config = this.mergeWithDefaults(userConfig);
    this.validateConfig(config);

    return config;
  }

  /**
   * Merge user configuration with default values
   * @param userConfig Partial user configuration
   * @returns Complete configuration with defaults applied
   */
  mergeWithDefaults(userConfig: PartialConfig): Config {
    // Start with default config
    const config: Config = { ...DEFAULT_CONFIG };

    // Merge top-level properties
    if (userConfig.strict !== undefined) {
      config.strict = userConfig.strict;
    }
    if (userConfig.preferInterfaces !== undefined) {
      config.preferInterfaces = userConfig.preferInterfaces;
    }
    if (userConfig.targetTSVersion !== undefined) {
      config.targetTSVersion = userConfig.targetTSVersion;
    }
    if (userConfig.aiMode !== undefined) {
      config.aiMode = userConfig.aiMode;
    }
    if (userConfig.excludePatterns !== undefined) {
      config.excludePatterns = userConfig.excludePatterns;
    }

    // Merge AI config if provided
    if (userConfig.aiConfig) {
      config.aiConfig = this.mergeAIConfig(userConfig.aiConfig);
    } else if (config.aiMode) {
      // If AI mode is enabled but no config provided, use defaults
      config.aiConfig = { ...DEFAULT_AI_CONFIG };
    }

    return config;
  }

  /**
   * Merge AI configuration with defaults
   * @param userAIConfig Partial AI configuration
   * @returns Complete AI configuration
   */
  private mergeAIConfig(userAIConfig: Partial<AIConfig>): AIConfig {
    return {
      provider: userAIConfig.provider ?? DEFAULT_AI_CONFIG.provider,
      apiKey: userAIConfig.apiKey,
      model: userAIConfig.model ?? DEFAULT_AI_CONFIG.model,
      maxTokens: userAIConfig.maxTokens ?? DEFAULT_AI_CONFIG.maxTokens,
    };
  }

  /**
   * Find and read configuration file from current directory
   * @returns Parsed configuration or empty object if not found
   */
  private findAndReadConfig(): PartialConfig {
    const cwd = process.cwd();

    for (const fileName of CONFIG_FILE_NAMES) {
      const filePath = path.join(cwd, fileName);
      if (fs.existsSync(filePath)) {
        return this.readConfigFile(filePath);
      }
    }

    // No config file found, return empty config
    return {};
  }

  /**
   * Read and parse configuration file
   * @param filePath Path to configuration file
   * @returns Parsed configuration
   */
  private readConfigFile(filePath: string): PartialConfig {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const config = JSON.parse(content);

      // Handle JSON schema files that have a "default" property
      if (config.default && typeof config.default === 'object') {
        return config.default as PartialConfig;
      }

      return config as PartialConfig;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ConfigValidationError(`Configuration file not found: ${filePath}`);
      }
      if (error instanceof SyntaxError) {
        throw new ConfigValidationError(`Invalid JSON in configuration file: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Validate configuration values
   * @param config Configuration to validate
   * @throws ConfigValidationError if validation fails
   */
  private validateConfig(config: Config): void {
    // Validate strict
    if (typeof config.strict !== 'boolean') {
      throw new ConfigValidationError('Config property "strict" must be a boolean');
    }

    // Validate preferInterfaces
    if (typeof config.preferInterfaces !== 'boolean') {
      throw new ConfigValidationError('Config property "preferInterfaces" must be a boolean');
    }

    // Validate targetTSVersion
    if (typeof config.targetTSVersion !== 'string') {
      throw new ConfigValidationError('Config property "targetTSVersion" must be a string');
    }
    if (!/^\d+\.\d+$/.test(config.targetTSVersion)) {
      throw new ConfigValidationError(
        'Config property "targetTSVersion" must be in format "X.Y" (e.g., "5.0")'
      );
    }

    // Validate aiMode
    if (typeof config.aiMode !== 'boolean') {
      throw new ConfigValidationError('Config property "aiMode" must be a boolean');
    }

    // Validate aiConfig if aiMode is enabled
    if (config.aiMode) {
      if (!config.aiConfig) {
        throw new ConfigValidationError('Config property "aiConfig" is required when aiMode is true');
      }
      this.validateAIConfig(config.aiConfig);
    }

    // Validate excludePatterns
    if (!Array.isArray(config.excludePatterns)) {
      throw new ConfigValidationError('Config property "excludePatterns" must be an array');
    }
    if (!config.excludePatterns.every((pattern) => typeof pattern === 'string')) {
      throw new ConfigValidationError('All items in "excludePatterns" must be strings');
    }
  }

  /**
   * Validate AI configuration
   * @param aiConfig AI configuration to validate
   * @throws ConfigValidationError if validation fails
   */
  private validateAIConfig(aiConfig: AIConfig): void {
    const validProviders = ['openai', 'anthropic', 'local'];
    if (!validProviders.includes(aiConfig.provider)) {
      throw new ConfigValidationError(
        `Config property "aiConfig.provider" must be one of: ${validProviders.join(', ')}`
      );
    }

    if (aiConfig.apiKey !== undefined && typeof aiConfig.apiKey !== 'string') {
      throw new ConfigValidationError('Config property "aiConfig.apiKey" must be a string');
    }

    if (aiConfig.model !== undefined && typeof aiConfig.model !== 'string') {
      throw new ConfigValidationError('Config property "aiConfig.model" must be a string');
    }

    if (aiConfig.maxTokens !== undefined) {
      if (typeof aiConfig.maxTokens !== 'number') {
        throw new ConfigValidationError('Config property "aiConfig.maxTokens" must be a number');
      }
      if (aiConfig.maxTokens <= 0) {
        throw new ConfigValidationError('Config property "aiConfig.maxTokens" must be greater than 0');
      }
    }
  }
}
