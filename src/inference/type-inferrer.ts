/**
 * Type inference engine for JavaScript to TypeScript conversion
 */

import * as t from '@babel/types';
import {
  InferredType,
  TypeContext,
  createPrimitiveType,
  createArrayType,
  createUnknownType,
  mergeTypes
} from './types';

/**
 * TypeInferrer class handles type inference for JavaScript AST nodes
 */
export class TypeInferrer {
  /**
   * Infer the type of a variable from its declarator node
   * @param node - VariableDeclarator AST node
   * @param context - Type context for scope and interface tracking
   * @returns Inferred type with confidence score
   */
  inferVariableType(node: t.VariableDeclarator, context: TypeContext): InferredType {
    // If no initializer, we can't infer the type
    if (!node.init) {
      return createUnknownType(0.0);
    }

    return this.inferExpressionType(node.init, context);
  }

  /**
   * Infer the type of an expression node
   * @param node - Expression AST node
   * @param context - Type context for scope and interface tracking
   * @returns Inferred type with confidence score
   */
  private inferExpressionType(node: t.Expression | t.PatternLike | t.PrivateName, context: TypeContext): InferredType {
    // Handle PrivateName (private class fields)
    if (t.isPrivateName(node)) {
      return createUnknownType(0.3);
    }
    // Handle literal types
    if (t.isStringLiteral(node)) {
      return createPrimitiveType('string', 1.0);
    }

    if (t.isNumericLiteral(node)) {
      return createPrimitiveType('number', 1.0);
    }

    if (t.isBooleanLiteral(node)) {
      return createPrimitiveType('boolean', 1.0);
    }

    if (t.isNullLiteral(node)) {
      return createPrimitiveType('null', 1.0);
    }

    // Handle template literals (template strings)
    if (t.isTemplateLiteral(node)) {
      return createPrimitiveType('string', 1.0);
    }

    // Handle BigInt literals
    if (t.isBigIntLiteral(node)) {
      return createPrimitiveType('bigint', 1.0);
    }

    // Handle RegExp literals
    if (t.isRegExpLiteral(node)) {
      return createPrimitiveType('RegExp', 1.0);
    }

    // Handle array expressions
    if (t.isArrayExpression(node)) {
      return this.inferArrayType(node, context);
    }

    // Handle identifiers (variable references)
    if (t.isIdentifier(node)) {
      return this.inferIdentifierType(node, context);
    }

    // Handle unary expressions (e.g., -5, !true, typeof x)
    if (t.isUnaryExpression(node)) {
      return this.inferUnaryExpressionType(node, context);
    }

    // Handle binary expressions (e.g., 1 + 2, "a" + "b")
    if (t.isBinaryExpression(node)) {
      return this.inferBinaryExpressionType(node, context);
    }

    // Handle logical expressions (e.g., a && b, a || b)
    if (t.isLogicalExpression(node)) {
      return this.inferLogicalExpressionType(node, context);
    }

    // Handle conditional expressions (ternary)
    if (t.isConditionalExpression(node)) {
      return this.inferConditionalExpressionType(node, context);
    }

    // Handle call expressions (function calls)
    if (t.isCallExpression(node)) {
      return this.inferCallExpressionType(node, context);
    }

    // Handle member expressions (e.g., obj.prop, arr[0])
    if (t.isMemberExpression(node)) {
      return this.inferMemberExpressionType(node, context);
    }

    // Default to unknown for unsupported expression types
    return createUnknownType(0.0);
  }

  /**
   * Infer the type of an array expression
   * @param node - ArrayExpression AST node
   * @param context - Type context
   * @returns Inferred array type with confidence score
   */
  private inferArrayType(node: t.ArrayExpression, context: TypeContext): InferredType {
    // Empty array - we can't infer element type
    if (node.elements.length === 0) {
      return createArrayType('unknown', 0.5);
    }

    // Infer types of all elements
    const elementTypes: InferredType[] = [];
    for (const element of node.elements) {
      if (element && !t.isSpreadElement(element)) {
        const elementType = this.inferExpressionType(element, context);
        elementTypes.push(elementType);
      }
    }

    // If no valid elements, return unknown array
    if (elementTypes.length === 0) {
      return createArrayType('unknown', 0.3);
    }

    // Merge all element types to find common type
    let mergedType = elementTypes[0];
    for (let i = 1; i < elementTypes.length; i++) {
      mergedType = mergeTypes(mergedType, elementTypes[i]);
    }

    // Calculate confidence based on type consistency
    const allSameType = elementTypes.every(t => t.value === elementTypes[0].value);
    const confidence = allSameType ? 1.0 : mergedType.confidence * 0.9;

    return createArrayType(mergedType.value, confidence);
  }

