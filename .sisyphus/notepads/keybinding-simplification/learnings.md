# Learnings: Keybinding Simplification

## [2026-02-16T04:48:26Z] Session Start: ses_3d0394182ffeQXy6X8VM8QS6xd

### Context
- User wants Tab/Shift+Tab for indentation (not browser focus switching)
- User wants Ctrl-based keybindings replaced with single keys
- Replace `Ctrl-X` prefix with `t` prefix
- Remove `Ctrl+c` (Escape is sufficient)
- Make `/` direct key for toggle comment

## Task 1: Remove Obsolete Keybindings from vim.ts

### Execution Summary
- **File**: `src/keybindings/presets/vim.ts`
- **Lines removed**: 11 keybinding entries
- **Status**: ✅ COMPLETE

### Removals Made
1. ✅ Line 18: `Ctrl+c` in outline-normal mode
2. ✅ Line 38: `Tab` in outline-normal mode (indent)
3. ✅ Line 39: `Shift+Tab` in outline-normal mode (outdent)
4. ✅ Line 46: `Space t` in outline-normal mode (change type)
5. ✅ Line 52: `Ctrl+c` in outline-insert mode
6. ✅ Line 58: `Ctrl+c` in visual-normal mode
7. ✅ Line 74: `Tab` in visual-normal mode (indent)
8. ✅ Line 75: `Shift+Tab` in visual-normal mode (outdent)
9. ✅ Line 83: `Space t` in visual-normal mode (change type)
10. ✅ Line 89: `Ctrl+c` in visual-edit mode
11. ✅ Line 97: `Ctrl+c` in visual-move mode

### Verification
- ✅ Build passes: `bun run build` exits 0
- ✅ No `Ctrl+c` bindings remain
- ✅ No `Tab` or `Shift+Tab` bindings remain
- ✅ No `Space t` bindings remain
- ✅ File structure valid (vimKeymap export intact)
- ✅ All other keybindings preserved (j, k, h, l, dd, yy, p, o, O, etc.)

### Key Insights
- Escape key remains as primary exit mechanism (sufficient for all modes)
- Hierarchy navigation now uses `> >` and `< <` instead of Tab/Shift+Tab
- Node type change will be handled in OutlineEditor.tsx
- File reduced from 108 to 91 lines (17 lines removed)

## Task 2-3: Implement New Keybindings in OutlineEditor.tsx

### Execution Summary
- **File**: `src/components/OutlineEditor.tsx`
- **Changes**: 7 modifications across state, handlers, and UI
- **Status**: ✅ COMPLETE

### Changes Made

#### 1. State Type Change (Line 292)
- **From**: `useState<'ctrl-x' | null>(null)`
- **To**: `useState<'t' | null>(null)`
- **Impact**: Type system now reflects new prefix key

#### 2. Tab/Shift+Tab Handler (After line 380)
- **Added**: 11-line handler for Tab key
- **Behavior**: 
  - `Tab` → indents focused node
  - `Shift+Tab` → outdents focused node
  - `preventDefault()` prevents browser focus switching
  - `stopPropagation()` prevents event bubbling
- **Functions used**: `indentNode()`, `outdentNode()` from useOutline hook

#### 3. Forward Slash Handler (After Tab handler)
- **Added**: 9-line handler for `/` key
- **Behavior**: 
  - Toggles comment on focused node
  - Only active when NOT in type prefix mode
  - Uses `toggleComment()` from useOutline hook

#### 4. Prefix Activation (Line ~391)
- **From**: `if (!commandPrefix && e.ctrlKey && e.key === 'x')`
- **To**: `if (!commandPrefix && e.key === 't')`
- **Impact**: Single `t` key now activates type mode (no Ctrl needed)

#### 5. Prefix Check (Line ~407)
- **From**: `if (commandPrefix === 'ctrl-x')`
- **To**: `if (commandPrefix === 't')`
- **Impact**: Type commands now triggered after `t` prefix

#### 6. Mode Indicator (Lines ~637-639)
- **From**: `-- CTRL-X --`
- **To**: `-- TYPE --`
- **Impact**: User sees clearer mode name

#### 7. Footer Help Text (Lines ~632-635)
- **From**: `Ctrl-X & | parallel • Ctrl-X | type`
- **To**: `Tab | indent • t | type • / | comment`
- **Impact**: Users see new keybindings in footer

### Verification Results

#### Build Status
✅ **PASS**: `bun run build` exits 0
- No TypeScript errors
- All imports resolved
- Bundle generated successfully

#### Playwright Tests (All Passing)
1. ✅ **Tab indentation**: Pressing Tab indents focused node
2. ✅ **Shift+Tab outdentation**: Pressing Shift+Tab outdents focused node
3. ✅ **Type mode activation**: Pressing `t` shows "-- TYPE --" indicator
4. ✅ **Type change**: Pressing `t d` changes node type to decision (◆)
5. ✅ **Comment toggle**: Pressing `/` toggles comment styling (italic)
6. ✅ **Footer display**: New keybindings visible in footer

#### Screenshot Evidence
- Captured full page showing:
  - Footer with new keybinding hints
  - Type mode indicator working
  - Indented nodes visible
  - Comment styling applied

### Key Insights
- **Simpler keybindings**: Single key (`t`) replaces Ctrl-X prefix
- **Direct access**: `/` provides direct comment toggle without prefix
- **Browser compatibility**: preventDefault() prevents Tab from switching focus
- **Type safety**: TypeScript caught all state type changes automatically
- **Backward compatibility**: All other keybindings (j/k, i, etc.) unchanged
- **User experience**: Footer clearly shows available keybindings

### Implementation Notes
- `indentNode` and `outdentNode` were already exported from useOutline hook
- No changes needed to node manipulation logic
- Radial menu functionality unaffected
- Jump label functionality unaffected
- Ex-command functionality unaffected

### Files Modified
1. `src/components/OutlineEditor.tsx` - 7 changes
2. `src/keybindings/presets/vim.ts` - 11 removals (from Task 1)

