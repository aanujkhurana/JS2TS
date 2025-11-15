import { parse as babelParse, ParserOptions } from '@babel/parser';
import * as t from '@babel/types';

export interface ParseResult {
  ast: t.File;
  comments: t.Comment[];
  tokens: any[];
}

export interface ValidationResult {
  valid: boolean;
  error?: {
    message: string;
    line: number;
    column: number;
  };
}

export class ParseError extends Error {
  constructor(
    message: string,
    public line?: number,
    public column?: number
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export class JSParser {
  private parserOptions: ParserOptions;

  constructor() {
    // Configure parser for modern JavaScript features
    this.parserOptions = {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'typescript',
        'asyncGenerators',
        'bigInt',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'decorators-legacy',
        'doExpressions',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'functionBind',
        'functionSent',
        'importMeta',
        'logicalAssignment',
        'nullishCoalescingOperator',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining',
        'partialApplication',
        'throwExpressions',
        'topLevelAwait'
      ],
      tokens: true,
      ranges: true
    };
  }

  /**
   * Parse JavaScript code into an AST
   * @param code - JavaScript source code to parse
   * @returns ParseResult containing AST, comments, and tokens
   * @throws ParseError if the code contains syntax errors
   */
  parse(code: string): ParseResult {
    try {
      const ast = babelParse(code, this.parserOptions);
      
      return {
        ast,
        comments: ast.comments || [],
        tokens: ast.tokens || []
      };
    } catch (error: any) {
      // Extract error details from Babel parser error
      const line = error.loc?.line;
      const column = error.loc?.column;
      const message = this.formatErrorMessage(error.message);
      
      throw new ParseError(message, line, column);
    }
  }

  /**
   * Validate JavaScript code without returning the full AST
   * @param code - JavaScript source code to validate
   * @returns ValidationResult indicating if code is valid
   */
  validate(code: string): ValidationResult {
    try {
      babelParse(code, this.parserOptions);
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: {
          message: this.formatErrorMessage(error.message),
          line: error.loc?.line || 0,
          column: error.loc?.column || 0
        }
      };
    }
  }

  /**
   * Format error message to be more user-friendly
   * @param message - Raw error message from Babel
   * @returns Formatted error message
   */
  private formatErrorMessage(message: string): string {
    // Remove internal Babel error codes and clean up message
    return message
      .replace(/\(\d+:\d+\)$/, '')
      .trim();
  }
}
