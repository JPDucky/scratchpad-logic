import { describe, it, expect } from 'vitest';
import { parse } from '../parser';
import { serialize } from '../serializer';
import type { OutlineNode } from '../../types';

type SimplifiedNode = {
  type: OutlineNode['type'];
  label: string;
  children: SimplifiedNode[];
};

const simplifyNodes = (nodes: OutlineNode[]): SimplifiedNode[] =>
  nodes.map((node) => ({
    type: node.type,
    label: node.label,
    children: simplifyNodes(node.children),
  }));

describe('parser integration', () => {
  it('parses bracket syntax into correct tree', () => {
    const input = '[start] Begin\n  [process] Step\n[end] Done';
    const result = parse(input);

    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].type).toBe('start');
    expect(result.nodes[0].label).toBe('Begin');
    expect(result.nodes[0].children).toHaveLength(1);
    expect(result.nodes[0].children[0].type).toBe('process');
    expect(result.nodes[0].children[0].label).toBe('Step');
    expect(result.nodes[1].type).toBe('end');
    expect(result.nodes[1].label).toBe('Done');
  });

  it('parses keyword syntax into correct tree', () => {
    const input = 'start: Begin\nprocess: Step\nend: Done';
    const result = parse(input);

    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes.map((node) => node.type)).toEqual(['start', 'process', 'end']);
    expect(result.nodes.map((node) => node.label)).toEqual(['Begin', 'Step', 'Done']);
  });

  it('parses sigil syntax into correct tree', () => {
    const input = '> Begin\n- Step\n. Done';
    const result = parse(input);

    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes.map((node) => node.type)).toEqual(['start', 'process', 'end']);
    expect(result.nodes.map((node) => node.label)).toEqual(['Begin', 'Step', 'Done']);
  });

  it('parses mixed syntax with brackets, keywords, and sigils', () => {
    const input = '[start] Begin\nprocess: Step\n- More\nend: Done';
    const result = parse(input);

    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(4);
    expect(result.nodes.map((node) => node.type)).toEqual(['start', 'process', 'process', 'end']);
    expect(result.nodes.map((node) => node.label)).toEqual(['Begin', 'Step', 'More', 'Done']);
  });

  it('parses inference syntax for question marks', () => {
    const input = 'Begin\nDo something\nIs valid?';
    const result = parse(input);

    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes.map((node) => node.type)).toEqual(['process', 'process', 'decision']);
    expect(result.nodes.map((node) => node.label)).toEqual(['Begin', 'Do something', 'Is valid?']);
  });

  it('resolves goto anchors in the same document', () => {
    const input = '[process @form] Form\n[goto] @form';
    const result = parse(input);

    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[1].type).toBe('goto');
    expect(result.nodes[1].targetId).toBe(result.nodes[0].id);
  });

  it('joins multi-line labels with backslash continuation', () => {
    const input = ['[process] First line \\', '  Second line'].join('\n');
    const result = parse(input);

    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].label).toBe('First line Second line');
  });

  it('skips comment lines', () => {
    const input = '// comment\n[process] Step';
    const result = parse(input);

    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].type).toBe('process');
    expect(result.nodes[0].label).toBe('Step');
  });

  it('builds explicit decision branches', () => {
    const input = '[decision] Check?\n  [yes] OK\n  [no] Fail';
    const result = parse(input);

    expect(result.errors).toHaveLength(0);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].type).toBe('decision');
    expect(result.nodes[0].label).toBe('Check?');
    expect(result.nodes[0].children).toHaveLength(2);
    expect(result.nodes[0].children.map((node) => node.type)).toEqual(['branch', 'branch']);
    expect(result.nodes[0].children.map((node) => node.label)).toEqual(['OK', 'Fail']);
  });

  it('returns error for tab indentation', () => {
    const input = '\t[process] Step';
    const result = parse(input);

    expect(result.nodes).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('tab');
  });

  it('returns error for non-2-space indentation', () => {
    const input = '   [process] Step';
    const result = parse(input);

    expect(result.nodes).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('multiple of 2 spaces');
  });

  it('returns empty result for empty input', () => {
    const result = parse('');

    expect(result.nodes).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('round-trips tree via serialize and parse', () => {
    const nodes: OutlineNode[] = [
      {
        id: 'root',
        type: 'start',
        label: 'Begin',
        children: [
          {
            id: 'decision',
            type: 'decision',
            label: 'Valid?',
            children: [
              {
                id: 'yes',
                type: 'branch',
                label: 'Yes',
                children: [
                  { id: 'process', type: 'process', label: 'Proceed', children: [] },
                ],
              },
              {
                id: 'no',
                type: 'branch',
                label: 'No',
                children: [
                  { id: 'end', type: 'end', label: 'Stop', children: [] },
                ],
              },
            ],
          },
        ],
      },
    ];

    const serialized = serialize(nodes);
    const result = parse(serialized);

    expect(result.errors).toHaveLength(0);
    expect(simplifyNodes(result.nodes)).toEqual(simplifyNodes(nodes));
  });
});
