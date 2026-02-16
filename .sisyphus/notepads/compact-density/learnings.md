# Learnings - Compact Density Mode

## Conventions & Patterns

### Tailwind Template Literals with Config Objects

**Pattern Used:**
```typescript
className={`fixed-classes ${DENSITY_CONFIG.property} other-classes`}
```

**Key Points:**
1. Template literals allow dynamic className values from config objects
2. Works seamlessly with existing Tailwind class strings
3. Maintains readability by keeping fixed classes separate from config values
4. No performance impact when config is marked `as const`

### Tailwind Spacing Values Reference

- `py-0` = 0px padding (0rem)
- `py-0.5` = 4px padding (0.125rem)
- `py-1` = 8px padding (0.25rem)
- `space-y-0` = 0px gap (0rem)
- `space-y-0.5` = 2px gap (0.125rem)
- `w-4 h-4` = 16px (0.25rem)
- `w-5 h-5` = 20px (0.3125rem)

### Density Improvements Achieved

**Metrics:**
- Average node height reduced from ~34px to 28.60px (14% reduction)
- Visible nodes increased from ~26 to 31 in 910px container (19% improvement)
- Successfully exceeds target of 20-25 visible nodes

**Changes Made:**
1. Row padding: `py-1` → `py-0.5` (saves 4px)
2. Icon size: `w-5 h-5` → `w-4 h-4` (saves 4px)
3. Text padding: `py-0.5` → `py-0` (saves 4px)
4. Node gap: `space-y-0.5` → `space-y-0` (saves 2px)

### Configuration Flexibility

The DENSITY_CONFIG constant enables easy future adjustments:
- All spacing values centralized in one object
- Changes propagate to all 6 affected locations automatically
- No need to search/replace across multiple lines
- Type-safe with TypeScript `as const`

### Testing Verification

✓ Build passes with zero TypeScript errors
✓ 67 nodes created and rendered successfully
✓ Keyboard navigation (j/k/i/o) all functional
✓ No console errors detected
✓ Screenshots captured showing improved density
