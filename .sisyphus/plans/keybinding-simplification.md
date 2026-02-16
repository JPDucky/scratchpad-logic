# Keybinding Simplification

## TL;DR

> **Quick Summary**: Replace Ctrl-based keybindings with single-key alternatives and fix Tab/Shift+Tab to control indentation instead of switching focus.
> 
> **Deliverables**: 
> - Updated vim.ts keybindings
> - Modified OutlineEditor.tsx key handling
> - Updated footer help text
> 
> **Estimated Effort**: Quick (~15 minutes)
> **Parallel Execution**: NO - sequential changes
> **Critical Path**: Task 1 → Task 2 → Task 3

---

## Context

### Original Request
User wants:
1. Tab/Shift+Tab to control indentation (not switch browser focus)
2. Ctrl-bound keybindings replaced with single keys

### Current State
- `Ctrl-X` is a prefix key for type changes and parallel nodes
- `Ctrl+c` duplicates Escape functionality
- Tab/Shift+Tab ARE bound to indent/outdent but browser intercepts them

### New Keybinding Scheme

| Old | New | Action |
|-----|-----|--------|
| `Ctrl-X p` | `t p` | Set type → process |
| `Ctrl-X d` | `t d` | Set type → decision |
| `Ctrl-X e` | `t e` | Set type → end |
| `Ctrl-X s` | `t s` | Set type → start |
| `Ctrl-X m` | `t m` | Set type → merge |
| `Ctrl-X g` | `t g` | Set type → goto |
| `Ctrl-X &` | `t &` | Set type → parallel |
| `Ctrl-X /` | `/` | Toggle comment (direct key) |
| `Ctrl+c` | (remove) | Escape is sufficient |
| `Tab` | `Tab` | Indent (fix interception) |
| `Shift+Tab` | `Shift+Tab` | Outdent (fix interception) |

---

## Work Objectives

### Core Objective
Simplify keybindings by removing Ctrl modifiers and fixing Tab behavior.

### Concrete Deliverables
- Modified `src/keybindings/presets/vim.ts`
- Modified `src/components/OutlineEditor.tsx`

### Definition of Done
- [ ] Tab indents focused node (no browser focus switch)
- [ ] Shift+Tab outdents focused node
- [ ] `t` prefix works for type changes
- [ ] `/` toggles comment directly
- [ ] No Ctrl-based bindings remain
- [ ] Build passes

### Must Have
- Tab/Shift+Tab control indentation
- `t` prefix for all type changes
- `/` for toggle comment

### Must NOT Have (Guardrails)
- No Ctrl-based keybindings
- No changes to navigation keys (j/k/h/l)
- No changes to other vim-style bindings (dd, yy, p, o, O)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun)
- **Automated tests**: NO (keybinding changes, manual verification)
- **Framework**: bun

### Agent-Executed QA Scenarios

All scenarios verified via Playwright.

---

## TODOs

