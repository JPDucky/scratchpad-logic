# Flat Outline with Breadcrumb Navigation

## TL;DR

> **Quick Summary**: Replace horizontal indentation with dot-based depth indicators and a sticky breadcrumb header, eliminating the "content pushed off-screen" problem.
> 
> **Deliverables**:
> - Dots indicate depth level (no dots at root, `•` at level 1, `••` at level 2, etc.)
> - Sticky breadcrumb showing path to focused node
> - Subtle color gradient (brighter at root, dimmer at depth)
> - All nodes left-aligned (no horizontal indentation)
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: NO - sequential dependency chain
> **Critical Path**: Task 1 → Task 2 → Task 3

---

## Context

### Original Request
User hates indentation because deep nesting pushes content off-screen to the right. Wants a flat list with visual depth indicators instead.

### Interview Summary
**Key Decisions**:
- **Depth indicator**: Dots (`•`, `••`, `•••`)
- **Root level (depth 0)**: No dots (empty space)
- **Breadcrumb**: Sticky header showing path to focused node
- **Color gradient**: Brighter at root, dimmer at depth
- **Collapse/expand**: DEFERRED to future work

**What We're NOT Doing**:
- No collapse/expand toggles (user explicitly deferred this)
- No data model changes (no `isExpanded` field needed)
- No changes to flowchart view

### Metis Review
**Key Findings**:
- Current indentation: `ml-3 pl-3 border-l` = 24px per level
- Need to handle edge case: breadcrumb overflow for deep paths
- Need to handle edge case: empty labels in breadcrumb
- Navigation (`j`/`k`) should continue working unchanged (no collapse feature)

---

## Work Objectives

### Core Objective
Eliminate horizontal space waste from indentation by using dot-based depth indicators and a breadcrumb header for navigation context.

### Concrete Deliverables
- Modified `OutlineEditor.tsx` with new row structure
- Sticky breadcrumb component
- Dot depth indicator column
- Color gradient by depth

### Definition of Done
- [x] No horizontal indentation in outline (no `ml-3 pl-3` on nested nodes)
- [x] Dots render correctly: depth 0 = none, depth 1 = `•`, depth 2 = `••`, etc.
- [x] Breadcrumb shows path to focused node
- [x] Color gets subtly dimmer at deeper levels
- [x] All existing keyboard navigation works (j/k/o/dd/yy/p, Ctrl-X commands)
- [x] `bun run build` passes with zero TypeScript errors

### Must Have
- Dot-based depth indicator
- Sticky breadcrumb header
- Color gradient by depth
- Preserved keyboard navigation

### Must NOT Have (Guardrails)
- **NO collapse/expand** - explicitly deferred
- **NO data model changes** - `OutlineNode` interface unchanged
- **NO flowchart changes** - only outline editor
- **NO icons in breadcrumb** - text labels only
- **NO animations** - instant rendering
- **NO changes to DENSITY_CONFIG** - already optimized

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: NO - visual/layout changes
- **Framework**: Playwright for visual verification

### Agent-Executed QA Scenarios (MANDATORY)

**Verification Tools:**
| Type | Tool |
|------|------|
| Visual/Layout | Playwright |
| Build | Bash |
| Code | Bash (grep) |

---

## Execution Strategy

### Sequential Tasks
Tasks have dependencies - must execute in order.

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agent |
|------|-------|-------------------|
| 1 | Task 1 | task(category="quick", load_skills=["playwright"]) |
| 2 | Task 2 | task(category="quick", load_skills=["playwright"]) |
| 3 | Task 3 | task(category="quick", load_skills=["playwright"]) |

---

## TODOs

