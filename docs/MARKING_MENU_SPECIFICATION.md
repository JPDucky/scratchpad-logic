# Marking Menu Feature Specification

## Overview

This document defines the behavior of the marking menu (radial menu with gesture support) for the Logic Flow Brainstorming Tool. The design is based on extensive HCI research, primarily the work of Kurtenbach & Buxton (1994) and subsequent studies.

---

## 1. Core Interaction Model

### 1.1 Dual-Mode Design Philosophy

The marking menu supports two distinct usage modes that the user can seamlessly switch between:

| Mode | User Type | Interaction | Menu Visible? |
|------|-----------|-------------|---------------|
| **Novice/Menu Mode** | New users discovering commands | Press + wait → menu appears → drag to select → release | YES |
| **Expert/Mark Mode** | Experienced users with muscle memory | Press + immediately move in direction → release | NO |

**Key Insight**: The expert mode is completely invisible. The menu never appears. This is the fundamental difference from a standard radial menu.

### 1.2 Why This Matters

From Kurtenbach & Buxton (1994):
> "The physical movement involved in selecting a command is identical to the physical movement required to make the mark corresponding to that command."

This means:
- **Novices learn by doing**: Every menu selection rehearses the expert gesture
- **Smooth skill transition**: No need to learn a different protocol (unlike keyboard shortcuts)
- **Self-revealing**: Users naturally discover the expert mode through repeated use

---

## 2. Timing Parameters

### 2.1 Press-and-Wait Delay

| Parameter | Value | Source |
|-----------|-------|--------|
| Menu appearance delay | **333ms** (~1/3 second) | Kurtenbach & Buxton 1994 |

**Rationale**: 
- Short enough that novices don't feel delayed
- Long enough that experts can execute gestures without triggering the menu
- Matches human reaction time thresholds

### 2.2 Movement Threshold

| Parameter | Value | Notes |
|-----------|-------|-------|
| Movement to cancel timer | **10-15 pixels** | Implementation-specific |
| Minimum gesture length for selection | **15-20 pixels** | Dead zone radius |

**Behavior**:
- If user moves > threshold BEFORE timer fires → cancel timer, enter expert mode (invisible)
- If user moves < threshold and timer fires → show menu in novice mode

### 2.3 Selection Timing

From the 1994 study with real users:

| Method | Average Time | Comparison |
|--------|--------------|------------|
| Mark (expert) | 0.18 - 0.40 seconds | Baseline |
| Menu selection | 1.09 - 1.54 seconds | 3.5-7x slower |
| Menu - delay | 0.76 - 1.21 seconds | Still 3-4x slower |

**Key Finding**: "A mark will always be faster than menu selection, even if press-and-wait was not required to trigger the menu."

---

## 3. Menu Structure

### 3.1 Number of Items

| Items | Recommendation | Notes |
|-------|----------------|-------|
| 4 | Excellent | Cardinal directions, very easy |
| 6 | Good | Original ConEd study used this |
| 8 | Good | Common in modern implementations |
| 12 | Maximum recommended | Still usable but error-prone |
| 16+ | Not recommended | Too many similar angles |

**Design Principle**: "Restrict menus to even numbers of items, up to twelve. This enhances marking performance."

### 3.2 Item Placement Guidelines

1. **Use meaningful directions**: 
   - "Add Below" → Down direction
   - "Add Child" → Down-right (hierarchy flows down-right)
   - "Delete" → Intuitive based on mental model

2. **Pair inverse operations**:
   - Same position can toggle states (laugh/unlaugh)
   - Reduces total menu items needed

3. **Frequent items get easy directions**:
   - Cardinal directions (up, down, left, right) are easiest
   - Diagonal directions are slightly harder

### 3.3 Current Menu Layout (8 items)

