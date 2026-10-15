/**
 * Reads the `#` entries of the nearest `package.json` `imports` field, the
 * Node.js subpath imports that name a project's modules and, by their order,
 * its layers.
 */

import { readFileSync, statSync } from "node:fs";

import { isInsideDir, normalizePath, parentDir, resolveFrom, stemName } from "./paths.ts";

/**
 * File name stems that mark a directory's public entry point. Compared
 * without the extension so `.ts`, `.tsx`, `.js` and friends all count.
 */
export const BARREL_STEMS: string[] = ["index", "mod"];

/**
 * Barrel stems the `enforce-mod-file` rule rejects. They stay in
 * `BARREL_STEMS` so a project that turns that rule off still has its entry
 * points recognized.
 */
export const REJECTED_STEMS: string[] = ["mod"];

/** The config file searched for in every directory up from a file. */
const CONFIG_NAME = "package.json";

/** A query or fragment suffix, which never names part of a path. */
const QUERY_PATTERN: RegExp = /[?#].*$/u;

/** A path written with a Windows drive after a leading slash, as in `/C:/dir`. */
const SLASHED_DRIVE_PATTERN: RegExp = /^\/[a-zA-Z]:/u;

/** A single `#`-prefixed entry of the `imports` map in `package.json`. */
export interface ModuleEntry {
  /** The bare specifier, such as `#utils`. */
  specifier: string;
  /** Normalized absolute path the specifier resolves to. */
  target: string;
  /**
   * The directory this module owns. For a barrel such as
   * `./src/utils/index.ts` this is `./src/utils`, meaning every file below it
   * belongs to the module. For a plain file entry it equals `target`, so the
   * module owns nothing but itself.
   */
  dir: string;
  /** Whether `target` is a barrel file rather than a plain module. */
  isBarrel: boolean;
  /** Declaration order in `package.json`, which defines the layer order. */
  index: number;
}

/**
 * A `#`-prefixed subpath pattern with one `*`, such as `#utils/*`, which lets
 * importers reach files inside a module directly.
 */
export interface PatternEntry {
  /** The whole pattern key, such as `#utils/*`. */
  specifier: string;
  /** The key before its `*`, such as `#utils/`. */
  prefix: string;
  /** The key after its `*`, usually empty. */
  suffix: string;
  /** The target as written, such as `./src/utils/*`. */
  target: string;
}

/** The `#`-prefixed portion of a `package.json` `imports` map. */
export interface ImportsConfig {
  /** Normalized absolute directory containing the config file. */
  configDir: string;
  /** Exact `#` entries in declaration order. */
  entries: ModuleEntry[];
  /** Lookup from a normalized absolute path to the entry pointing at it. */
  byTarget: Map<string, ModuleEntry>;
  /** Lookup from a bare specifier such as `#utils` to its entry. */
  bySpecifier: Map<string, ModuleEntry>;
  /** Subpath patterns, longest prefix first. */
  patterns: PatternEntry[];
}

/** A config file read from disk, and the modification time it was read at. */
interface CachedConfig {
  mtimeMs: number;
  config: ImportsConfig | null;
}

/**
 * Parsed configs keyed by file path. An entry is reused only while the file's
 * modification time is unchanged, so an editor session sees edits.
 */
const configCache = new Map<string, CachedConfig>();

/** The modification time of a file, or `null` when it does not exist. */
function modifiedAt(path: string): number | null {
  try {
    const stats = statSync(path, { throwIfNoEntry: false });
    return stats?.isFile() === true ? stats.mtimeMs : null;
  } catch {
    return null;
  }
}

/**
 * Walks up from a file to the nearest `package.json` and reads its
 * `#`-prefixed imports. Like Node.js, the search stops at that file even when
 * it declares no `#` entries, so a nested package never borrows the imports
 * of an enclosing one. Returns `null` when no `package.json` exists up the
 * tree, or when the nearest one cannot be read or declares no local `#` entry.
 */
export function findImportsConfig(fromFile: string): ImportsConfig | null {
  let dir = parentDir(normalizePath(fromFile));
  for (;;) {
    const configPath = `${dir}/${CONFIG_NAME}`;
    const mtimeMs = modifiedAt(configPath);
    if (mtimeMs !== null) {
      return cachedConfig(configPath, dir, mtimeMs);
    }
    const parent = parentDir(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/** One config file, read through the cache. */
function cachedConfig(
  configPath: string,
  configDir: string,
  mtimeMs: number,
): ImportsConfig | null {
  const cached = configCache.get(configPath);
  if (cached?.mtimeMs === mtimeMs) {
    return cached.config;
  }
  const config = readConfig(configPath, configDir);
  configCache.set(configPath, { mtimeMs, config });
  return config;
}

/** The `imports` object of a parsed `package.json`, or `null` if it has none. */
function importsField(parsed: unknown): object | null {
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }
  const imports: unknown = Reflect.get(parsed, "imports");
  return typeof imports === "object" && imports !== null ? imports : null;
}

/**
 * Reads and parses one config file. Returns `null` when the file
 * is unreadable, is not JSON, or has no local `#` entries.
 */
function readConfig(configPath: string, configDir: string): ImportsConfig | null {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    return null;
  }
  const imports = importsField(parsed);
  if (imports === null) {
    return null;
  }

  const entries: ModuleEntry[] = [];
  const byTarget = new Map<string, ModuleEntry>();
  const bySpecifier = new Map<string, ModuleEntry>();
  const patterns: PatternEntry[] = [];

  for (const [specifier, value] of Object.entries(imports)) {
    // Only relative string targets point at local files. A "#" alias for a
    // package, or a condition object, is legitimate but irrelevant here.
    if (
      !specifier.startsWith("#") ||
      typeof value !== "string" ||
      !(value.startsWith("./") || value.startsWith("../"))
    ) {
      continue;
    }

    const star = specifier.indexOf("*");
    if (star !== -1) {
      patterns.push({
        specifier,
        prefix: specifier.slice(0, star),
        suffix: specifier.slice(star + 1),
        target: value,
      });
      continue;
    }

    const target = resolveFrom(configDir, value);
    const isBarrel = BARREL_STEMS.includes(stemName(target));
    const entry: ModuleEntry = {
      specifier,
      target,
      dir: isBarrel ? parentDir(target) : target,
      isBarrel,
      index: entries.length,
    };
    entries.push(entry);
    bySpecifier.set(specifier, entry);
    // First declaration wins when two specifiers share a target.
    if (!byTarget.has(target)) {
      byTarget.set(target, entry);
    }
  }

  if (entries.length === 0 && patterns.length === 0) {
    return null;
  }

  patterns.sort((a, b) => b.prefix.length - a.prefix.length);

  return { configDir, entries, byTarget, bySpecifier, patterns };
}

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
