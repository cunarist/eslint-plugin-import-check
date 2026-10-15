/**
 * Finding every module specifier in a file: static imports, re-exports,
 * dynamic imports, and type-level `import("...")`.
 */

import type { RuleVisitor } from "@eslint/core";
import type { TSESTree } from "@typescript-eslint/types";

/** A node holding a statically known module specifier. */
export type SpecifierNode = TSESTree.StringLiteral | TSESTree.TemplateLiteral;

/** What a rule does with one specifier. */
export type SpecifierCheck = (node: SpecifierNode, specifier: string) => void;

/** Every statement or expression that carries a module specifier. */
type SourceBearingNode =
  | TSESTree.ImportDeclaration
  | TSESTree.ExportNamedDeclaration
  | TSESTree.ExportAllDeclaration
  | TSESTree.ImportExpression;

/**
 * Builds a visitor that runs `check` for every module specifier in a file,
 * so each rule only describes what to do with one specifier.
 */
export function visitSpecifiers(check: SpecifierCheck): RuleVisitor {
  function handle(node: SourceBearingNode): void {
    const source = node.source;
    // Dynamic imports accept any expression, and a re-export without a
    // specifier has none at all. Only literal strings are analyzable.
    if (source === null) {
      return;
    }
    // A backtick with nothing to substitute is as fixed as a quoted string
    // and resolves the same way, so it must not become a way to write a
    // specifier the rules never see.
    if (source.type === "TemplateLiteral") {
      const [quasi] = source.quasis;
      if (source.expressions.length === 0 && source.quasis.length === 1 && quasi !== undefined) {
        check(source, quasi.value.raw);
      }
      return;
    }
    if (source.type === "Literal" && typeof source.value === "string") {
      check(source, source.value);
    }
  }

  return {
    ImportDeclaration: handle,
    ExportNamedDeclaration: handle,
    ExportAllDeclaration: handle,
    ImportExpression: handle,
    // `type T = import("#utils").Thing` reaches another module without an
    // import statement, so it needs its own node.
    TSImportType(node: TSESTree.TSImportType): void {
      check(node.source, node.source.value);
    },
  };
}

/**
 * Rewrites a specifier while keeping the original quote character. A template
 * literal has no quote of its own, and rewriting it as a plain string is the
 * point, so it falls through to double quotes.
 */
export function quoteLike(original: SpecifierNode, specifier: string): string {
  const quote = original.type === "Literal" && original.raw.startsWith("'") ? "'" : '"';
  return quote + specifier + quote;
}