- [x] 1. Update vim.ts keybindings

  **What to do**:
  - Remove all `Ctrl+c` bindings (lines 18, 52, 58, 89, 97)
  - Remove `Tab` and `Shift+Tab` bindings from vim.ts (handled in OutlineEditor instead)
  - Remove `Space t` binding (replaced by `t` prefix in OutlineEditor)

  **Exact changes in `src/keybindings/presets/vim.ts`**:
  
  ```typescript
  // REMOVE these lines:
  { key: 'Ctrl+c', action: 'mode.normal', mode: 'outline-normal', description: 'Back to normal mode' },
  { key: 'Ctrl+c', action: 'mode.outline', mode: 'outline-insert', description: 'Back to outline-normal' },
  { key: 'Ctrl+c', action: 'mode.normal', mode: 'visual-normal', description: 'Back to normal mode' },
  { key: 'Ctrl+c', action: 'edit.exit', mode: 'visual-edit', description: 'Exit text edit' },
  { key: 'Ctrl+c', action: 'move.cancel', mode: 'visual-move', description: 'Cancel move' },
  { key: 'Tab', action: 'node.indent', mode: 'outline-normal', description: 'Indent node' },
  { key: 'Shift+Tab', action: 'node.outdent', mode: 'outline-normal', description: 'Outdent node' },
  { key: 'Tab', action: 'node.indent', mode: 'visual-normal', description: 'Indent node' },
  { key: 'Shift+Tab', action: 'node.outdent', mode: 'visual-normal', description: 'Outdent node' },
  { key: 'Space t', action: 'node.changeType', mode: 'outline-normal', description: 'Change node type' },
  { key: 'Space t', action: 'node.changeType', mode: 'visual-normal', description: 'Change node type' },
  ```

  **Must NOT do**:
  - Change navigation keys
  - Change dd, yy, p, o, O bindings

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 2, Task 3
  - **Blocked By**: None

  **References**:
  - `src/keybindings/presets/vim.ts` - Full file to modify

  **Acceptance Criteria**:
  - [ ] No `Ctrl+c` bindings in file
  - [ ] No `Tab` or `Shift+Tab` bindings in file
  - [ ] No `Space t` bindings in file
  - [ ] File still exports valid `vimKeymap` object

  **Commit**: NO (group with Task 2 and 3)

---

- [ ] 2. Update OutlineEditor.tsx key handling

  **What to do**:
  - Replace `ctrl-x` prefix with `t` prefix
  - Add direct Tab/Shift+Tab handling with preventDefault
  - Add direct `/` handling for toggle comment
  - Update state type from `'ctrl-x' | null` to `'t' | null`

  **Exact changes in `src/components/OutlineEditor.tsx`**:

  **A. Change state type (line ~292)**:
  ```typescript
  // FROM:
  const [commandPrefix, setCommandPrefix] = useState<'ctrl-x' | null>(null);
  // TO:
  const [commandPrefix, setCommandPrefix] = useState<'t' | null>(null);
  ```

  **B. Add Tab/Shift+Tab handling (in handleKeyDown, after mode check ~line 380)**:
  ```typescript
  // Handle Tab/Shift+Tab for indent/outdent (prevent browser focus)
  if (e.key === 'Tab') {
    e.preventDefault();
    e.stopPropagation();
    const focusedId = appContextRef.current.focusedNodeId;
    if (!focusedId) return;
    if (e.shiftKey) {
      outdentNode(focusedId);
    } else {
      indentNode(focusedId);
    }
    return;
  }
  ```

  **C. Add direct `/` handling for toggle comment**:
  ```typescript
  // Handle / for toggle comment
  if (e.key === '/' && !commandPrefix) {
    e.preventDefault();
    e.stopPropagation();
    const focusedId = appContextRef.current.focusedNodeId;
    if (focusedId) {
      toggleComment(focusedId);
    }
    return;
  }
  ```

  **D. Replace Ctrl-X prefix activation with `t` (line ~390-404)**:
  ```typescript
  // FROM:
  if (!commandPrefix && e.ctrlKey && e.key === 'x') {
    ...
    setCommandPrefix('ctrl-x');
  
  // TO:
  if (!commandPrefix && e.key === 't') {
    e.preventDefault();
    e.stopPropagation();
    setCommandPrefix('t');
    
    if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    commandTimeoutRef.current = window.setTimeout(() => {
      setCommandPrefix(null);
    }, 3000);
    return;
  }
  ```

  **E. Update command prefix check (line ~407)**:
  ```typescript
  // FROM:
  if (commandPrefix === 'ctrl-x') {
  // TO:
  if (commandPrefix === 't') {
  ```

  **F. Update mode indicator display (line ~637-639)**:
  ```typescript
  // FROM:
  {commandPrefix === 'ctrl-x' && (
    <div className="... animate-pulse">
      -- CTRL-X --
  // TO:
  {commandPrefix === 't' && (
    <div className="... animate-pulse">
      -- TYPE --
  ```

  **Must NOT do**:
  - Change any node manipulation logic
  - Change radial menu functionality
  - Change jump label functionality

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  - `src/components/OutlineEditor.tsx:290-465` - Key handling section
  - `src/components/OutlineEditor.tsx:630-640` - Footer and mode indicator

  **Acceptance Criteria**:
  - [ ] Tab indents node (verified via Playwright)
  - [ ] Shift+Tab outdents node
  - [ ] `t` activates type prefix mode
  - [ ] `t p`, `t d`, `t e`, etc. change node types
  - [ ] `/` toggles comment on focused node
  - [ ] Mode indicator shows "-- TYPE --" when `t` prefix active

  **Commit**: NO (group with Task 1 and 3)

