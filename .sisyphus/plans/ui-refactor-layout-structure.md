# UI Refactor: Layout & Visual Hierarchy

## TL;DR

> **Quick Summary**: Refactor the main editor layout to fix scrolling issues (keeping the status bar visible) and implement visual structural guides to replace deep whitespace indentation.
> 
> **Deliverables**:
> - "Cockpit Layout": Fixed header/footer, independent scrolling for content.
> - "Visual Rails": Vertical lines indicating hierarchy depth.
> - Reduced horizontal indentation to prevent "staircase effect".
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: Sequential (Layout first, then Structure)
> **Critical Path**: Layout Fix → Visual Guides

---

## Context

### Original Request
The user identified two critical UX issues:
1.  **Poor Framing**: The status bar (hints, command indicators) scrolls off-screen because it's part of the main document flow. It must be fixed at the bottom.
2.  **Poor Scaling (The Staircase Effect)**: Deep indentation pushes content off-screen. User requested visual indicators (shapes/lines/boxes) instead of massive whitespace indentation.

### Visual Design Decisions
1.  **The Frame**: Switch `OutlineEditor` to a flex-column layout. Header and Footer are fixed (`flex-shrink-0`). The node list is the only scrollable area (`flex-1 overflow-auto`).
2.  **The Structure**:
    *   **Reduce Indentation**: Shrink the pixel shift per level (e.g., 24px → 12px or 16px).
    *   **Add Guide Rails**: Render vertical lines connecting parents to children. This allows the eye to track depth without needing wide margins.
    *   **Active Scope**: When a node is focused, slightly highlight its container or guide rail to provide "boxed" context.

---

## Work Objectives

### Core Objective
Create a stable, scalable interface that handles deep nesting gracefully and keeps critical controls always visible.

### Concrete Deliverables
1.  Refactored `OutlineEditor.tsx` with fixed footer.
2.  Updated `OutlineNodeItem.tsx` with "Guide Rails" styling.
3.  Tighter indentation logic.

### Definition of Done
- [x] Status bar (Ctrl-X indicator, hints) is ALWAYS visible at the bottom, never scrolls away.
- [x] Node list scrolls independently within the central frame.
- [x] Hierarchy is indicated by vertical lines (rails) rather than just empty space.
- [x] Content uses less horizontal space per indentation level.

---

## Verification Strategy

### Agent-Executed QA Pattern
- **Layout Check**: Verify the footer remains visible even when the list has 100+ items.
- **Visual Check**: Verify vertical lines appear correctly for nested items.
- **Responsiveness**: Verify the layout holds up at the minimum panel width (200px).

---

## Execution Strategy

### Wave 1: The Frame (Layout)
- **Task 1**: Refactor `OutlineEditor` layout structure.
  - Convert container to `flex-col h-full`.
  - Isolate node list in `flex-1 overflow-auto`.
  - Pin footer to bottom.

### Wave 2: The Structure (Visuals)
- **Task 2**: Implement Visual Rails & Tighter Indentation.
  - Modify `OutlineNodeItem`.
  - Add borders/lines for hierarchy.
  - Reduce `padding-left` calculation.

---

## TODOs

### Task 1: Cockpit Layout Refactor

**Status**: [x] Complete

**What to do**:
- Modify `src/components/OutlineEditor.tsx`.
- Change the root container class to `h-full flex flex-col bg-slate-900 overflow-hidden`.
- Wrap the node list mapping in a `div` with `flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-4`.
- Ensure the Footer (`mt-4 pt-4 border-t...`) is outside the scrollable div, with `flex-shrink-0 z-10 bg-slate-900`.
- Ensure the Header (`h2`) is outside the scrollable div.

**Must NOT do**:
- Don't change the actual node rendering logic yet (just the containers).

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`

**Acceptance Criteria**:
- [x] Header ("OUTLINE") is fixed at top.
- [x] Footer (Key hints, Ctrl-X) is fixed at bottom.
- [x] Middle section scrolls independently.
- [x] Ex-Command input (`:jump`) overlays correctly at the bottom.

**Agent-Executed QA Scenarios**:
```
Scenario: Footer remains visible on scroll
  Tool: Playwright
  Steps:
    1. Generate enough nodes to overflow the viewport (using loop or manual creation)
    2. Scroll the outline list
    3. Assert the footer text ("i edit • j/k navigate") is still in the viewport
    4. Assert the header ("OUTLINE") is still at the top
  Evidence: Screenshot
```

---

### Task 2: Visual Rails & Tighter Indentation

**Status**: [x] Complete

**What to do**:
- Modify `src/components/OutlineNodeItem.tsx` (and potentially `OutlineEditor` recursion if logic is there).
- **Reduce Indentation**: If using padding/margin per depth, reduce the multiplier (e.g., `depth * 12px` instead of `24px`).
- **Add Rails**:
  - Add a left-border or absolute positioned vertical line for each level of depth.
  - Color the lines subtly (`border-slate-800` or similar).
  - Highlight the line corresponding to the current active scope if possible.
- **Visual Box** (Optional): Add a subtle background hover effect that spans the full width of the rail container.

**Must NOT do**:
- Don't remove the indentation entirely (we need some offset for the text).

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`

**Acceptance Criteria**:
- [x] Indentation per level is reduced (compact mode).
- [x] Vertical lines (rails) connect parent and children visually.
- [x] Hierarchy is readable without massive horizontal drift.

**Agent-Executed QA Scenarios**:
```
Scenario: Visual Rails render correctly
  Tool: Playwright
  Steps:
    1. Create a nested structure (Root -> Child -> Grandchild)
    2. Verify vertical lines appear to the left of the nodes
    3. Verify text indentation is tighter than before
  Evidence: Screenshot
```
