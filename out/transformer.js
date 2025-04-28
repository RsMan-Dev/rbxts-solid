import ts from 'typescript';
/**
 * 
 * @param {ts.Program} program 
 * @returns {ts.TransformerFactory<ts.SourceFile>} 
 * 
 */
export default function (program) {
  const checker = program.getTypeChecker();
  return (context) => {

    /**
     * @param {ts.Expression} expr 
     * @returns {ts.Type | undefined}
     */
    const expressionType = (expr) => {
      return ts.isStringLiteral(expr) 
        ? checker.getContextualType(expr) 
        : checker.getTypeAtLocation(expr);
    }

    /**
     * @param {ts.Expression} expr 
     * @returns {ts.TypeNode | undefined}
     */
    const expressionTypeNode = (expr) => {
      let type = expressionType(expr)
      let typeNode = undefined
      try {
        typeNode = checker.typeToTypeNode(type, expr, ts.NodeBuilderFlags.None)
      } catch (e) {}
      return typeNode
    }

    let enumItemSymbol 
    const isEnumItem = (expr) => {
      try{
        enumItemSymbol ||= checker.resolveName(
          "EnumItem",
          expr?.kind ? expr : undefined,
          ts.SymbolFlags.Type,
          false
        )
        return checker.isTypeAssignableTo(
          checker.getTypeAtLocation(expr),
          checker.getDeclaredTypeOfSymbol(enumItemSymbol)
        )
      } catch {
        return false
      }
    }

    const isEnumAccess = (expr) => {
      if(!ts.isPropertyAccessExpression(expr) || !isEnumItem(expr)) return false
      let parentExpression = expr.expression
      while(ts.isPropertyAccessExpression(parentExpression)) {
        parentExpression = parentExpression.expression
      }
      // check if topmost expression is "Enum."
      return parentExpression.getText() === "Enum"
    }


    /**
     * Check if the expression is trackable, any trackable is:
     * - function call expression
     * - object property access expression
     * - function declaration or arrow function (as we want to avoid the function execution on initial render)
     * - parenthesis and content is a trackable expression
     * - "||", "&&", "&", "|", "^", "~", ">>", "<<", ">>>" expressions with trackable left or right expression
     * - conditional expression with trackable condition, whenTrue or whenFalse
     * - "==", "===", "!==", "!=", "<", ">", "<=", ">=" expressions with trackable left and right expression
     * - comma list expression with at least one trackable element
     * - math operations with trackable left or right expression
     * - [] access expression with trackable left expression
     * - object declaration with trackable properties
     * - is function type
     * - string template expression with at least one trackable element
     * 
     * Ignored cases:
     * - new expression are ignored even if constructors can make tracking, to avoid majority of classes non trackable creating functions
     * - "typeof", "instanceof" expressions are ignored, cannot be created on roblox ts
     * - "new" expressions are ignored, to avoid majority of classes non trackable creating functions
     * 
     * @param {ts.Expression} expr 
     * @returns {boolean}
     */
    const isTrackable = (expr) => {
      if(isEnumAccess(expr)) return false
      return ts.isCallExpression(expr) ||
        (ts.isNewExpression(expr) && expr.arguments?.some(isTrackable)) ||
        ts.isPropertyAccessExpression(expr) ||
        ts.isFunctionDeclaration(expr) ||
        ts.isArrowFunction(expr) ||
        (ts.isBinaryExpression(expr) && (isTrackable(expr.left) || isTrackable(expr.right))) ||
        (ts.isParenthesizedExpression(expr) && isTrackable(expr.expression)) ||
        (ts.isConditionalExpression(expr) && (isTrackable(expr.condition) || isTrackable(expr.whenTrue) || isTrackable(expr.whenFalse))) ||
        (ts.isCommaListExpression(expr) && expr.elements.some(isTrackable)) ||
        (ts.isArrayLiteralExpression(expr) && expr.elements.some(isTrackable)) ||
        ts.isSpreadElement(expr) ||
        ts.isSpreadAssignment(expr) ||
        (ts.isNonNullExpression(expr) && isTrackable(expr.expression)) ||
        ts.isElementAccessExpression(expr) ||
        (ts.isObjectLiteralExpression(expr) && expr.properties.some(p => ts.isPropertyAssignment(p) && isTrackable(p.initializer))) ||
        (ts.isAsExpression(expr) && isTrackable(expr.expression)) ||
        (checker.getSignaturesOfType(checker.getTypeAtLocation(expr), ts.SignatureKind.Call).length > 0) ||
        (ts.isTemplateExpression(expr) && expr.templateSpans.some(s => isTrackable(s.expression)))
    }

    /**
     * @param {ts.Expression} expr 
     * @param {boolean} withType 
     * @returns {ts.Expression}
     */
    const wrapTrackableInFunction = (expr, withType = true) => {
      // check if trackable, if not trackable and withType is true, return the expression in "(expr) as type"
      if(isTrackable(expr)) {
        // if a call and function is not a property access or element access, we return the function directly
        if(
          ts.isCallExpression(expr) && 
          !expr.arguments?.length &&
          !ts.isPropertyAccessExpression(expr.expression) &&
          !ts.isElementAccessExpression(expr.expression)
        ) {
          return expr.expression
        }

        return ts.factory.createArrowFunction(
          undefined,
          undefined,
          [],
          withType ? expressionTypeNode(expr) : undefined,
          undefined,
          expr
        )
      }
      return withType 
        ? ts.factory.createAsExpression(
            ts.isBinaryExpression(expr)
              ? ts.factory.createParenthesizedExpression(expr)
              : expr,
            expressionTypeNode(expr)
          )
        : expr
    }

    /**
     * @param {ts.Node} node 
     * @returns {ts.Node}
     */
    const visit = (node) => {
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
        const tagName = ts.isJsxElement(node) ? node.openingElement.tagName : ts.isJsxSelfClosingElement(node) ? node.tagName : undefined;
        const isFragment = !tagName || ts.isJsxFragment(node);
        const factoryFromConfig = program.getCompilerOptions().jsxFactory ?? 'SOLID.createElement';
        const fragmentFactoryFromConfig = program.getCompilerOptions().jsxFragmentFactory ?? 'SOLID.createFragment';
        if (!fragmentFactoryFromConfig.includes('.')) throw new Error('Fragment factory must be a static method, from a namespace or a class, ex: "SOLID.createFragment"');
        const factoryClass = factoryFromConfig.split('.').shift();
        const factoryName = isFragment ? fragmentFactoryFromConfig : factoryFromConfig;
        const attributes = ts.isJsxElement(node) ? node.openingElement.attributes : ts.isJsxSelfClosingElement(node) ? node.attributes : undefined;

        const mergePropsArgs = [], currPropertiesAssignments = []
        
        if(attributes) {
          for(const attr of attributes?.properties) {
            if (ts.isJsxSpreadAttribute(attr)) {
              if(currPropertiesAssignments.length > 0) {
                mergePropsArgs.push(ts.factory.createObjectLiteralExpression(currPropertiesAssignments, true))
                currPropertiesAssignments.length = 0
              }

              mergePropsArgs.push(wrapTrackableInFunction(attr.expression, false))
              continue
            }

            /**
             * @type {ts.Expression}
             */
            const expr = attr.initializer === undefined
              ? ts.factory.createTrue()
              : ts.isJsxElement(attr.initializer) || ts.isJsxSelfClosingElement(attr.initializer) || ts.isJsxFragment(attr.initializer)
              ? visit(attr.initializer)
              : ts.isJsxExpression(attr.initializer)
              ? attr.initializer.expression ? visit(attr.initializer.expression) : ts.factory.createTrue()
              : attr.initializer ?? ts.factory.createTrue()

            const name = ts.isIdentifier(attr.name)
              ? attr.name.text
              : ts.factory.createStringLiteral(attr.name.namespace.text + ':' + attr.name.name.text)

            currPropertiesAssignments.push(
              ts.factory.createPropertyAssignment(
                name, 
                wrapTrackableInFunction(expr)
              )
            )
          }

          if(currPropertiesAssignments.length > 0) {
            mergePropsArgs.push(ts.factory.createObjectLiteralExpression(currPropertiesAssignments, true))
          }
        }


        const children = ("children" in node ? node.children : undefined)
          ?.filter((child) => !(ts.isJsxText(child) && child.text.trim() === ''))
          ?.map((child) => {
            child = visit(child)
            if (ts.isJsxText(child)) {
              return ts.factory.createIdentifier(`"${child.text.trim()}"`)
            }
            
            let expression = ts.isJsxExpression(child) 
              ? child.expression ?? ts.factory.createIdentifier("undefined")
              : child;
        
            if(ts.isFunctionExpression(expression) || ts.isArrowFunction(expression)) {
              const parametersCastedIntoItsType = expression.parameters.map(p => {
                return ts.factory.updateParameterDeclaration(
                  p,
                  p.modifiers,
                  p.dotDotDotToken,
                  p.name,
                  p.questionToken,
                  expressionTypeNode(p),
                  p.initializer
                )
              });

              expression = ts.isFunctionExpression(expression) 
                ? ts.factory.updateFunctionExpression(
                  expression,
                  expression.modifiers,
                  expression.asteriskToken,
                  expression.name,
                  parametersCastedIntoItsType,
                  expression.parameters,
                  expression.type,
                  expression.body
                ) : ts.factory.updateArrowFunction(
                  expression,
                  expression.modifiers,
                  expression.typeParameters,
                  parametersCastedIntoItsType,
                  expression.type,
                  expression.equalsGreaterThanToken,
                  expression.body
                ) 
            }

            return wrapTrackableInFunction(expression);
          }).filter(Boolean);

        const tagNameId = !tagName ? undefined : ts.isIdentifier(tagName)
          ? tagName.text.match(/^[a-z]/)
            ? ts.factory.createStringLiteral(tagName.text)
            : tagName
          : ts.isJsxNamespacedName(tagName)
            ? ts.factory.createStringLiteral(tagName.getText())
            : ts.isPropertyAccessExpression(tagName)
              ? checker.getSignaturesOfType(checker.getTypeAtLocation(tagName), ts.SignatureKind.Call).length
                ? ts.factory.createArrowFunction(
                  undefined,
                  undefined,
                  [
                    ts.factory.createParameterDeclaration(
                      undefined,
                      undefined,
                      'props',
                      undefined,
                      ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
                      undefined
                    )
                  ],
                  ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
                  undefined,
                  ts.factory.createCallExpression(tagName, undefined, [
                    ts.factory.createAsExpression(
                      ts.factory.createIdentifier('props'),
                      ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                    ),
                  ])
                )
                : tagName
              : tagName;

        let disableFunctionCallForPropsMerging = false
        if(
          mergePropsArgs.length === 1 &&
          ts.isObjectLiteralExpression(mergePropsArgs[0]) &&
          mergePropsArgs[0].properties.every(p => {
            if(!ts.isPropertyAssignment(p)) return false
            else if (!ts.isArrowFunction(p.initializer)) {
              return !checker.getSignaturesOfType(checker.getTypeAtLocation(p.initializer), ts.SignatureKind.Call).length
            } else {
              if(ts.isBlock(p.initializer.body)) return false
              if(ts.isArrowFunction(p.initializer.body) && p.initializer.body.parameters.length === 0) return true
              return checker.getSignaturesOfType(checker.getTypeAtLocation(p.initializer.body), ts.SignatureKind.Call).length > 0
            }
          })
        ) {
          disableFunctionCallForPropsMerging = true
          mergePropsArgs[0] = ts.factory.createObjectLiteralExpression(
            mergePropsArgs[0].properties.map(p => {
              if(ts.isPropertyAssignment(p) && ts.isArrowFunction(p.initializer)) {
                return ts.factory.createPropertyAssignment(
                  p.name,
                  ts.factory.createAsExpression(
                    ts.factory.createParenthesizedExpression(p.initializer.body),
                    expressionTypeNode(p.initializer.body)
                  )
                )
                
              }
              return p
            }), 
            true
          )
        }

        const props = mergePropsArgs.length <= 0
          ? ts.factory.createObjectLiteralExpression([], true)
          : mergePropsArgs.length === 1 &&
            ts.isObjectLiteralExpression(mergePropsArgs[0]) &&
            disableFunctionCallForPropsMerging
            ? mergePropsArgs[0]
            : ts.factory.createCallExpression(
              ts.factory.createIdentifier(`${factoryClass}.mergeProps`),
              undefined,
              ts.factory.createNodeArray(mergePropsArgs, true)
            )

        const newCall = ts.factory.createCallExpression(
          ts.factory.createIdentifier(factoryName),
          undefined,
          isFragment ? [...children || []] : [
            tagNameId,
            props,
            ...children || [],
          ]
        );

        return newCall;
      }

      return ts.visitEachChild(node, visit, context);
    };
    return (node) => {
      return ts.visitEachChild(node, visit, context);
    }
  };
}