/**
 * Unit tests for TypeInferrer class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TypeInferrer } from '../../src/inference/type-inferrer';
import { createTypeContext, TypeContext } from '../../src/inference/types';
import { JSParser } from '../../src/parser/parser';
import * as t from '@babel/types';

describe('TypeInferrer', () => {
  let inferrer: TypeInferrer;
  let parser: JSParser;
  let context: TypeContext;

  beforeEach(() => {
    inferrer = new TypeInferrer();
    parser = new JSParser();
    context = createTypeContext();
  });

  /**
   * Helper function to get the first variable declarator from code
   */
  function getFirstVariableDeclarator(code: string): t.VariableDeclarator {
    const result = parser.parse(code);
    const program = result.ast.program;
    const varDecl = program.body[0] as t.VariableDeclaration;
    return varDecl.declarations[0];
  }

  describe('inferVariableType - Primitive Literals', () => {
    it('should infer string type from string literal', () => {
      const declarator = getFirstVariableDeclarator('const x = "hello";');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('string');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer string type from single-quoted string', () => {
      const declarator = getFirstVariableDeclarator("const x = 'world';");
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('string');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer string type from template literal', () => {
      const declarator = getFirstVariableDeclarator('const x = `hello`;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('string');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number type from integer literal', () => {
      const declarator = getFirstVariableDeclarator('const x = 42;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number type from float literal', () => {
      const declarator = getFirstVariableDeclarator('const x = 3.14;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number type from negative number', () => {
      const declarator = getFirstVariableDeclarator('const x = -100;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer boolean type from true literal', () => {
      const declarator = getFirstVariableDeclarator('const x = true;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('boolean');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer boolean type from false literal', () => {
      const declarator = getFirstVariableDeclarator('const x = false;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('boolean');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer null type from null literal', () => {
      const declarator = getFirstVariableDeclarator('const x = null;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('null');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer bigint type from bigint literal', () => {
      const declarator = getFirstVariableDeclarator('const x = 123n;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('bigint');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer RegExp type from regex literal', () => {
      const declarator = getFirstVariableDeclarator('const x = /test/g;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('RegExp');
      expect(type.confidence).toBe(1.0);
    });
  });

  describe('inferVariableType - Arrays', () => {
    it('should infer string array from string literals', () => {
      const declarator = getFirstVariableDeclarator('const x = ["a", "b", "c"];');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('array');
      expect(type.value).toBe('string[]');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number array from number literals', () => {
      const declarator = getFirstVariableDeclarator('const x = [1, 2, 3];');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('array');
      expect(type.value).toBe('number[]');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer boolean array from boolean literals', () => {
      const declarator = getFirstVariableDeclarator('const x = [true, false, true];');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('array');
      expect(type.value).toBe('boolean[]');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer union array from mixed types', () => {
      const declarator = getFirstVariableDeclarator('const x = [1, "two", 3];');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('array');
      expect(type.value).toContain('string');
      expect(type.value).toContain('number');
      expect(type.confidence).toBeLessThan(1.0);
    });

    it('should infer unknown array from empty array', () => {
      const declarator = getFirstVariableDeclarator('const x = [];');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('array');
      expect(type.value).toBe('unknown[]');
      expect(type.confidence).toBe(0.5);
    });

    it('should infer nested array type', () => {
      const declarator = getFirstVariableDeclarator('const x = [[1, 2], [3, 4]];');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('array');
      expect(type.value).toBe('number[][]');
      expect(type.confidence).toBe(1.0);
    });
  });

  describe('inferVariableType - Unary Expressions', () => {
    it('should infer boolean from logical NOT', () => {
      const declarator = getFirstVariableDeclarator('const x = !true;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('boolean');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from unary plus', () => {
      const declarator = getFirstVariableDeclarator('const x = +42;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from unary minus', () => {
      const declarator = getFirstVariableDeclarator('const x = -42;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer string from typeof operator', () => {
      const declarator = getFirstVariableDeclarator('const x = typeof 42;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('string');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer undefined from void operator', () => {
      const declarator = getFirstVariableDeclarator('const x = void 0;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('undefined');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer boolean from delete operator', () => {
      const declarator = getFirstVariableDeclarator('const x = delete obj.prop;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('boolean');
      expect(type.confidence).toBe(1.0);
    });
  });

  describe('inferVariableType - Binary Expressions', () => {
    it('should infer boolean from equality comparison', () => {
      const declarator = getFirstVariableDeclarator('const x = 1 === 2;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('boolean');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer boolean from less than comparison', () => {
      const declarator = getFirstVariableDeclarator('const x = 1 < 2;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('boolean');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from arithmetic subtraction', () => {
      const declarator = getFirstVariableDeclarator('const x = 5 - 3;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from multiplication', () => {
      const declarator = getFirstVariableDeclarator('const x = 5 * 3;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from division', () => {
      const declarator = getFirstVariableDeclarator('const x = 10 / 2;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer string from string concatenation', () => {
      const declarator = getFirstVariableDeclarator('const x = "hello" + "world";');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('string');
      expect(type.confidence).toBeGreaterThan(0.9);
    });

    it('should infer number from number addition', () => {
      const declarator = getFirstVariableDeclarator('const x = 1 + 2;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });
  });

  describe('inferVariableType - Logical Expressions', () => {
    it('should infer union type from logical OR', () => {
      const declarator = getFirstVariableDeclarator('const x = "hello" || 42;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.value).toContain('string');
      expect(type.value).toContain('number');
    });

    it('should infer union type from logical AND', () => {
      const declarator = getFirstVariableDeclarator('const x = true && "value";');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.value).toContain('boolean');
      expect(type.value).toContain('string');
    });

    it('should infer type from nullish coalescing', () => {
      const declarator = getFirstVariableDeclarator('const x = null ?? "default";');
      const type = inferrer.inferVariableType(declarator, context);
      
      // Should prefer the fallback type
      expect(type.value).toContain('string');
    });
  });

  describe('inferVariableType - Conditional Expressions', () => {
    it('should infer union type from ternary with different types', () => {
      const declarator = getFirstVariableDeclarator('const x = true ? "yes" : 42;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.value).toContain('string');
      expect(type.value).toContain('number');
    });

    it('should infer single type from ternary with same types', () => {
      const declarator = getFirstVariableDeclarator('const x = true ? "yes" : "no";');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('string');
    });
  });

  describe('inferVariableType - Built-in Functions', () => {
    it('should infer string from String constructor', () => {
      const declarator = getFirstVariableDeclarator('const x = String(42);');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('string');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from Number constructor', () => {
      const declarator = getFirstVariableDeclarator('const x = Number("42");');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from parseInt', () => {
      const declarator = getFirstVariableDeclarator('const x = parseInt("42");');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer boolean from Boolean constructor', () => {
      const declarator = getFirstVariableDeclarator('const x = Boolean(1);');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('boolean');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer Date from Date constructor', () => {
      const declarator = getFirstVariableDeclarator('const x = Date();');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('Date');
      expect(type.confidence).toBe(1.0);
    });
  });

  describe('inferVariableType - String Methods', () => {
    it('should infer string from string.toLowerCase()', () => {
      const declarator = getFirstVariableDeclarator('const x = "HELLO".toLowerCase();');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('string');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer string array from string.split()', () => {
      const declarator = getFirstVariableDeclarator('const x = "a,b,c".split(",");');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('array');
      expect(type.value).toBe('string[]');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from string.indexOf()', () => {
      const declarator = getFirstVariableDeclarator('const x = "hello".indexOf("e");');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer boolean from string.includes()', () => {
      const declarator = getFirstVariableDeclarator('const x = "hello".includes("e");');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('boolean');
      expect(type.confidence).toBe(1.0);
    });
  });

  describe('inferVariableType - Array Methods', () => {
    it('should infer string array from array.map()', () => {
      const declarator = getFirstVariableDeclarator('const x = ["a", "b"].map(s => s);');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('array');
      expect(type.value).toBe('string[]');
      expect(type.confidence).toBeGreaterThan(0.8);
    });

    it('should infer string from array.join()', () => {
      const declarator = getFirstVariableDeclarator('const x = [1, 2, 3].join(",");');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('string');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer boolean from array.includes()', () => {
      const declarator = getFirstVariableDeclarator('const x = [1, 2, 3].includes(2);');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('boolean');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from array.indexOf()', () => {
      const declarator = getFirstVariableDeclarator('const x = [1, 2, 3].indexOf(2);');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });
  });

  describe('inferVariableType - Identifiers', () => {
    it('should infer undefined from undefined identifier', () => {
      const declarator = getFirstVariableDeclarator('const x = undefined;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('undefined');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from NaN identifier', () => {
      const declarator = getFirstVariableDeclarator('const x = NaN;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer number from Infinity identifier', () => {
      const declarator = getFirstVariableDeclarator('const x = Infinity;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(1.0);
    });
  });

  describe('inferVariableType - No Initializer', () => {
    it('should return unknown type for variable without initializer', () => {
      const declarator = getFirstVariableDeclarator('let x;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('unknown');
      expect(type.value).toBe('unknown');
      expect(type.confidence).toBe(0.0);
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence for literal types', () => {
      const declarator = getFirstVariableDeclarator('const x = "test";');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.confidence).toBe(1.0);
    });

    it('should have lower confidence for mixed array types', () => {
      const declarator = getFirstVariableDeclarator('const x = [1, "two"];');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.confidence).toBeLessThan(1.0);
    });

    it('should have low confidence for empty arrays', () => {
      const declarator = getFirstVariableDeclarator('const x = [];');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should have zero confidence for unknown types', () => {
      const declarator = getFirstVariableDeclarator('let x;');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.confidence).toBe(0.0);
    });
  });
});