---

- [ ] 3. Update footer help text

  **What to do**:
  - Update the keyboard hints in the footer to reflect new bindings

  **Exact changes in `src/components/OutlineEditor.tsx` (lines ~632-636)**:
  ```typescript
  // FROM:
  <p className="text-slate-500 text-xs">
    <kbd>i</kbd> edit •{' '}
    <kbd>j/k</kbd> navigate •{' '}
    <kbd>Ctrl-X &</kbd> parallel •{' '}
    <kbd>Ctrl-X</kbd> type
  </p>
  
  // TO:
  <p className="text-slate-500 text-xs">
    <kbd>i</kbd> edit •{' '}
    <kbd>j/k</kbd> navigate •{' '}
    <kbd>Tab</kbd> indent •{' '}
    <kbd>t</kbd> type •{' '}
    <kbd>/</kbd> comment
  </p>
  ```

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:
  - `src/components/OutlineEditor.tsx:630-636` - Footer section

  **Acceptance Criteria**:
  - [ ] Footer shows updated keyboard hints
  - [ ] No mention of Ctrl-X

  **Commit**: YES (after all tasks)
  - Message: `feat(keys): simplify keybindings - replace Ctrl-X with t prefix, fix Tab indent`
  - Files: `src/keybindings/presets/vim.ts`, `src/components/OutlineEditor.tsx`
  - Pre-commit: `bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 3 | `feat(keys): simplify keybindings - replace Ctrl-X with t prefix, fix Tab indent` | vim.ts, OutlineEditor.tsx | bun run build |

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Expected: exits 0, no errors
```

### Final Checklist
- [ ] Tab indents focused node
- [ ] Shift+Tab outdents focused node
- [ ] `t` followed by type key changes node type
- [ ] `/` toggles comment
- [ ] No Ctrl-based keybindings
- [ ] Footer help text updated
- [ ] Build passes

### Agent-Executed QA Scenarios

```
Scenario: Tab indents node
  Tool: Playwright
  Preconditions: Dev server running on localhost:5174, node focused in outline
  Steps:
    1. Navigate to http://localhost:5174
    2. Click on "Start" node to enter outline mode and focus it
    3. Press 'o' to create child node
    4. Press Tab
    5. Assert: New node is now indented under Start (child relationship)
  Expected Result: Node is indented, visible indent in UI
  Evidence: Screenshot

Scenario: t prefix changes node type
  Tool: Playwright
  Preconditions: Dev server running, node focused
  Steps:
    1. Focus a node
    2. Press 't'
    3. Assert: Mode indicator shows "-- TYPE --"
    4. Press 'd' (for decision)
    5. Assert: Node icon changes to decision diamond (◆)
  Expected Result: Node type changed to decision
  Evidence: Screenshot

Scenario: / toggles comment
  Tool: Playwright
  Preconditions: Dev server running, node focused
  Steps:
    1. Focus a node
    2. Press '/'
    3. Assert: Node appears commented (visual change)
    4. Press '/' again
    5. Assert: Node is uncommented
  Expected Result: Comment toggled on/off
  Evidence: Screenshot
```
