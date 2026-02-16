# Insert Mode Improvements

## TL;DR

> **Quick Summary**: Fix Tab behavior in insert mode and add `jj`/`kk` escape sequences.
> 
> **Deliverables**: 
> - Tab inserts tab character (or indents) in insert mode instead of switching focus
> - `jj` and `kk` escape insert mode (vim-style)
> 
> **Estimated Effort**: Quick (~10 minutes)
> **Parallel Execution**: NO - single task
> **Critical Path**: One task only

---

## Context

### Original Request
User reports:
1. Tab has "wacky behaviors" in outline insert mode (browser focus switching)
2. Wants `jj` and `kk` to escape insert mode (vim-style double-key escape)

### Current State
**Tab in insert mode:**
- Keybinding context (line 246-253 in context.tsx) only intercepts Escape in insert mode
- All other keys (including Tab) pass through to browser defaults
- Browser Tab causes focus to switch to next element

**Escape from insert mode:**
- Only Escape key works currently
- No `jj`/`kk` sequences implemented

### Desired Behavior
1. **Tab in insert mode**: Insert a tab character (or indent text if at start of line)
2. **jj/kk sequences**: Exit insert mode when typed in quick succession (< 300ms)

---

## Work Objectives

### Core Objective
Improve insert mode UX by fixing Tab and adding vim-style escape sequences.

### Concrete Deliverables
- Modified `src/components/OutlineEditor.tsx` (OutlineNodeItem handleKeyDown)
- Maybe modified `src/keybindings/context.tsx` (if we handle there)

### Definition of Done
- [x] Tab inserts tab character in insert mode (no browser focus switch)
- [x] `jj` typed quickly exits insert mode
- [x] `kk` typed quickly exits insert mode
- [x] Normal Escape still works
- [x] Build passes

### Must Have
- Tab preventDefault in insert mode
- jj/kk escape detection (< 300ms between keys)

### Must NOT Have (Guardrails)
- No changes to normal mode Tab behavior
- No changes to other insert mode keys (Enter, Backspace, arrows)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun, Playwright)
- **Automated tests**: NO (manual verification via Playwright)
- **Framework**: bun

### Agent-Executed QA Scenarios

All scenarios verified via Playwright.

---

## TODOs

- [x] 1. Fix Tab in insert mode and add jj/kk escape sequences

  **What to do**:
  
  **APPROACH A: Handle in OutlineNodeItem (simpler)**
  
  Modify the `handleKeyDown` in `OutlineNodeItem` component (line 136 in OutlineEditor.tsx):
  
  1. **Add Tab handling:**
     ```typescript
     } else if (e.key === 'Tab') {
       e.preventDefault();
       // Insert tab character at cursor position
       const input = e.currentTarget;
       const start = input.selectionStart || 0;
       const end = input.selectionEnd || 0;
       const value = input.value;
       const newValue = value.substring(0, start) + '\t' + value.substring(end);
       updateNode(node.id, { label: newValue });
       // Set cursor position after tab
       setTimeout(() => {
         input.selectionStart = input.selectionEnd = start + 1;
       }, 0);
     ```
  
  2. **Add jj/kk tracking:**
     - Add state to track last key and timestamp:
       ```typescript
       const [lastKey, setLastKey] = useState<{key: string, time: number} | null>(null);
       ```
     
     - At the START of handleKeyDown, before any other checks:
       ```typescript
       const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
         // Check for jj or kk escape sequence
         if ((e.key === 'j' || e.key === 'k') && lastKey) {
           const now = Date.now();
           if (lastKey.key === e.key && (now - lastKey.time) < 300) {
             e.preventDefault();
             // Delete the first j or k that was typed
             const input = e.currentTarget;
             const value = input.value;
             const newValue = value.slice(0, -1);
             updateNode(node.id, { label: newValue });
             // Exit insert mode
             appContext.setMode('outline-normal');
             setLastKey(null);
             return;
           }
         }
         
         // Track this key press
         setLastKey({ key: e.key, time: Date.now() });
         
         // Rest of existing handleKeyDown code...
       ```
  
  **APPROACH B: Handle in keybindings context (if needed)**
  
  If Approach A doesn't work, modify context.tsx lines 246-253 to also handle Tab.
  
  **Must NOT do**:
  - Change normal mode Tab behavior
  - Change other insert mode functionality (Enter, Backspace, arrows)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `["playwright", "git-master"]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/components/OutlineEditor.tsx:136-155` - OutlineNodeItem handleKeyDown
  - `src/components/OutlineEditor.tsx:110-125` - OutlineNodeItem component setup

  **Acceptance Criteria**:
  
  **Build Verification:**
  - [ ] `bun run build` exits with code 0
  
  **Agent-Executed QA Scenarios:**
  
  ```
  Scenario: Tab inserts tab in insert mode
    Tool: Playwright
    Preconditions: Dev server running on localhost:5174
    Steps:
      1. Navigate to http://localhost:5174
      2. Focus a node and press 'i' to enter insert mode
      3. Type some text
      4. Press Tab
      5. Assert: Tab character inserted in text (no focus switch)
      6. Assert: Cursor after tab character
    Expected Result: Tab inserted, input still focused
    Evidence: Screenshot
  
  Scenario: jj escapes insert mode
    Tool: Playwright
    Preconditions: In insert mode
    Steps:
      1. Enter insert mode on a node
      2. Type "test"
      3. Type 'j' then 'j' quickly (< 300ms)
      4. Assert: Mode changes to "-- OUTLINE --"
      5. Assert: Text is "testj" (one j typed, one j triggered escape)
    Expected Result: Insert mode exited, only one 'j' in text
    Evidence: Screenshot
  
  Scenario: kk escapes insert mode
    Tool: Playwright
    Preconditions: In insert mode
    Steps:
      1. Enter insert mode
      2. Type "hello"
      3. Type 'k' then 'k' quickly (< 300ms)
      4. Assert: Mode changes to "-- OUTLINE --"
      5. Assert: Text is "hellok" (one k typed, one k triggered escape)
    Expected Result: Insert mode exited, only one 'k' in text
    Evidence: Screenshot
  
  Scenario: Slow jj does NOT escape
    Tool: Playwright
    Preconditions: In insert mode
    Steps:
      1. Enter insert mode
      2. Type 'j'
      3. Wait 400ms
      4. Type 'j'
      5. Assert: Still in insert mode
      6. Assert: Text contains "jj"
    Expected Result: Both j's typed, still in insert mode
    Evidence: Screenshot
  ```
  
  **Commit**: YES
  - Message: `feat(insert): fix Tab behavior and add jj/kk vim-style escape`
  - Files: `src/components/OutlineEditor.tsx`
  - Pre-commit: `bun run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(insert): fix Tab behavior and add jj/kk vim-style escape` | OutlineEditor.tsx | bun run build + Playwright |

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Expected: exits 0, no errors
```

### Final Checklist
- [x] Tab inserts tab character in insert mode
- [x] jj escapes insert mode (< 300ms)
- [x] kk escapes insert mode (< 300ms)
- [x] Slow jj/kk does NOT escape
- [x] Normal Escape still works
- [x] Build passes
- [x] Playwright verified
