/**
 * Unit tests for type inference data structures and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  createPrimitiveType,
  createArrayType,
  createObjectType,
  createFunctionType,
  createUnionType,
  createUnknownType,
  areTypesEqual,
  mergeTypes,
  createPropertyDefinition,
  createInterfaceDefinition,
  hashInterfaceDefinition,
  areInterfacesEqual,
  createTypeContext,
  type InferredType,
  type PropertyDefinition
} from '../../src/inference/types';

describe('Type Creation Functions', () => {
  describe('createPrimitiveType', () => {
    it('should create a primitive type with default confidence', () => {
      const type = createPrimitiveType('string');
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('string');
      expect(type.confidence).toBe(1.0);
    });

    it('should create a primitive type with custom confidence', () => {
      const type = createPrimitiveType('number', 0.8);
      expect(type.kind).toBe('primitive');
      expect(type.value).toBe('number');
      expect(type.confidence).toBe(0.8);
    });
  });

  describe('createArrayType', () => {
    it('should create an array type', () => {
      const type = createArrayType('string');
      expect(type.kind).toBe('array');
      expect(type.value).toBe('string[]');
      expect(type.confidence).toBe(1.0);
    });

    it('should create an array type with custom confidence', () => {
      const type = createArrayType('number', 0.9);
      expect(type.kind).toBe('array');
      expect(type.value).toBe('number[]');
      expect(type.confidence).toBe(0.9);
    });
  });

  describe('createObjectType', () => {
    it('should create an object type without interface', () => {
      const type = createObjectType('{ x: number; y: number }');
      expect(type.kind).toBe('object');
      expect(type.value).toBe('{ x: number; y: number }');
      expect(type.needsInterface).toBe(false);
      expect(type.interfaceName).toBeUndefined();
    });

    it('should create an object type with interface', () => {
      const type = createObjectType('Point', 1.0, true, 'Point');
      expect(type.kind).toBe('object');
      expect(type.value).toBe('Point');
      expect(type.needsInterface).toBe(true);
      expect(type.interfaceName).toBe('Point');
    });
  });

  describe('createFunctionType', () => {
    it('should create a function type', () => {
      const type = createFunctionType('(x: number) => number');
      expect(type.kind).toBe('function');
      expect(type.value).toBe('(x: number) => number');
    });
  });

  describe('createUnionType', () => {
    it('should create a union type from multiple types', () => {
      const type = createUnionType(['string', 'number']);
      expect(type.kind).toBe('union');
      expect(type.value).toBe('string | number');
    });

    it('should create a union type with custom confidence', () => {
      const type = createUnionType(['string', 'null'], 0.7);
      expect(type.kind).toBe('union');
      expect(type.value).toBe('string | null');
      expect(type.confidence).toBe(0.7);
    });
  });

  describe('createUnknownType', () => {
    it('should create an unknown type', () => {
      const type = createUnknownType();
      expect(type.kind).toBe('unknown');
      expect(type.value).toBe('unknown');
      expect(type.confidence).toBe(0.0);
    });
  });
});

describe('Type Comparison and Merging', () => {
  describe('areTypesEqual', () => {
    it('should return true for identical primitive types', () => {
      const type1 = createPrimitiveType('string');
      const type2 = createPrimitiveType('string');
      expect(areTypesEqual(type1, type2)).toBe(true);
    });

    it('should return false for different primitive types', () => {
      const type1 = createPrimitiveType('string');
      const type2 = createPrimitiveType('number');
      expect(areTypesEqual(type1, type2)).toBe(false);
    });

    it('should return false for same value but different kinds', () => {
      const type1 = createPrimitiveType('string');
      const type2 = createArrayType('string');
      expect(areTypesEqual(type1, type2)).toBe(false);
    });

    it('should return true for identical union types', () => {
      const type1 = createUnionType(['string', 'number']);
      const type2 = createUnionType(['string', 'number']);
      expect(areTypesEqual(type1, type2)).toBe(true);
    });
  });

  describe('mergeTypes', () => {
    it('should prefer higher confidence when types are equal', () => {
      const type1 = createPrimitiveType('string', 0.8);
      const type2 = createPrimitiveType('string', 0.9);
      const merged = mergeTypes(type1, type2);
      expect(merged.value).toBe('string');
      expect(merged.confidence).toBe(0.9);
    });

    it('should prefer non-unknown type when one is unknown', () => {
      const type1 = createUnknownType();
      const type2 = createPrimitiveType('string');
      const merged = mergeTypes(type1, type2);
      expect(merged.value).toBe('string');
      expect(merged.kind).toBe('primitive');
    });

    it('should create union type when types are different', () => {
      const type1 = createPrimitiveType('string', 0.8);
      const type2 = createPrimitiveType('number', 0.9);
      const merged = mergeTypes(type1, type2);
      expect(merged.kind).toBe('union');
      expect(merged.value).toContain('string');
      expect(merged.value).toContain('number');
      expect(merged.confidence).toBeCloseTo(0.85, 2);
    });

    it('should merge existing union types', () => {
      const type1 = createUnionType(['string', 'number']);
      const type2 = createPrimitiveType('boolean');
      const merged = mergeTypes(type1, type2);
      expect(merged.kind).toBe('union');
      expect(merged.value).toContain('string');
      expect(merged.value).toContain('number');
      expect(merged.value).toContain('boolean');
    });

    it('should deduplicate types in union', () => {
      const type1 = createUnionType(['string', 'number']);
      const type2 = createPrimitiveType('string');
      const merged = mergeTypes(type1, type2);
      expect(merged.kind).toBe('union');
      const types = merged.value.split(' | ');
      expect(types.filter(t => t === 'string').length).toBe(1);
    });
  });
});

describe('Property and Interface Definitions', () => {
  describe('createPropertyDefinition', () => {
    it('should create a basic property definition', () => {
      const prop = createPropertyDefinition('name', 'string');
      expect(prop.name).toBe('name');
      expect(prop.type).toBe('string');
      expect(prop.optional).toBe(false);
      expect(prop.readonly).toBe(false);
    });

    it('should create an optional property', () => {
      const prop = createPropertyDefinition('age', 'number', true);
      expect(prop.name).toBe('age');
      expect(prop.type).toBe('number');
      expect(prop.optional).toBe(true);
      expect(prop.readonly).toBe(false);
    });

    it('should create a readonly property', () => {
      const prop = createPropertyDefinition('id', 'string', false, true);
      expect(prop.name).toBe('id');
      expect(prop.type).toBe('string');
      expect(prop.optional).toBe(false);
      expect(prop.readonly).toBe(true);
    });
  });

  describe('hashInterfaceDefinition', () => {
    it('should generate consistent hash for same properties', () => {
      const props1: PropertyDefinition[] = [
        createPropertyDefinition('name', 'string'),
        createPropertyDefinition('age', 'number')
      ];
      const props2: PropertyDefinition[] = [
        createPropertyDefinition('name', 'string'),
        createPropertyDefinition('age', 'number')
      ];
      expect(hashInterfaceDefinition(props1)).toBe(hashInterfaceDefinition(props2));
    });

    it('should generate same hash regardless of property order', () => {
      const props1: PropertyDefinition[] = [
        createPropertyDefinition('name', 'string'),
        createPropertyDefinition('age', 'number')
      ];
      const props2: PropertyDefinition[] = [
        createPropertyDefinition('age', 'number'),
        createPropertyDefinition('name', 'string')
      ];
      expect(hashInterfaceDefinition(props1)).toBe(hashInterfaceDefinition(props2));
    });

    it('should generate different hash for different properties', () => {
      const props1: PropertyDefinition[] = [
        createPropertyDefinition('name', 'string')
      ];
      const props2: PropertyDefinition[] = [
        createPropertyDefinition('name', 'number')
      ];
      expect(hashInterfaceDefinition(props1)).not.toBe(hashInterfaceDefinition(props2));
    });

    it('should consider optional flag in hash', () => {
      const props1: PropertyDefinition[] = [
        createPropertyDefinition('name', 'string', false)
      ];
      const props2: PropertyDefinition[] = [
        createPropertyDefinition('name', 'string', true)
      ];
      expect(hashInterfaceDefinition(props1)).not.toBe(hashInterfaceDefinition(props2));
    });
  });

  describe('createInterfaceDefinition', () => {
    it('should create an interface definition with hash', () => {
      const props: PropertyDefinition[] = [
        createPropertyDefinition('x', 'number'),
        createPropertyDefinition('y', 'number')
      ];
      const iface = createInterfaceDefinition('Point', props);
      expect(iface.name).toBe('Point');
      expect(iface.properties).toEqual(props);
      expect(iface.usageCount).toBe(1);
      expect(iface.hash).toBeDefined();
      expect(typeof iface.hash).toBe('string');
    });
  });

  describe('areInterfacesEqual', () => {
    it('should return true for interfaces with same shape', () => {
      const props: PropertyDefinition[] = [
        createPropertyDefinition('x', 'number'),
        createPropertyDefinition('y', 'number')
      ];
      const iface1 = createInterfaceDefinition('Point', props);
      const iface2 = createInterfaceDefinition('Coordinate', props);
      expect(areInterfacesEqual(iface1, iface2)).toBe(true);
    });

    it('should return false for interfaces with different shapes', () => {
      const props1: PropertyDefinition[] = [
        createPropertyDefinition('x', 'number')
      ];
      const props2: PropertyDefinition[] = [
        createPropertyDefinition('x', 'string')
      ];
      const iface1 = createInterfaceDefinition('Point', props1);
      const iface2 = createInterfaceDefinition('Point', props2);
      expect(areInterfacesEqual(iface1, iface2)).toBe(false);
    });
  });
});

describe('Type Context', () => {
  describe('createTypeContext', () => {
    it('should create an empty type context', () => {
      const context = createTypeContext();
      expect(context.scope).toBeInstanceOf(Map);
      expect(context.scope.size).toBe(0);
      expect(context.interfaces).toBeInstanceOf(Map);
      expect(context.interfaces.size).toBe(0);
      expect(context.imports).toEqual([]);
    });

    it('should allow adding types to scope', () => {
      const context = createTypeContext();
      const type = createPrimitiveType('string');
      context.scope.set('myVar', type);
      expect(context.scope.get('myVar')).toEqual(type);
    });

    it('should allow adding interfaces', () => {
      const context = createTypeContext();
      const props: PropertyDefinition[] = [
        createPropertyDefinition('name', 'string')
      ];
      const iface = createInterfaceDefinition('User', props);
      context.interfaces.set('User', iface);
      expect(context.interfaces.get('User')).toEqual(iface);
    });
  });
});