- [x] 1. Remove indentation and add dot-based depth indicator

  **What to do**:
  
  1. **Remove indentation** from OutlineNodeItem:
     - Find line ~199: `<div className={depth > 0 ? "ml-3 pl-3 border-l border-slate-700/50" : ""}>`
     - Replace with: `<div>` (no conditional classes)
  
  2. **Add dot column** to the row structure:
     - Create a fixed-width column (e.g., `w-8` = 32px) at the start of each row
     - Render dots based on depth: `'•'.repeat(depth)` 
     - Right-align dots in the column
     - Style: `text-slate-600 text-xs font-mono`
     - Depth 0 = empty (no dots)
  
  3. **Update row structure** (line ~192-196):
     ```tsx
     // New structure:
     // [dot column] [type icon] [label]
     ```

  **Must NOT do**:
  - Change navigation logic
  - Touch data model
  - Add collapse/expand
  - Modify DENSITY_CONFIG

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 2, Task 3
  - **Blocked By**: None

  **References**:
  - `src/components/OutlineEditor.tsx:199` - Current indentation pattern
  - `src/components/OutlineEditor.tsx:191-196` - Row class construction
  - `src/components/OutlineEditor.tsx:13-18` - DENSITY_CONFIG pattern

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `bun run build` completes with zero TypeScript errors

  **Code Verification:**
  - [ ] `grep -n "ml-3 pl-3" src/components/OutlineEditor.tsx` returns NO matches
  - [ ] `grep -n "repeat(depth)" src/components/OutlineEditor.tsx` returns match (dot rendering)

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Dots render correctly at each depth level
    Tool: Playwright
    Preconditions: Dev server running on localhost:5173
    Steps:
      1. Navigate to http://localhost:5173
      2. Click outline panel to focus
      3. Create structure: Root → Child → Grandchild → Great-grandchild
         - Press 'o' to create sibling
         - Press 'O' (shift+o) to create child
         - Repeat to get 4 levels
      4. Inspect dot indicators:
         - Assert: Root level (depth 0) has NO dots
         - Assert: Child (depth 1) shows "•"
         - Assert: Grandchild (depth 2) shows "••"
         - Assert: Great-grandchild (depth 3) shows "•••"
      5. Screenshot: .sisyphus/evidence/flat-outline-dots.png
    Expected Result: Dots increase with depth, no horizontal indentation
    Evidence: .sisyphus/evidence/flat-outline-dots.png

  Scenario: Keyboard navigation still works
    Tool: Playwright
    Preconditions: Structure from previous scenario exists
    Steps:
      1. Focus on root node
      2. Press 'j' 3 times
      3. Assert: Focus moves down through all nodes
      4. Press 'k' 2 times
      5. Assert: Focus moves back up
      6. Press 'i', type "Test", press Escape
      7. Assert: Label updated
    Expected Result: j/k navigation works, edit mode works
    Evidence: Terminal output confirms navigation
  ```

  **Commit**: YES
  - Message: `feat(ui): replace indentation with dot-based depth indicators`
  - Files: `src/components/OutlineEditor.tsx`
  - Pre-commit: `bun run build`

---

- [x] 2. Add sticky breadcrumb header

  **What to do**:
  
  1. **Compute breadcrumb path** for focused node:
     - Create helper function `getAncestorPath(nodeId: string): OutlineNode[]`
     - Walk up from focused node to root, collecting ancestors
     - Return array: `[root, ..., parent, focused]`
  
  2. **Add breadcrumb component** inside the header section (line ~602):
     - Position: Below "Outline" title, above scrollable content
     - Style: `text-sm text-slate-400`
     - Format: `Label1 › Label2 › Label3`
     - Separator: ` › ` (thin space + right angle bracket + thin space)
     - Empty label fallback: Use node type name (e.g., "Process")
  
  3. **Make breadcrumb sticky** inside scroll area:
     - OR place in header section (already sticky)
     - Breadcrumb should always be visible
  
  4. **Handle overflow**:
     - If path too long, truncate middle: `Root › ... › Parent › Focused`
     - Max display: ~60 characters or 4 segments

  **Must NOT do**:
  - Add icons to breadcrumb
  - Make breadcrumb clickable (navigation feature - defer)
  - Animate breadcrumb changes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  - `src/components/OutlineEditor.tsx:600-615` - Header section
  - `src/store.tsx` - `findNodeById` function for ancestor lookup
  - `src/types.ts:22-31` - NODE_TYPE_CONFIG for type labels

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `bun run build` completes with zero TypeScript errors

  **Code Verification:**
  - [ ] `grep -n "›" src/components/OutlineEditor.tsx` returns match (breadcrumb separator)
  - [ ] `grep -n "getAncestorPath\|ancestorPath\|breadcrumb" src/components/OutlineEditor.tsx` returns matches

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Breadcrumb shows path to focused node
    Tool: Playwright
    Preconditions: Dev server running, multi-level structure exists
    Steps:
      1. Navigate to http://localhost:5173
      2. Create structure with labeled nodes:
         - Root: "Start Process"
         - Child: "Validate Input"
         - Grandchild: "Check Format"
      3. Focus on grandchild ("Check Format")
      4. Assert: Breadcrumb shows "Start Process › Validate Input › Check Format"
      5. Focus on root ("Start Process")
      6. Assert: Breadcrumb shows just "Start Process"
      7. Screenshot: .sisyphus/evidence/flat-outline-breadcrumb.png
    Expected Result: Breadcrumb updates as focus changes
    Evidence: .sisyphus/evidence/flat-outline-breadcrumb.png

  Scenario: Breadcrumb handles empty labels
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Create node with empty label (just press Enter without typing)
      2. Create child of that node
      3. Focus on child
      4. Assert: Breadcrumb shows type name for empty-label parent (e.g., "Process")
    Expected Result: Empty labels fall back to type name
    Evidence: Screenshot or text assertion
  ```

  **Commit**: YES
  - Message: `feat(ui): add sticky breadcrumb navigation header`
  - Files: `src/components/OutlineEditor.tsx`
  - Pre-commit: `bun run build`

