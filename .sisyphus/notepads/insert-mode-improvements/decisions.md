# Decisions: Insert Mode Improvements

## [2026-02-16T05:00:00Z] Implementation Approach

**Decision**: Handle in OutlineNodeItem component
- Tab: Insert tab character at cursor position
- jj/kk: Track last key + timestamp, detect double-key within 300ms

