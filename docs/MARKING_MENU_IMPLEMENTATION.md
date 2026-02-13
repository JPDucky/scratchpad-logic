# Marking Menu Implementation Guide

This document maps the research findings to our specific implementation.

---

## Current Implementation Status

### What We Have (Correct)

| Feature | Status | Location |
|---------|--------|----------|
| 333ms press-and-wait delay | ✅ | `PRESS_AND_WAIT_DELAY = 333` |
| 10px movement threshold | ✅ | `MOVEMENT_THRESHOLD = 10` |
| Expert mode is invisible | ✅ | Menu only shown after timer fires |
| 8 menu items | ✅ | Array of 8 items in OutlineEditor |
| Dead zone for cancel | ✅ | `DEAD_ZONE = 15` pixels |
| Direction-based selection | ✅ | `getExpertModeDirection()` |
| Release in center → click mode | ✅ | `onSwitchToMenuMode()` |

### Constants (Research-Backed)

```typescript
// RadialMenu.tsx - All values from Kurtenbach & Buxton 1994
const PRESS_AND_WAIT_DELAY = 333;  // ms - "approximately 1/3 second"
const MOVEMENT_THRESHOLD = 10;     // px - triggers expert mode
const INNER_RADIUS = 30;           // px - dead zone visual
const OUTER_RADIUS = 90;           // px - menu size
const DEAD_ZONE = 15;              // px - cancel threshold
```

---

## Menu Item Layout

### Current Layout (Index → Direction)

```
Index 0: ↑    (0°)    - Add Below
Index 1: ↗   (45°)   - Add Child  
Index 2: →   (90°)   - Edit
Index 3: ↘  (135°)   - Delete
Index 4: ↓  (180°)   - Process
Index 5: ↙  (225°)   - Decision
Index 6: ←  (270°)   - Jump
Index 7: ↖  (315°)   - End
```

### Recommended Reorganization

Based on research principles:
1. **Frequent actions → Cardinal directions** (easier to execute)
2. **Spatial mnemonics** (direction relates to meaning)
3. **Related actions grouped**

```
PROPOSED LAYOUT:

        Add Below (↓)     ← Most common, easy direction
            |
   Edit (↗) |  Add Child (↘)  ← Creation actions on right
        \   |   /
         \  |  /
Delete (←)--●--Process (→)    ← Destructive left, default right
         /  |  \
        /   |   \
   End (↙)  |  Decision (↗)   ← Type changes on diagonals
            |
        Jump (↑)
```

**Rationale**:
- **Add Below** (most frequent) → Down (natural "add below" mental model)
- **Add Child** → Down-right (hierarchy flows down and indents right)
- **Delete** → Left (destructive, "back" direction)
- **Process** → Right (default type, "forward/proceed")
- **Edit** → Up-right (common action, easy diagonal)

---

## Interaction State Machine

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
              [IDLE]                                          │
                │                                             │
                │ Right-click down on node                    │
                ▼                                             │
         [PRESS_STARTED]                                      │
           │         │                                        │
           │         │ Movement > 10px                        │
           │         │ (before timer)                         │
           │         ▼                                        │
           │    [EXPERT_MODE] ◄──────────────────────┐       │
           │         │                                │       │
           │         │ Release                        │       │
           │         ▼                                │       │
           │    Direction → Execute                   │       │
           │         │                                │       │
           │         └────────────────────────────────┼───────┘
           │                                          │
           │ Timer fires (333ms, no movement)         │
           ▼                                          │
    [MENU_VISIBLE]                                    │
           │                                          │
           ├─── Release on slice → Execute ───────────┘
           │
           ├─── Release in center → [CLICK_MODE]
           │                              │
           │                              │ Click on slice
           │                              ▼
           │                         Execute
           │                              │
           └─── Escape ───────────────────┴──────────────────┘
