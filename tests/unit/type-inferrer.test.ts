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

  describe('inferFunctionReturnType', () => {
    /**
     * Helper function to get function declaration from code
     */
    function getFunctionDeclaration(code: string): t.FunctionDeclaration {
      const result = parser.parse(code);
      const program = result.ast.program;
      return program.body[0] as t.FunctionDeclaration;
    }

    /**
     * Helper function to get function expression from code
     */
    function getFunctionExpression(code: string): t.FunctionExpression {
      const result = parser.parse(code);
      const program = result.ast.program;
      const varDecl = program.body[0] as t.VariableDeclaration;
      return varDecl.declarations[0].init as t.FunctionExpression;
    }

    /**
     * Helper function to get arrow function from code
     */
    function getArrowFunction(code: string): t.ArrowFunctionExpression {
      const result = parser.parse(code);
      const program = result.ast.program;
      const varDecl = program.body[0] as t.VariableDeclaration;
      return varDecl.declarations[0].init as t.ArrowFunctionExpression;
    }

    describe('Function Declarations', () => {
      it('should infer string return type from string literal', () => {
        const func = getFunctionDeclaration('function test() { return "hello"; }');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('string');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should infer number return type from number literal', () => {
        const func = getFunctionDeclaration('function test() { return 42; }');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('number');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should infer boolean return type from boolean literal', () => {
        const func = getFunctionDeclaration('function test() { return true; }');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('boolean');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should infer void return type when no return statement', () => {
        const func = getFunctionDeclaration('function test() { console.log("hi"); }');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('void');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should infer void return type from empty return', () => {
        const func = getFunctionDeclaration('function test() { return; }');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('void');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should infer union type from multiple different return types', () => {
        const func = getFunctionDeclaration(`
          function test(x) {
            if (x) {
              return "string";
            } else {
              return 42;
            }
          }
        `);
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.value).toContain('string');
        expect(returnType.value).toContain('number');
        expect(returnType.confidence).toBeLessThan(1.0);
      });

      it('should infer consistent type from multiple same-type returns', () => {
        const func = getFunctionDeclaration(`
          function test(x) {
            if (x > 0) {
              return "positive";
            } else {
              return "negative";
            }
          }
        `);
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('string');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should handle nested return statements', () => {
        const func = getFunctionDeclaration(`
          function test(x) {
            if (x > 0) {
              if (x > 10) {
                return 100;
              }
              return 10;
            }
            return 0;
          }
        `);
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('number');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should handle return in loops', () => {
        const func = getFunctionDeclaration(`
          function test(arr) {
            for (let i = 0; i < arr.length; i++) {
              if (arr[i] === 5) {
                return true;
              }
            }
            return false;
          }
        `);
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('boolean');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should handle return in switch statements', () => {
        const func = getFunctionDeclaration(`
          function test(x) {
            switch (x) {
              case 1:
                return "one";
              case 2:
                return "two";
              default:
                return "other";
            }
          }
        `);
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('string');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should handle return in try-catch', () => {
        const func = getFunctionDeclaration(`
          function test() {
            try {
              return "success";
            } catch (e) {
              return "error";
            }
          }
        `);
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('string');
        expect(returnType.confidence).toBe(1.0);
      });
    });

    describe('Function Expressions', () => {
      it('should infer return type from function expression', () => {
        const func = getFunctionExpression('const test = function() { return 123; };');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('number');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should infer void from function expression without return', () => {
        const func = getFunctionExpression('const test = function() { console.log("hi"); };');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('void');
        expect(returnType.confidence).toBe(1.0);
      });
    });

    describe('Arrow Functions', () => {
      it('should infer return type from arrow function with expression body', () => {
        const func = getArrowFunction('const test = () => "hello";');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('string');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should infer return type from arrow function with number expression', () => {
        const func = getArrowFunction('const test = () => 42;');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('number');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should infer return type from arrow function with block body', () => {
        const func = getArrowFunction('const test = () => { return true; };');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('boolean');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should infer void from arrow function with block but no return', () => {
        const func = getArrowFunction('const test = () => { console.log("hi"); };');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('primitive');
        expect(returnType.value).toBe('void');
        expect(returnType.confidence).toBe(1.0);
      });

      it('should infer array return type from arrow function', () => {
        const func = getArrowFunction('const test = () => [1, 2, 3];');
        const returnType = inferrer.inferFunctionReturnType(func, context);
        
        expect(returnType.kind).toBe('array');
        expect(returnType.value).toBe('number[]');
        expect(returnType.confidence).toBe(1.0);
      });
    });
  });

  describe('inferParameterTypes', () => {
    /**
     * Helper function to get function declaration from code
     */
    function getFunctionDeclaration(code: string): t.FunctionDeclaration {
      const result = parser.parse(code);
      const program = result.ast.program;
      return program.body[0] as t.FunctionDeclaration;
    }

    /**
     * Helper function to get arrow function from code
     */
    function getArrowFunction(code: string): t.ArrowFunctionExpression {
      const result = parser.parse(code);
      const program = result.ast.program;
      const varDecl = program.body[0] as t.VariableDeclaration;
      return varDecl.declarations[0].init as t.ArrowFunctionExpression;
    }

    describe('Parameter Usage Analysis', () => {
      it('should infer number type from arithmetic operations', () => {
        const func = getFunctionDeclaration('function test(x) { return x * 2; }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].value).toBe('number');
        expect(paramTypes[0].confidence).toBeGreaterThan(0.7);
      });

      it('should infer number type from subtraction', () => {
        const func = getFunctionDeclaration('function test(a, b) { return a - b; }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(2);
        expect(paramTypes[0].value).toBe('number');
        expect(paramTypes[1].value).toBe('number');
      });

      it('should infer string type from string methods', () => {
        const func = getFunctionDeclaration('function test(str) { return str.toLowerCase(); }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].value).toBe('string');
        expect(paramTypes[0].confidence).toBeGreaterThan(0.6);
      });

      it('should infer array type from array methods', () => {
        const func = getFunctionDeclaration('function test(arr) { return arr.map(x => x); }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].kind).toBe('array');
        expect(paramTypes[0].confidence).toBeGreaterThan(0.6);
      });

      it('should infer Function type when parameter is called', () => {
        const func = getFunctionDeclaration('function test(callback) { return callback(); }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].value).toBe('Function');
        expect(paramTypes[0].confidence).toBeGreaterThan(0.7);
      });

      it('should return unknown for unused parameters', () => {
        const func = getFunctionDeclaration('function test(x) { return 42; }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].kind).toBe('unknown');
      });

      it('should handle multiple parameters with different types', () => {
        const func = getFunctionDeclaration(`
          function test(num, str, arr) {
            return num * 2 + str.toUpperCase() + arr.map(x => x);
          }
        `);
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(3);
        expect(paramTypes[0].value).toBe('number');
        expect(paramTypes[1].value).toBe('string');
        expect(paramTypes[2].kind).toBe('array');
      });
    });

    describe('Default Parameters', () => {
      it('should infer type from default value', () => {
        const func = getFunctionDeclaration('function test(x = 10) { return x; }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].value).toBe('number');
        expect(paramTypes[0].confidence).toBe(1.0);
      });

      it('should infer string type from default string', () => {
        const func = getFunctionDeclaration('function test(name = "default") { return name; }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].value).toBe('string');
        expect(paramTypes[0].confidence).toBe(1.0);
      });

      it('should infer boolean type from default boolean', () => {
        const func = getFunctionDeclaration('function test(flag = true) { return flag; }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].value).toBe('boolean');
        expect(paramTypes[0].confidence).toBe(1.0);
      });
    });

    describe('Rest Parameters', () => {
      it('should infer array type for rest parameters', () => {
        const func = getFunctionDeclaration('function test(...args) { return args; }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].kind).toBe('array');
      });
    });

    describe('Destructured Parameters', () => {
      it('should infer object type for object destructuring', () => {
        const func = getFunctionDeclaration('function test({ x, y }) { return x + y; }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].value).toBe('object');
      });

      it('should infer array type for array destructuring', () => {
        const func = getFunctionDeclaration('function test([a, b]) { return a + b; }');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].kind).toBe('array');
      });
    });

    describe('Arrow Functions', () => {
      it('should infer parameter types in arrow functions', () => {
        const func = getArrowFunction('const test = (x) => x * 2;');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].value).toBe('number');
      });

      it('should infer string parameter in arrow function', () => {
        const func = getArrowFunction('const test = (str) => str.toUpperCase();');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(1);
        expect(paramTypes[0].value).toBe('string');
      });

      it('should handle arrow function with no parameters', () => {
        const func = getArrowFunction('const test = () => 42;');
        const paramTypes = inferrer.inferParameterTypes(func, context);
        
        expect(paramTypes).toHaveLength(0);
      });
    });
  });

  describe('inferObjectShape', () => {
    it('should infer empty object type', () => {
      const declarator = getFirstVariableDeclarator('const x = {};');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toBe('{}');
      expect(type.confidence).toBeGreaterThan(0.7);
    });

    it('should infer simple object with string property', () => {
      const declarator = getFirstVariableDeclarator('const x = { name: "John" };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('name');
      expect(type.value).toContain('string');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer object with number property', () => {
      const declarator = getFirstVariableDeclarator('const x = { age: 30 };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('age');
      expect(type.value).toContain('number');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer object with boolean property', () => {
      const declarator = getFirstVariableDeclarator('const x = { active: true };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('active');
      expect(type.value).toContain('boolean');
      expect(type.confidence).toBe(1.0);
    });

    it('should infer object with multiple properties', () => {
      const declarator = getFirstVariableDeclarator('const x = { name: "John", age: 30, active: true };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('name');
      expect(type.value).toContain('string');
      expect(type.value).toContain('age');
      expect(type.value).toContain('number');
      expect(type.value).toContain('active');
      expect(type.value).toContain('boolean');
    });

    it('should infer nested object types', () => {
      const declarator = getFirstVariableDeclarator('const x = { user: { name: "John", age: 30 } };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('user');
      expect(type.value).toContain('name');
      expect(type.value).toContain('string');
      expect(type.value).toContain('age');
      expect(type.value).toContain('number');
    });

    it('should infer object with array property', () => {
      const declarator = getFirstVariableDeclarator('const x = { items: [1, 2, 3] };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('items');
      expect(type.value).toContain('number[]');
    });

    it('should infer object with method', () => {
      const declarator = getFirstVariableDeclarator('const x = { greet() { return "hello"; } };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('greet');
      expect(type.value).toContain('=>');
      expect(type.value).toContain('string');
    });

    it('should infer object with arrow function property', () => {
      const declarator = getFirstVariableDeclarator('const x = { greet: () => "hello" };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('greet');
    });

    it('should handle object with numeric property names', () => {
      const declarator = getFirstVariableDeclarator('const x = { 0: "zero", 1: "one" };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('0');
      expect(type.value).toContain('1');
      expect(type.value).toContain('string');
    });

    it('should handle object with string literal property names', () => {
      const declarator = getFirstVariableDeclarator('const x = { "first-name": "John" };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('first-name');
      expect(type.value).toContain('string');
    });

    it('should mark complex objects as needing interfaces', () => {
      const declarator = getFirstVariableDeclarator(`
        const x = { 
          name: "John", 
          age: 30, 
          email: "john@example.com",
          address: "123 Main St"
        };
      `);
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.needsInterface).toBe(true);
      expect(type.interfaceName).toBeDefined();
    });

    it('should mark objects with nested objects as needing interfaces', () => {
      const declarator = getFirstVariableDeclarator('const x = { user: { name: "John" } };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.needsInterface).toBe(true);
    });

    it('should mark objects with methods as needing interfaces', () => {
      const declarator = getFirstVariableDeclarator('const x = { greet() { return "hello"; } };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.needsInterface).toBe(true);
    });

    it('should handle deeply nested objects', () => {
      const declarator = getFirstVariableDeclarator(`
        const x = { 
          level1: { 
            level2: { 
              level3: { 
                value: 42 
              } 
            } 
          } 
        };
      `);
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('level1');
      expect(type.value).toContain('level2');
      expect(type.value).toContain('level3');
      expect(type.value).toContain('value');
      expect(type.value).toContain('number');
    });

    it('should handle object with mixed property types', () => {
      const declarator = getFirstVariableDeclarator(`
        const x = { 
          id: 1,
          name: "Product",
          price: 99.99,
          inStock: true,
          tags: ["new", "sale"],
          metadata: { created: "2024-01-01" }
        };
      `);
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('id');
      expect(type.value).toContain('number');
      expect(type.value).toContain('name');
      expect(type.value).toContain('string');
      expect(type.value).toContain('price');
      expect(type.value).toContain('inStock');
      expect(type.value).toContain('boolean');
      expect(type.value).toContain('tags');
      expect(type.value).toContain('string[]');
      expect(type.value).toContain('metadata');
    });

    it('should return uncertain type for objects with spread properties', () => {
      const declarator = getFirstVariableDeclarator('const x = { ...other, name: "John" };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toBe('object');
      expect(type.confidence).toBeLessThan(0.7);
    });

    it('should return uncertain type for objects with computed property names', () => {
      const declarator = getFirstVariableDeclarator('const x = { [key]: "value" };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toBe('object');
      expect(type.confidence).toBeLessThan(0.7);
    });

    it('should handle object with null property', () => {
      const declarator = getFirstVariableDeclarator('const x = { value: null };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('value');
      expect(type.value).toContain('null');
    });

    it('should handle object with undefined property', () => {
      const declarator = getFirstVariableDeclarator('const x = { value: undefined };');
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('value');
      expect(type.value).toContain('undefined');
    });

    it('should handle object with array of objects', () => {
      const declarator = getFirstVariableDeclarator(`
        const x = { 
          users: [
            { name: "John", age: 30 },
            { name: "Jane", age: 25 }
          ]
        };
      `);
      const type = inferrer.inferVariableType(declarator, context);
      
      expect(type.kind).toBe('object');
      expect(type.value).toContain('users');
      // Should detect array of objects
      expect(type.value).toMatch(/\[\]/);
    });
  });
});
