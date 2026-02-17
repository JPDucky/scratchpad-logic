
## Task 5: Header Import/Export Buttons
- Added Import and Export buttons to the Header component.
- Implemented file picker using a hidden file input triggered by the Import button.
- Implemented a stub for Export that creates a dummy `.logic` file download.
- Added an error state display below the header for invalid file types or read errors.
- Used standard Tailwind classes for styling to match the existing dark theme.
- Note: `animate-in` classes from `tailwindcss-animate` were removed as the plugin is not installed. Used standard transitions or simple display toggling instead.

## Task 6: Lexer
- Implemented lexer utilities with indentation validation (tabs rejected, 2-space multiples enforced) and continuation joining.
- Detection respects family priority and keyword detection only when aliases are known.
- Parsing returns raw type strings, anchor extraction via @name pattern, and dash-family disambiguation handled.

## Task 7: Tree Builder
- Added stack-based tree builder with alias resolution and comment skipping.
- Enforced branch invariants by auto-wrapping decision children into Yes/No branches.
- Added comprehensive tree tests covering flat lists, nesting, aliases, branch labels, fallback types, and ID format.

## Task 9: Parser integration tests
- Added parser integration tests covering bracket/keyword/sigil/mixed/inference syntax, anchors, comments, decisions, indentation errors, empty input, and round-trip serialization.
- Multi-line label continuation in tests uses a joined two-line string to avoid accidental literal prefixes.
