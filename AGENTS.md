At the start of every new session, run `damem recall` in the terminal and treat
its output as the context for this repository. If the `damem` command is not
found, read [INSTALL.md](https://github.com/cunarist/damem/blob/main/INSTALL.md)
and follow it before reasoning or responding.

# AGENTS.md

## Project

- **@cunarist/eslint-plugin-import-check**: import rules that keep a module
  graph layered and free of cycles, with the order of `package.json` `imports`
  as the layer order. One ESLint plugin that also runs under Oxlint. Namespace
  `@cunarist/import-check`, 11 rules in one config, `import-check`.
- The package's only export is the default one, the plugin. Configs live at
  `plugin.configs`: `import-check` and `all` (every rule, built from the rule
  registry). No `recommended`, no named exports.
- Runs on Node.js 22+; Bun is not a supported target. Built with Vite+ (`vp`):
  Oxlint, Oxfmt, type checking, Vitest, tsdown.
- Ported from the lint plugin of `jsr:@cunarist/deno-import-check` (its
  `./lint` entry). The published plugin mirrors exactly its 11 rules, nothing
  added or removed. Its CLI was not ported.

## Rules

- `vp check`, `vp test`, and `vp pack` must all pass. `vp check --fix` formats.
- The only config files are `package.json`, `tsconfig.json`, and
  `vite.config.ts`, plus `package-lock.json`. Only `.ts` source files, configs
  included; there are no `.js`, `.mjs`, `.cjs`, `.jsx`, or `.tsx` files. The
  only other JSON files are the rule-test fixtures under
  `src/testing/fixture/`: its `package.json` and a nested one that proves the
  config lookup stops at the nearest `package.json`, as Node.js does.
- Every directory's entry file is `index.ts`. Every rule lives flat in
  `src/rules/<rule-id>.ts`, tested in `src/rules/<rule-id>.test.ts` and
  registered in `src/rules/index.ts`.
- Each rule file has one named export with a `Rule` suffix, e.g.
  `export const noSelfImportRule`. The package's only default export is the
  plugin, defined in `src/plugin/index.ts` and re-exported by the package
  entry `src/index.ts`; `scripts/project-lint.ts` default-exports its own.
- Configs are lists of rule ids in `src/plugin/index.ts`. `all` is built from the
  registry.
- Shared code in `src/` comes through `#` aliases, never a relative path out
  of a directory. An alias may point only at a direct subfolder of `src/`
  (`#testing`, `#helpers`), never at `src/` itself, a deeper folder, or
  anything outside `src/`. The `imports` key order is the layer order the
  repo's own `enforce-layer-order` checks: `#plugin`, `#rules`, `#testing`,
  `#helpers`. Code outside `src/` uses relative paths: `vite.config.ts`
  imports `./src/index.ts` and `./scripts/project-lint.ts`. Source imports only `.ts` files, never JSON; rules read
  `package.json` with `node:fs`.
- `meta.name` and `meta.version` are written out in `src/plugin/index.ts`; a release
  bumps them with `package.json`, and `tests/package-meta.test.ts` checks both.
- Rules use ESLint's standard `create` API, typed `ExplicitRule`, with every
  visitor's node parameter annotated. Messages are one ESLint-style sentence.
- Unit tests sit next to the code as `*.test.ts`. Regression and integration
  tests go in `tests/` and use only the plugin, through `#plugin`.
- Every rule test runs under both ESLint's and Oxlint's `RuleTester` through
  `testRule`, called exactly once per rule file with every case in its `valid`
  and `invalid` lists. Write cases once, in ESLint's shape and 1-based columns.
- Rules this repo enforces on itself but does not publish live in
  `scripts/project-lint.ts`, so far an unchanged copy from
  cunarist/eslint-plugin-explicit-types (header included, which is why it
  names that plugin). Rules needed for this repo's Deno lint parity get added
  there. `scripts/` is repo tooling, never packed or published, and has no
  tests.
- The repo lints itself with its own rules. Lint disable and enable comments
  (`eslint-*` or `oxlint-*`, any form) fail `vp check`; fix the source.
- `vite.config.ts` lists no rule by name: its `rules` spreads
  `configs.all.rules` from `src/index.ts` and `configs.project.rules` from
  `scripts/project-lint.ts`. Only `overrides`, being file globs, stays there.
- Every rule has a `docs/rules/<rule>.md` in the ESLint core layout: Rule
  Details, incorrect/correct examples, and When Not To Use It. `npm run docs`
  regenerates the headers and the README rules list after `vp pack`.
- Never add a second import sorter beside `enforce-import-order`.
- CI runs every rule test, ESLint and Oxlint halves alike, on node@22 and
  node@latest. Bun is not tested and not supported.
- `package.json` keys stay in hand-written order (metadata, then `scripts`,
  `exports`, `imports`, dependencies); `fmt.sortPackageJson` is off. There is
  no `packageManager` field; npm is detected from `package-lock.json`.
- Only CI publishes, from a published GitHub release `vX.Y.Z` that matches
  `package.json`. Use the `release` skill and ask the user first.
- Release notes live only on GitHub releases. There is no `CHANGELOG.md`; never
  add one.
