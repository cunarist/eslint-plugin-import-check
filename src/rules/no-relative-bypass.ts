import {
  BARREL_STEMS,
  docsUrl,
  type ExplicitRule,
  isInModuleScope,
  stemName,
  visitSpecifiers,
} from "#helpers";

/**
 * `no-relative-bypass` — rejects a `./` specifier that descends more than one
 * level, or lands anywhere in a subfolder but its entry point.
 *
 * Together with `no-parent-import` this leaves exactly two ways to reach
 * another module: a sibling file, or a `#` entry. Imports between files
 * outside every `#` module, such as `./scripts/build.ts` from
 * `vite.config.ts`, are left alone.
 */
export const noRelativeBypassRule: ExplicitRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow relative specifiers that reach past a subfolder's entry point",
      url: docsUrl("no-relative-bypass"),
    },
    schema: [],
    messages: {
      bypass: "'{{specifier}}' reaches past the entry point of './{{folder}}'.",
    },
  },
  create(context) {
    return visitSpecifiers((node, specifier) => {
      // Parent imports belong to "no-parent-import", and bare or "#"
      // specifiers never walk the file tree.
      if (!specifier.startsWith("./")) {
        return;
      }
      const segments = specifier
        .slice(2)
        .split("/")
        .filter((segment) => segment !== "" && segment !== ".");
      const [folder, file] = segments;
      // A single segment is a sibling file, which is always fine.
      if (folder === undefined || file === undefined) {
        return;
      }
      if (segments.length === 2 && BARREL_STEMS.includes(stemName(file))) {
        return;
      }
      if (!isInModuleScope(context.filename, specifier)) {
        return;
      }
      context.report({ node, messageId: "bypass", data: { specifier, folder } });
    });
  },
};
