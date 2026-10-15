/**
 * Every rule in the plugin, one file each, registered here by rule id. Which
 * configs turn a rule on is decided in `src/index.ts`, not here, because a rule
 * can belong to more than one config.
 */

import type { ExplicitRule } from "#helpers";

import { enforceImportOrderRule } from "./enforce-import-order.ts";
import { enforceLayerOrderRule } from "./enforce-layer-order.ts";
import { enforceModFileRule } from "./enforce-mod-file.ts";
import { noAbsoluteImportRule } from "./no-absolute-import.ts";
import { noBarrelBypassRule } from "./no-barrel-bypass.ts";
import { noDuplicateImportSourceRule } from "./no-duplicate-import-source.ts";
import { noParentImportRule } from "./no-parent-import.ts";
import { noRelativeBypassRule } from "./no-relative-bypass.ts";
import { noSelfImportRule } from "./no-self-import.ts";
import { noWildcardImportRule } from "./no-wildcard-import.ts";
import { preferAliasImportRule } from "./prefer-alias-import.ts";

/**
 * Every rule, keyed by rule id, in alphabetical order.
 *
 * A `Map` rather than an object literal: a rule record is a lookup keyed by
 * rule id, so the ids belong in value position.
 */
export const rules: Map<string, ExplicitRule> = new Map([
  ["enforce-import-order", enforceImportOrderRule],
  ["enforce-layer-order", enforceLayerOrderRule],
  ["enforce-mod-file", enforceModFileRule],
  ["no-absolute-import", noAbsoluteImportRule],
  ["no-barrel-bypass", noBarrelBypassRule],
  ["no-duplicate-import-source", noDuplicateImportSourceRule],
  ["no-parent-import", noParentImportRule],
  ["no-relative-bypass", noRelativeBypassRule],
  ["no-self-import", noSelfImportRule],
  ["no-wildcard-import", noWildcardImportRule],
  ["prefer-alias-import", preferAliasImportRule],
]);
