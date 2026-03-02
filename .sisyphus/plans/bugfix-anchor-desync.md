# Bugfix: Resolver Anchor Desync After validateBranches

## TL;DR

> **Quick Summary**: Fix a P0 bug where the resolver's parallel walk between ParsedLine[] and OutlineNode[] desyncs when validateBranches inserts synthetic branch nodes. Reorder the pipeline so anchor resolution happens before branch validation.
> 
> **Deliverables**:
> - Fix pipeline ordering in parser.ts and tree.ts
> - Add 2 regression tests
> - Update existing tree.test.ts for changed buildTree behavior
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO — sequential fixes
> **Critical Path**: T1 → T2 → T3

---

## Context

### Bug Description
`validateBranches()` inserts synthetic branch nodes when a decision node has non-branch children. The resolver's `buildAnchorMap()` then walks the modified tree in parallel with the original `ParsedLine[]` — but the node count no longer matches the line count. Anchors get mapped to wrong nodes.

### Root Cause
In `tree.ts` line 86, `buildTree()` calls `validateBranches(nodes)` internally. Then in `parser.ts` line 22, `validateBranches` is called AGAIN. The resolver runs AFTER both calls, when the tree has synthetic nodes that don't correspond to any ParsedLine entry.

### Reproduction
```
[decision] Check?
  [process @step] Do something
[goto] @step
```
Goto resolves to the synthetic branch(Yes) node instead of the process node.

---

## Work Objectives

### Core Objective
Fix the pipeline ordering so anchor resolution happens before synthetic branch insertion.

### Must Have
- Resolve anchors BEFORE validateBranches
- Remove double validateBranches call
- All 131 existing tests still pass
- 2 new regression tests pass

### Must NOT Have (Guardrails)
- DO NOT change any public API signatures
- DO NOT modify resolver.ts (the bug is in the pipeline ordering, not the resolver)
- DO NOT modify types.ts
- DO NOT skip updating tree.test.ts (buildTree no longer auto-validates)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: YES (tests-after)
- **Framework**: vitest

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Sequential — all 3 tasks):
├── Task 1: Fix tree.ts and parser.ts pipeline ordering [quick]
├── Task 2: Update tree.test.ts for changed buildTree behavior [quick]  
└── Task 3: Add regression tests for anchor desync [quick]

Critical Path: Task 1 → Task 2 → Task 3
```

---

## TODOs

- [x] 1. Fix pipeline ordering in tree.ts and parser.ts

  **What to do**:
  - In `src/logic/tree.ts` line 86, change `return { nodes: validateBranches(nodes), errors };` to `return { nodes, errors };`
  - In `src/logic/parser.ts`, reorder steps 3-5:
    - Step 3: `buildTree(parsedLines)` (unchanged)
    - Step 4: `resolveAnchors(treeResult.nodes, parsedLines)` (moved BEFORE validateBranches)
    - Step 5: `validateBranches(resolveResult.nodes)` (moved AFTER resolveAnchors)
  - Update the return statement to use `validatedNodes` instead of `resolveResult.nodes`

  **Must NOT do**:
  - Do NOT change any function signatures
  - Do NOT modify resolver.ts

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 2, Task 3
  - **Blocked By**: None

  **References**:
  - `src/logic/tree.ts:86` — The line to change (remove validateBranches wrapper)
  - `src/logic/parser.ts:18-25` — The pipeline ordering block to reorder
  - `src/logic/parser.ts:37-41` — The return statement to update

  **Exact edit for tree.ts line 86**:
  ```
  OLD: return { nodes: validateBranches(nodes), errors };
  NEW: return { nodes, errors };
  ```

  **Exact edit for parser.ts lines 18-41**:
  ```typescript
  // 3. Build tree
  const treeResult = buildTree(parsedLines);
  
  // 4. Resolve anchors BEFORE validateBranches (validateBranches inserts
  //    synthetic branch nodes that desync the parallel walk with parsedLines)
  const resolveResult = resolveAnchors(treeResult.nodes, parsedLines);
  
  // 5. Validate branches (auto-wrap decision children in Yes/No branches)
  const validatedNodes = validateBranches(resolveResult.nodes);
  
  // 6. Collect errors and warnings
  const errors = [
    ...preprocessResult.errors,
    ...treeResult.errors
  ];
  
  const warnings = resolveResult.unresolvedGotos.map(
    anchor => `Unresolved goto reference: @${anchor}`
  );
  
  return {
    nodes: validatedNodes,
    errors,
    warnings,
  };
  ```

  **Acceptance Criteria**:
  - [ ] `src/logic/tree.ts:86` no longer calls validateBranches
  - [ ] `src/logic/parser.ts` calls resolveAnchors BEFORE validateBranches
  - [ ] `src/logic/parser.ts` returns validatedNodes
  - [ ] `tsc -b` → no type errors

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: TypeScript compiles cleanly
    Tool: Bash
    Steps:
      1. Run `tsc -b`
    Expected Result: No errors
    Evidence: .sisyphus/evidence/bugfix-tsc.txt
  ```

  **Commit**: NO (grouped with Task 3)

