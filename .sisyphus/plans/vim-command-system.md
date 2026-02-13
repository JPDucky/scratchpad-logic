# Vim Command System for scratchpad-logic

## TL;DR

> **Quick Summary**: Add Vim-adjacent keyboard commands for node type assignment and flow control, making the outline feel like extended markdown that you can type at full speed.
> 
> **Deliverables**:
> - Ctrl-X prefix command system for type assignment
> - `:jump` ex-command with visual node selection
> - Comment syntax (`//`) for annotations
> - Parallel node type for simultaneous execution
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Command system → Jump UI → Comments → Parallel

---

## Context

### Original Request
User wants to document logic flows at typing speed. Current bottleneck is NOT capture speed — it's organization and expressiveness beyond what markdown lists allow.

### Research Summary
**Key Findings from 3 Librarian Agents:**
- 80/20 notation: Only 4 symbols needed (oval, rect, diamond, arrow) — current types are appropriate
- Cognitive load: 3-5 primary actions max (Hick's Law)
- Flow state: Keyboard-first is 10x faster than mouse
- Best tools: Logseq/Taskade style hybrid text+visual wins

**User Interview Findings:**
- Vim muscle memory is sacred ("Love it")
- Radial menu: "Table it for now" — keyboard preferred
- Type commands: "Command buffer prefix like Ctrl-X"
- Loops: ":jump then select which node"
- Comments: "// syntax"
- Parallel: "I don't know" — needs design
- Actors/swimlanes: "Not concerned yet"

---

## Work Objectives

### Core Objective
Enable Vim-power-user speed for logic flow creation by mapping all structural operations to keyboard commands.

### Concrete Deliverables
1. `Ctrl-X` prefix command system for node type changes
2. `:jump` ex-command with interactive node selection
3. Comment nodes excluded from flow rendering
4. Parallel node type with fork/join visualization

### Definition of Done
- [ ] All type changes possible via `Ctrl-X {letter}`
- [ ] `:jump` opens picker, selecting node sets goto target
- [ ] Lines starting with `//` render as comments (not in flowchart)
- [ ] Parallel nodes render with fork/join bars in flowchart

### Must Have
- Keyboard-only workflow (no mouse required for any operation)
- Vim mode compatibility (commands work in normal mode)
- Visual feedback when command prefix is active

### Must NOT Have (Guardrails)
- No mouse-only features
- No new UI panels or sidebars
- No color configuration
- No breaking changes to existing keybindings (j/k/o/dd/yy/p)
- No removal of radial menu (just deprioritized)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (no test files found)
- **Automated tests**: None — verify via Playwright agent QA
- **Agent QA**: MANDATORY for all tasks

### Agent-Executed QA Pattern
Each task will be verified by Playwright browser automation:
- Navigate to app
- Execute keyboard sequences
- Assert DOM state / visual state
- Screenshot evidence

---

## Execution Strategy

### Wave 1 (Foundation)
- Task 1: Ctrl-X command prefix system
- Task 2: Add `isComment` field to data model

### Wave 2 (Features)
- Task 3: `:jump` command with node selection UI
- Task 4: Comment rendering (outline + flowchart exclusion)

### Wave 3 (Enhancement)
- Task 5: Parallel node type + visualization

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1 | None | 3 |
| 2 | None | 4 |
| 3 | 1 | None |
| 4 | 2 | None |
| 5 | None | None |

---

## TODOs

### Task 1: Ctrl-X Command Prefix System

**What to do**:
- Add command prefix state to OutlineEditor (e.g., `commandPrefix: 'ctrl-x' | null`)
- Listen for `Ctrl-X` in normal mode → set prefix active
- Show visual indicator when prefix active (e.g., "-- CTRL-X --" in status)
- Map subsequent keys to type changes:
  - `p` → type: process
  - `d` → type: decision (auto-create Yes/No branches if none)
  - `e` → type: end
  - `s` → type: start
  - `m` → type: merge
  - `g` → type: goto (then trigger jump selection)
- Timeout or `Esc` cancels prefix
- After command, return to normal mode

**Must NOT do**:
- Don't remove existing radial menu
- Don't change j/k/o/dd behavior
- Don't require mouse for any type change

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: Keyboard event handling, state management, visual feedback

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Task 2)
- **Blocks**: Task 3 (jump command uses same prefix)
- **Blocked By**: None

**References**:
- `src/components/OutlineEditor.tsx` - Main editor, keyboard handling
- `src/types.ts:NodeType` - Type definitions
- `src/store.tsx:updateNode` - Type change function

**Acceptance Criteria**:
- [x] `Ctrl-X` in normal mode shows "-- CTRL-X --" status
- [x] `Ctrl-X p` on decision node changes it to process
- [x] `Ctrl-X d` on process node changes it to decision with Yes/No branches
- [x] `Esc` after `Ctrl-X` cancels without action
- [x] Invalid key after `Ctrl-X` cancels and beeps/flashes

