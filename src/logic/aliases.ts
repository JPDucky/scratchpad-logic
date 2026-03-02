/**
 * Alias table and sigil map for .logic file format parser.
 * Maps user-friendly aliases and sigils to canonical node types.
 */

export interface AliasResolution {
  canonicalType: string;
  branchLabel?: string;
}

/**
 * Complete alias table mapping all 32 aliases to canonical types.
 * Supports case-insensitive lookup.
 */
export const ALIAS_TABLE: Record<string, AliasResolution> = {
  // Start aliases (3)
  start: { canonicalType: 'start' },
  begin: { canonicalType: 'start' },
  s: { canonicalType: 'start' },

  // End aliases (4)
  end: { canonicalType: 'end' },
  done: { canonicalType: 'end' },
  finish: { canonicalType: 'end' },
  e: { canonicalType: 'end' },

  // Process aliases (6)
  process: { canonicalType: 'process' },
  proc: { canonicalType: 'process' },
  step: { canonicalType: 'process' },
  do: { canonicalType: 'process' },
  action: { canonicalType: 'process' },
  p: { canonicalType: 'process' },

  // Decision aliases (5)
  decision: { canonicalType: 'decision' },
  decide: { canonicalType: 'decision' },
  check: { canonicalType: 'decision' },
  if: { canonicalType: 'decision' },
  d: { canonicalType: 'decision' },

  // Goto aliases (3)
  goto: { canonicalType: 'goto' },
  jump: { canonicalType: 'goto' },
  go: { canonicalType: 'goto' },

  // Yes-branch aliases (3)
  yes: { canonicalType: 'branch', branchLabel: 'Yes' },
  true: { canonicalType: 'branch', branchLabel: 'Yes' },
  then: { canonicalType: 'branch', branchLabel: 'Yes' },

  // No-branch aliases (3)
  no: { canonicalType: 'branch', branchLabel: 'No' },
  false: { canonicalType: 'branch', branchLabel: 'No' },
  else: { canonicalType: 'branch', branchLabel: 'No' },

  // Parallel aliases (3)
  parallel: { canonicalType: 'parallel' },
  par: { canonicalType: 'parallel' },
  fork: { canonicalType: 'parallel' },

  // Merge aliases (2)
  merge: { canonicalType: 'merge' },
  join: { canonicalType: 'merge' },
};

/**
 * Sigil map for single-character and multi-character sigils.
 * Includes -family disambiguation: -> (goto) > --- (branch-no) > - (process)
 */
export const SIGIL_MAP: Record<string, AliasResolution> = {
  '>': { canonicalType: 'start' },
  '.': { canonicalType: 'end' },
  '-': { canonicalType: 'process' },
  '?': { canonicalType: 'decision' },
  '+': { canonicalType: 'branch', branchLabel: 'Yes' },
  '->': { canonicalType: 'goto' },
  '---': { canonicalType: 'branch', branchLabel: 'No' },
};

/**
 * Resolve an alias (keyword or sigil) to its canonical type.
 * Case-insensitive for keywords.
 * Returns null if the alias is not recognized.
 */
export function resolveAlias(raw: string): AliasResolution | null {
  // Try exact match first (for sigils)
  if (raw in SIGIL_MAP) {
    return SIGIL_MAP[raw];
  }

  // Try case-insensitive match in alias table
  const lowerRaw = raw.toLowerCase();
  if (lowerRaw in ALIAS_TABLE) {
    return ALIAS_TABLE[lowerRaw];
  }

  return null;
}

/**
 * Check if a string is a known alias (keyword or sigil).
 * Case-insensitive for keywords.
 */
export function isKnownAlias(raw: string): boolean {
  // Check sigils (case-sensitive)
  if (raw in SIGIL_MAP) {
    return true;
  }

  // Check aliases (case-insensitive)
  const lowerRaw = raw.toLowerCase();
  return lowerRaw in ALIAS_TABLE;
}