  /**
   * Infer the type of an identifier (variable reference)
   * @param node - Identifier AST node
   * @param context - Type context
   * @returns Inferred type from context or unknown
   */
  private inferIdentifierType(node: t.Identifier, context: TypeContext): InferredType {
    // Check if we have this identifier in our scope
    const knownType = context.scope.get(node.name);
    if (knownType) {
      return knownType;
    }

    // Handle known global identifiers
    switch (node.name) {
      case 'undefined':
        return createPrimitiveType('undefined', 1.0);
      case 'NaN':
      case 'Infinity':
        return createPrimitiveType('number', 1.0);
      default:
        return createUnknownType(0.0);
    }
  }

  /**
   * Infer the type of a unary expression
   * @param node - UnaryExpression AST node
   * @param context - Type context
   * @returns Inferred type based on operator
   */
  private inferUnaryExpressionType(node: t.UnaryExpression, context: TypeContext): InferredType {
    switch (node.operator) {
      case '!':
        return createPrimitiveType('boolean', 1.0);
      case '+':
      case '-':
      case '~':
        return createPrimitiveType('number', 1.0);
      case 'typeof':
        return createPrimitiveType('string', 1.0);
      case 'void':
        return createPrimitiveType('undefined', 1.0);
      case 'delete':
        return createPrimitiveType('boolean', 1.0);
      default:
        return createUnknownType(0.5);
    }
  }

  /**
   * Infer the type of a binary expression
   * @param node - BinaryExpression AST node
   * @param context - Type context
   * @returns Inferred type based on operator and operands
   */
  private inferBinaryExpressionType(node: t.BinaryExpression, context: TypeContext): InferredType {
    const leftType = this.inferExpressionType(node.left, context);
    const rightType = this.inferExpressionType(node.right, context);

    // Comparison operators always return boolean
    if (['==', '===', '!=', '!==', '<', '<=', '>', '>=', 'in', 'instanceof'].includes(node.operator)) {
      return createPrimitiveType('boolean', 1.0);
    }

    // Arithmetic operators
    if (['-', '*', '/', '%', '**', '<<', '>>', '>>>', '&', '|', '^'].includes(node.operator)) {
      return createPrimitiveType('number', 1.0);
    }

    // Addition operator - could be string or number
    if (node.operator === '+') {
      // If either operand is a string, result is string
      if (leftType.value === 'string' || rightType.value === 'string') {
        return createPrimitiveType('string', 0.95);
      }
      // If both are numbers, result is number
      if (leftType.value === 'number' && rightType.value === 'number') {
        return createPrimitiveType('number', 1.0);
      }
      // Otherwise, could be either
      return createPrimitiveType('string | number', 0.6);
    }

    return createUnknownType(0.3);
  }

  /**
   * Infer the type of a logical expression
   * @param node - LogicalExpression AST node
   * @param context - Type context
   * @returns Inferred type based on operands
   */
  private inferLogicalExpressionType(node: t.LogicalExpression, context: TypeContext): InferredType {
    const leftType = this.inferExpressionType(node.left, context);
    const rightType = this.inferExpressionType(node.right, context);

    // For && and ||, the result could be either operand type
    if (node.operator === '&&' || node.operator === '||') {
      return mergeTypes(leftType, rightType);
    }

    // For ?? (nullish coalescing), prefer the right type
    if (node.operator === '??') {
      // Right side is the fallback, so it's more likely to be the result type
      return rightType.confidence > 0.5 ? rightType : mergeTypes(leftType, rightType);
    }

    return createUnknownType(0.3);
  }

  /**
   * Infer the type of a conditional expression (ternary)
   * @param node - ConditionalExpression AST node
   * @param context - Type context
   * @returns Inferred type as union of consequent and alternate
   */
  private inferConditionalExpressionType(node: t.ConditionalExpression, context: TypeContext): InferredType {
    const consequentType = this.inferExpressionType(node.consequent, context);
    const alternateType = this.inferExpressionType(node.alternate, context);
    
    return mergeTypes(consequentType, alternateType);
  }

  /**
   * Infer the type of a call expression (function call)
   * @param node - CallExpression AST node
   * @param context - Type context
   * @returns Inferred type based on known function signatures
   */
  private inferCallExpressionType(node: t.CallExpression, context: TypeContext): InferredType {
    // Try to identify the function being called
    if (t.isIdentifier(node.callee)) {
      return this.inferBuiltInFunctionReturnType(node.callee.name, node.arguments, context);
    }

    // For member expressions like arr.map(), handle separately
    if (t.isMemberExpression(node.callee)) {
      return this.inferMethodCallType(node.callee, node.arguments, context);
    }

    return createUnknownType(0.2);
  }