---

- [x] 3. Add color gradient by depth

  **What to do**:
  
  1. **Define color scale** in a config (similar to DENSITY_CONFIG):
     ```typescript
     const DEPTH_COLORS = [
       'text-slate-100',  // depth 0 - brightest
       'text-slate-200',  // depth 1
       'text-slate-300',  // depth 2
       'text-slate-400',  // depth 3+
     ] as const;
     ```
  
  2. **Apply color to label text** based on depth:
     - Get color: `DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)]`
     - Apply to the label span/input element
  
  3. **Keep type icon colors unchanged**:
     - Only the text label gets dimmer
     - Type icons retain their semantic colors (green for start, red for end, etc.)

  **Must NOT do**:
  - Change icon colors
  - Apply gradient to background
  - Make it too dramatic (subtle is key)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: Task 1, Task 2

  **References**:
  - `src/components/OutlineEditor.tsx:266-277` - Label rendering (input and span)
  - `src/components/OutlineEditor.tsx:13-18` - DENSITY_CONFIG pattern to follow

  **Acceptance Criteria**:

  **Build Verification:**
  - [ ] `bun run build` completes with zero TypeScript errors

  **Code Verification:**
  - [ ] `grep -n "DEPTH_COLORS" src/components/OutlineEditor.tsx` returns match

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Deeper nodes have dimmer text
    Tool: Playwright
    Preconditions: Dev server running, multi-level structure exists
    Steps:
      1. Navigate to http://localhost:5173
      2. Create 4-level structure with labels at each level
      3. Screenshot showing all levels
      4. Visual inspection: root should be brightest, depth 3+ should be dimmest
      5. Screenshot: .sisyphus/evidence/flat-outline-gradient.png
    Expected Result: Visible gradient from bright (root) to dim (deep)
    Evidence: .sisyphus/evidence/flat-outline-gradient.png

  Scenario: Type icons retain their colors
    Tool: Playwright
    Preconditions: Structure exists with different node types
    Steps:
      1. Set node types: start (green), process (blue), decision (orange), end (red)
      2. Assert: Icon colors are unchanged regardless of depth
      3. Assert: Only text labels have gradient
    Expected Result: Icons keep semantic colors
    Evidence: Visual inspection in screenshot
  ```

  **Commit**: YES
  - Message: `feat(ui): add subtle color gradient by depth level`
  - Files: `src/components/OutlineEditor.tsx`
  - Pre-commit: `bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(ui): replace indentation with dot-based depth indicators` | OutlineEditor.tsx | bun run build |
| 2 | `feat(ui): add sticky breadcrumb navigation header` | OutlineEditor.tsx | bun run build |
| 3 | `feat(ui): add subtle color gradient by depth level` | OutlineEditor.tsx | bun run build |

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Expected: Build successful, no errors
grep -n "ml-3 pl-3" src/components/OutlineEditor.tsx  # Expected: No matches (indentation removed)
grep -n "DEPTH_COLORS" src/components/OutlineEditor.tsx  # Expected: Config found
```

### Final Checklist
- [x] No horizontal indentation (`ml-3 pl-3` removed)
- [x] Dots render: 0=none, 1=•, 2=••, 3=•••
- [x] Breadcrumb shows path to focused node
- [x] Color gradient: root=bright, deep=dim
- [x] All keyboard shortcuts work (j/k/o/i/dd/yy/p, Ctrl-X)
- [x] Build passes with zero errors

---

## Future Work (Deferred)

- **Collapse/expand toggles** - User explicitly deferred this
- **Clickable breadcrumb segments** - Navigate by clicking path
- **Breadcrumb animations** - Smooth transitions on path change
- **Configurable dot character** - Let user choose `•` vs `·` vs numbers
