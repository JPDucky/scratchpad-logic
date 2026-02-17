import { describe, it, expect } from 'vitest';
import { resolveAnchors } from '../resolver';
import type { OutlineNode } from '../../types';
import type { ParsedLine } from '../types';

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

const baseNode = (overrides: Partial<OutlineNode>): OutlineNode => ({
  id: 'node1',
  type: 'process',
  label: '',
  children: [],
  ...overrides,
});

describe('resolveAnchors', () => {
  it('resolves simple anchor and goto', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'process', label: 'Step 1', anchor: 'step1', lineNumber: 1 }),
      baseLine({ type: 'goto', label: '@step1', isGoto: true, lineNumber: 2 }),
    ];

    const nodes: OutlineNode[] = [
      baseNode({ id: 'n1', type: 'process', label: 'Step 1' }),
      baseNode({ id: 'n2', type: 'goto', label: '@step1' }),
    ];

    const result = resolveAnchors(nodes, lines);

    expect(result.nodes[1].targetId).toBe('n1');
    expect(result.unresolvedGotos).toHaveLength(0);
  });

  it('resolves multiple anchors and gotos', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'process', label: 'Start', anchor: 'start', lineNumber: 1 }),
      baseLine({ type: 'process', label: 'Middle', anchor: 'mid', lineNumber: 2 }),
      baseLine({ type: 'goto', label: '@mid', isGoto: true, lineNumber: 3 }),
      baseLine({ type: 'goto', label: '@start', isGoto: true, lineNumber: 4 }),
    ];

    const nodes: OutlineNode[] = [
      baseNode({ id: 'n1', type: 'process', label: 'Start' }),
      baseNode({ id: 'n2', type: 'process', label: 'Middle' }),
      baseNode({ id: 'n3', type: 'goto', label: '@mid' }),
      baseNode({ id: 'n4', type: 'goto', label: '@start' }),
    ];

    const result = resolveAnchors(nodes, lines);

    expect(result.nodes[2].targetId).toBe('n2');
    expect(result.nodes[3].targetId).toBe('n1');
    expect(result.unresolvedGotos).toHaveLength(0);
  });

  it('handles broken reference', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'process', label: 'Step', lineNumber: 1 }),
      baseLine({ type: 'goto', label: '@nonexistent', isGoto: true, lineNumber: 2 }),
    ];

    const nodes: OutlineNode[] = [
      baseNode({ id: 'n1', type: 'process', label: 'Step' }),
      baseNode({ id: 'n2', type: 'goto', label: '@nonexistent' }),
    ];

    const result = resolveAnchors(nodes, lines);

    expect(result.nodes[1].targetId).toBeUndefined();
    expect(result.unresolvedGotos).toContain('nonexistent');
  });

  it('handles no gotos as no-op', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'process', label: 'Step 1', anchor: 'step1', lineNumber: 1 }),
      baseLine({ type: 'process', label: 'Step 2', lineNumber: 2 }),
    ];

    const nodes: OutlineNode[] = [
      baseNode({ id: 'n1', type: 'process', label: 'Step 1' }),
      baseNode({ id: 'n2', type: 'process', label: 'Step 2' }),
    ];

    const result = resolveAnchors(nodes, lines);

    expect(result.nodes[0].targetId).toBeUndefined();
    expect(result.nodes[1].targetId).toBeUndefined();
    expect(result.unresolvedGotos).toHaveLength(0);
  });

  it('handles no anchors with all gotos unresolved', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'process', label: 'Step', lineNumber: 1 }),
      baseLine({ type: 'goto', label: '@target1', isGoto: true, lineNumber: 2 }),
      baseLine({ type: 'goto', label: '@target2', isGoto: true, lineNumber: 3 }),
    ];

    const nodes: OutlineNode[] = [
      baseNode({ id: 'n1', type: 'process', label: 'Step' }),
      baseNode({ id: 'n2', type: 'goto', label: '@target1' }),
      baseNode({ id: 'n3', type: 'goto', label: '@target2' }),
    ];

    const result = resolveAnchors(nodes, lines);

    expect(result.nodes[1].targetId).toBeUndefined();
    expect(result.nodes[2].targetId).toBeUndefined();
    expect(result.unresolvedGotos).toContain('target1');
    expect(result.unresolvedGotos).toContain('target2');
  });

  it('resolves nested anchor with goto on different branch', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'decision', label: 'Check?', lineNumber: 1, indent: 0 }),
      baseLine({ type: 'branch', label: 'Yes', lineNumber: 2, indent: 1 }),
      baseLine({ type: 'process', label: 'Action', anchor: 'action', lineNumber: 3, indent: 2 }),
      baseLine({ type: 'branch', label: 'No', lineNumber: 4, indent: 1 }),
      baseLine({ type: 'goto', label: '@action', isGoto: true, lineNumber: 5, indent: 2 }),
    ];

    const nodes: OutlineNode[] = [
      baseNode({
        id: 'n1',
        type: 'decision',
        label: 'Check?',
        children: [
          baseNode({
            id: 'n2',
            type: 'branch',
            label: 'Yes',
            children: [baseNode({ id: 'n3', type: 'process', label: 'Action' })],
          }),
          baseNode({
            id: 'n4',
            type: 'branch',
            label: 'No',
            children: [baseNode({ id: 'n5', type: 'goto', label: '@action' })],
          }),
        ],
      }),
    ];

    const result = resolveAnchors(nodes, lines);

    // Navigate to the goto node
    const gotoNode = result.nodes[0].children[1].children[0];
    expect(gotoNode.targetId).toBe('n3');
    expect(result.unresolvedGotos).toHaveLength(0);
  });

  it('skips comment lines when building anchor map', () => {
    const lines: ParsedLine[] = [
      baseLine({ syntaxFamily: 'comment', type: 'comment', label: '// Comment', lineNumber: 1 }),
      baseLine({ type: 'process', label: 'Step', anchor: 'step', lineNumber: 2 }),
      baseLine({ syntaxFamily: 'comment', type: 'comment', label: '// Another', lineNumber: 3 }),
      baseLine({ type: 'goto', label: '@step', isGoto: true, lineNumber: 4 }),
    ];

    const nodes: OutlineNode[] = [
      baseNode({ id: 'n1', type: 'process', label: 'Step' }),
      baseNode({ id: 'n2', type: 'goto', label: '@step' }),
    ];

    const result = resolveAnchors(nodes, lines);

    expect(result.nodes[1].targetId).toBe('n1');
    expect(result.unresolvedGotos).toHaveLength(0);
  });

  it('extracts anchor from goto label without @ prefix', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'process', label: 'Target', anchor: 'target', lineNumber: 1 }),
      baseLine({ type: 'goto', label: 'target', isGoto: true, lineNumber: 2 }),
    ];

    const nodes: OutlineNode[] = [
      baseNode({ id: 'n1', type: 'process', label: 'Target' }),
      baseNode({ id: 'n2', type: 'goto', label: 'target' }),
    ];

    const result = resolveAnchors(nodes, lines);

    expect(result.nodes[1].targetId).toBe('n1');
    expect(result.unresolvedGotos).toHaveLength(0);
  });

  it('extracts first anchor from goto label with extra text', () => {
    const lines: ParsedLine[] = [
      baseLine({ type: 'process', label: 'Step', anchor: 'step', lineNumber: 1 }),
      baseLine({ type: 'goto', label: '@step some extra text', isGoto: true, lineNumber: 2 }),
    ];

    const nodes: OutlineNode[] = [
      baseNode({ id: 'n1', type: 'process', label: 'Step' }),
      baseNode({ id: 'n2', type: 'goto', label: '@step some extra text' }),
    ];

    const result = resolveAnchors(nodes, lines);

    expect(result.nodes[1].targetId).toBe('n1');
    expect(result.unresolvedGotos).toHaveLength(0);
  });
});