  /**
   * Infer return type of built-in functions
   * @param functionName - Name of the function
   * @param args - Function arguments
   * @param context - Type context
   * @returns Inferred return type
   */
  private inferBuiltInFunctionReturnType(
    functionName: string,
    args: Array<t.Expression | t.SpreadElement | t.ArgumentPlaceholder>,
    context: TypeContext
  ): InferredType {
    switch (functionName) {
      case 'String':
        return createPrimitiveType('string', 1.0);
      case 'Number':
      case 'parseInt':
      case 'parseFloat':
        return createPrimitiveType('number', 1.0);
      case 'Boolean':
        return createPrimitiveType('boolean', 1.0);
      case 'Array':
        return createArrayType('unknown', 0.7);
      case 'Object':
        return createPrimitiveType('object', 0.7);
      case 'Date':
        return createPrimitiveType('Date', 1.0);
      case 'RegExp':
        return createPrimitiveType('RegExp', 1.0);
      case 'Promise':
        return createPrimitiveType('Promise<unknown>', 0.8);
      default:
        return createUnknownType(0.1);
    }
  }

  /**
   * Infer return type of method calls
   * @param memberExpr - MemberExpression for the method
   * @param args - Method arguments
   * @param context - Type context
   * @returns Inferred return type
   */
  private inferMethodCallType(
    memberExpr: t.MemberExpression,
    args: Array<t.Expression | t.SpreadElement | t.ArgumentPlaceholder>,
    context: TypeContext
  ): InferredType {
    // Only handle computed: false (dot notation) and ensure property is an expression
    if (memberExpr.computed || !t.isExpression(memberExpr.property)) {
      return createUnknownType(0.2);
    }

    const objectType = this.inferExpressionType(memberExpr.object, context);
    
    // Get method name
    let methodName: string | undefined;
    if (t.isIdentifier(memberExpr.property)) {
      methodName = memberExpr.property.name;
    }

    if (!methodName) {
      return createUnknownType(0.2);
    }

    // Array methods
    if (objectType.kind === 'array') {
      return this.inferArrayMethodReturnType(methodName, objectType, context);
    }

    // String methods
    if (objectType.value === 'string') {
      return this.inferStringMethodReturnType(methodName);
    }

    return createUnknownType(0.2);
  }

  /**
   * Infer return type of array methods
   * @param methodName - Name of the array method
   * @param arrayType - Type of the array
   * @param context - Type context
   * @returns Inferred return type
   */
  private inferArrayMethodReturnType(
    methodName: string,
    arrayType: InferredType,
    context: TypeContext
  ): InferredType {
    // Extract element type from array type (e.g., "string[]" -> "string")
    const elementType = arrayType.value.replace('[]', '');

    switch (methodName) {
      case 'map':
      case 'filter':
      case 'slice':
      case 'concat':
        return createArrayType(elementType, 0.9);
      case 'find':
      case 'pop':
      case 'shift':
        return createPrimitiveType(`${elementType} | undefined`, 0.9);
      case 'reduce':
        return createUnknownType(0.5);
      case 'join':
        return createPrimitiveType('string', 1.0);
      case 'indexOf':
      case 'lastIndexOf':
      case 'findIndex':
      case 'length':
        return createPrimitiveType('number', 1.0);
      case 'includes':
      case 'some':
      case 'every':
        return createPrimitiveType('boolean', 1.0);
      case 'forEach':
      case 'push':
      case 'unshift':
        return createPrimitiveType('void', 0.9);
      default:
        return createUnknownType(0.3);
    }
  }

  /**
   * Infer return type of string methods
   * @param methodName - Name of the string method
   * @returns Inferred return type
   */
  private inferStringMethodReturnType(methodName: string): InferredType {
    switch (methodName) {
      case 'charAt':
      case 'concat':
      case 'slice':
      case 'substring':
      case 'substr':
      case 'toLowerCase':
      case 'toUpperCase':
      case 'trim':
      case 'trimStart':
      case 'trimEnd':
      case 'repeat':
      case 'replace':
      case 'replaceAll':
      case 'padStart':
      case 'padEnd':
        return createPrimitiveType('string', 1.0);
      case 'split':
        return createArrayType('string', 1.0);
      case 'indexOf':
      case 'lastIndexOf':
      case 'search':
      case 'charCodeAt':
      case 'length':
        return createPrimitiveType('number', 1.0);
      case 'includes':
      case 'startsWith':
      case 'endsWith':
        return createPrimitiveType('boolean', 1.0);
      case 'match':
      case 'matchAll':
        return createPrimitiveType('RegExpMatchArray | null', 0.9);
      default:
        return createUnknownType(0.3);
    }
  }

  /**
   * Infer the type of a member expression
   * @param node - MemberExpression AST node
   * @param context - Type context
   * @returns Inferred type
   */
  private inferMemberExpressionType(node: t.MemberExpression, context: TypeContext): InferredType {
    const objectType = this.inferExpressionType(node.object, context);

    // For array access with numeric index, return element type
    if (objectType.kind === 'array' && !node.computed && t.isExpression(node.property) && t.isNumericLiteral(node.property)) {
      const elementType = objectType.value.replace('[]', '');
      return createPrimitiveType(`${elementType} | undefined`, 0.9);
    }

    // For property access, we'd need object shape inference (future task)
    return createUnknownType(0.2);
  }
}
