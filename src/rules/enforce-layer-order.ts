import {
  docsUrl,
  type ExplicitRule,
  findImportsConfig,
  findOwningEntry,
  resolveTarget,
  visitSpecifiers,
} from "#helpers";

/**
 * `enforce-layer-order` — treats the order of `#` entries in `package.json`
 * `imports` as the layer order, top layer first: a module may only import
 * modules declared below it. Also rejects a file that imports its own
 * module's entry point, by alias or by path.
 *
 * This makes cycles between modules structurally impossible rather than
 * merely detectable.
 */
export const enforceLayerOrderRule: ExplicitRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce the order of `package.json` `imports` as the layer order",
      url: docsUrl("enforce-layer-order"),
    },
    schema: [],
    messages: {
      ownEntry: "'{{owner}}' must not import its own entry point through '{{specifier}}'.",
      upward:
        "'{{owner}}' must not import '{{target}}', which is declared above it in package.json.",
    },
  },
  create(context) {
    return visitSpecifiers((node, specifier) => {
      const config = findImportsConfig(context.filename);
      if (config === null) {
        return;
      }
      const owner = findOwningEntry(config, context.filename);
      const target = resolveTarget(config, context.filename, specifier);
      if (owner === null || target === null) {
        return;
      }
      if (target.index === owner.index) {
        context.report({
          node,
          messageId: "ownEntry",
          data: { owner: owner.specifier, specifier },
        });
        return;
      }
      if (target.index < owner.index) {
        context.report({
          node,
          messageId: "upward",
          data: { owner: owner.specifier, target: target.specifier },
        });
      }
    });
  },
};
