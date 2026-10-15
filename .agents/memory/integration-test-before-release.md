---
description: Before a release, lint bad and good files from separate ESLint and Vite+ consumer projects
---

Unit tests run rules through both `RuleTester`s; that is not the deployment
path. Before release, `vp pack`, `npm pack`, install the tarball into
_separate_ consumer projects, and lint a deliberately-bad file and a known-good
one — once with `vp lint` and `jsPlugins`, once with ESLint 9 and
the `import-check` config, in a project with a layered `package.json` `imports`. On the sibling Lit plugin that check caught two bugs 313
unit tests missed.

---
