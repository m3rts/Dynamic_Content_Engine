import path from "node:path";
import ts from "typescript";

/** @typedef {{ id: string, from: RegExp, forbiddenModules: RegExp[], forbiddenPaths: RegExp[] }} BoundaryRule */

/** @type {BoundaryRule[]} */
export const boundaryRules = [
  {
    id: "shared-packages",
    from: /^packages\/(contracts|domain|policy|observability|storage|evals)(?:\/|$)/,
    forbiddenModules: [
      /^apps\//,
      /^@dce\/providers(?:\/|$)/,
      /^next(?:\/|$)/,
      /^react(?:\/|$)/,
      /^pg-boss(?:\/|$)/,
      /^@aws-sdk\//,
      /^openai(?:\/|$)/,
      /^@anthropic-ai\//,
    ],
    forbiddenPaths: [/^apps(?:\/|$)/, /^packages\/providers(?:\/|$)/],
  },
  {
    id: "packages-db",
    from: /^packages\/db(?:\/|$)/,
    forbiddenModules: [
      /^apps\//,
      /^@dce\/providers(?:\/|$)/,
      /^next(?:\/|$)/,
      /^react(?:\/|$)/,
      /^openai(?:\/|$)/,
      /^@anthropic-ai\//,
    ],
    forbiddenPaths: [/^apps(?:\/|$)/, /^packages\/providers(?:\/|$)/],
  },
  {
    id: "apps-web",
    from: /^apps\/web(?:\/|$)/,
    forbiddenModules: [
      /^@dce\/providers(?:\/|$)/,
      /^pg-boss(?:\/|$)/,
      /^openai(?:\/|$)/,
      /^@anthropic-ai\//,
    ],
    forbiddenPaths: [/^packages\/providers(?:\/|$)/],
  },
  {
    id: "apps-worker",
    from: /^apps\/worker(?:\/|$)/,
    forbiddenModules: [/^next(?:\/|$)/, /^react(?:\/|$)/],
    forbiddenPaths: [],
  },
];

/** @typedef {{ file: string, ruleId: string, specifier: string, line: number, kind: string, resolvedPath?: string }} BoundaryViolation */

/**
 * @param {string} repoRoot
 * @param {string} relativePath
 * @param {string} specifier
 * @returns {string | undefined}
 */
export function resolveImportPath(repoRoot, relativePath, specifier) {
  if (specifier.startsWith(".")) {
    const absoluteImport = path.resolve(repoRoot, path.dirname(relativePath), specifier);
    const repoRelative = path.relative(repoRoot, absoluteImport).split(path.sep).join("/");
    return repoRelative;
  }

  if (specifier.startsWith("@dce/")) {
    const packageName = specifier.split("/")[0];
    const subpath = specifier.slice(packageName.length + 1);
    const packageDir = path.join("packages", packageName.slice("@dce/".length));
    return subpath ? `${packageDir}/${subpath}` : packageDir;
  }

  return undefined;
}

/**
 * @param {BoundaryRule} rule
 * @param {string} moduleSpecifier
 * @param {string | undefined} resolvedPath
 */
function matchesForbiddenTarget(rule, moduleSpecifier, resolvedPath) {
  if (rule.forbiddenModules.some((pattern) => pattern.test(moduleSpecifier))) {
    return true;
  }

  if (resolvedPath) {
    const normalized = resolvedPath.split(path.sep).join("/").replace(/\/+$/, "");
    return rule.forbiddenPaths.some((pattern) => pattern.test(normalized));
  }

  return false;
}

/**
 * @param {string} source
 * @param {string} fileName
 * @returns {{ specifier: string, line: number, kind: string }[]}
 */
export function extractModuleSpecifiers(source, fileName) {
  const scriptKind = fileName.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : fileName.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : ts.ScriptKind.TS;

  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  /** @type {{ specifier: string, line: number, kind: string }[]} */
  const specifiers = [];

  /**
   * @param {ts.Node} node
   */
  function visit(node) {
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push({
        specifier: node.moduleSpecifier.text,
        line: sourceFile.getLineAndCharacterOfPosition(node.moduleSpecifier.getStart()).line + 1,
        kind: node.importClause?.namedBindings ? "import" : "side-effect-import",
      });
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push({
        specifier: node.moduleSpecifier.text,
        line: sourceFile.getLineAndCharacterOfPosition(node.moduleSpecifier.getStart()).line + 1,
        kind: "re-export",
      });
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push({
        specifier: node.arguments[0].text,
        line: sourceFile.getLineAndCharacterOfPosition(node.arguments[0].getStart()).line + 1,
        kind: "dynamic-import",
      });
    }

    if (ts.isCallExpression(node)) {
      const isRequire =
        (ts.isIdentifier(node.expression) && node.expression.text === "require") ||
        (ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === "require" &&
          node.expression.name.text === "main");

      if (isRequire) {
        const [firstArg] = node.arguments;
        if (firstArg && ts.isStringLiteral(firstArg)) {
          specifiers.push({
            specifier: firstArg.text,
            line: sourceFile.getLineAndCharacterOfPosition(firstArg.getStart()).line + 1,
            kind: "require",
          });
        }
      }
    }

    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const expression = node.moduleReference.expression;
      if (expression && ts.isStringLiteral(expression)) {
        specifiers.push({
          specifier: expression.text,
          line: sourceFile.getLineAndCharacterOfPosition(expression.getStart()).line + 1,
          kind: "import-equals",
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

/**
 * @param {string} relativePath
 * @param {string} source
 * @param {string} repoRoot
 * @returns {BoundaryViolation[]}
 */
export function findViolations(relativePath, source, repoRoot) {
  /** @type {BoundaryViolation[]} */
  const violations = [];
  const applicableRules = boundaryRules.filter((rule) => rule.from.test(relativePath));

  if (applicableRules.length === 0) {
    return violations;
  }

  const specifiers = extractModuleSpecifiers(source, relativePath);

  for (const entry of specifiers) {
    const resolvedPath = resolveImportPath(repoRoot, relativePath, entry.specifier);

    for (const rule of applicableRules) {
      if (matchesForbiddenTarget(rule, entry.specifier, resolvedPath)) {
        violations.push({
          file: relativePath,
          ruleId: rule.id,
          specifier: entry.specifier,
          line: entry.line,
          kind: entry.kind,
          ...(resolvedPath ? { resolvedPath } : {}),
        });
      }
    }
  }

  return violations;
}

/**
 * @param {{ repoRoot: string, relativePath: string, source: string }[]} files
 * @returns {BoundaryViolation[]}
 */
export function scanFileContents(files) {
  /** @type {BoundaryViolation[]} */
  const violations = [];

  for (const file of files) {
    violations.push(...findViolations(file.relativePath, file.source, file.repoRoot));
  }

  return violations;
}
