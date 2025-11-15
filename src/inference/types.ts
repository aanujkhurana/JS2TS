/**
 * Type inference data structures and utilities
 */

import type * as babel from '@babel/types';

/**
 * Represents the kind of inferred type
 */
export type TypeKind = 'primitive' | 'object' | 'array' | 'function' | 'union' | 'unknown';

/**
 * Represents an inferred type with confidence score
 */
export interface InferredType {
  kind: TypeKind;
  value: string;
  confidence: number;
  needsInterface?: boolean;
  interfaceName?: string;
}

/**
 * Represents a property in an interface definition
 */
export interface PropertyDefinition {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
}

/**
 * Represents an interface definition
 */
export interface InterfaceDefinition {
  name: string;
  properties: PropertyDefinition[];
  usageCount: number;
  hash: string;
}

/**
 * Represents the type context during inference
 */
export interface TypeContext {
  scope: Map<string, InferredType>;
  interfaces: Map<string, InterfaceDefinition>;
  imports: babel.ImportDeclaration[];
}

/**
 * Creates a new empty type context
 */
export function createTypeContext(): TypeContext {
  return {
    scope: new Map(),
    interfaces: new Map(),
    imports: []
  };
}

/**
 * Creates a primitive inferred type
 */
export function createPrimitiveType(value: string, confidence: number = 1.0): InferredType {
  return {
    kind: 'primitive',
    value,
    confidence
  };
}

/**
 * Creates an array inferred type
 */
export function createArrayType(elementType: string, confidence: number = 1.0): InferredType {
  return {
    kind: 'array',
    value: `${elementType}[]`,
    confidence
  };
}

/**
 * Creates an object inferred type
 */
export function createObjectType(
  value: string,
  confidence: number = 1.0,
  needsInterface: boolean = false,
  interfaceName?: string
): InferredType {
  return {
    kind: 'object',
    value,
    confidence,
    needsInterface,
    interfaceName
  };
}

/**
 * Creates a function inferred type
 */
export function createFunctionType(value: string, confidence: number = 1.0): InferredType {
  return {
    kind: 'function',
    value,
    confidence
  };
}

/**
 * Creates a union inferred type
 */
export function createUnionType(types: string[], confidence: number = 1.0): InferredType {
  return {
    kind: 'union',
    value: types.join(' | '),
    confidence
  };
}

/**
 * Creates an unknown inferred type
 */
export function createUnknownType(confidence: number = 0.0): InferredType {
  return {
    kind: 'unknown',
    value: 'unknown',
    confidence
  };
}

/**
 * Compares two inferred types for equality
 */
export function areTypesEqual(type1: InferredType, type2: InferredType): boolean {
  return type1.kind === type2.kind && type1.value === type2.value;
}

/**
 * Merges two inferred types, preferring the one with higher confidence
 */
export function mergeTypes(type1: InferredType, type2: InferredType): InferredType {
  // If types are equal, return the one with higher confidence
  if (areTypesEqual(type1, type2)) {
    return type1.confidence >= type2.confidence ? type1 : type2;
  }

  // If one is unknown, prefer the other
  if (type1.kind === 'unknown') {
    return type2;
  }
  if (type2.kind === 'unknown') {
    return type1;
  }

  // If types are different, create a union type
  const unionTypes = new Set<string>();
  
  // Extract types from existing unions
  if (type1.kind === 'union') {
    type1.value.split(' | ').forEach(t => unionTypes.add(t.trim()));
  } else {
    unionTypes.add(type1.value);
  }
  
  if (type2.kind === 'union') {
    type2.value.split(' | ').forEach(t => unionTypes.add(t.trim()));
  } else {
    unionTypes.add(type2.value);
  }

  // Calculate average confidence
  const avgConfidence = (type1.confidence + type2.confidence) / 2;

  return createUnionType(Array.from(unionTypes), avgConfidence);
}

/**
 * Generates a hash for an interface definition based on its properties
 */
export function hashInterfaceDefinition(properties: PropertyDefinition[]): string {
  const sortedProps = [...properties].sort((a, b) => a.name.localeCompare(b.name));
  const signature = sortedProps
    .map(p => `${p.name}${p.optional ? '?' : ''}${p.readonly ? '!' : ''}:${p.type}`)
    .join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    const char = signature.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Checks if two interface definitions have the same shape
 */
export function areInterfacesEqual(
  def1: InterfaceDefinition,
  def2: InterfaceDefinition
): boolean {
  return def1.hash === def2.hash;
}

/**
 * Creates a property definition
 */
export function createPropertyDefinition(
  name: string,
  type: string,
  optional: boolean = false,
  readonly: boolean = false
): PropertyDefinition {
  return {
    name,
    type,
    optional,
    readonly
  };
}

/**
 * Creates an interface definition
 */
export function createInterfaceDefinition(
  name: string,
  properties: PropertyDefinition[]
): InterfaceDefinition {
  return {
    name,
    properties,
    usageCount: 1,
    hash: hashInterfaceDefinition(properties)
  };
}