---

- [x] 2. Update tree.test.ts for changed buildTree behavior

  **What to do**:
  - In `src/logic/__tests__/tree.test.ts`, the test "auto-wraps decision children in yes/no branches" (line 105) currently tests that buildTree auto-wraps. Since buildTree no longer calls validateBranches, this test needs updating:
    - Either change it to test that buildTree does NOT auto-wrap (and add a separate validateBranches test)
    - Or wrap the buildTree result in validateBranches in the test
  - The simplest fix: update the test to call `validateBranches(buildTree(lines).nodes)` instead of `buildTree(lines).nodes`

  **Must NOT do**:
  - Do NOT remove the auto-wrap test — just adjust how it's called

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  - `src/logic/__tests__/tree.test.ts:105-118` — The test to update

  **Acceptance Criteria**:
  - [ ] `npx vitest run src/logic/__tests__/tree.test.ts` → all 12 tests pass
  - [ ] Auto-wrap behavior still tested (via explicit validateBranches call)

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: Tree tests pass
    Tool: Bash
    Steps:
      1. Run `npx vitest run src/logic/__tests__/tree.test.ts`
    Expected Result: 12 tests pass
    Evidence: .sisyphus/evidence/bugfix-tree-tests.txt
  ```

  **Commit**: NO (grouped with Task 3)

---

- [x] 3. Add regression tests for anchor desync

  **What to do**:
  - Add two tests to `src/logic/__tests__/parser.test.ts`:
  
  Test 1: "resolves anchor on node inside auto-wrapped decision"
  ```typescript
  it('resolves anchor on node inside auto-wrapped decision', () => {
    const input = [
      '[decision] Check?',
      '  [process @step] Do something',
      '[goto] @step',
    ].join('\n');

    const result = parse(input);
    
    const gotoNode = result.nodes[1];
    const decision = result.nodes[0];
    const yesBranch = decision.children.find(c => c.label === 'Yes');
    const processNode = yesBranch?.children[0];
    
    expect(gotoNode.type).toBe('goto');
    expect(processNode?.type).toBe('process');
    expect(processNode?.label).toBe('Do something');
    expect(gotoNode.targetId).toBe(processNode?.id);
  });
  ```

  Test 2: "resolves anchor on node after auto-wrapped decision"
  ```typescript
  it('resolves anchor on node after auto-wrapped decision', () => {
    const input = [
      '[decision] Check?',
      '  [process] Step A',
      '[process @target] Step B',
      '[goto] @target',
    ].join('\n');

    const result = parse(input);
    
    const processB = result.nodes[1];
    const gotoNode = result.nodes[2];
    
    expect(processB.type).toBe('process');
    expect(processB.label).toBe('Step B');
    expect(gotoNode.type).toBe('goto');
    expect(gotoNode.targetId).toBe(processB.id);
  });
  ```

  **Must NOT do**:
  - Do NOT modify existing tests
  - Do NOT create a separate test file

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: Tasks 1, 2

  **References**:
  - `src/logic/__tests__/parser.test.ts` — Add tests at end of describe block

  **Acceptance Criteria**:
  - [ ] 2 new tests added to parser.test.ts
  - [ ] `npx vitest run src/logic/__tests__/parser.test.ts` → 15 tests pass (13 + 2)
  - [ ] `npx vitest run` → ALL tests pass (full suite)
  - [ ] `tsc -b` → no type errors

  **QA Scenarios (MANDATORY):**
  ```
  Scenario: Full suite passes with regression tests
    Tool: Bash
    Steps:
      1. Run `npx vitest run`
      2. Assert all tests pass
    Expected Result: 133+ tests pass (131 + 2 new)
    Evidence: .sisyphus/evidence/bugfix-full-suite.txt
  ```

  **Commit**: YES
  - Message: `fix(logic): resolve anchor desync after validateBranches inserts synthetic nodes`
  - Files: `src/logic/tree.ts`, `src/logic/parser.ts`, `src/logic/__tests__/tree.test.ts`, `src/logic/__tests__/parser.test.ts`
  - Pre-commit: `npx vitest run`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 3 | `fix(logic): resolve anchor desync after validateBranches inserts synthetic nodes` | tree.ts, parser.ts, tree.test.ts, parser.test.ts | `npx vitest run` |

---

## Success Criteria

### Verification Commands
```bash
npx vitest run  # Expected: 133+ tests, 0 failures
tsc -b           # Expected: clean compilation
```

### Final Checklist
- [x] Anchors resolve correctly when decision nodes are auto-wrapped
- [x] buildTree no longer calls validateBranches internally
- [x] parser.ts calls resolveAnchors BEFORE validateBranches
- [x] All existing tests still pass (133 passing)
- [x] 2 new regression tests pass
