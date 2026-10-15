import type { TSESTree } from "@typescript-eslint/types";

import {
  baseName,
  docsUrl,
  type ExplicitRule,
  normalizePath,
  REJECTED_STEMS,
  stemName,
  visitSpecifiers,
} from "#helpers";

/**
 * `enforce-mod-file` — requires module entry points to be named `index.ts`,
 * the Node.js convention. Reports both a file named `mod` and any project
 * specifier pointing at one.
 *
 * The rule keeps the name of the Deno plugin's rule, which required `mod.ts`;
 * on Node.js the entry point is `index.ts`. One name everywhere means a
 * module's entry point is never ambiguous.
 */
export const enforceModFileRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce `index.ts` as the name of module entry points",
      url: docsUrl("enforce-mod-file"),
    },
    schema: [],
    messages: {
      fileName: "Expected the entry point to be named 'index.ts' but found '{{name}}'.",
      specifier: "'{{specifier}}' points at a 'mod' entry point.",
    },
  },
  create(context) {
    const specifiers = visitSpecifiers((node, specifier) => {
      // Only paths this project controls. A package may ship whatever file
      // names it likes.
      if (!specifier.startsWith(".") && !specifier.startsWith("#")) {
        return;
      }
      if (REJECTED_STEMS.includes(stemName(specifier))) {
        context.report({ node, messageId: "specifier", data: { specifier } });
      }
    });
    return {
      ...specifiers,
      Program(node: TSESTree.Program): void {
        const filename = normalizePath(context.filename);
        if (REJECTED_STEMS.includes(stemName(filename))) {
          context.report({ node, messageId: "fileName", data: { name: baseName(filename) } });
        }
      },
    };
  },
};
