# .logic File Format: Parser, Serializer & Import/Export

## TL;DR

> **Quick Summary**: Implement the `.logic` file format parser and serializer for scratchpad-logic, enabling import/export of flowcharts as human-writable text files. The parser accepts multiple syntax families ("chaos, captured" architecture) and normalizes to the app's canonical `OutlineNode[]` structure.
> 
> **Deliverables**:
> - `.logic` file parser: text → `OutlineNode[]` (supports bracket, keyword, sigil, and inference syntax)
> - `.logic` file serializer: `OutlineNode[]` → text (bracket syntax only for v1)
> - Import/Export UI: buttons in Header for loading and saving `.logic` files
> - Test infrastructure: Vitest setup + comprehensive test suite for all parser/serializer components
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves + final verification
> **Critical Path**: T1 (vitest) → T6 (lexer) → T9 (parser entry) → T10 (UI wiring)

---

## Context

### Original Request
Design and implement a `.logic` file format for the scratchpad-logic flowchart brainstorming tool. The format should be human-writable in vim/any editor, accept multiple syntax styles that normalize to a canonical form, and enable import/export of flowcharts.

### Interview Summary
**Key Discussions**:
- **"Chaos, captured" philosophy**: Accept any of 4 syntax families (bracket `[type]`, keyword `type:`, sigil `> - ? .`, inference), normalize all to canonical `OutlineNode[]`. Validated against 9+ production systems (Git DWIM, HCL, Docker Compose, etc.).
- **Indentation**: 2-space strict, tabs are hard errors. "Hierarchy is paramount."
- **Comment semantics**: File comments (`//`, `#`) are completely ignored by parser. App's `isComment` disabled-node concept is deferred — not exported in v1.
- **Integration model**: Import/Export only for v1. localStorage stays primary storage. No rearchitecture.
- **Export style**: Bracket syntax only for v1. No settings UI for export style.
- **Type inference**: Conservative only — `?` suffix → decision, everything else → process. No positional inference.
- **Error philosophy**: Strict on structure (indentation errors = hard failure), loose on syntax (unknown types → process).
- **Goto/anchors**: Explicit `@name` syntax, user-defined names, broken refs parsed but flagged.
- **Multi-line labels**: Backslash continuation (`\` at end of line).

**Research Findings**:
- Parser architecture validated by HCL (separate parsers, unified AST), Git (ordered rule expansion), Docker Compose (type dispatch)
- `-` family disambiguation resolved: `->` (goto) > `---` exact (branch-no) > `-` (process). Backed by CommonMark/YAML specs.
- `#` is always a comment, never dual-use. Covers ~95% of developer backgrounds with `//` + `#`.
- Branch nodes in the codebase use `type: 'branch'` with `label: 'Yes'`/`'No'`, NOT separate `yes`/`no` types.

### Metis Review
**Identified Gaps** (addressed):
- Comment semantics mismatch → Resolved: file comments ignored, `isComment` deferred
- Integration model ambiguity → Resolved: import/export only for v1
- Branch type mapping → Resolved: `[yes]`/`[no]` → `{ type: 'branch', label: 'Yes'/'No' }`
- No test infrastructure → Resolved: Vitest setup as first task
- Round-trip preservation → Deferred to v2, v1 always exports brackets
- Hydration model → Deferred to v2, fresh IDs on every import

---

## Work Objectives

### Core Objective
Build a `.logic` file parser and serializer as pure functions in `src/logic/`, with import/export UI in the app header, enabling users to save and load flowcharts as human-readable text files.

### Concrete Deliverables
- `src/logic/` module with parser, serializer, and all supporting files
- `src/logic/__tests__/` comprehensive Vitest test suite
- Import button in Header: opens file picker → parses `.logic` → creates new document
- Export button in Header: serializes active document → downloads `.logic` file
- Parse error display when import fails

### Definition of Done
- [ ] `npx vitest run` → all tests pass (0 failures)
- [ ] `tsc -b` → no type errors
- [ ] Import a `.logic` file → flowchart renders correctly in both outline and flowchart views
- [ ] Export a document → downloaded `.logic` file is valid and re-importable
- [ ] Mixed-syntax `.logic` file (bracket + keyword + sigil + inference) parses correctly
- [ ] Indentation errors produce clear error messages
- [ ] Goto anchors resolve correctly after import

### Must Have
- Parser accepts ALL 4 syntax families (bracket, keyword, sigil, inference) plus comments
- 2-space strict indentation enforcement with clear error messages
- Tab rejection with error message
- Alias table: all documented aliases resolve correctly (case-insensitive)
- Sigil map: all documented sigils work, including `-` family disambiguation
- Branch type mapping: `[yes]`/`[no]` → `{ type: 'branch', label: 'Yes'/'No', children: [] }`
- Multi-line label support via backslash continuation
- Goto anchor declaration (`@name`) and resolution (post-processing)
- Broken goto refs: parse succeeds, `targetId` left undefined
- Empty lines ignored
- Unknown type keywords → `process` (soft fallback)
- Serializer: bracket syntax only, 2-space indent
- Import: file picker → parse → create new document with parsed nodes
- Export: serialize active document → download as `.logic` file
- `isComment` nodes silently omitted from export (not exported at all)
- All parser functions are pure (no React, no store imports)

### Must NOT Have (Guardrails)
- **DO NOT** modify `src/types.ts` — the `OutlineNode` and `NodeType` types are the parser's target, not its input
- **DO NOT** modify `src/store.tsx` except to add an `importDocument(nodes: OutlineNode[], name: string)` method if needed for UI wiring
- **DO NOT** build a settings UI for export style selection — hardcode brackets
- **DO NOT** implement hydration model (`.logic.json` dual-file) — deferred to v2
- **DO NOT** implement round-trip style preservation — deferred to v2
- **DO NOT** implement stable ID matching across re-imports — every import generates fresh IDs
- **DO NOT** add external parser libraries (Chevrotain, PEG.js, tree-sitter, nearley)
- **DO NOT** implement variable interpolation (`${var}`) — reserved but not active
- **DO NOT** implement module system (`@import`/`@export`) — deferred
- **DO NOT** export `isComment` nodes in any form — silently skip them
- **DO NOT** support inline comments (`[process] Do thing // not a comment` — the `//` is part of the label)
- **DO NOT** add excessive JSDoc or documentation comments — code should be self-documenting
- **DO NOT** create abstract base classes or over-engineered inheritance hierarchies for parsers
- **DO NOT** add `parallel` or `merge` node type parsing beyond what the alias table provides — these types exist in the app but have no special parsing behavior

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO — must be set up
- **Automated tests**: YES (TDD) — RED → GREEN → REFACTOR for each parser component
- **Framework**: Vitest (integrates natively with Vite 7 project)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

| Deliverable Type | Verification Tool | Method |
|------------------|-------------------|--------|
| Parser module | Bash (vitest) | `npx vitest run src/logic/__tests__/{file}` |
| Serializer module | Bash (vitest) | `npx vitest run src/logic/__tests__/serializer.test.ts` |
| UI buttons | Playwright | Navigate, click import/export, verify behavior |
| Type safety | Bash (tsc) | `tsc -b` — zero errors |
| Full integration | Playwright | Import `.logic` file → verify outline + flowchart rendering |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation, 5 parallel):
├── Task 1: Vitest + test infrastructure setup [quick]
├── Task 2: src/logic/types.ts — parser-specific types [quick]
├── Task 3: src/logic/aliases.ts — alias table + sigil map [quick]
├── Task 4: src/logic/serializer.ts — OutlineNode[] → .logic text [unspecified-high]
└── Task 5: Import/Export UI scaffold in Header.tsx [visual-engineering]

Wave 2 (After Wave 1 — core parser components, 3 parallel):
├── Task 6: src/logic/lexer.ts — normalize + detect + parse lines [deep]
├── Task 7: src/logic/tree.ts — indentation → nested tree [deep]
└── Task 8: src/logic/resolver.ts — goto anchors + branch validation [unspecified-high]

Wave 3 (After Wave 2 — integration, 2 parallel):
├── Task 9: src/logic/parser.ts + index.ts + integration tests [deep]
└── Task 10: Wire parser/serializer into Header UI + store [unspecified-high]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality review [unspecified-high]
├── Task F3: Real QA with Playwright [unspecified-high]
└── Task F4: Scope fidelity check [deep]

Critical Path: T1 → T6 → T9 → T10 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 5 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|------------|--------|------|
| T1 (vitest) | — | T2, T3, T4, T5, T6, T7, T8 | 1 |
| T2 (types) | — | T6, T7, T8, T9 | 1 |
| T3 (aliases) | — | T6, T8, T9 | 1 |
| T4 (serializer) | — | T9, T10 | 1 |
| T5 (UI scaffold) | — | T10 | 1 |
| T6 (lexer) | T1, T2, T3 | T9 | 2 |
| T7 (tree) | T1, T2 | T9 | 2 |
| T8 (resolver) | T1, T2, T3 | T9 | 2 |
| T9 (parser entry) | T6, T7, T8 | T10 | 3 |
| T10 (UI wiring) | T4, T5, T9 | F1-F4 | 3 |
| F1-F4 | T10 | — | FINAL |

