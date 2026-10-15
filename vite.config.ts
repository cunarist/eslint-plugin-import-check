import { defineConfig } from "vite-plus";

import importCheck from "#plugin";
import projectLint from "#project-lint";

export default defineConfig({
  // Keep package.json in its hand-written order.
  fmt: { sortPackageJson: false },
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "import"],
    // Lints itself from source; `scripts/project-lint.ts` holds the repo's own
    // rule list and repo-only rules, never published.
    jsPlugins: ["./src/index.ts", "./scripts/project-lint.ts"],
    categories: { correctness: "error", suspicious: "error", pedantic: "error", perf: "error" },
    rules: { ...importCheck.configs.all.rules, ...projectLint.configs.project.rules },
    // File globs are config, not a rule list: the registry imports every rule.
    overrides: [{ files: ["src/rules/index.ts"], rules: { "import/max-dependencies": "off" } }],
    options: {
      typeAware: true,
      typeCheck: true,
      maxWarnings: 0,
      reportUnusedDisableDirectives: "error",
    },
  },
  pack: {
    entry: "src/index.ts",
    dts: true,
    fixedExtension: false,
  },
});
