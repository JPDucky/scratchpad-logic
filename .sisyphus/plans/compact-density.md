# Compact Density Mode

## TL;DR

> **Quick Summary**: Reduce vertical spacing in the outline editor so 20-25 nodes fit on screen without scrolling, using a parametric config object for future adjustability.
> 
> **Deliverables**:
> - `DENSITY_CONFIG` object at top of OutlineEditor.tsx
> - Reduced row padding, icon size, node gap, and text padding
> - ~33% more nodes visible in same viewport
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: NO - single task
> **Critical Path**: Task 1 (only task)

---

## Context

### Original Request
User reported that after ~12 nodes, the outline requires scrolling. They want 20-25 nodes visible without scrolling, with parametric adjustability via code.

### Interview Summary
**Key Discussions**:
- **Display mode**: Always compact (not toggleable)
- **Target density**: 20-25 nodes visible, adjustable via code
- **Approach**: Reduce padding/spacing, create config object

**Research Findings**:
- Current row height: ~34px (py-1 + h-5 icon + py-0.5 text + space-y-0.5 gap)
- Target row height: ~20px (py-0.5 + h-4 icon + py-0 text + space-y-0 gap)
- This yields ~33% more nodes per viewport

### Metis Review
**Identified Gaps** (addressed):
- Text `py-0.5` padding was missed in original analysis (now included)
- Jump labels have `h-5` sizing (out of scope, separate concern)
- Click target size concern (20px still usable, not touch-device)
- Empty state and very long labels (no change needed, just verify)

---

## Work Objectives

### Core Objective
Increase outline node density by ~33% through reduced vertical spacing, making 20-25 nodes visible without scrolling in a typical viewport.

### Concrete Deliverables
- `DENSITY_CONFIG` constant in `src/components/OutlineEditor.tsx`
- Updated row classes using config values
- Updated icon size using config values
- Updated container gap using config values

### Definition of Done
- [x] At least 20 nodes visible in a 600px tall panel without scrolling
- [x] `DENSITY_CONFIG` object exists and is clearly documented
- [x] `bun run build` passes with zero TypeScript errors

### Must Have
- Parametric config object for spacing values
- Reduced vertical spacing (~33% improvement)
- No visual regressions (text readable, icons visible)

### Must NOT Have (Guardrails)
- **NO font size changes** - Keep `text-sm` and `text-xs` as-is
- **NO indentation changes** - Keep `ml-3 pl-3` for visual rails
- **NO horizontal spacing changes** - Keep `gap-2` between icon and text
- **NO NodeTypeSelector changes** - Dropdown already uses `w-4 h-4`
- **NO refactoring** - Only add config, don't reorganize existing code
- **NO jump label changes** - Separate concern

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL verification is executed by the agent using tools.

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: NO - This is a visual/layout change
- **Framework**: N/A

### Agent-Executed QA Scenarios (MANDATORY)

**Verification Tool:**
| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Visual/Layout** | Playwright | Count visible nodes, take screenshots |
| **Build** | Bash | Run build, check for errors |
| **Code** | Bash (grep) | Verify config object exists |

---

## Execution Strategy

### Single Task
This is a quick, focused change. No parallel execution needed.

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | task(category="quick", load_skills=["playwright"], run_in_background=false) |

---

## TODOs

