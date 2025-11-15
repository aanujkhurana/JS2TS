import { describe, it, expect } from 'vitest';
import { JSParser, ParseError } from '../../src/parser/parser';

describe('JSParser', () => {
  let parser: JSParser;

  beforeEach(() => {
    parser = new JSParser();
  });

  describe('parse', () => {
    it('should parse simple variable declaration', () => {
      const code = 'const x = 5;';
      const result = parser.parse(code);
      
      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('File');
      expect(result.ast.program.body).toHaveLength(1);
    });

    it('should parse function declarations', () => {
      const code = 'function add(a, b) { return a + b; }';
      const result = parser.parse(code);
      
      expect(result.ast.program.body).toHaveLength(1);
      expect(result.ast.program.body[0].type).toBe('FunctionDeclaration');
    });

    it('should parse arrow functions', () => {
      const code = 'const multiply = (x, y) => x * y;';
      const result = parser.parse(code);
      
      expect(result.ast.program.body).toHaveLength(1);
    });

    it('should parse class declarations', () => {
      const code = `
        class Person {
          constructor(name) {
            this.name = name;
          }
          greet() {
            return 'Hello';
          }
        }
      `;
      const result = parser.parse(code);
      
      expect(result.ast.program.body).toHaveLength(1);
      expect(result.ast.program.body[0].type).toBe('ClassDeclaration');
    });

    it('should parse object literals', () => {
      const code = 'const obj = { name: "John", age: 30 };';
      const result = parser.parse(code);
      
      expect(result.ast.program.body).toHaveLength(1);
    });

    it('should parse array literals', () => {
      const code = 'const arr = [1, 2, 3, "four"];';
      const result = parser.parse(code);
      
      expect(result.ast.program.body).toHaveLength(1);
    });

    it('should parse async/await syntax', () => {
      const code = `
        async function fetchData() {
          const data = await fetch('/api');
          return data;
        }
      `;
      const result = parser.parse(code);
      
      expect(result.ast.program.body).toHaveLength(1);
    });

    it('should parse destructuring', () => {
      const code = 'const { name, age } = person;';
      const result = parser.parse(code);
      
      expect(result.ast.program.body).toHaveLength(1);
    });

    it('should parse spread operator', () => {
      const code = 'const newArr = [...oldArr, 4, 5];';
      const result = parser.parse(code);
      
      expect(result.ast.program.body).toHaveLength(1);
    });

    it('should parse optional chaining', () => {
      const code = 'const value = obj?.property?.nested;';
      const result = parser.parse(code);
      
      expect(result.ast.program.body).toHaveLength(1);
    });

    it('should parse nullish coalescing', () => {
      const code = 'const value = input ?? defaultValue;';
      const result = parser.parse(code);
      
      expect(result.ast.program.body).toHaveLength(1);
    });

    it('should preserve comments', () => {
      const code = `
        // This is a comment
        const x = 5;
        /* Block comment */
      `;
      const result = parser.parse(code);
      
      expect(result.comments).toBeDefined();
      expect(result.comments.length).toBeGreaterThan(0);
    });

    it('should include tokens', () => {
      const code = 'const x = 5;';
      const result = parser.parse(code);
      
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should throw ParseError for invalid syntax', () => {
      const code = 'const x = ;';
      
      expect(() => parser.parse(code)).toThrow(ParseError);
    });

    it('should include line and column in ParseError', () => {
      const code = 'const x = ;';
      
      try {
        parser.parse(code);
        expect.fail('Should have thrown ParseError');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).line).toBeDefined();
        expect((error as ParseError).column).toBeDefined();
      }
    });
  });

  describe('validate', () => {
    it('should return valid for correct JavaScript', () => {
      const code = 'const x = 5;';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for syntax errors', () => {
      const code = 'const x = ;';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBeDefined();
    });

    it('should include error location for invalid code', () => {
      const code = 'const x = ;';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error?.line).toBeGreaterThan(0);
      expect(result.error?.column).toBeGreaterThanOrEqual(0);
    });

    it('should validate complex valid code', () => {
      const code = `
        class MyClass {
          async method() {
            const data = await fetch('/api');
            return data?.result ?? null;
          }
        }
      `;
      const result = parser.validate(code);
      
      expect(result.valid).toBe(true);
    });

    it('should detect missing closing brace', () => {
      const code = 'function test() { const x = 5;';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.line).toBeGreaterThan(0);
    });

    it('should detect missing closing parenthesis', () => {
      const code = 'const result = add(1, 2;';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should detect invalid object syntax', () => {
      const code = 'const obj = { name: "John", age: };';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error?.message).toBeDefined();
    });

    it('should detect unclosed string literal', () => {
      const code = 'const str = "unclosed string;';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should detect invalid arrow function syntax', () => {
      const code = 'const fn = => x + 1;';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should detect invalid destructuring', () => {
      const code = 'const { name, age } =;';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should detect multiple syntax errors and report first one', () => {
      const code = 'const x = ; const y = ;';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.line).toBe(1);
    });

    it('should provide accurate line numbers for multiline errors', () => {
      const code = `
        const x = 5;
        const y = 10;
        const z = ;
      `;
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error?.line).toBe(4);
    });

    it('should detect invalid class syntax', () => {
      const code = 'class MyClass { constructor( { }';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate empty code', () => {
      const code = '';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(true);
    });

    it('should validate code with only comments', () => {
      const code = '// Just a comment\n/* Another comment */';
      const result = parser.validate(code);
      
      expect(result.valid).toBe(true);
    });
  });
});
