# Learnings: Insert Mode Improvements

## [2026-02-16T05:00:00Z] Session Start: ses_3d0394182ffeQXy6X8VM8QS6xd

### Context
- User reported Tab has "wacky behaviors" in insert mode
- User wants `jj` and `kk` to escape insert mode (vim-style)

### Issues Identified
1. **Tab in insert mode**: Keybinding context returns early, letting browser Tab switch focus
2. **No jj/kk escape**: Only Escape works to exit insert mode

## [2026-02-16T06:00:00Z] Implementation Complete

### Solution Implemented
Fixed both issues in `OutlineNodeItem` component's `handleKeyDown` function:

1. **Tab Character Insertion**
   - Prevents browser default Tab behavior with `e.preventDefault()`
   - Inserts tab character (`\t`) at cursor position
   - Maintains cursor position after insertion
   - Works seamlessly in insert mode

2. **jj/kk Vim-Style Escape**
   - Added `lastKeyPress` state to track previous key and timestamp
   - Detects when same key (j or k) is pressed within 300ms
   - Removes the first character and exits insert mode
   - Slow presses (> 300ms) type both characters normally
   - Normal Escape key still works as expected

### Implementation Details
- Added `appContext` to `OutlineNodeItemProps` interface
- Passed `appContext` to both `OutlineNodeItem` calls (parent and recursive)
- Used `Date.now()` for timing detection
- 300ms threshold matches standard vim timeout for double-key sequences

### Testing Results
✅ **Tab insertion**: "test" + Tab → "test\t" (tab character inserted)
✅ **jj escape**: "hello" + jj (quick) → "hello" (mode exits, second j removed)
✅ **kk escape**: "hello" + kk (quick) → "hello" (mode exits, second k removed)
✅ **Slow jj**: "test" + j + 400ms + j → "testjj" (both characters typed, no escape)
✅ **Normal Escape**: Still exits insert mode as expected
✅ **Build**: `bun run build` passes without errors

### Key Insights
- The keybinding context was preventing Tab from being handled in insert mode
- Moving Tab handling to the input's `handleKeyDown` ensures it works correctly
- Vim-style double-key escapes require precise timing detection
- 300ms is a good threshold - fast enough for intentional double-taps, slow enough to avoid accidental triggers

### Files Modified
- `src/components/OutlineEditor.tsx`: Added Tab and jj/kk handling to `OutlineNodeItem`

### Commit
- `feat(insert): fix Tab behavior and add jj/kk vim-style escape` (d21abbc)

