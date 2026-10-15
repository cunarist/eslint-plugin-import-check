import type { RuleTextEdit } from "@eslint/core";

import {
  docsUrl,
  type ExplicitRule,
  findImportsConfig,
  normalizePath,
  parentDir,
  quoteLike,
  resolveFrom,
  visitSpecifiers,
} from "#helpers";

/**
 * `no-parent-import` — rejects `../` specifiers, rewriting one to its `#`
 * entry where `package.json` declares an entry for the same file.
 *
 * Reaching up and back down couples two modules through their file layout
 * instead of their public surface.
 */
export const noParentImportRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow parent-relative module specifiers",
      url: docsUrl("no-parent-import"),
    },
    fixable: "code",
    schema: [],
    messages: {
      parentImport: "Unexpected parent-relative import '{{specifier}}'.",
      useAlias: "Parent-relative import '{{specifier}}' should be '{{alias}}'.",
    },
  },
  create(context) {
    return visitSpecifiers((node, specifier) => {
      if (!specifier.startsWith("../")) {
        return;
      }
      const config = findImportsConfig(context.filename);
      const resolved = resolveFrom(parentDir(normalizePath(context.filename)), specifier);
      const entry = config?.byTarget.get(resolved);
      if (entry === undefined) {
        context.report({ node, messageId: "parentImport", data: { specifier } });
        return;
      }
      context.report({
        node,
        messageId: "useAlias",
        data: { specifier, alias: entry.specifier },
        fix: (fixer): RuleTextEdit => fixer.replaceText(node, quoteLike(node, entry.specifier)),
      });
    });
  },
};