### Agent Dispatch Summary

| Wave | # Parallel | Tasks → Agent Category |
|------|------------|----------------------|
| 1 | **5** | T1 → `quick`, T2 → `quick`, T3 → `quick`, T4 → `unspecified-high`, T5 → `visual-engineering` |
| 2 | **3** | T6 → `deep`, T7 → `deep`, T8 → `unspecified-high` |
| 3 | **2** | T9 → `deep`, T10 → `unspecified-high` |
| FINAL | **4** | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep` |

---

## TODOs

---

- [x] 1. Vitest + Test Infrastructure Setup

  **What to do**:
  - Install vitest as a dev dependency: `npm install -D vitest`
  - Create `vitest.config.ts` at project root with basic configuration for the Vite/React project
  - Add test scripts to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`
  - Create `src/logic/__tests__/` directory with a smoke test file `setup.test.ts` that verifies vitest works
  - Verify `tsconfig.app.json` includes test files (the `"include": ["src"]` already covers `src/logic/__tests__/`)
  - Run `npx vitest run` and verify the smoke test passes

  **Must NOT do**:
  - Do NOT install jsdom or happy-dom — parser tests are pure logic, no DOM needed
  - Do NOT add React Testing Library — this is for pure function testing only
  - Do NOT modify `tsconfig.app.json` unless absolutely required for vitest to work
  - Do NOT add vitest globals — use explicit imports (`import { describe, it, expect } from 'vitest'`)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-step tooling setup, no complex logic
  - **Skills**: [`playwright`]
    - `playwright`: For verifying the test run output in terminal
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work
    - `git-master`: No git operations needed during task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7, 8 (all tests depend on vitest existing)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `package.json:1-36` — Current dev dependencies and scripts. Add `vitest` to devDependencies, add `test` and `test:watch` scripts.
  - `tsconfig.app.json:1-29` — TypeScript config. Verify `"include": ["src"]` covers test files in `src/logic/__tests__/`. The `"types": ["vite/client"]` may need vitest types added if vitest globals are not used (they shouldn't be — use explicit imports).

  **External References**:
  - Vitest docs: https://vitest.dev/guide/ — Setup with Vite projects

  **WHY Each Reference Matters**:
  - `package.json` — You need to know existing scripts and dependencies to add vitest without conflicts
  - `tsconfig.app.json` — Must verify test files are included in TypeScript compilation

  **Acceptance Criteria**:
  - [ ] `vitest` appears in `package.json` devDependencies
  - [ ] `vitest.config.ts` exists at project root
  - [ ] `package.json` has `"test": "vitest run"` and `"test:watch": "vitest"` scripts
  - [ ] `src/logic/__tests__/setup.test.ts` exists with at least one passing test
  - [ ] `npx vitest run` → PASS (1+ tests, 0 failures)
  - [ ] `tsc -b` → no new type errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Vitest runs and passes smoke test
    Tool: Bash
    Preconditions: vitest installed, config exists, smoke test file exists
    Steps:
      1. Run `npx vitest run` from project root
      2. Capture stdout/stderr
      3. Assert output contains "Tests  1 passed" (or similar pass indicator)
      4. Assert exit code is 0
    Expected Result: Exit code 0, output shows 1+ tests passed, 0 failed
    Failure Indicators: Non-zero exit code, "FAIL" in output, missing vitest binary
    Evidence: .sisyphus/evidence/task-1-vitest-smoke.txt

  Scenario: TypeScript compilation still works
    Tool: Bash
    Preconditions: vitest config and test files added
    Steps:
      1. Run `tsc -b` from project root
      2. Assert exit code is 0
    Expected Result: Exit code 0, no output (clean compilation)
    Failure Indicators: Type errors in output, non-zero exit code
    Evidence: .sisyphus/evidence/task-1-tsc-check.txt
  ```

  **Commit**: YES
  - Message: `feat(logic): set up vitest test infrastructure`
  - Files: `vitest.config.ts`, `package.json`, `src/logic/__tests__/setup.test.ts`
  - Pre-commit: `npx vitest run`

---

- [x] 2. Parser Types — `src/logic/types.ts`

  **What to do**:
  - Create `src/logic/types.ts` with these types:
    - `SyntaxFamily`: union type `'comment' | 'bracket' | 'keyword' | 'sigil' | 'inference' | 'default'`
    - `ParsedLine`: intermediate representation of a single parsed line: `{ indent: number; syntaxFamily: SyntaxFamily; type: string; label: string; anchor?: string; isGoto: boolean; raw: string; lineNumber: number }`
    - `ParseError`: structured error: `{ message: string; line: number; column?: number; source: string }`
    - `ParseResult`: `{ nodes: OutlineNode[]; errors: ParseError[]; warnings: string[] }` — parser always returns a result, errors are collected not thrown
    - `ParseOptions`: `{ strict?: boolean }` — reserved for future configurability
  - Write tests in `src/logic/__tests__/types.test.ts` verifying type construction (simple instantiation tests)
  - Note: `ParsedLine.type` is a RAW string (e.g., `"proc"`, `"yes"`, `"begin"`) — alias resolution happens later

  **Must NOT do**:
  - Do NOT import from `src/types.ts` here — this file is parser-internal. The app's `OutlineNode` is imported only by the tree builder and serializer.
  - Do NOT add runtime validation or class constructors — these are plain interfaces/types
  - Do NOT add `syntaxFamily` to `OutlineNode` — that's a v2 round-trip concern

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure type definitions, minimal logic
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - All: No specialized skills needed for type definitions

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Tasks 6, 7, 8, 9
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/types.ts:1-31` — App's `NodeType` and `OutlineNode` types. The parser must ultimately produce `OutlineNode[]`. Study this to understand the target shape. `NodeType = 'start' | 'end' | 'process' | 'decision' | 'merge' | 'branch' | 'goto' | 'parallel'`. Note: there is NO `'yes'` or `'no'` type — branches use `type: 'branch'` with `label: 'Yes'`/`'No'`.
  - `src/keybindings/types.ts` — Example of how this codebase organizes module-specific types in a separate `types.ts` file. Follow this pattern.

  **WHY Each Reference Matters**:
  - `src/types.ts` — You need to know what `OutlineNode` looks like to design `ParsedLine` as a compatible intermediate format. `ParsedLine.type` is a raw string; the tree builder resolves it to `NodeType`.
  - `src/keybindings/types.ts` — Organizational pattern to follow for module-local types.

  **Acceptance Criteria**:
  - [ ] `src/logic/types.ts` exists with `SyntaxFamily`, `ParsedLine`, `ParseError`, `ParseResult`, `ParseOptions` types
  - [ ] `src/logic/__tests__/types.test.ts` exists with basic type construction tests
  - [ ] `npx vitest run src/logic/__tests__/types.test.ts` → PASS
  - [ ] `tsc -b` → no type errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Types compile and tests pass
    Tool: Bash
    Preconditions: vitest installed (T1), type file created
    Steps:
      1. Run `npx vitest run src/logic/__tests__/types.test.ts`
      2. Assert output shows all tests passed
      3. Run `tsc -b`
      4. Assert no type errors
    Expected Result: All tests pass, clean compilation
    Failure Indicators: Type errors, test failures
    Evidence: .sisyphus/evidence/task-2-types-tests.txt
  ```

  **Commit**: YES
  - Message: `feat(logic): add parser-specific type definitions`
  - Files: `src/logic/types.ts`, `src/logic/__tests__/types.test.ts`
  - Pre-commit: `npx vitest run src/logic/__tests__/types.test.ts`

---

- [x] 3. Alias Table & Sigil Map — `src/logic/aliases.ts`

  **What to do**:
  - Create `src/logic/aliases.ts` with:
    - `ALIAS_TABLE`: `Record<string, { canonicalType: string; branchLabel?: string }>` mapping ALL aliases to their canonical type. The `branchLabel` field handles yes/no → branch mapping:
      ```
      "start" → { canonicalType: "start" }
      "begin" → { canonicalType: "start" }
      "s"     → { canonicalType: "start" }
      "end"   → { canonicalType: "end" }
      "done"  → { canonicalType: "end" }
      "finish"→ { canonicalType: "end" }
      "e"     → { canonicalType: "end" }
      "process" → { canonicalType: "process" }
      "proc"  → { canonicalType: "process" }
      "step"  → { canonicalType: "process" }
      "do"    → { canonicalType: "process" }
      "action"→ { canonicalType: "process" }
      "p"     → { canonicalType: "process" }
      "decision" → { canonicalType: "decision" }
      "decide"→ { canonicalType: "decision" }
      "check" → { canonicalType: "decision" }
      "if"    → { canonicalType: "decision" }
      "d"     → { canonicalType: "decision" }
      "goto"  → { canonicalType: "goto" }
      "jump"  → { canonicalType: "goto" }
      "go"    → { canonicalType: "goto" }
      "yes"   → { canonicalType: "branch", branchLabel: "Yes" }
      "true"  → { canonicalType: "branch", branchLabel: "Yes" }
      "then"  → { canonicalType: "branch", branchLabel: "Yes" }
      "no"    → { canonicalType: "branch", branchLabel: "No" }
      "false" → { canonicalType: "branch", branchLabel: "No" }
      "else"  → { canonicalType: "branch", branchLabel: "No" }
      "parallel" → { canonicalType: "parallel" }
      "par"   → { canonicalType: "parallel" }
      "fork"  → { canonicalType: "parallel" }
      "merge" → { canonicalType: "merge" }
      "join"  → { canonicalType: "merge" }
      ```
    - `SIGIL_MAP`: `Record<string, { canonicalType: string; branchLabel?: string }>`:
      ```
      ">"  → { canonicalType: "start" }
      "."  → { canonicalType: "end" }
      "-"  → { canonicalType: "process" }
      "?"  → { canonicalType: "decision" }
      "+"  → { canonicalType: "branch", branchLabel: "Yes" }
      "->" → { canonicalType: "goto" }
      "---"→ { canonicalType: "branch", branchLabel: "No" }
      ```
    - `resolveAlias(raw: string): { canonicalType: string; branchLabel?: string } | null` — case-insensitive lookup, returns null if not in table
    - `isKnownAlias(raw: string): boolean` — quick check for keyword detection
  - Write tests in `src/logic/__tests__/aliases.test.ts`:
    - All aliases resolve correctly
    - Case insensitivity works (`Process`, `PROCESS`, `process` all → process)
    - Unknown strings return null
    - Yes/no/true/false correctly map to branch type with correct label
    - All sigils map correctly

  **Must NOT do**:
  - Do NOT add runtime alias registration (dynamic alias table) — static constants only
  - Do NOT import from `src/types.ts` — use plain strings. The tree builder handles NodeType casting.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Static data + simple lookup functions
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - All: No specialized skills needed for lookup tables

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Tasks 6, 8, 9
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `.sisyphus/drafts/logic-syntax-spec.md:274-306` — Complete alias table with all aliases grouped by canonical type. This is the AUTHORITATIVE source. Implement exactly what's listed.
  - `.sisyphus/drafts/logic-syntax-spec.md:222-245` — Complete sigil map with `-` family disambiguation rules.
  - `src/types.ts:1` — `NodeType` union. The `canonicalType` strings in the alias table MUST match these values exactly: `'start' | 'end' | 'process' | 'decision' | 'merge' | 'branch' | 'goto' | 'parallel'`. Note: `'yes'` and `'no'` are NOT valid NodeType values — they map to `'branch'` with a label.

  **WHY Each Reference Matters**:
  - Syntax spec aliases section — The exact set of aliases is a design decision, not an implementation detail. Follow it precisely.
  - Sigil map — Includes the `-` family priority which is critical for disambiguation.
  - `src/types.ts` — Ensures alias table output matches what the app actually accepts.

  **Acceptance Criteria**:
  - [ ] `src/logic/aliases.ts` exists with `ALIAS_TABLE`, `SIGIL_MAP`, `resolveAlias()`, `isKnownAlias()`
  - [ ] All 30 aliases from the spec resolve to correct canonical types
  - [ ] All 7 sigils map correctly
  - [ ] `resolveAlias("yes")` → `{ canonicalType: "branch", branchLabel: "Yes" }`
  - [ ] `resolveAlias("PROCESS")` → `{ canonicalType: "process" }` (case insensitive)
  - [ ] `resolveAlias("unknown")` → `null`
  - [ ] `npx vitest run src/logic/__tests__/aliases.test.ts` → PASS
  - [ ] `tsc -b` → no type errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All aliases resolve correctly
    Tool: Bash
    Preconditions: vitest installed, aliases module created
    Steps:
      1. Run `npx vitest run src/logic/__tests__/aliases.test.ts`
      2. Assert all tests pass
    Expected Result: 30+ alias tests pass, 7 sigil tests pass, case insensitivity verified
    Failure Indicators: Any test failure, missing alias
    Evidence: .sisyphus/evidence/task-3-aliases-tests.txt

  Scenario: Unknown aliases return null
    Tool: Bash
    Preconditions: Tests include unknown alias cases
    Steps:
      1. Verify test file includes cases for "unknown", "meeting", "blurb", "foo"
      2. Run tests
    Expected Result: All unknown strings return null from resolveAlias
    Failure Indicators: False positive alias match
    Evidence: .sisyphus/evidence/task-3-unknown-aliases.txt
  ```

  **Commit**: YES
  - Message: `feat(logic): add alias table and sigil map with lookup functions`
  - Files: `src/logic/aliases.ts`, `src/logic/__tests__/aliases.test.ts`
  - Pre-commit: `npx vitest run src/logic/__tests__/aliases.test.ts`

---

- [x] 4. Serializer — `src/logic/serializer.ts`

  **What to do**:
  - Create `src/logic/serializer.ts` with:
    - `serialize(nodes: OutlineNode[]): string` — main entry point
    - Recursively walks the `OutlineNode[]` tree and outputs bracket-syntax `.logic` text
    - 2-space indentation per nesting level
    - Mapping rules:
      - `type: 'start'` → `[start] {label}`
      - `type: 'end'` → `[end] {label}`
      - `type: 'process'` → `[process] {label}`
      - `type: 'decision'` → `[decision] {label}`
      - `type: 'branch'` → `[yes]` if label is "Yes" (case-insensitive), `[no]` if label is "No", otherwise `[yes] {label}` (treat as yes-branch with custom label)
      - `type: 'goto'` → `[goto]` (targetId is internal, not exported — goto without anchor in v1)
      - `type: 'merge'` → `[merge] {label}`
      - `type: 'parallel'` → `[parallel] {label}`
    - Nodes with `isComment === true` are **silently skipped** (not exported at all)
    - Empty labels: `[start]` (no trailing space)
    - Goto nodes: For v1, export as `[goto]` since anchor names are not stored on OutlineNode. If the tree was originally imported with anchors and we want to re-export them, that's v2 round-trip concern.
  - Write tests in `src/logic/__tests__/serializer.test.ts`:
    - Single node serialization for each type
    - Nested tree with proper indentation
    - Branch nodes → `[yes]`/`[no]` based on label
    - `isComment` nodes skipped
    - Empty label handling
    - Deep nesting (3+ levels) with correct indent
    - Mixed node types in a realistic tree (use K8s auth flow structure as reference)

  **Must NOT do**:
  - Do NOT implement keyword or sigil export styles — brackets only for v1
  - Do NOT implement round-trip style preservation
  - Do NOT add a settings parameter for export style
  - Do NOT handle anchor names on export — `OutlineNode` has `targetId` (an internal ID), not `anchorName`
  - Do NOT import anything from `src/logic/types.ts` — the serializer only needs `OutlineNode` from `src/types.ts`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Pure logic with moderate complexity in tree walking and edge cases
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work
    - `playwright`: No browser testing needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Tasks 9, 10
  - **Blocked By**: None (depends only on `src/types.ts` which already exists)

  **References**:

  **Pattern References**:
  - `src/types.ts:1-10` — `OutlineNode` interface. This is the INPUT to the serializer. Study every field: `id`, `type`, `label`, `children`, `targetId?`, `isComment?`.
  - `src/types.ts:1` — `NodeType` union. Map each NodeType to its bracket syntax output.
  - `src/store.tsx:27-210` — `createK8sAuthFlow()`. This is a real `OutlineNode[]` tree you can use as a test fixture. Note how branch nodes use `type: 'branch'` with `label: 'Yes'`/`'No'`.

  **API/Type References**:
  - `src/types.ts:3-10` — `OutlineNode` is the contract. Serializer must handle ALL fields.

  **External References**:
  - `.sisyphus/drafts/logic-syntax-spec.md:459-468` — Bracket export example showing exact expected output format.

  **WHY Each Reference Matters**:
  - `OutlineNode` — This is literally what you're serializing. Every field matters.
  - `createK8sAuthFlow()` — Real-world tree structure showing actual branch/decision patterns. Use this shape for integration-style tests.
  - Syntax spec export section — Shows the exact output format expected.

  **Acceptance Criteria**:
  - [ ] `src/logic/serializer.ts` exists with `serialize(nodes: OutlineNode[]): string`
  - [ ] Branch nodes with label "Yes" → `[yes]`, label "No" → `[no]`
  - [ ] `isComment` nodes are completely omitted from output
  - [ ] 2-space indentation per nesting level
  - [ ] Empty labels produce no trailing space: `[start]` not `[start] `
  - [ ] `npx vitest run src/logic/__tests__/serializer.test.ts` → PASS (8+ tests)
  - [ ] `tsc -b` → no type errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Serializer produces correct bracket syntax
    Tool: Bash
    Preconditions: vitest installed, serializer module created
    Steps:
      1. Run `npx vitest run src/logic/__tests__/serializer.test.ts`
      2. Assert all tests pass
      3. Verify test file includes: single node, nested tree, branch mapping, isComment skip, empty labels, deep nesting
    Expected Result: 8+ tests pass, 0 failures
    Failure Indicators: Wrong bracket type, incorrect indentation, isComment nodes appearing in output
    Evidence: .sisyphus/evidence/task-4-serializer-tests.txt

  Scenario: Serializer handles realistic tree structure
    Tool: Bash
    Preconditions: Test includes K8s-auth-like tree structure
    Steps:
      1. Verify test serializes a decision node with yes/no branches containing children
      2. Check output matches expected bracket format with correct indentation
    Expected Result: Multi-level tree serializes with correct nesting and bracket types
    Failure Indicators: Branch nodes not mapping to [yes]/[no], wrong indent level
    Evidence: .sisyphus/evidence/task-4-serializer-realistic.txt
  ```

  **Commit**: YES
  - Message: `feat(logic): add .logic file serializer with bracket syntax export`
  - Files: `src/logic/serializer.ts`, `src/logic/__tests__/serializer.test.ts`
  - Pre-commit: `npx vitest run src/logic/__tests__/serializer.test.ts`

---

- [x] 5. Import/Export UI Scaffold in Header.tsx

  **What to do**:
  - Add two buttons to the Header component between the document title and save indicator:
    - **Import** button: Opens a file picker (accept `.logic` files), reads the file content as text. For now, call a stub function `handleImport(text: string, filename: string)` that logs to console. The real parser wiring happens in T10.
    - **Export** button: For now, call a stub function `handleExport()` that logs to console. The real serializer wiring happens in T10.
  - Implement the file picker using a hidden `<input type="file" accept=".logic">` triggered by the import button click
  - Implement the download using `URL.createObjectURL` + hidden `<a>` click pattern for the export button
  - Style buttons to match existing Header aesthetic (slate colors, hover states, consistent with document dropdown button)
  - Add an error state display: if import fails, show a brief error toast/banner below the header (simple `useState<string | null>` for error message, auto-dismiss after 5 seconds)

  **Must NOT do**:
  - Do NOT import any parser/serializer code yet — use stub functions that will be replaced in T10
  - Do NOT modify the DocumentDropdown component
  - Do NOT add drag-and-drop file import (future enhancement)
  - Do NOT add modal dialogs — keep it simple (file picker + download)
  - Do NOT add export format selection UI

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component work requiring visual consistency with existing design
  - **Skills**: [`frontend-ui-ux`, `playwright`]
    - `frontend-ui-ux`: Header styling, button design, error display
    - `playwright`: Verify buttons render and file picker opens
  - **Skills Evaluated but Omitted**:
    - `git-master`: No git operations needed during task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Task 10
  - **Blocked By**: None (works with existing app code)

  **References**:

  **Pattern References**:
  - `src/components/Header.tsx:221-254` — `Header()` component. This is where the buttons go. Current layout: `[doc dropdown + title] ... [flex spacer] ... [save indicator]`. Add import/export buttons between the spacer and save indicator.
  - `src/components/Header.tsx:228-239` — Document dropdown button styling. Match this `text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors` pattern for new buttons.
  - `src/components/Header.tsx:6-29` — `SaveIndicator` component. Follow this pattern for small utility components within the file.

  **API/Type References**:
  - `src/store.tsx:659-670` — `DocumentStore` interface. The import flow will need `createDocument()` or a new method. For now, just stub. Note: `createDocument(name?: string)` returns a new doc ID — the real import in T10 will need to either use this and then set nodes, or create a new method.

  **WHY Each Reference Matters**:
  - `Header()` — Exact insertion point for buttons. Must understand current layout.
  - Button styling — Visual consistency is critical. Copy existing patterns exactly.
  - `DocumentStore` — Understanding what methods exist for document creation informs the stub design.

  **Acceptance Criteria**:
  - [ ] Two new buttons visible in Header: "Import" and "Export" (or icon buttons with tooltips)
  - [ ] Import button opens a file picker filtered to `.logic` files
  - [ ] Export button triggers a stub function (console.log for now)
  - [ ] File picker reads selected file as text and passes to stub handler
  - [ ] Error state renders below header when set (with auto-dismiss)
  - [ ] Button styling matches existing Header aesthetic
  - [ ] `tsc -b` → no type errors
  - [ ] App still loads and renders correctly with new buttons

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Import and Export buttons render in header
    Tool: Playwright
    Preconditions: App running on dev server (npm run dev)
    Steps:
      1. Navigate to http://localhost:5173
      2. Wait for header to render (selector: 'header')
      3. Assert import button exists (look for button with title="Import" or text "Import")
      4. Assert export button exists (look for button with title="Export" or text "Export")
      5. Screenshot the header area
    Expected Result: Both buttons visible, styled consistently with existing header elements
    Failure Indicators: Buttons missing, layout broken, style inconsistent
    Evidence: .sisyphus/evidence/task-5-header-buttons.png

  Scenario: Import button opens file picker
    Tool: Playwright
    Preconditions: App running, buttons rendered
    Steps:
      1. Navigate to http://localhost:5173
      2. Check for hidden file input element with accept=".logic"
      3. Click the import button
      4. Verify file chooser dialog would open (Playwright can intercept fileChooser event)
    Expected Result: File chooser event fires when import button clicked
    Failure Indicators: No file input element, click doesn't trigger picker
    Evidence: .sisyphus/evidence/task-5-file-picker.png

  Scenario: Export button calls stub function
    Tool: Playwright
    Preconditions: App running, buttons rendered
    Steps:
      1. Navigate to http://localhost:5173
      2. Open browser console
      3. Click export button
      4. Assert console shows stub log message
    Expected Result: Console log appears confirming export stub was called
    Failure Indicators: No console output, button not clickable, error thrown
    Evidence: .sisyphus/evidence/task-5-export-stub.png
  ```

  **Commit**: YES
  - Message: `feat(logic): add import/export button scaffold in header`
  - Files: `src/components/Header.tsx`
  - Pre-commit: `tsc -b`

---

- [ ] 6. Lexer — Line Normalization, Detection & Parsing — `src/logic/lexer.ts`

  **What to do**:
  - Create `src/logic/lexer.ts` with these pure functions:
    1. **`preprocessLines(text: string): { content: string; indent: number; lineNumber: number }[]`** — Split text into lines, handle:
       - Empty line detection (skip)
       - Leading whitespace → indent level (count spaces / 2). If not a multiple of 2 → `ParseError`.
       - Tab detection → `ParseError` (hard error)
       - Backslash continuation: if line ends with `\`, join with next line (trimmed), repeat
       - Return array of preprocessed lines with content, indent level, and original line number
    2. **`detectFamily(content: string): SyntaxFamily`** — Determine syntax family of a trimmed line. Priority order:
       - Comment: starts with `//` or `#` → `'comment'`
       - Bracket: starts with `[` → `'bracket'`
       - Keyword: first word followed by `:` AND first word is in alias table → `'keyword'`
       - Sigil: starts with one of `> . ? + - →` (check `->` before `-`, check `---` before `-`) → `'sigil'`
       - Inference: content ends with `?` → `'inference'`
       - Default: everything else → `'default'`
    3. **`parseLine(content: string, family: SyntaxFamily): { type: string; label: string; anchor?: string; isGoto: boolean }`** — Extract type, label, and anchor from a line based on its syntax family:
       - **Comment**: return special marker (will be skipped by tree builder)
       - **Bracket**: parse `[type @anchor] label` — extract type string, optional anchor, remaining label
       - **Keyword**: parse `type @anchor: label` — extract type keyword, optional anchor, label after `: `
       - **Sigil**: parse `sigil @anchor label` — map sigil to type, extract optional anchor, remaining label. Handle `-` family: `->` content → goto, `---` alone → branch-no, `-` content → process
       - **Inference**: label ends with `?` → type is `"decision"`, label is the full content
       - **Default**: type is `"process"`, label is the full content
    4. **`lexLine(content: string): ParsedLine`** — compose: `detectFamily` → `parseLine`, return full `ParsedLine`
  - Write comprehensive tests in `src/logic/__tests__/lexer.test.ts`:
    - **Preprocessing**: indent counting, tab rejection, continuation joining, empty line skipping, odd-space error
    - **Detection**: each family correctly identified, priority order (comment before bracket before keyword, etc.), keyword only if in alias table
    - **Bracket parsing**: `[start] label`, `[proc] label`, `[yes]`, `[goto @target]`, `[process @anchor] label`, `[unknown] label` → type "unknown"
    - **Keyword parsing**: `start: label`, `process @form: label`, `yes:`, `meeting: topic` → NOT keyword (falls to default)
    - **Sigil parsing**: `> Start`, `- Process`, `? Question?`, `+ `, `---`, `-> @target`, `-> target`
    - **`-` disambiguation**: `->` content → goto, `---` alone → branch-no, `- content` → process, `-` alone → process
    - **Inference**: `Is this valid?` → decision, `Do something` → process
    - **Edge cases**: line with just spaces, line with just `//`, `#` followed by content, `[` without `]`

  **Must NOT do**:
  - Do NOT throw exceptions for parse errors — return them in a collected errors array
  - Do NOT resolve aliases here — return raw type strings. Alias resolution is in the tree builder (T7).
  - Do NOT build the tree here — this is line-level parsing only
  - Do NOT handle `isComment` (app concept) — only handle file comments (which are ignored)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Most complex logic task — multiple parsing strategies, disambiguation rules, extensive edge cases. Requires careful TDD.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction
    - `frontend-ui-ux`: No UI work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 1 (vitest), 2 (types), 3 (aliases)

  **References**:

  **Pattern References**:
  - `.sisyphus/drafts/logic-syntax-spec.md:44-73` — Indentation rules with exact error messages. Implement these exact errors.
  - `.sisyphus/drafts/logic-syntax-spec.md:77-110` — Comment rules. `//` and `#` at start of content (after indent). Inline comments NOT supported.
  - `.sisyphus/drafts/logic-syntax-spec.md:151-174` — Bracket syntax rules. `[` is first non-whitespace after indentation. Type name case-insensitive. Label after `] `.
  - `.sisyphus/drafts/logic-syntax-spec.md:177-203` — Keyword syntax rules. Keyword MUST be in alias table. Colon MUST be followed by space (or end of line). `meeting: stuff` → NOT keyword, falls to default.
  - `.sisyphus/drafts/logic-syntax-spec.md:208-245` — Sigil syntax rules with complete `-` family disambiguation. Priority: `->` > `---` > `-`.
  - `.sisyphus/drafts/logic-syntax-spec.md:249-268` — Inference rules. Only `?` suffix → decision. Everything else → process.
  - `.sisyphus/drafts/logic-syntax-spec.md:370-412` — Multi-line continuation rules. `\` at end of line, next line trimmed and appended with space.
  - `.sisyphus/drafts/logic-syntax-spec.md:310-345` — Anchor syntax. `@name` inside brackets: `[process @form] label`. In keyword: `process @form: label`. In sigil: `- @form label`. Name pattern: `[a-zA-Z0-9-]+`.

  **API/Type References**:
  - `src/logic/types.ts` (from T2) — `ParsedLine`, `SyntaxFamily`, `ParseError` types. These are the output shapes.
  - `src/logic/aliases.ts` (from T3) — `isKnownAlias()` used by keyword detection to distinguish real keywords from regular text.

  **WHY Each Reference Matters**:
  - Syntax spec sections — Each section is the AUTHORITATIVE specification for that parsing rule. The implementation must match exactly.
  - Types — Define the output contract.
  - Aliases — `isKnownAlias()` is the gatekeeper for keyword detection. `meeting:` is NOT a keyword because "meeting" is not in the alias table.

  **Acceptance Criteria**:
  - [ ] `src/logic/lexer.ts` exists with `preprocessLines()`, `detectFamily()`, `parseLine()`, `lexLine()`
  - [ ] Tab characters produce `ParseError` with message containing "tab"
  - [ ] Non-2-space indentation produces `ParseError` with message about "2 spaces"
  - [ ] Backslash continuation joins multi-line labels correctly
  - [ ] All 6 syntax families detected in correct priority order
  - [ ] Keyword detection only triggers for alias-table words (not "meeting:", "topic:", etc.)
  - [ ] `-` family disambiguation: `->` → goto, `---` → branch-no, `- content` → process
  - [ ] Anchor extraction works for bracket `[type @name]`, keyword `type @name:`, sigil `- @name label`
  - [ ] `npx vitest run src/logic/__tests__/lexer.test.ts` → PASS (25+ tests)
  - [ ] `tsc -b` → no type errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Lexer passes all unit tests
    Tool: Bash
    Preconditions: vitest installed, lexer module created, types and aliases available
    Steps:
      1. Run `npx vitest run src/logic/__tests__/lexer.test.ts`
      2. Assert 25+ tests pass
      3. Assert 0 failures
    Expected Result: All lexer tests pass covering every syntax family and edge case
    Failure Indicators: Any test failure, especially dash disambiguation or keyword detection
    Evidence: .sisyphus/evidence/task-6-lexer-tests.txt

  Scenario: Dash family disambiguation is correct
    Tool: Bash
    Preconditions: Tests include specific dash disambiguation cases
    Steps:
      1. Verify test file has cases for: "-> target", "---", "- content", "-" alone, "-> @anchor"
      2. Run tests
      3. Assert: "-> target" → goto, "---" → branch/no, "- content" → process, "-" → process
    Expected Result: All dash variants correctly classified
    Failure Indicators: "---" treated as process, "->" treated as process
    Evidence: .sisyphus/evidence/task-6-dash-disambiguation.txt

  Scenario: Tab rejection produces clear error
    Tool: Bash
    Preconditions: Tests include tab input cases
    Steps:
      1. Verify test calls preprocessLines with tab-indented input
      2. Assert ParseError is returned with message containing "tab" or "Tab"
    Expected Result: ParseError with helpful message about using spaces instead of tabs
    Failure Indicators: Tab accepted without error, vague error message
    Evidence: .sisyphus/evidence/task-6-tab-rejection.txt
  ```

  **Commit**: YES
  - Message: `feat(logic): add lexer with multi-syntax family detection and parsing`
  - Files: `src/logic/lexer.ts`, `src/logic/__tests__/lexer.test.ts`
  - Pre-commit: `npx vitest run src/logic/__tests__/lexer.test.ts`

---

- [x] 7. Tree Builder — `src/logic/tree.ts`

  **What to do**:
  - Create `src/logic/tree.ts` with:
    - **`buildTree(lines: ParsedLine[]): { nodes: OutlineNode[]; errors: ParseError[] }`** — Convert flat array of `ParsedLine` (with indent levels) into nested `OutlineNode[]` tree:
      1. Use a stack-based approach: maintain a stack of `(node, indent)` pairs
      2. For each `ParsedLine`:
         - Skip comment lines (family === 'comment')
         - Resolve type via `resolveAlias()` from aliases.ts. If alias returns null → use `'process'` as fallback
         - Handle branch label: if `resolveAlias()` returns `branchLabel`, use it. If the line also has a label, append/override accordingly:
           - `[yes]` → `{ type: 'branch', label: 'Yes' }`
           - `[yes] Custom label` → `{ type: 'branch', label: 'Custom label' }` (user override)
           - `[no]` → `{ type: 'branch', label: 'No' }`
         - Generate fresh ID using `Math.random().toString(36).substring(2, 9)` (same pattern as `src/store.tsx:9-11`)
         - Create `OutlineNode`: `{ id, type: resolvedType as NodeType, label, children: [], targetId: undefined, isComment: undefined }`
         - Place node in tree based on indent level relative to stack
      3. Return the root-level nodes array

    - **`validateBranches(nodes: OutlineNode[]): OutlineNode[]`** — Post-process to enforce branch invariants:
      - Decision nodes MUST have branch children. If a decision node has non-branch children, auto-wrap them: create `{ type: 'branch', label: 'Yes', children: [existing children] }` and `{ type: 'branch', label: 'No', children: [] }`
      - Branch nodes must NOT appear outside of decision parents (warn but don't fail)
      - This mirrors the auto-wrapping behavior in `src/store.tsx:852-863`

  - Write tests in `src/logic/__tests__/tree.test.ts`:
    - Flat list (all indent 0) → array of siblings
    - Nested tree (indent 0, 2, 4, 2) → parent/child/grandchild structure
    - Comment lines skipped
    - Alias resolution: `ParsedLine` with type "proc" → `OutlineNode` with type "process"
    - Branch label handling: yes → `{ type: 'branch', label: 'Yes' }`, custom label preserved
    - Unknown type → process fallback
    - Branch validation: decision with non-branch children → auto-wrapped
    - Empty input → empty array
    - IDs are generated (unique strings)

  **Must NOT do**:
  - Do NOT import `generateId` from `src/store.tsx` — duplicate the simple pattern inline. The parser module must be decoupled from React/store.
  - Do NOT modify `src/types.ts` — cast the resolved string to `NodeType` using `as NodeType`
  - Do NOT handle goto resolution here — that's T8 (resolver)
  - Do NOT throw on malformed trees — collect errors and return best-effort result

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Stack-based tree building with alias resolution and branch invariant enforcement. Requires careful state management.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 1 (vitest), 2 (types)

  **References**:

  **Pattern References**:
  - `src/store.tsx:9-11` — `generateId()` pattern. Duplicate this exactly: `Math.random().toString(36).substring(2, 9)`. Do NOT import from store.
  - `src/store.tsx:846-876` — Branch invariant enforcement in `updateNode()`. When changing TO decision, auto-wrap children in Yes/No branches. The tree builder MUST produce trees that satisfy this invariant. Study lines 852-863 specifically for the auto-wrap pattern: `children: [{ type: 'branch', label: 'Yes', children: existingChildren }, { type: 'branch', label: 'No', children: [] }]`.
  - `src/types.ts:1-10` — `OutlineNode` interface. This is the OUTPUT shape. Every node must have `id`, `type`, `label`, `children`. `targetId` and `isComment` are optional.

  **API/Type References**:
  - `src/logic/types.ts` (from T2) — `ParsedLine` is the INPUT. Key fields: `indent`, `type` (raw string), `label`, `anchor?`, `isGoto`, `syntaxFamily`.
  - `src/logic/aliases.ts` (from T3) — `resolveAlias(raw: string)` maps raw type strings to `{ canonicalType, branchLabel? }`.

  **WHY Each Reference Matters**:
  - `generateId()` — IDs must match the existing format so the rest of the app works (string of 7 random alphanumeric chars).
  - Branch invariant code — The tree builder's auto-wrap logic MUST match how the store handles it. If the parser produces a decision node without branch children, the app will malfunction.
  - `ParsedLine` — Understanding the input shape is critical for the transformation logic.

  **Acceptance Criteria**:
  - [ ] `src/logic/tree.ts` exists with `buildTree()` and `validateBranches()`
  - [ ] Flat list → array of siblings (all at root level)
  - [ ] Indentation creates proper parent-child nesting
  - [ ] Alias resolution: "proc" → "process", "begin" → "start", "yes" → branch/Yes
  - [ ] Decision nodes without branch children are auto-wrapped
  - [ ] Comment lines are skipped (not in output tree)
  - [ ] Generated IDs are unique 7-char strings
  - [ ] `npx vitest run src/logic/__tests__/tree.test.ts` → PASS (10+ tests)
  - [ ] `tsc -b` → no type errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Tree builder produces correct nested structure
    Tool: Bash
    Preconditions: vitest installed, tree module created, types and aliases available
    Steps:
      1. Run `npx vitest run src/logic/__tests__/tree.test.ts`
      2. Assert all tests pass
    Expected Result: 10+ tests pass covering flat lists, nesting, aliases, branches, comments
    Failure Indicators: Wrong nesting, aliases not resolved, branches not validated
    Evidence: .sisyphus/evidence/task-7-tree-tests.txt

  Scenario: Branch auto-wrap matches store behavior
    Tool: Bash
    Preconditions: Test includes decision node with non-branch children
    Steps:
      1. Verify test creates ParsedLines: [decision indent=0, process indent=2, process indent=2]
      2. Assert output has decision with children: [branch "Yes" with 2 process children, branch "No" empty]
    Expected Result: Auto-wrap matches store.tsx:852-863 pattern exactly
    Failure Indicators: Decision children not wrapped in branches, wrong branch labels
    Evidence: .sisyphus/evidence/task-7-branch-autowrap.txt
  ```

  **Commit**: YES
  - Message: `feat(logic): add tree builder with alias resolution and branch validation`
  - Files: `src/logic/tree.ts`, `src/logic/__tests__/tree.test.ts`
  - Pre-commit: `npx vitest run src/logic/__tests__/tree.test.ts`

---

- [ ] 8. Resolver — Goto Anchors & Post-processing — `src/logic/resolver.ts`

  **What to do**:
  - Create `src/logic/resolver.ts` with:
    - **`resolveAnchors(nodes: OutlineNode[], anchorMap: Map<string, string>): { nodes: OutlineNode[]; unresolvedGotos: string[] }`** — Post-processing pass:
      1. First pass: build anchor map by walking the tree. For each node that had an anchor declared during parsing, map `anchorName → node.id`.
      2. Second pass: for each goto node, look up its target anchor in the map. If found, set `targetId = resolvedNodeId`. If not found, leave `targetId` undefined and add to `unresolvedGotos` list.
    - **Design note**: The anchor information needs to flow from the lexer through the tree builder to the resolver. The `ParsedLine` has `anchor?: string`. The tree builder should attach this as a temporary property or the resolver needs access to the original `ParsedLine` data. Recommended approach: during tree building, store a side-map of `nodeId → anchorName` that gets passed to the resolver.
    - **`collectAnchors(lines: ParsedLine[], nodeIds: string[]): Map<string, string>`** — Build the anchorName → nodeId mapping from the parallel arrays of parsed lines and generated node IDs.

  - Write tests in `src/logic/__tests__/resolver.test.ts`:
    - Simple case: one anchor, one goto → targetId resolved
    - Multiple anchors, multiple gotos → all resolved
    - Broken reference: goto to non-existent anchor → targetId undefined, listed in unresolvedGotos
    - No gotos → no-op, nodes unchanged
    - No anchors → all gotos unresolved
    - Anchor on nested node, goto on different branch → still resolves (tree-wide)

  **Must NOT do**:
  - Do NOT modify OutlineNode to add an `anchorName` field — anchor data is transient, used only during parsing
  - Do NOT fail on broken references — collect them and return
  - Do NOT handle circular goto references — that's a UI/runtime concern

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Moderate complexity — two-pass tree walking with map lookup. Clear algorithm.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 1 (vitest), 2 (types), 3 (aliases — for understanding branch resolution context)

  **References**:

  **Pattern References**:
  - `.sisyphus/drafts/logic-syntax-spec.md:310-365` — Complete anchor and goto specification. Anchor declaration with `@name`, goto referencing with `@name`, broken reference behavior, case-sensitive matching, `[a-zA-Z0-9-]+` name pattern.
  - `src/types.ts:8` — `targetId?: string` on `OutlineNode`. This is the field the resolver sets. It contains the `id` of the target node, NOT the anchor name.
  - `src/store.tsx:1088-1098` — `setGotoTarget(gotoNodeId, targetId)` in store. This shows how the app uses `targetId` — it's a node ID, not an anchor name.

  **API/Type References**:
  - `src/logic/types.ts` (from T2) — `ParsedLine.anchor?: string` is the source of anchor names.
  - `src/logic/types.ts` (from T2) — `ParsedLine.isGoto: boolean` identifies which nodes are gotos.

  **WHY Each Reference Matters**:
  - Anchor spec — Defines exact behavior for resolution, broken refs, naming rules.
  - `targetId` — Must understand this is a node ID (not anchor name) to correctly implement resolution.
  - Store's `setGotoTarget` — Confirms the app expects `targetId` to be a node ID.

  **Acceptance Criteria**:
  - [ ] `src/logic/resolver.ts` exists with `resolveAnchors()` and `collectAnchors()`
  - [ ] Anchors resolve correctly: goto node gets `targetId` set to target node's `id`
  - [ ] Broken references: `targetId` left undefined, anchor name in `unresolvedGotos` array
  - [ ] Multiple anchors and gotos all resolve independently
  - [ ] Nested anchors (deep in tree) resolvable by gotos anywhere in tree
  - [ ] `npx vitest run src/logic/__tests__/resolver.test.ts` → PASS (6+ tests)
  - [ ] `tsc -b` → no type errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Resolver tests pass
    Tool: Bash
    Preconditions: vitest installed, resolver module created
    Steps:
      1. Run `npx vitest run src/logic/__tests__/resolver.test.ts`
      2. Assert all tests pass
    Expected Result: 6+ tests pass covering resolution, broken refs, multiple anchors, nested anchors
    Failure Indicators: targetId not set, broken refs not detected, cross-branch resolution failing
    Evidence: .sisyphus/evidence/task-8-resolver-tests.txt

  Scenario: Broken goto references handled gracefully
    Tool: Bash
    Preconditions: Test includes goto to non-existent anchor
    Steps:
      1. Verify test creates a goto node referencing "@nonexistent"
      2. Assert targetId is undefined on the goto node
      3. Assert "nonexistent" appears in unresolvedGotos array
    Expected Result: No exception thrown, graceful degradation
    Failure Indicators: Exception thrown, targetId set to wrong value
    Evidence: .sisyphus/evidence/task-8-broken-refs.txt
  ```

  **Commit**: YES
  - Message: `feat(logic): add goto anchor resolver with broken reference handling`
  - Files: `src/logic/resolver.ts`, `src/logic/__tests__/resolver.test.ts`
  - Pre-commit: `npx vitest run src/logic/__tests__/resolver.test.ts`

---

- [ ] 9. Parser Entry Point + Integration Tests — `src/logic/parser.ts` + `src/logic/index.ts`

  **What to do**:
  - Create `src/logic/parser.ts` with:
    - **`parse(text: string): ParseResult`** — Main entry point orchestrating the full pipeline:
      1. Call `preprocessLines(text)` from lexer → get preprocessed lines (or errors)
      2. For each preprocessed line, call `lexLine(content)` → get `ParsedLine[]`
      3. Call `buildTree(parsedLines)` → get nested `OutlineNode[]`
      4. Call `validateBranches(nodes)` → enforce decision/branch invariants
      5. Call `resolveAnchors(nodes, anchorMap)` → set `targetId` on goto nodes
      6. Return `ParseResult: { nodes, errors, warnings }` — errors from all stages collected, warnings for unresolved gotos
    - Handle the anchor data flow: `lexLine` produces `ParsedLine` with `anchor?` and `isGoto`. After tree building (which generates IDs), collect anchors into a map, then run resolver.
  - Create `src/logic/index.ts` barrel export:
    ```typescript
    export { parse } from './parser';
    export { serialize } from './serializer';
    export type { ParseResult, ParseError } from './types';
    ```
  - Write **integration tests** in `src/logic/__tests__/parser.test.ts` testing the FULL pipeline end-to-end:
    - **Bracket syntax**: Parse the K8s deployment example from spec → verify correct node tree
    - **Keyword syntax**: Parse the keyword example from spec → same canonical structure
    - **Sigil syntax**: Parse the sigil example from spec → same canonical structure
    - **Mixed syntax**: Parse Example 4 from spec ("Auth flow — written quickly in vim") → correct tree
    - **Goto with anchors**: Parse Example 5 from spec → goto node has `targetId` pointing to correct node
    - **Multi-line labels**: Parse Example 6 → labels joined correctly
    - **Error cases**: Tab input → error, 3-space indent → error, empty input → empty result
    - **Round-trip test**: serialize a tree → parse the output → compare node types and labels (IDs will differ)
    - **Comment handling**: Comments in file are skipped, not in output tree
    - **Branch structure**: Decision nodes have branch children with correct labels

  **Must NOT do**:
  - Do NOT add caching or memoization — keep it simple
  - Do NOT add streaming/incremental parsing
  - Do NOT import React or store modules

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integration work requiring understanding of all parser components and comprehensive test coverage. Must verify the complete pipeline against spec examples.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction yet

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 10, though T10 depends on T9)
  - **Parallel Group**: Wave 3 (start with Task 10 after this completes)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 6 (lexer), 7 (tree), 8 (resolver)

  **References**:

  **Pattern References**:
  - `src/logic/lexer.ts` (from T6) — `preprocessLines()`, `lexLine()` functions to call
  - `src/logic/tree.ts` (from T7) — `buildTree()`, `validateBranches()` functions to call
  - `src/logic/resolver.ts` (from T8) — `resolveAnchors()`, `collectAnchors()` functions to call
  - `src/logic/serializer.ts` (from T4) — `serialize()` for round-trip tests
  - `src/keybindings/index.ts` — Example barrel export pattern in this codebase

  **Test Data References**:
  - `.sisyphus/drafts/logic-syntax-spec.md:548-572` — Example 1: Bracket style K8s deployment (full bracket syntax tree)
  - `.sisyphus/drafts/logic-syntax-spec.md:574-598` — Example 2: Sigil style (same tree, sigil syntax)
  - `.sisyphus/drafts/logic-syntax-spec.md:600-624` — Example 3: Keyword style (same tree, keyword syntax)
  - `.sisyphus/drafts/logic-syntax-spec.md:626-650` — Example 4: Mixed style ("chaos, captured" — brackets + keywords + sigils + inference)
  - `.sisyphus/drafts/logic-syntax-spec.md:652-669` — Example 5: Goto with anchors
  - `.sisyphus/drafts/logic-syntax-spec.md:671-688` — Example 6: Multi-line labels

  **WHY Each Reference Matters**:
  - Component modules — You're orchestrating these. Must understand their APIs.
  - Spec examples — These are the AUTHORITATIVE test cases. If the parser doesn't handle these correctly, it's broken. Each example shows a different syntax family producing the same canonical tree.
  - Barrel export pattern — Follow codebase conventions.

  **Acceptance Criteria**:
  - [ ] `src/logic/parser.ts` exists with `parse(text: string): ParseResult`
  - [ ] `src/logic/index.ts` exports `parse`, `serialize`, `ParseResult`, `ParseError`
  - [ ] All 6 spec examples parse correctly (bracket, sigil, keyword, mixed, goto, multi-line)
  - [ ] Mixed-syntax input (Example 4) produces same tree structure as pure-bracket input
  - [ ] Goto anchors resolve to correct node IDs
  - [ ] Tab and bad-indent errors collected in `ParseResult.errors`
  - [ ] Round-trip: serialize → parse → compare types/labels matches
  - [ ] Empty input → `{ nodes: [], errors: [], warnings: [] }`
  - [ ] `npx vitest run src/logic/__tests__/parser.test.ts` → PASS (12+ tests)
  - [ ] `npx vitest run` → ALL tests pass (full suite)
  - [ ] `tsc -b` → no type errors

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full parser integration tests pass
    Tool: Bash
    Preconditions: All parser components available (T6, T7, T8)
    Steps:
      1. Run `npx vitest run src/logic/__tests__/parser.test.ts`
      2. Assert 12+ tests pass, 0 failures
    Expected Result: All integration tests pass including all spec examples
    Failure Indicators: Any spec example failing, mixed syntax producing different tree than pure bracket
    Evidence: .sisyphus/evidence/task-9-parser-integration.txt

  Scenario: Full test suite passes
    Tool: Bash
    Preconditions: All parser modules complete
    Steps:
      1. Run `npx vitest run`
      2. Assert ALL tests across ALL test files pass
    Expected Result: 60+ total tests, 0 failures across all files
    Failure Indicators: Any regression in earlier modules
    Evidence: .sisyphus/evidence/task-9-full-suite.txt

  Scenario: Round-trip serializer → parser produces equivalent tree
    Tool: Bash
    Preconditions: Serializer and parser both working
    Steps:
      1. Verify test creates a tree, serializes it, parses the output
      2. Assert each node's type and label matches (IDs differ — that's expected)
      3. Assert tree structure (nesting) matches
    Expected Result: Serialized output re-parses to structurally equivalent tree
    Failure Indicators: Types differ, labels differ, nesting structure differs
    Evidence: .sisyphus/evidence/task-9-roundtrip.txt
  ```

  **Commit**: YES
  - Message: `feat(logic): add parser entry point with full pipeline integration`
  - Files: `src/logic/parser.ts`, `src/logic/index.ts`, `src/logic/__tests__/parser.test.ts`
  - Pre-commit: `npx vitest run`

---

- [ ] 10. Wire Parser/Serializer into Header UI + Store Integration

  **What to do**:
  - **Store changes** (minimal):
    - Add `importDocument(nodes: OutlineNode[], name: string): string` method to the store that creates a new document with the provided nodes (instead of `createEmptyNodes()`). Pattern: copy `createDocument()` logic but substitute provided nodes. Return the new document ID.
    - Add `importDocument` to the `DocumentStore` interface, `StoreProvider` value, and `useDocuments()` hook.
  - **Header.tsx changes** (replace stubs from T5):
    - Import `parse` and `serialize` from `src/logic`
    - Import `useDocuments` to access `activeDocument`, `importDocument`
    - Replace import stub:
      1. Read file text via FileReader
      2. Call `parse(text)` → get `ParseResult`
      3. If `result.errors.length > 0` → show error toast with first error message
      4. If `result.nodes.length > 0` → call `importDocument(result.nodes, filename)` → switch to new doc
      5. If `result.warnings.length > 0` → show warning about unresolved gotos (brief, auto-dismiss)
    - Replace export stub:
      1. Get `activeDocument.nodes` from store
      2. Call `serialize(nodes)` → get `.logic` text string
      3. Create Blob → URL.createObjectURL → trigger download as `{documentName}.logic`
  - **Error display**: Style the error/warning toast to match the app's slate color scheme. Show below header, auto-dismiss after 5 seconds.

  **Must NOT do**:
  - Do NOT modify `src/types.ts`
  - Do NOT add undo/redo for imports
  - Do NOT add a confirmation dialog before import ("are you sure?")
  - Do NOT add export preview
  - Do NOT modify any component other than Header.tsx (and store.tsx for the new method)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Cross-cutting integration — store method + UI wiring + error handling. Moderate complexity.
  - **Skills**: [`frontend-ui-ux`, `playwright`]
    - `frontend-ui-ux`: Error toast styling, visual integration
    - `playwright`: End-to-end verification of import/export flow
  - **Skills Evaluated but Omitted**:
    - `git-master`: No git operations during task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential after T9)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 4 (serializer), 5 (UI scaffold), 9 (parser entry)

  **References**:

  **Pattern References**:
  - `src/store.tsx:760-765` — `createDocument()` method. The new `importDocument()` should follow this exact pattern but accept `nodes` parameter instead of calling `createEmptyNodes()`.
  - `src/store.tsx:659-670` — `DocumentStore` interface. Add `importDocument: (nodes: OutlineNode[], name: string) => string` here.
  - `src/store.tsx:1165-1179` — `useDocuments()` hook. Add `importDocument` to the returned object.
  - `src/components/Header.tsx` (from T5) — The stub handlers to replace. Import button → real parse logic. Export button → real serialize logic.

  **API/Type References**:
  - `src/logic/index.ts` (from T9) — `parse(text): ParseResult`, `serialize(nodes): string`. These are the two functions to wire in.
  - `src/logic/types.ts` (from T2) — `ParseResult: { nodes, errors, warnings }`. Check `errors.length` and `warnings.length` for user feedback.

  **WHY Each Reference Matters**:
  - `createDocument()` — Copy this pattern for `importDocument()`. Same structure, different node source.
  - `DocumentStore` interface — Must add the new method to the interface for TypeScript to accept it.
  - `useDocuments()` — Must expose the new method through the hook for Header to access it.
  - Parser/serializer APIs — These are what you're calling. Must understand return types.

  **Acceptance Criteria**:
  - [ ] `importDocument(nodes, name)` method exists on store and creates a new document with provided nodes
  - [ ] Import button: selecting a `.logic` file creates a new document with parsed nodes
  - [ ] Export button: downloads current document as `{name}.logic` file
  - [ ] Parse errors displayed in error toast below header
  - [ ] Unresolved goto warnings displayed briefly
  - [ ] Error toast auto-dismisses after 5 seconds
  - [ ] Imported document appears in document dropdown
  - [ ] Imported flowchart renders correctly in both outline and flowchart views
  - [ ] `tsc -b` → no type errors
  - [ ] `npx vitest run` → all tests still pass

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Import a .logic file and verify rendering
    Tool: Playwright
    Preconditions: App running, parser and serializer wired in
    Steps:
      1. Navigate to http://localhost:5173
      2. Create a test .logic file with content:
         [start] Test Flow
           [process] Step one
           [decision] Continue?
             [yes]
               [end] Done
             [no]
               [end] Stopped
      3. Click import button
      4. Upload the test .logic file via file chooser
      5. Wait for document to load (new doc appears in header title)
      6. Assert outline view shows 6 nodes with correct labels
      7. Assert flowchart view renders (canvas element present)
      8. Screenshot both views
    Expected Result: Document created, outline shows correct hierarchy, flowchart renders
    Failure Indicators: Parse error toast, empty document, wrong node types, broken rendering
    Evidence: .sisyphus/evidence/task-10-import-flow.png

  Scenario: Export and re-import produces equivalent document
    Tool: Playwright
    Preconditions: App running with a document loaded
    Steps:
      1. Navigate to http://localhost:5173
      2. Load a sample flow (K8s Auth or CI/CD)
      3. Click export button
      4. Capture the downloaded .logic file content
      5. Import the exported file
      6. Compare node count between original and re-imported document
      7. Screenshot both documents side-by-side (switch between them)
    Expected Result: Re-imported document has same structure, types, and labels as original
    Failure Indicators: Node count differs, types wrong, labels missing
    Evidence: .sisyphus/evidence/task-10-roundtrip-export.png

  Scenario: Import with errors shows error toast
    Tool: Playwright
    Preconditions: App running
    Steps:
      1. Navigate to http://localhost:5173
      2. Create a .logic file with tab indentation:
         [start] Bad file
         	[process] Tab indented
      3. Import this file
      4. Assert error toast appears below header
      5. Assert toast contains text about "tab" or "Tab"
      6. Wait 6 seconds
      7. Assert toast has dismissed
    Expected Result: Error toast visible with tab error message, auto-dismisses after 5s
    Failure Indicators: No toast, wrong message, toast persists, app crashes
    Evidence: .sisyphus/evidence/task-10-import-error.png

  Scenario: Import with broken goto shows warning
    Tool: Playwright
    Preconditions: App running
    Steps:
      1. Create .logic file with broken goto:
         [start] Flow
           [goto @nonexistent]
      2. Import this file
      3. Assert warning toast appears mentioning unresolved reference
      4. Assert document was still created (goto node exists but without target)
    Expected Result: Warning toast shown, document created with unresolved goto
    Failure Indicators: Hard error, document not created, no warning
    Evidence: .sisyphus/evidence/task-10-broken-goto.png
  ```

  **Commit**: YES
  - Message: `feat(logic): wire parser and serializer into import/export UI`
  - Files: `src/store.tsx`, `src/components/Header.tsx`
  - Pre-commit: `tsc -b && npx vitest run`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read `.sisyphus/plans/logic-file-format.md` end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.

  Specific checks:
  - All 4 syntax families parse correctly (bracket, keyword, sigil, inference)
  - Alias table has all 30 documented aliases
  - Sigil map has all 7 sigils
  - `-` family disambiguation works
  - Branch mapping: `[yes]` → `{ type: 'branch', label: 'Yes' }`
  - `isComment` nodes NOT in export output
  - No imports from `src/store.tsx` in `src/logic/` (except `src/types.ts`)
  - No external parser libraries in `package.json`
  - Tab rejection with error message
  - `tsc -b` clean, `npx vitest run` all pass

  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc -b` + `npx eslint .` + `npx vitest run`. Review all files in `src/logic/` for: `as any`/`@ts-ignore`, empty catches, console.log in prod code (not tests), commented-out code, unused imports. Check AI slop: excessive comments (more than 1 comment per 10 lines of code), over-abstraction, generic variable names (data/result/item/temp without context).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` + `playwright` skill
  Start from clean state (fresh app load). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration:
  - Import bracket example → export → re-import → compare
  - Import mixed-syntax example → verify all types correct
  - Import file with errors → verify error toast
  - Import file with goto anchors → verify goto works in flowchart view
  - Export sample K8s auth flow → verify output is valid `.logic` format
  Save all evidence to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task T1-T10: read "What to do" and "Must NOT do", read actual files. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Specific scope checks:
  - No hydration model implemented (no `.logic.json` files)
  - No round-trip style preservation
  - No settings UI for export style
  - No variable interpolation
  - No module system
  - `src/types.ts` unmodified
  - `src/store.tsx` only has `importDocument` added
  - No external parser libraries
  Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| T1 | `feat(logic): set up vitest test infrastructure` | `vitest.config.ts`, `package.json`, `src/logic/__tests__/setup.test.ts` | `npx vitest run` |