**Agent-Executed QA Scenarios**:

```
Scenario: Ctrl-X prefix activates and shows status
  Tool: Playwright
  Preconditions: App running, node focused in normal mode
  Steps:
    1. Press Ctrl+X
    2. Assert status bar contains "CTRL-X" or similar indicator
    3. Press Escape
    4. Assert status returns to "NORMAL"
  Evidence: screenshot

Scenario: Ctrl-X d converts process to decision
  Tool: Playwright
  Preconditions: Process node focused
  Steps:
    1. Note current node type (process icon ●)
    2. Press Ctrl+X, then d
    3. Assert node icon changed to decision (◆)
    4. Assert Yes/No branches were auto-created as children
  Evidence: screenshot showing decision with branches
```

**Commit**: YES
- Message: `feat(editor): add Ctrl-X command prefix for type changes`
- Files: `src/components/OutlineEditor.tsx`

---

### Task 2: Add Comment Field to Data Model

**What to do**:
- Add `isComment?: boolean` to `OutlineNode` in types.ts
- Add `toggleComment(id: string)` function to store
- Comments should persist in localStorage with documents

**Must NOT do**:
- Don't change flowchart rendering yet (Task 4)
- Don't add UI for comments yet

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: `[]`
- Reason: Simple data model addition

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Task 1)
- **Blocks**: Task 4
- **Blocked By**: None

**References**:
- `src/types.ts:OutlineNode` - Add field here
- `src/store.tsx:updateNode` - May need toggleComment

**Acceptance Criteria**:
- [x] `OutlineNode` type includes `isComment?: boolean`
- [x] Store has `toggleComment(id)` function
- [x] TypeScript compiles without errors

**Agent-Executed QA Scenarios**:

```
Scenario: Build passes with new field
  Tool: Bash
  Steps:
    1. Run: npm run build
    2. Assert: exit code 0, no type errors
  Evidence: build output
```

**Commit**: YES
- Message: `feat(types): add isComment field to OutlineNode`
- Files: `src/types.ts`, `src/store.tsx`

---

### Task 3: Jump Command with Node Selection

**What to do**:
- Add `:jump` ex-command (when user types `:` in normal mode, show command input)
- Typing `jump` and Enter activates jump selection mode
- In jump selection mode:
  - All nodes get temporary letter labels (a, b, c... or home-row based)
  - User presses letter → current node becomes goto type with targetId set
  - Or Escape to cancel
- Show visual feedback during selection (highlight valid targets)

**Must NOT do**:
- Don't allow jumping to self
- Don't allow jumping to descendants (would create infinite loop)

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: Complex UI interaction, visual overlay, keyboard handling