```

---

## Key Implementation Details

### 1. Expert Mode Detection

```typescript
// In useRadialMenu hook
const handleMouseMove = useCallback((e: React.MouseEvent) => {
  if (!pressStateRef.current.isPressed) return;
  
  currentMouseRef.current = { x: e.clientX, y: e.clientY };
  
  if (!pressStateRef.current.hasMoved) {
    const dx = e.clientX - pressStateRef.current.startX;
    const dy = e.clientY - pressStateRef.current.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > MOVEMENT_THRESHOLD) {
      // KEY: Cancel timer, enter invisible expert mode
      pressStateRef.current.hasMoved = true;
      pressStateRef.current.expertModeActive = true;
      clearWaitTimer();
      // Menu is NEVER shown in expert mode
    }
  }
}, [clearWaitTimer]);
```

### 2. Direction Calculation

```typescript
// Convert mouse position to slice index (0-7 for 8 items)
const getExpertModeDirection = useCallback((): number | null => {
  const dx = currentMouseRef.current.x - pressStateRef.current.startX;
  const dy = currentMouseRef.current.y - pressStateRef.current.startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < MOVEMENT_THRESHOLD) return null;  // Dead zone
  
  // Convert to angle (0° = up, clockwise)
  let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;
  
  // Convert angle to slice index
  const sliceAngle = 360 / 8;
  return Math.floor(((angle + sliceAngle / 2) % 360) / sliceAngle);
}, []);
```

### 3. Expert Mode Execution (OutlineEditor)

```typescript
// Global listener catches expert mode releases
useEffect(() => {
  const handleGlobalMouseUp = (_e: MouseEvent) => {
    if (radialMenu.isInExpertMode()) {
      const index = radialMenu.getExpertModeDirection();
      handleRadialMenuExecute(index);
    }
  };

  window.addEventListener('mouseup', handleGlobalMouseUp);
  return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
}, [radialMenu, handleRadialMenuExecute]);
```

---

## Performance Expectations

From the research, users should experience:

| Metric | Expected Value |
|--------|----------------|
| Expert mark time | 0.2-0.4 seconds |
| Menu selection time | 1.0-1.5 seconds |
| Speed improvement | 3-5x faster with marks |
| Learning time | ~50-100 uses to reach 90% marks |
| Error rate | <5% for 8-item menus |

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/components/RadialMenu.tsx` | Visual menu component + `useRadialMenu` hook |
| `src/components/OutlineEditor.tsx` | Menu items definition + execution handlers |
| `src/components/FlowchartView.tsx` | Simplified menu-only mode (ReactFlow limitations) |

---

## Testing Checklist

### Expert Mode (Invisible Gesture)
- [ ] Right-click + immediately drag right → Process action executes
- [ ] Right-click + immediately drag down → Add Below executes
- [ ] Menu never appears during quick gesture
- [ ] Release in center during gesture → No action (cancel)

### Novice Mode (Visible Menu)
- [ ] Right-click + hold still → Menu appears after 333ms
- [ ] Drag to slice + release → Action executes
- [ ] Release in center → Menu stays open in click mode
- [ ] Click on slice → Action executes
- [ ] Escape → Menu closes

### Edge Cases
- [ ] Very quick click (< 333ms, no movement) → Nothing happens
- [ ] Movement during menu visible → Selection follows mouse
- [ ] Disabled items → Cannot be selected
- [ ] Click outside menu → Menu closes

---

## Future Enhancements

### From Research (Not Yet Implemented)

1. **Hierarchical Menus**: Zig-zag gestures for submenus
   - Right-then-down = "Add" submenu → "Add Child"
   - Limit to 2 levels deep

2. **Keyboard Alternative**: 
   - Arrow keys to navigate slices when menu visible
   - Enter to confirm selection

3. **Learning Analytics**:
   - Track mark vs menu usage ratio
   - Surface when user is ready for expert tips

4. **Customizable Layout**:
   - Let users reorder items based on their frequency
   - Persist layout preference