```
                    Add Below (↓)
                        |
      Add Child (↘)     |     Edit (↗)
                   \    |    /
                    \   |   /
    Delete (←) ------[CENTER]------ Process (→)
                    /   |   \
                   /    |    \
      End (↙)          |        Decision (↖)
                        |
                    Jump (↑)
```

**Note**: Layout should be refined based on actual usage frequency.

---

## 4. Visual Design

### 4.1 Menu Appearance

| Element | Specification |
|---------|---------------|
| Inner radius (dead zone) | 25-35 pixels |
| Outer radius | 80-100 pixels |
| Slice gaps | 1-2 pixels |
| Background | Semi-transparent dark |
| Highlight color | Action-specific color |
| Text size | 9-10pt for labels |
| Icon size | 14-18pt |

### 4.2 Feedback Elements

1. **Direction indicator**: Subtle line from center showing current direction
2. **Hover highlight**: Slice changes color when selected
3. **Mode indicator**: Text showing "Release to select" vs "Click to select"
4. **Center label**: Shows "Cancel" when in dead zone

### 4.3 No Menu (Expert Mode)

In expert mode, provide minimal optional feedback:
- Cursor change (optional)
- No visual menu
- Action executes on release based purely on direction

---

## 5. Interaction States

### 5.1 State Machine

```
[Idle] 
    │
    │ Right-click down
    ▼
[Press Started] ──────────────────────────────────────┐
    │                                                  │
    │ Timer (333ms)              Movement > threshold  │
    ▼                                                  ▼
[Menu Visible]                              [Expert Mode (invisible)]
    │                                                  │
    │ Mouse move                           Mouse move  │
    ▼                                                  ▼
[Slice Highlighted]                         [Direction Tracked]
    │                                                  │
    │ Release on slice                     Release     │
    ▼                                                  ▼
[Execute Action]                            [Execute Action]
    │                                                  │
    │ Release in center                                │
    ▼                                                  │
[Switch to Click Mode] ◄───────────────────────────────┘
    │                           (if released in center during expert mode)
    │ Click on slice
    ▼
[Execute Action]
```

### 5.2 Cancel Behaviors

| Context | Action | Result |
|---------|--------|--------|
| Menu visible, release in center | Switch to click-to-select mode | Menu stays open |
| Menu visible, press Escape | Close menu | No action |
| Expert mode, release in center | Cancel | No action |
| Click mode, click outside | Close menu | No action |

---

## 6. Learning & Skill Acquisition

### 6.1 Novice to Expert Transition

From the 1994 longitudinal study:

1. **Initial behavior**: 90-100% menu usage
2. **Learning phase**: Gradual increase in mark usage
3. **Expert behavior**: 90%+ mark usage
4. **Retention**: Skills fade after layoffs, but recover quickly

**Design Implication**: Always allow switching back to menu mode. "Even expert users still switch back to menus to refresh their memory of menu layout."

### 6.2 Memory Aids

1. **Consistent placement**: Same commands always in same position
2. **Spatial mnemonics**: Direction relates to action meaning
3. **Rehearsal through use**: Menu selection practices the gesture
4. **Progressive disclosure**: Novices see full menu, experts see nothing

### 6.3 Error Recovery

From research, marking errors increase with:
- More menu items (12 > 8 > 4)
- Diagonal vs cardinal directions
- Hierarchical depth
- User fatigue

**Mitigation**:
- Provide undo for all actions
- Visual confirmation of selection before release
- Center dead zone for "bail out"

---

## 7. Hierarchical Menus (Future Consideration)

### 7.1 Zig-Zag Marking

For deeper command hierarchies, research shows:
- Each level adds a direction change
- "Zig-zag" marks (e.g., right-then-up) can be learned
- Limit to 2-3 levels maximum
- Performance degrades significantly past 8 items per level

### 7.2 Breadth vs Depth Trade-off

| Structure | Selection Time | Error Rate | Learning |
|-----------|---------------|------------|----------|
| Wide (8×8=64 items) | Slower | Lower | Easier |
| Deep (4×4×4=64 items) | Faster | Higher | Harder |