**Parallelization**:
- **Can Run In Parallel**: NO (needs Task 1's command system understanding)
- **Parallel Group**: Wave 2
- **Blocks**: None
- **Blocked By**: Task 1

**References**:
- `src/components/OutlineEditor.tsx` - Add ex-command handling
- `src/store.tsx:setGotoTarget` - Already exists!
- `src/types.ts:NodeType` - 'goto' type already exists

**Acceptance Criteria**:
- [ ] `:` in normal mode shows command input at bottom
- [ ] Typing `jump` and Enter enters selection mode
- [ ] Nodes show letter labels (a-z or similar)
- [ ] Pressing letter sets current node to goto with targetId
- [ ] Flowchart shows arrow to target node
- [ ] Escape cancels selection mode

**Agent-Executed QA Scenarios**:

```
Scenario: Jump command creates goto link
  Tool: Playwright
  Preconditions: Multiple nodes exist, one focused
  Steps:
    1. Press : to open command input
    2. Type "jump" and press Enter
    3. Assert nodes show letter labels
    4. Press letter for a non-descendant node
    5. Assert current node icon changed to goto (↩)
    6. Assert flowchart shows arrow to target
  Evidence: screenshot of flowchart with loop arrow

Scenario: Jump to self is prevented
  Tool: Playwright
  Steps:
    1. Start jump mode
    2. Press letter for current node
    3. Assert nothing happens or error shown
  Evidence: screenshot
```

**Commit**: YES
- Message: `feat(editor): add :jump command with visual node selection`
- Files: `src/components/OutlineEditor.tsx`

---

### Task 4: Comment Rendering

**What to do**:
- In outline view: Render comment nodes with muted style (gray, italic, or `//` prefix)
- In flowchart view: EXCLUDE comment nodes entirely
- Add `Ctrl-X /` to toggle comment status on current node
- Support typing `// ` at start of label to auto-mark as comment

**Must NOT do**:
- Don't delete comment nodes, just hide from flow
- Don't change comment data on flowchart rebuild

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: Styling, conditional rendering, React Flow filtering

**Parallelization**:
- **Can Run In Parallel**: YES (after Task 2)
- **Parallel Group**: Wave 2 (with Task 3)
- **Blocks**: None
- **Blocked By**: Task 2

**References**:
- `src/components/OutlineEditor.tsx` - Comment styling in outline
- `src/components/FlowDiagram.tsx` or equivalent - Filter comments from React Flow
- `src/types.ts:OutlineNode.isComment` - From Task 2

**Acceptance Criteria**:
- [x] `Ctrl-X /` toggles isComment on focused node
- [x] Comment nodes show gray/muted in outline
- [x] Comment nodes NOT rendered in flowchart
- [x] Typing `// note` auto-marks node as comment
- [x] Comments persist across reload

**Agent-Executed QA Scenarios**:

```
Scenario: Toggle comment excludes from flowchart
  Tool: Playwright
  Preconditions: Node with text exists, visible in flowchart
  Steps:
    1. Focus node in outline
    2. Press Ctrl+X, then /
    3. Assert node appears muted/gray in outline
    4. Assert node is NOT visible in flowchart
    5. Press Ctrl+X, then / again
    6. Assert node appears normal in outline
    7. Assert node IS visible in flowchart
  Evidence: before/after screenshots

Scenario: Typing // prefix auto-comments
  Tool: Playwright
  Steps:
    1. Create new node (press o)
    2. Type "// this is a note"
    3. Press Escape
    4. Assert node is styled as comment
    5. Assert node not in flowchart
  Evidence: screenshot
```

**Commit**: YES
- Message: `feat(editor): add comment nodes with // syntax`
- Files: `src/components/OutlineEditor.tsx`, `src/components/FlowDiagram.tsx`

---

### Task 5: Parallel Node Type

**What to do**:
- Add `parallel` to NodeType union
- Parallel node children execute simultaneously (semantic only)
- In outline: Show with `&` prefix or parallel icon
- In flowchart: Render as fork bar → parallel children → join bar
- Add `Ctrl-X &` to set type to parallel

**Must NOT do**:
- Don't implement actual parallel execution (this is documentation only)
- Don't add complex nesting rules

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: React Flow custom node, layout algorithm adjustment

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 3 (after core features stable)
- **Blocks**: None
- **Blocked By**: Task 1 (needs Ctrl-X system)

**References**:
- `src/types.ts:NodeType` - Add 'parallel'
- `src/types.ts:NODE_TYPE_CONFIG` - Add config for parallel
- `src/components/FlowDiagram.tsx` - Fork/join rendering

**Acceptance Criteria**:
- [ ] `parallel` type exists in NodeType
- [ ] `Ctrl-X &` sets node to parallel type
- [ ] Parallel node shows with & icon in outline
- [ ] Flowchart renders fork bar before parallel children
- [ ] Flowchart renders join bar after parallel children

**Agent-Executed QA Scenarios**:

```
Scenario: Parallel node renders with fork/join
  Tool: Playwright
  Preconditions: Node with 2+ children exists
  Steps:
    1. Focus parent node
    2. Press Ctrl+X, then &
    3. Assert parent shows parallel icon (&) in outline
    4. Assert flowchart shows fork bar above children
    5. Assert flowchart shows join bar below children
    6. Screenshot flowchart
  Evidence: screenshot showing fork/join bars

Scenario: Parallel type persists
  Tool: Playwright
  Steps:
    1. Set node to parallel
    2. Reload page
    3. Assert node still shows as parallel
  Evidence: screenshot after reload
```

**Commit**: YES
- Message: `feat(types): add parallel node type with fork/join visualization`
- Files: `src/types.ts`, `src/components/OutlineEditor.tsx`, `src/components/FlowDiagram.tsx`

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `feat(editor): add Ctrl-X command prefix for type changes` | OutlineEditor.tsx |
| 2 | `feat(types): add isComment field to OutlineNode` | types.ts, store.tsx |
| 3 | `feat(editor): add :jump command with visual node selection` | OutlineEditor.tsx |
| 4 | `feat(editor): add comment nodes with // syntax` | OutlineEditor.tsx, FlowDiagram.tsx |
| 5 | `feat(types): add parallel node type with fork/join visualization` | types.ts, OutlineEditor.tsx, FlowDiagram.tsx |

---

## Success Criteria

### Verification Commands
```bash
npm run build    # Expected: exit 0, no errors
npm run dev      # Expected: app runs, test manually
```

### Final Checklist
- [ ] All type changes via `Ctrl-X {letter}` work
- [ ] `:jump` command works with visual selection
- [ ] `//` comments excluded from flowchart
- [ ] Parallel nodes show fork/join in flowchart
- [ ] No regression in existing keybindings (j/k/o/dd/yy/p)
- [ ] Radial menu still works (untouched)
