import { describe, it, expect } from 'vitest';
import { buildTree, validateBranches } from '../tree';
import type { ParsedLine } from '../types';
import type { OutlineNode } from '../../types';

const baseLine = (overrides: Partial<ParsedLine>): ParsedLine => ({
  indent: 0,
  syntaxFamily: 'keyword',
  type: 'process',
  label: '',
  anchor: undefined,
  isGoto: false,
  raw: '',
  lineNumber: 1,
  ...overrides,
});

describe('tree builder', () => {
  it('builds flat list as siblings', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'start', label: 'Start', lineNumber: 1 }),
      baseLine({ type: 'process', label: 'Step', lineNumber: 2 }),
      baseLine({ type: 'end', label: 'End', lineNumber: 3 }),
    ];

    const result = buildTree(lines);
    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes[0].label).toBe('Start');
    expect(result.nodes[1].label).toBe('Step');
    expect(result.nodes[2].label).toBe('End');
    expect(result.nodes[0].children).toHaveLength(0);
  });

  it('builds nested tree using indentation levels', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'start', label: 'Root', indent: 0, lineNumber: 1 }),
      baseLine({ type: 'process', label: 'Child', indent: 1, lineNumber: 2 }),
      baseLine({ type: 'decision', label: 'Grandchild', indent: 2, lineNumber: 3 }),
      baseLine({ type: 'end', label: 'Sibling', indent: 1, lineNumber: 4 }),
    ];

    const result = buildTree(lines);
    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].children).toHaveLength(2);
    expect(result.nodes[0].children[0].label).toBe('Child');
    expect(result.nodes[0].children[0].children[0].label).toBe('Grandchild');
    expect(result.nodes[0].children[1].label).toBe('Sibling');
  });

  it('skips comment lines', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'start', label: 'Start', lineNumber: 1 }),
      baseLine({ syntaxFamily: 'comment', type: 'comment', label: 'Skip', lineNumber: 2 }),
      baseLine({ type: 'end', label: 'End', lineNumber: 3 }),
    ];

    const result = buildTree(lines);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].label).toBe('Start');
    expect(result.nodes[1].label).toBe('End');
  });

  it('resolves aliases to canonical types', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'proc', label: 'Work', lineNumber: 1 }),
    ];

    const result = buildTree(lines);
    expect(result.nodes[0].type).toBe('process');
  });

  it('applies branch labels for yes/no aliases', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'yes', label: '', lineNumber: 1 }),
      baseLine({ type: 'no', label: '', lineNumber: 2 }),
    ];

    const result = buildTree(lines);
    expect(result.nodes[0].type).toBe('branch');
    expect(result.nodes[0].label).toBe('Yes');
    expect(result.nodes[1].label).toBe('No');
  });

  it('preserves custom branch labels when provided', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'yes', label: 'Custom', lineNumber: 1 }),
    ];

    const result = buildTree(lines);
    expect(result.nodes[0].type).toBe('branch');
    expect(result.nodes[0].label).toBe('Custom');
  });

  it('falls back to process for unknown types', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'mystery', label: 'Unknown', lineNumber: 1 }),
    ];

    const result = buildTree(lines);
    expect(result.nodes[0].type).toBe('process');
  });

  it('does not auto-wrap decision children (validateBranches is separate)', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'decision', label: 'Check', indent: 0, lineNumber: 1 }),
      baseLine({ type: 'process', label: 'First', indent: 1, lineNumber: 2 }),
      baseLine({ type: 'process', label: 'Second', indent: 1, lineNumber: 3 }),
    ];

    const result = buildTree(lines);
    // buildTree no longer calls validateBranches — children are raw
    expect(result.nodes[0].children).toHaveLength(2);
    expect(result.nodes[0].children[0].type).toBe('process');
    expect(result.nodes[0].children[0].label).toBe('First');
    expect(result.nodes[0].children[1].label).toBe('Second');

    // validateBranches wraps them properly
    const validated = validateBranches(result.nodes);
    expect(validated[0].children).toHaveLength(2);
    expect(validated[0].children[0].type).toBe('branch');
    expect(validated[0].children[0].label).toBe('Yes');
    expect(validated[0].children[0].children).toHaveLength(2);
    expect(validated[0].children[1].label).toBe('No');
  });

  it('returns empty array for empty input', () => {
    const result = buildTree([]);
    expect(result.nodes).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('generates 7-character alphanumeric ids', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'process', label: 'Check', lineNumber: 1 }),
    ];

    const result = buildTree(lines);
    expect(result.nodes[0].id).toMatch(/^[a-z0-9]{7}$/i);
  });

  it('reports indentation errors without throwing', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'start', label: 'Root', indent: 0, lineNumber: 1 }),
      baseLine({ type: 'process', label: 'Too deep', indent: 3, lineNumber: 2 }),
    ];

    const result = buildTree(lines);
    expect(result.errors).toHaveLength(1);
    expect(result.nodes).toHaveLength(1);
  });
});

describe('validateBranches', () => {
  it('wraps decision children when no branches exist', () => {
    const nodes: OutlineNode[] = [
      {
        id: 'root',
        type: 'decision',
        label: 'Decide',
        children: [
          { id: 'a', type: 'process', label: 'Child', children: [] },
        ],
      },
    ];

    const result = validateBranches(nodes);
    expect(result[0].children).toHaveLength(2);
    expect(result[0].children[0].type).toBe('branch');
    expect(result[0].children[0].label).toBe('Yes');
    expect(result[0].children[0].children).toHaveLength(1);
    expect(result[0].children[1].label).toBe('No');
  });
});