**Recommendation**: Prefer wider, shallower menus for discoverability.

---

## 8. Comparison to Alternatives

### 8.1 vs Linear Menus

| Aspect | Marking Menu | Linear Menu |
|--------|--------------|-------------|
| Selection speed (expert) | 0.18-0.40s | 0.79s |
| Selection speed (novice) | 1.09-1.54s | 0.79s |
| Learning curve | Steeper initially | Flat |
| Eyes-free operation | Yes | No |
| Space efficiency | Compact | Requires screen space |

### 8.2 vs Keyboard Shortcuts

| Aspect | Marking Menu | Keyboard Shortcuts |
|--------|--------------|-------------------|
| Discoverability | Self-revealing | Requires memorization |
| Motor learning | Same as discovery | Different protocol |
| Pen/touch compatible | Yes | No |
| Hand position | Near work area | Requires keyboard |

---

## 9. Implementation Checklist

### 9.1 Core Requirements

- [ ] Right-click initiates press state (no immediate menu)
- [ ] 333ms timer starts on press
- [ ] Movement > threshold cancels timer, enters expert mode
- [ ] Timer expiry shows menu in novice mode
- [ ] Direction calculation works identically in both modes
- [ ] Release in dead zone = cancel (expert) or switch to click mode (novice)
- [ ] Escape key closes menu at any time

### 9.2 Visual Requirements

- [ ] Radial menu with 8 equal slices
- [ ] Dead zone in center with "Cancel" label
- [ ] Direction indicator from center
- [ ] Mode indicator text
- [ ] Smooth hover highlighting
- [ ] Action-specific colors for each slice

### 9.3 Accessibility

- [ ] Keyboard navigation alternative (arrow keys + enter)
- [ ] High contrast mode support
- [ ] Screen reader announcements for menu state changes
- [ ] Configurable timing for motor impairments

---

## 10. References

### Primary Sources

1. **Kurtenbach, G. & Buxton, W. (1994)**. "User Learning and Performance with Marking Menus." *Proceedings of CHI '94*, 258-264.
   - Foundational study with longitudinal real-world usage data
   - Established 333ms press-and-wait delay
   - Demonstrated 3.5x speed improvement for expert users

2. **Kurtenbach, G. & Buxton, W. (1993)**. "The Limits of Expert Performance Using Hierarchical Marking Menus." *Proceedings of CHI '93*.
   - Hierarchical menu depth limits
   - Error rate analysis

3. **Buxton, W. (1995)**. "Touch, Gesture & Marking" in *Readings in Human-Computer Interaction: Toward the Year 2000*.
   - Comprehensive overview of marking menu theory
   - Connection to motor learning and skill acquisition

4. **Callahan, J., Hopkins, D., Weiser, M. & Shneiderman, B. (1988)**. "An Empirical Comparison of Pie vs. Linear Menus." *Proceedings of CHI '88*, 95-100.
   - Established superiority of radial layout for menu selection

### Modern Implementations

5. **Autodesk Maya** - Industry-standard marking menu implementation
6. **Autodesk Fusion 360** - Modern CAD marking menu
7. **Blender Pie Menus** - Open-source implementation (slightly different model)

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **Marking Menu** | Radial menu that supports both visual selection and invisible gesture-based selection |
| **Press-and-Wait** | Interaction where holding still triggers menu display |
| **Mark** | A directional stroke gesture that invokes a command without showing the menu |
| **Dead Zone** | Central area where no selection occurs (used for cancel) |
| **Expert Mode** | Invisible gesture-based selection without menu display |
| **Novice Mode** | Visual menu-based selection with highlighting |
| **Zig-Zag Mark** | Multi-segment gesture for hierarchical menu selection |

---

*Document Version: 1.0*
*Last Updated: February 2025*
*Based on research spanning 1988-2024*
