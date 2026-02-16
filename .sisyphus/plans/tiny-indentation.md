# Tiny Indentation

## TL;DR

> **Quick Summary**: Reduce horizontal indentation from 24px/level to 8px/level to prevent deep nodes from being pushed off-screen.
> 
> **Deliverables**: 
> - Single line change in OutlineEditor.tsx
> 
> **Estimated Effort**: Quick (< 5 minutes)
> **Parallel Execution**: NO - single task
> **Critical Path**: Task 1 only

---

## Context

### Original Request
User wants to reduce indentation spacing to keep deeply nested nodes visible without horizontal scrolling. After rejecting a complex flat-outline implementation, user chose the simplest solution: "just make the spacing tiny".

### User Decision
Selected "Just tiny indentation" - keep current structure with vertical rail lines, reduce `ml-3 pl-3` to `ml-1 pl-1`.

---

## Work Objectives

### Core Objective
Reduce per-level indentation from 24px to 8px while preserving the existing visual structure.

### Concrete Deliverables
- Modified `src/components/OutlineEditor.tsx` line 188

### Definition of Done
- [x] Build passes: `bun run build` exits 0
- [x] Indentation visually reduced (verified via Playwright)

### Must Have
- Reduced indentation: `ml-1 pl-1` instead of `ml-3 pl-3`
- Keep existing `border-l border-slate-700/50` vertical rail line

### Must NOT Have (Guardrails)
- No other changes to OutlineEditor.tsx
- No removal of the vertical rail line
- No color changes
- No structural changes

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun)
- **Automated tests**: NO (UI change, no unit tests needed)
- **Framework**: bun

### Agent-Executed QA Scenarios (MANDATORY)

Primary verification via Playwright to confirm visual change.

---

## TODOs

- [x] 1. Reduce indentation spacing

  **What to do**:
  - Open `src/components/OutlineEditor.tsx`
  - Line 188: Change `ml-3 pl-3` to `ml-1 pl-1`
  - Keep `border-l border-slate-700/50` unchanged

  **Must NOT do**:
  - Change any other code
  - Remove the border/rail line
  - Add any new features

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-line trivial change
  - **Skills**: [`playwright`]
    - `playwright`: For visual verification of indentation change

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: N/A (single task)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/components/OutlineEditor.tsx:188` - The exact line to modify

  **Acceptance Criteria**:

  **Build Verification:**
  - [x] `bun run build` exits with code 0

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Indentation is visually reduced
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:5173
    Steps:
      1. Navigate to: http://localhost:5173
      2. Wait for: .outline-editor or main content area visible (timeout: 5s)
      3. Create nested nodes if needed (or use existing data)
      4. Visual inspection: Nodes at depth 3+ should have significantly less horizontal offset than before
      5. Assert: Vertical rail lines (border-l) still visible between parent-child
      6. Screenshot: .sisyphus/evidence/tiny-indentation-result.png
    Expected Result: Indentation is tighter, content stays on-screen at deep levels
    Evidence: .sisyphus/evidence/tiny-indentation-result.png
  ```

  **Commit**: YES
  - Message: `style(outline): reduce indentation from 24px to 8px per level`
  - Files: `src/components/OutlineEditor.tsx`
  - Pre-commit: `bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `style(outline): reduce indentation from 24px to 8px per level` | OutlineEditor.tsx | bun run build |

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Expected: exits 0, no errors
```

### Final Checklist
- [x] `ml-1 pl-1` replaces `ml-3 pl-3` on line 188
- [x] Vertical rail line preserved
- [x] Build passes
- [x] Screenshot evidence captured