- [x] 1. Implement DENSITY_CONFIG and apply to OutlineEditor

  **What to do**:
  
  1. **Create config object** at top of OutlineEditor.tsx (after imports):
  ```typescript
  /**
   * Density configuration - adjust these values to change node density.
   * Current settings optimized for 20-25 visible nodes in ~600px panel.
   */
  const DENSITY_CONFIG = {
    rowPadding: 'py-0.5',      // py-0.5 = 4px total, py-1 = 8px total
    iconSize: 'w-4 h-4',       // w-4 h-4 = 16px, w-5 h-5 = 20px
    nodeGap: 'space-y-0',      // space-y-0 = 0px, space-y-0.5 = 2px
    textPadding: 'py-0',       // py-0 = 0px, py-0.5 = 4px
  } as const;
  ```

  2. **Update row classes** (line ~181):
     - Find: `py-1` in the row className
     - Replace with: `${DENSITY_CONFIG.rowPadding}`
  
  3. **Update icon button** (line ~208):
     - Find: `w-5 h-5` in the icon button className
     - Replace with: `${DENSITY_CONFIG.iconSize}`
  
  4. **Update text spans** (lines ~224, ~255, ~258):
     - Find: `py-0.5` in the text span/input classNames
     - Replace with: `${DENSITY_CONFIG.textPadding}`
  
  5. **Update container gap** (line ~608):
     - Find: `space-y-0.5` in the container div
     - Replace with: `${DENSITY_CONFIG.nodeGap}`

  **Must NOT do**:
  - Change font sizes (`text-sm`, `text-xs`)
  - Change indentation (`ml-3 pl-3`)
  - Change horizontal gap (`gap-2`)
  - Touch NodeTypeSelector component
  - Touch jump label sizing
  - Reorganize or refactor existing class patterns

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, <20 line changes, straightforward replacements
  - **Skills**: [`playwright`]
    - `playwright`: Needed for visual verification and node counting
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not needed - no design decisions, just spacing changes

  **Parallelization**:
  - **Can Run In Parallel**: NO (single task)
  - **Parallel Group**: N/A
  - **Blocks**: None
  - **Blocked By**: None

  **References** (CRITICAL):

  **Pattern References** (existing code to follow):
  - `src/components/OutlineEditor.tsx:180-185` - Current row className concatenation pattern
  - `src/components/OutlineEditor.tsx:208` - Current icon button with w-5 h-5
  - `src/components/OutlineEditor.tsx:608` - Current container with space-y-0.5

  **Exact Lines to Modify**:
  - `src/components/OutlineEditor.tsx:181` - Row padding `py-1` → `${DENSITY_CONFIG.rowPadding}`
  - `src/components/OutlineEditor.tsx:208` - Icon `w-5 h-5` → `${DENSITY_CONFIG.iconSize}`
  - `src/components/OutlineEditor.tsx:224` - Goto text `py-0.5` → `${DENSITY_CONFIG.textPadding}`
  - `src/components/OutlineEditor.tsx:255` - Input `py-0.5` → `${DENSITY_CONFIG.textPadding}`
  - `src/components/OutlineEditor.tsx:258` - Span `py-0.5` → `${DENSITY_CONFIG.textPadding}`
  - `src/components/OutlineEditor.tsx:608` - Container `space-y-0.5` → `${DENSITY_CONFIG.nodeGap}`

  **WHY Each Reference Matters**:
  - Line 180-185: Shows existing className array pattern to follow for row
  - Line 208: Shows the icon button element that needs size reduction
  - Lines 224/255/258: Shows all text elements with py-0.5 that need config
  - Line 608: Shows the container div that controls inter-node spacing

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY**

  **Build Verification:**
  - [ ] `bun run build` completes with zero TypeScript errors
  - [ ] No console warnings about invalid Tailwind classes

  **Code Verification:**
  - [ ] `grep -n "DENSITY_CONFIG" src/components/OutlineEditor.tsx | head -10` shows config object
  - [ ] Config object has `rowPadding`, `iconSize`, `nodeGap`, `textPadding` properties

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Verify increased node density
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:5173
    Steps:
      1. Navigate to: http://localhost:5173
      2. Click on outline panel to focus it
      3. Create 25 nodes using: press 'o' key 24 times (creates sibling)
      4. Wait for: 25 nodes to exist in DOM
      5. Measure: Count nodes visible without scrolling
      6. Assert: At least 20 nodes visible in viewport (scrollTop = 0)
      7. Screenshot: .sisyphus/evidence/compact-density-25-nodes.png
    Expected Result: 20+ nodes visible without scrolling
    Evidence: .sisyphus/evidence/compact-density-25-nodes.png

  Scenario: Verify icons and text are readable
    Tool: Playwright (playwright skill)
    Preconditions: Previous scenario completed (25 nodes exist)
    Steps:
      1. Screenshot the outline panel
      2. Assert: Node type icons are visible (16x16px minimum)
      3. Assert: Text labels are readable (text-sm = 14px)
      4. Screenshot: .sisyphus/evidence/compact-density-readability.png
    Expected Result: Icons and text clearly visible despite smaller size
    Evidence: .sisyphus/evidence/compact-density-readability.png

  Scenario: Verify keyboard navigation still works
    Tool: Playwright (playwright skill)
    Preconditions: Outline panel focused, 25 nodes exist
    Steps:
      1. Press 'j' to move down
      2. Assert: Focus moves to next node (ring visible)
      3. Press 'k' to move up
      4. Assert: Focus returns to previous node
      5. Press 'i' to enter insert mode
      6. Type "Test label"
      7. Press Escape
      8. Assert: Label saved correctly
    Expected Result: All navigation works at new density
    Evidence: Terminal output confirms key presses work
  ```

  **Evidence to Capture:**
  - [ ] `.sisyphus/evidence/compact-density-25-nodes.png` - Shows 20+ nodes visible
  - [ ] `.sisyphus/evidence/compact-density-readability.png` - Shows icons/text are readable

  **Commit**: YES
  - Message: `feat(ui): implement compact density mode for outline editor`
  - Files: `src/components/OutlineEditor.tsx`
  - Pre-commit: `bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(ui): implement compact density mode for outline editor` | OutlineEditor.tsx | bun run build |

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Expected: Build successful, no errors
grep -n "DENSITY_CONFIG" src/components/OutlineEditor.tsx  # Expected: Config object visible
```

### Final Checklist
- [x] At least 20 nodes visible in viewport without scrolling
- [x] DENSITY_CONFIG object exists with all 4 properties
- [x] No font size changes (text-sm preserved)
- [x] No indentation changes (ml-3 pl-3 preserved)
- [x] Build passes with zero errors
- [x] Keyboard navigation works (j/k/i/o)
