import type { RuleTextEdit } from "@eslint/core";

import {
  docsUrl,
  type ExplicitRule,
  findImportsConfig,
  findPatternEntry,
  patternOwner,
  quoteLike,
  visitSpecifiers,
} from "#helpers";

/**
 * `no-barrel-bypass` — rejects reaching past a module's entry point through a
 * `#` subpath pattern, such as `#components/internal.ts` through
 * `"#components/*"`.
 *
 * Whatever a file needs should be re-exported from the module's entry point,
 * so the module keeps one public surface. Switching to that entry point is a
 * suggestion, since the entry point may not export the name yet.
 */
export const noBarrelBypassRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `#` specifiers that reach past a module's entry point",
      url: docsUrl("no-barrel-bypass"),
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      bypass: "'{{specifier}}' reaches past the entry point '{{owner}}'.",
      internals: "'{{specifier}}' reaches into module internals.",
      useEntry: "Import from '{{owner}}' instead.",
    },
  },
  create(context) {
    return visitSpecifiers((node, specifier) => {
      if (!specifier.startsWith("#")) {
        return;
      }
      const config = findImportsConfig(context.filename);
      if (config === null || config.bySpecifier.has(specifier)) {
        return;
      }
      const pattern = findPatternEntry(config, specifier);
      if (pattern === null) {
        return;
      }
      const owner = patternOwner(config, pattern);
      if (owner === null) {
        context.report({ node, messageId: "internals", data: { specifier } });
        return;
      }
      context.report({
        node,
        messageId: "bypass",
        data: { specifier, owner: owner.specifier },
        suggest: [
          {
            messageId: "useEntry",
            data: { owner: owner.specifier },
            fix: (fixer): RuleTextEdit => fixer.replaceText(node, quoteLike(node, owner.specifier)),
          },
        ],
      });
    });
  },
};
