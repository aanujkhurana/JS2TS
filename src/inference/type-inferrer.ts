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
  createObjectType,
  createFunctionType,
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

    // Handle object expressions
    if (t.isObjectExpression(node)) {
      return this.inferObjectShape(node, context);
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

  /**
   * Infer the shape of an object literal expression
   * @param node - ObjectExpression AST node
   * @param context - Type context
   * @returns Inferred object type with optional interface information
   */
  inferObjectShape(node: t.ObjectExpression, context: TypeContext): InferredType {
    // Empty object
    if (node.properties.length === 0) {
      return createObjectType('{}', 0.8);
    }

    const properties: Array<{ name: string; type: InferredType; optional: boolean; method: boolean }> = [];
    let totalConfidence = 0;
    let propertyCount = 0;

    for (const prop of node.properties) {
      // Handle spread properties
      if (t.isSpreadElement(prop)) {
        // Spread makes the shape uncertain
        return createObjectType('object', 0.5);
      }

      // Handle object methods and properties
      if (t.isObjectProperty(prop) || t.isObjectMethod(prop)) {
        let propertyName: string | undefined;
        let optional = false;

        // Get property name
        if (t.isIdentifier(prop.key) && !prop.computed) {
          propertyName = prop.key.name;
        } else if (t.isStringLiteral(prop.key)) {
          propertyName = prop.key.value;
        } else if (t.isNumericLiteral(prop.key)) {
          propertyName = String(prop.key.value);
        } else {
          // Computed or complex property names make shape uncertain
          return createObjectType('object', 0.5);
        }

        // Infer property type
        let propertyType: InferredType;
        let isMethod = false;

        if (t.isObjectMethod(prop)) {
          // Object method
          isMethod = true;
          const returnType = this.inferFunctionReturnType(prop, context);
          const paramTypes = this.inferParameterTypes(prop, context);
          
          // Build function signature
          const paramSignature = paramTypes.map((pt, idx) => `arg${idx}: ${pt.value}`).join(', ');
          propertyType = createFunctionType(`(${paramSignature}) => ${returnType.value}`, returnType.confidence);
        } else if (t.isObjectProperty(prop)) {
          // Regular property
          if (t.isExpression(prop.value)) {
            // Handle nested objects recursively
            if (t.isObjectExpression(prop.value)) {
              propertyType = this.inferObjectShape(prop.value, context);
            } else {
              propertyType = this.inferExpressionType(prop.value, context);
            }
          } else if (t.isPatternLike(prop.value)) {
            propertyType = createUnknownType(0.3);
          } else {
            propertyType = createUnknownType(0.3);
          }
        } else {
          propertyType = createUnknownType(0.3);
        }

        properties.push({
          name: propertyName,
          type: propertyType,
          optional,
          method: isMethod
        });

        totalConfidence += propertyType.confidence;
        propertyCount++;
      }
    }

    // Calculate average confidence
    const avgConfidence = propertyCount > 0 ? totalConfidence / propertyCount : 0.5;

    // Build inline type representation
    const typeString = this.buildInlineObjectType(properties);

    // Determine if this object should have an interface
    // Complex objects (more than 3 properties or nested objects) should have interfaces
    const shouldHaveInterface = properties.length > 3 || 
      properties.some(p => p.type.kind === 'object' || p.type.kind === 'function');

    if (shouldHaveInterface) {
      // Generate a unique interface name (will be refined later with context)
      const interfaceName = this.generateInterfaceName(context);
      return createObjectType(typeString, avgConfidence, true, interfaceName);
    }

    return createObjectType(typeString, avgConfidence);
  }

  /**
   * Build an inline object type string from properties
   * @param properties - Array of property information
   * @returns Type string representation
   */
  private buildInlineObjectType(
    properties: Array<{ name: string; type: InferredType; optional: boolean; method: boolean }>
  ): string {
    if (properties.length === 0) {
      return '{}';
    }

    const propStrings = properties.map(prop => {
      const optionalMarker = prop.optional ? '?' : '';
      const propName = this.needsQuotes(prop.name) ? `"${prop.name}"` : prop.name;
      return `${propName}${optionalMarker}: ${prop.type.value}`;
    });

    return `{ ${propStrings.join('; ')} }`;
  }

  /**
   * Check if a property name needs quotes
   * @param name - Property name
   * @returns True if quotes are needed
   */
  private needsQuotes(name: string): boolean {
    // Check if name is a valid identifier
    const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    return !identifierRegex.test(name);
  }

  /**
   * Generate a unique interface name
   * @param context - Type context
   * @returns Generated interface name
   */
  private generateInterfaceName(context: TypeContext): string {
    let counter = context.interfaces.size + 1;
    let name = `Interface${counter}`;
    
    while (context.interfaces.has(name)) {
      counter++;
      name = `Interface${counter}`;
    }
    
    return name;
  }

  /**
   * Infer the return type of a function by analyzing its return statements
   * @param node - Function node (FunctionDeclaration, FunctionExpression, or ArrowFunctionExpression)
   * @param context - Type context
   * @returns Inferred return type with confidence score
   */
  inferFunctionReturnType(
    node: t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression,
    context: TypeContext
  ): InferredType {
    // Handle arrow functions with expression body (implicit return)
    if (t.isArrowFunctionExpression(node) && !t.isBlockStatement(node.body)) {
      return this.inferExpressionType(node.body, context);
    }

    // For block statements, collect all return statements
    const returnStatements: t.ReturnStatement[] = [];
    
    if (t.isBlockStatement(node.body)) {
      this.collectReturnStatements(node.body, returnStatements);
    }

    // If no return statements found, function returns void
    if (returnStatements.length === 0) {
      return createPrimitiveType('void', 1.0);
    }

    // Infer types from all return statements
    const returnTypes: InferredType[] = [];
    for (const returnStmt of returnStatements) {
      if (returnStmt.argument) {
        const returnType = this.inferExpressionType(returnStmt.argument, context);
        returnTypes.push(returnType);
      } else {
        // Return without argument is void
        returnTypes.push(createPrimitiveType('void', 1.0));
      }
    }

    // If all returns are void, return void
    if (returnTypes.every(t => t.value === 'void')) {
      return createPrimitiveType('void', 1.0);
    }

    // Merge all return types
    let mergedType = returnTypes[0];
    for (let i = 1; i < returnTypes.length; i++) {
      mergedType = mergeTypes(mergedType, returnTypes[i]);
    }

    // Calculate confidence based on consistency
    const allSameType = returnTypes.every(t => t.value === returnTypes[0].value);
    const confidence = allSameType ? 
      Math.min(...returnTypes.map(t => t.confidence)) : 
      mergedType.confidence * 0.85;

    return {
      ...mergedType,
      confidence
    };
  }

  /**
   * Recursively collect all return statements from a block statement
   * @param node - Block statement or nested statement
   * @param returnStatements - Array to collect return statements
   */
  private collectReturnStatements(
    node: t.Statement | t.BlockStatement,
    returnStatements: t.ReturnStatement[]
  ): void {
    if (t.isReturnStatement(node)) {
      returnStatements.push(node);
      return;
    }

    if (t.isBlockStatement(node)) {
      for (const statement of node.body) {
        this.collectReturnStatements(statement, returnStatements);
      }
    } else if (t.isIfStatement(node)) {
      this.collectReturnStatements(node.consequent, returnStatements);
      if (node.alternate) {
        this.collectReturnStatements(node.alternate, returnStatements);
      }
    } else if (t.isWhileStatement(node) || t.isDoWhileStatement(node)) {
      this.collectReturnStatements(node.body, returnStatements);
    } else if (t.isForStatement(node) || t.isForInStatement(node) || t.isForOfStatement(node)) {
      this.collectReturnStatements(node.body, returnStatements);
    } else if (t.isSwitchStatement(node)) {
      for (const switchCase of node.cases) {
        for (const statement of switchCase.consequent) {
          this.collectReturnStatements(statement, returnStatements);
        }
      }
    } else if (t.isTryStatement(node)) {
      this.collectReturnStatements(node.block, returnStatements);
      if (node.handler) {
        this.collectReturnStatements(node.handler.body, returnStatements);
      }
      if (node.finalizer) {
        this.collectReturnStatements(node.finalizer, returnStatements);
      }
    } else if (t.isLabeledStatement(node)) {
      this.collectReturnStatements(node.body, returnStatements);
    }
  }

  /**
   * Infer parameter types by analyzing how they are used within the function
   * @param node - Function node (FunctionDeclaration, FunctionExpression, or ArrowFunctionExpression)
   * @param context - Type context
   * @returns Array of inferred parameter types
   */
  inferParameterTypes(
    node: t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression,
    context: TypeContext
  ): InferredType[] {
    const paramTypes: InferredType[] = [];

    for (const param of node.params) {
      const paramType = this.inferParameterType(param, node, context);
      paramTypes.push(paramType);
    }

    return paramTypes;
  }

  /**
   * Infer a single parameter's type by analyzing its usage
   * @param param - Parameter node
   * @param functionNode - The function containing this parameter
   * @param context - Type context
   * @returns Inferred parameter type
   */
  private inferParameterType(
    param: t.Identifier | t.Pattern | t.RestElement | t.TSParameterProperty,
    functionNode: t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression,
    context: TypeContext
  ): InferredType {
    // Handle rest parameters
    if (t.isRestElement(param)) {
      const elementType = this.inferParameterType(param.argument as any, functionNode, context);
      return createArrayType(elementType.value, elementType.confidence * 0.9);
    }

    // Handle assignment patterns (default parameters)
    if (t.isAssignmentPattern(param)) {
      // Infer from the default value
      return this.inferExpressionType(param.right, context);
    }

    // Handle array destructuring
    if (t.isArrayPattern(param)) {
      return createArrayType('unknown', 0.5);
    }

    // Handle object destructuring
    if (t.isObjectPattern(param)) {
      return createPrimitiveType('object', 0.5);
    }

    // For simple identifiers, analyze usage within the function body
    if (t.isIdentifier(param)) {
      return this.inferParameterTypeFromUsage(param, functionNode, context);
    }

    return createUnknownType(0.0);
  }

  /**
   * Infer parameter type by analyzing how it's used in the function body
   * @param param - Parameter identifier
   * @param functionNode - The function containing this parameter
   * @param context - Type context
   * @returns Inferred parameter type based on usage
   */
  private inferParameterTypeFromUsage(
    param: t.Identifier,
    functionNode: t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression,
    context: TypeContext
  ): InferredType {
    const usageTypes: InferredType[] = [];
    const paramName = param.name;

    // Helper to analyze parameter usage in expressions
    const analyzeExpression = (expr: t.Node): void => {
      // Check if parameter is used in binary operations
      if (t.isBinaryExpression(expr)) {
        if (t.isIdentifier(expr.left) && expr.left.name === paramName) {
          // Infer from operator
          if (['-', '*', '/', '%', '**'].includes(expr.operator)) {
            usageTypes.push(createPrimitiveType('number', 0.8));
          }
        }
        if (t.isIdentifier(expr.right) && expr.right.name === paramName) {
          if (['-', '*', '/', '%', '**'].includes(expr.operator)) {
            usageTypes.push(createPrimitiveType('number', 0.8));
          }
        }
      }

      // Check if parameter is used in unary operations
      if (t.isUnaryExpression(expr)) {
        if (t.isIdentifier(expr.argument) && expr.argument.name === paramName) {
          if (['+', '-', '~'].includes(expr.operator)) {
            usageTypes.push(createPrimitiveType('number', 0.8));
          } else if (expr.operator === '!') {
            usageTypes.push(createPrimitiveType('boolean', 0.7));
          }
        }
      }

      // Check if parameter is used in member expressions (property access)
      if (t.isMemberExpression(expr)) {
        if (t.isIdentifier(expr.object) && expr.object.name === paramName) {
          // Check for array and string methods
          if (t.isIdentifier(expr.property) && !expr.computed) {
            const methodName = expr.property.name;
            // Array-specific methods (not shared with strings)
            if (['map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'join'].includes(methodName)) {
              usageTypes.push(createArrayType('unknown', 0.7));
            }
            // String-specific methods (not shared with arrays)
            else if (['toLowerCase', 'toUpperCase', 'trim', 'split', 'substring', 'substr', 'charAt', 'charCodeAt', 'startsWith', 'endsWith', 'replace', 'replaceAll', 'match', 'search', 'padStart', 'padEnd', 'repeat', 'concat'].includes(methodName)) {
              usageTypes.push(createPrimitiveType('string', 0.7));
            }
            // Shared methods - need more context, lower confidence
            else if (methodName === 'includes' || methodName === 'indexOf' || methodName === 'lastIndexOf') {
              // These exist on both arrays and strings, so we can't be sure
              // Don't add a type here, let other usage patterns determine it
            }
            // length property - very weak signal, skip it
            else if (methodName === 'length') {
              // Both arrays and strings have length, so this doesn't help us
              // Don't add a type here
            }
          }
        }
      }

      // Check if parameter is called as a function
      if (t.isCallExpression(expr)) {
        if (t.isIdentifier(expr.callee) && expr.callee.name === paramName) {
          usageTypes.push(createPrimitiveType('Function', 0.8));
        }
      }
    };

    // Traverse the function body to find parameter usage
    const traverseNode = (node: t.Node): void => {
      if (t.isBlockStatement(node)) {
        for (const statement of node.body) {
          traverseNode(statement);
        }
      } else if (t.isExpressionStatement(node)) {
        analyzeExpression(node.expression);
        traverseNode(node.expression);
      } else if (t.isReturnStatement(node) && node.argument) {
        analyzeExpression(node.argument);
        traverseNode(node.argument);
      } else if (t.isIfStatement(node)) {
        analyzeExpression(node.test);
        traverseNode(node.test);
        traverseNode(node.consequent);
        if (node.alternate) {
          traverseNode(node.alternate);
        }
      } else if (t.isVariableDeclaration(node)) {
        for (const declarator of node.declarations) {
          if (declarator.init) {
            analyzeExpression(declarator.init);
            traverseNode(declarator.init);
          }
        }
      } else if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
        analyzeExpression(node);
        traverseNode(node.left);
        traverseNode(node.right);
      } else if (t.isUnaryExpression(node)) {
        analyzeExpression(node);
        traverseNode(node.argument);
      } else if (t.isMemberExpression(node)) {
        analyzeExpression(node);
        traverseNode(node.object);
        if (t.isExpression(node.property)) {
          traverseNode(node.property);
        }
      } else if (t.isCallExpression(node)) {
        analyzeExpression(node);
        traverseNode(node.callee);
        for (const arg of node.arguments) {
          if (t.isExpression(arg)) {
            traverseNode(arg);
          }
        }
      } else if (t.isArrayExpression(node)) {
        for (const element of node.elements) {
          if (element && t.isExpression(element)) {
            traverseNode(element);
          }
        }
      }
    };

    // Analyze the function body
    if (t.isBlockStatement(functionNode.body)) {
      traverseNode(functionNode.body);
    } else if (t.isExpression(functionNode.body)) {
      // Arrow function with expression body
      analyzeExpression(functionNode.body);
      traverseNode(functionNode.body);
    }

    // If no usage found, return unknown
    if (usageTypes.length === 0) {
      return createUnknownType(0.3);
    }

    // Merge all usage types
    let mergedType = usageTypes[0];
    for (let i = 1; i < usageTypes.length; i++) {
      mergedType = mergeTypes(mergedType, usageTypes[i]);
    }

    return mergedType;
  }
}
