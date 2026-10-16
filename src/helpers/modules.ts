/**
 * Looks up the modules a `package.json` `imports` config declares: which
 * module owns a file, which one a specifier names, and whether an import
 * falls under the folder-layout rules.
 */

import {
  findImportsConfig,
  type ImportsConfig,
  type ModuleEntry,
  type PatternEntry,
  QUERY_PATTERN,
  SLASHED_DRIVE_PATTERN,
} from "./imports.ts";
import { isInsideDir, normalizePath, parentDir, resolveFrom } from "./paths.ts";

/**
 * Finds the module that owns a file, which is the entry with the most
 * specific directory containing it. Returns `null` for files outside every
 * declared module, such as scripts or config files.
 */
export function findOwningEntry(config: ImportsConfig, filePath: string): ModuleEntry | null {
  const path = normalizePath(filePath);
  let best: ModuleEntry | null = null;
  for (const entry of config.entries) {
    const owns = entry.target === path || (entry.isBarrel && isInsideDir(path, entry.dir));
    if (owns && (best === null || entry.dir.length > best.dir.length)) {
      best = entry;
    }
  }
  return best;
}

/**
 * Finds the subpath pattern a deep `#` specifier reaches through, such as
 * `#utils/*` for `#utils/internal.ts`. Returns `null` when none match.
 */
export function findPatternEntry(config: ImportsConfig, specifier: string): PatternEntry | null {
  for (const pattern of config.patterns) {
    if (
      specifier.length >= pattern.prefix.length + pattern.suffix.length &&
      specifier.startsWith(pattern.prefix) &&
      specifier.endsWith(pattern.suffix)
    ) {
      return pattern;
    }
  }
  return null;
}

/**
 * The exact entry a subpath pattern belongs to: `#utils` for `#utils/*`.
 * Returns `null` when the pattern does not end in `/*` or no such entry exists.
 */
export function patternOwner(config: ImportsConfig, pattern: PatternEntry): ModuleEntry | null {
  if (!pattern.prefix.endsWith("/") || pattern.suffix !== "") {
    return null;
  }
  return config.bySpecifier.get(pattern.prefix.slice(0, -1)) ?? null;
}

/**
 * Resolves the module a `#` specifier belongs to, whether it is an exact
 * entry such as `#utils` or a deep one such as `#utils/internal.ts`.
 */
export function targetModule(config: ImportsConfig, specifier: string): ModuleEntry | null {
  const exact = config.bySpecifier.get(specifier);
  if (exact !== undefined) {
    return exact;
  }
  const pattern = findPatternEntry(config, specifier);
  return pattern === null ? null : patternOwner(config, pattern);
}

/**
 * Resolves a local module specifier far enough to tell which file it names.
 * Package specifiers have no local target, so they give `null`.
 */
export function resolveLocalSpecifier(filename: string, specifier: string): string | null {
  const path = specifier.replace(QUERY_PATTERN, "");
  if (specifier.startsWith(".")) {
    return resolveFrom(parentDir(normalizePath(filename)), path);
  }
  if (specifier.startsWith("file:")) {
    return normalizePath(path);
  }
  if (specifier.startsWith("/")) {
    const absolute = normalizePath(path);
    return SLASHED_DRIVE_PATTERN.test(absolute) ? absolute.slice(1) : absolute;
  }
  if (!specifier.startsWith("#")) {
    return null;
  }

  const config = findImportsConfig(filename);
  if (config === null) {
    return null;
  }
  const exact = config.bySpecifier.get(specifier);
  if (exact !== undefined) {
    return exact.target;
  }
  const pattern = findPatternEntry(config, specifier);
  if (pattern === null) {
    return null;
  }
  const matched = specifier
    .slice(pattern.prefix.length, specifier.length - pattern.suffix.length)
    .replace(QUERY_PATTERN, "");
  return resolveFrom(config.configDir, pattern.target.replaceAll("*", matched));
}

/**
 * The module a specifier points at, whether it was written as a `#` alias or
 * as a path. Resolving both means the layer rules cannot be sidestepped by
 * spelling the same target a different way. Returns `null` for specifiers
 * that leave the project, such as package names.
 */
export function resolveTarget(
  config: ImportsConfig,
  filename: string,
  specifier: string,
): ModuleEntry | null {
  if (specifier.startsWith("#")) {
    return targetModule(config, specifier);
  }
  if (!specifier.startsWith(".")) {
    return null;
  }
  const resolved = resolveFrom(parentDir(normalizePath(filename)), specifier);
  return config.byTarget.get(resolved) ?? null;
}

/**
 * Whether a path lies in a module some `#` entry owns: the entry's own file,
 * or anything in a barrel entry's folder, the folder itself included.
 */
export function isModulePath(config: ImportsConfig, path: string): boolean {
  const normalized = normalizePath(path);
  return config.entries.some(
    (entry) =>
      entry.target === normalized ||
      (entry.isBarrel && (entry.dir === normalized || isInsideDir(normalized, entry.dir))),
  );
}

/**
 * Whether the folder-layout rules check a specifier at all. They guard the
 * folders `#` entries own, so an import is in scope when the importing file
 * or the file it names lies in such a module. Imports between files outside
 * every module, such as `vite.config.ts` reaching `./scripts/build.ts`, are
 * plain file imports and stay unchecked; so is everything in a project whose
 * `package.json` declares no `#` entry.
 */
export function isInModuleScope(filename: string, specifier: string): boolean {
  const config = findImportsConfig(filename);
  if (config === null) {
    return false;
  }
  if (isModulePath(config, filename)) {
    return true;
  }
  const target = resolveLocalSpecifier(filename, specifier);
  return target !== null && isModulePath(config, target);
}
