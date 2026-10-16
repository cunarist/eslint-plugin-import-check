import type { RuleTextEdit } from "@eslint/core";

import {
  docsUrl,
  type ExplicitRule,
  findImportsConfig,
  findOwningEntry,
  normalizePath,
  parentDir,
  quoteLike,
  resolveFrom,
  visitSpecifiers,
} from "#helpers";

/**
 * `prefer-alias-import` — requires the `#` alias when a `./` specifier
 * crosses into another folder whose file `package.json` already declares as
 * an entry. Same-folder siblings are left alone.
 *
 * One spelling per module keeps `package.json` `imports` the single source of
 * truth, and keeps the layer rules from being sidestepped by a path.
 */
export const preferAliasImportRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require the `#` alias for a module that `package.json` declares",
      url: docsUrl("prefer-alias-import"),
    },
    fixable: "code",
    schema: [],
    messages: {
      useAlias: "'{{specifier}}' is declared as '{{alias}}' in package.json.",
    },
  },
  create(context) {
    return visitSpecifiers((node, specifier) => {
      // Parent specifiers are banned outright by "no-parent-import", which
      // already offers this same rewrite.
      if (!specifier.startsWith("./")) {
        return;
      }
      const config = findImportsConfig(context.filename);
      if (config === null) {
        return;
      }
      const here = parentDir(normalizePath(context.filename));
      const resolved = resolveFrom(here, specifier);
      // A same-folder sibling is the form every other rule recommends.
      if (parentDir(resolved) === here) {
        return;
      }
      const entry = config.byTarget.get(resolved);
      if (entry === undefined) {
        return;
      }
      // Reaching your own entry point is never fixed by switching to the
      // alias, so "enforce-layer-order" owns that case alone.
      if (findOwningEntry(config, context.filename)?.index === entry.index) {
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