| T2 | `feat(logic): add parser-specific type definitions` | `src/logic/types.ts`, `src/logic/__tests__/types.test.ts` | `npx vitest run` |
| T3 | `feat(logic): add alias table and sigil map with lookup functions` | `src/logic/aliases.ts`, `src/logic/__tests__/aliases.test.ts` | `npx vitest run` |
| T4 | `feat(logic): add .logic file serializer with bracket syntax export` | `src/logic/serializer.ts`, `src/logic/__tests__/serializer.test.ts` | `npx vitest run` |
| T5 | `feat(logic): add import/export button scaffold in header` | `src/components/Header.tsx` | `tsc -b` |
| T6 | `feat(logic): add lexer with multi-syntax family detection and parsing` | `src/logic/lexer.ts`, `src/logic/__tests__/lexer.test.ts` | `npx vitest run` |
| T7 | `feat(logic): add tree builder with alias resolution and branch validation` | `src/logic/tree.ts`, `src/logic/__tests__/tree.test.ts` | `npx vitest run` |
| T8 | `feat(logic): add goto anchor resolver with broken reference handling` | `src/logic/resolver.ts`, `src/logic/__tests__/resolver.test.ts` | `npx vitest run` |
| T9 | `feat(logic): add parser entry point with full pipeline integration` | `src/logic/parser.ts`, `src/logic/index.ts`, `src/logic/__tests__/parser.test.ts` | `npx vitest run` |
| T10 | `feat(logic): wire parser and serializer into import/export UI` | `src/store.tsx`, `src/components/Header.tsx` | `tsc -b && npx vitest run` |

---

## Success Criteria

### Verification Commands
```bash
tsc -b                    # Expected: clean exit, no output
npx vitest run            # Expected: 60+ tests pass, 0 failures
npx eslint .              # Expected: no errors
```

### Final Checklist
- [ ] All "Must Have" items present and verified
- [ ] All "Must NOT Have" items confirmed absent
- [ ] All tests pass (`npx vitest run`)
- [ ] TypeScript compiles clean (`tsc -b`)
- [ ] Import flow works end-to-end (file picker → parse → render)
- [ ] Export flow works end-to-end (serialize → download)
- [ ] Mixed-syntax `.logic` files parse correctly
- [ ] Error handling works (tabs, bad indent, broken gotos)
- [ ] `src/logic/` module is fully decoupled from React/store (pure functions)
- [ ] Evidence files captured for all QA scenarios
