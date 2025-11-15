/**
 * Unit tests for ConfigManager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager, ConfigValidationError } from '../../src/config/config-manager';
import { DEFAULT_CONFIG, DEFAULT_AI_CONFIG } from '../../src/config/types';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let tempDir: string;

  beforeEach(() => {
    configManager = new ConfigManager();
    tempDir = path.join(__dirname, '../fixtures/temp-config');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });

  describe('mergeWithDefaults', () => {
    it('should return default config when given empty object', () => {
      const result = configManager.mergeWithDefaults({});
      expect(result).toEqual(DEFAULT_CONFIG);
    });

    it('should merge user config with defaults', () => {
      const userConfig = {
        strict: false,
        preferInterfaces: false,
      };
      const result = configManager.mergeWithDefaults(userConfig);
      
      expect(result.strict).toBe(false);
      expect(result.preferInterfaces).toBe(false);
      expect(result.targetTSVersion).toBe(DEFAULT_CONFIG.targetTSVersion);
      expect(result.aiMode).toBe(DEFAULT_CONFIG.aiMode);
    });

    it('should merge AI config when provided', () => {
      const userConfig = {
        aiMode: true,
        aiConfig: {
          provider: 'anthropic' as const,
          apiKey: 'test-key',
        },
      };
      const result = configManager.mergeWithDefaults(userConfig);
      
      expect(result.aiMode).toBe(true);
      expect(result.aiConfig?.provider).toBe('anthropic');
      expect(result.aiConfig?.apiKey).toBe('test-key');
      expect(result.aiConfig?.model).toBe(DEFAULT_AI_CONFIG.model);
      expect(result.aiConfig?.maxTokens).toBe(DEFAULT_AI_CONFIG.maxTokens);
    });

    it('should use default AI config when aiMode is true but no aiConfig provided', () => {
      const userConfig = {
        aiMode: true,
      };
      const result = configManager.mergeWithDefaults(userConfig);
      
      expect(result.aiMode).toBe(true);
      expect(result.aiConfig).toEqual(DEFAULT_AI_CONFIG);
    });

    it('should merge excludePatterns', () => {
      const userConfig = {
        excludePatterns: ['**/*.spec.ts', '**/dist/**'],
      };
      const result = configManager.mergeWithDefaults(userConfig);
      
      expect(result.excludePatterns).toEqual(['**/*.spec.ts', '**/dist/**']);
    });
  });

  describe('loadConfig', () => {
    it('should load config from specified file path', () => {
      const configPath = path.join(tempDir, 'test-config.json');
      const testConfig = {
        strict: false,
        targetTSVersion: '4.5',
      };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));

      const result = configManager.loadConfig(configPath);
      
      expect(result.strict).toBe(false);
      expect(result.targetTSVersion).toBe('4.5');
    });

    it('should throw error when specified file does not exist', () => {
      const configPath = path.join(tempDir, 'nonexistent.json');
      
      expect(() => configManager.loadConfig(configPath)).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig(configPath)).toThrow('Configuration file not found');
    });

    it('should throw error when config file has invalid JSON', () => {
      const configPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(configPath, '{ invalid json }');
      
      expect(() => configManager.loadConfig(configPath)).toThrow(ConfigValidationError);
      expect(() => configManager.loadConfig(configPath)).toThrow('Invalid JSON');
    });

    it('should handle JSON schema files with default property', () => {
      const configPath = path.join(tempDir, 'schema-config.json');
      const schemaConfig = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        default: {
          strict: false,
          preferInterfaces: false,
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(schemaConfig));

      const result = configManager.loadConfig(configPath);
      
      expect(result.strict).toBe(false);
      expect(result.preferInterfaces).toBe(false);
    });
  });

  describe('validation', () => {
    it('should throw error for invalid targetTSVersion format', () => {
      const configPath = path.join(tempDir, 'invalid-version.json');
      const testConfig = { targetTSVersion: 'invalid' };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));
      
      expect(() => configManager.loadConfig(configPath)).toThrow('Config property "targetTSVersion" must be in format "X.Y"');
    });

    it('should accept valid targetTSVersion format', () => {
      const configPath = path.join(tempDir, 'valid-version.json');
      const testConfig = { targetTSVersion: '5.2' };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));
      
      expect(() => configManager.loadConfig(configPath)).not.toThrow();
    });

    it('should use default AI config when aiMode is true but aiConfig is missing', () => {
      const configPath = path.join(tempDir, 'missing-ai-config.json');
      const testConfig = {
        aiMode: true,
      };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));
      
      const result = configManager.loadConfig(configPath);
      expect(result.aiMode).toBe(true);
      expect(result.aiConfig).toEqual(DEFAULT_AI_CONFIG);
    });

    it('should throw error for invalid AI provider', () => {
      const configPath = path.join(tempDir, 'invalid-provider.json');
      const testConfig = {
        aiMode: true,
        aiConfig: {
          provider: 'invalid',
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));
      
      expect(() => configManager.loadConfig(configPath)).toThrow('Config property "aiConfig.provider" must be one of');
    });

    it('should throw error for invalid maxTokens', () => {
      const configPath = path.join(tempDir, 'invalid-tokens.json');
      const testConfig = {
        aiMode: true,
        aiConfig: {
          provider: 'openai',
          maxTokens: -1,
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));
      
      expect(() => configManager.loadConfig(configPath)).toThrow('Config property "aiConfig.maxTokens" must be greater than 0');
    });

    it('should throw error for invalid excludePatterns type', () => {
      const configPath = path.join(tempDir, 'invalid-patterns.json');
      const testConfig = { excludePatterns: 'not-an-array' };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));
      
      expect(() => configManager.loadConfig(configPath)).toThrow('Config property "excludePatterns" must be an array');
    });

    it('should throw error for non-string items in excludePatterns', () => {
      const configPath = path.join(tempDir, 'invalid-pattern-items.json');
      const testConfig = { excludePatterns: ['valid', 123, 'also-valid'] };
      fs.writeFileSync(configPath, JSON.stringify(testConfig));
      
      expect(() => configManager.loadConfig(configPath)).toThrow('All items in "excludePatterns" must be strings');
    });
  });
});
