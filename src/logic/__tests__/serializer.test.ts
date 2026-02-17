import { describe, it, expect } from 'vitest';
import { serialize } from '../serializer';
import type { OutlineNode } from '../../types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

describe('serializer', () => {
  describe('serialize()', () => {
    it('should serialize a single start node', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'start', label: 'Begin Process', children: [] },
      ];
      expect(serialize(nodes)).toBe('[start] Begin Process');
    });

    it('should serialize a single end node', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'end', label: 'Finish', children: [] },
      ];
      expect(serialize(nodes)).toBe('[end] Finish');
    });

    it('should serialize a single process node', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'process', label: 'Validate Input', children: [] },
      ];
      expect(serialize(nodes)).toBe('[process] Validate Input');
    });

    it('should serialize a single decision node', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'decision', label: 'Is Valid?', children: [] },
      ];
      expect(serialize(nodes)).toBe('[decision] Is Valid?');
    });

    it('should serialize branch nodes with Yes/No label mapping', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'branch', label: 'Yes', children: [] },
        { id: generateId(), type: 'branch', label: 'No', children: [] },
        { id: generateId(), type: 'branch', label: 'YES', children: [] },
        { id: generateId(), type: 'branch', label: 'no', children: [] },
      ];
      const result = serialize(nodes);
      const lines = result.split('\n');
      expect(lines[0]).toBe('[yes]');
      expect(lines[1]).toBe('[no]');
      expect(lines[2]).toBe('[yes]');
      expect(lines[3]).toBe('[no]');
    });

    it('should serialize branch nodes with custom labels', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'branch', label: 'Success Path', children: [] },
      ];
      expect(serialize(nodes)).toBe('[yes] Success Path');
    });

    it('should serialize goto nodes', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'goto', label: '', children: [] },
      ];
      expect(serialize(nodes)).toBe('[goto]');
    });

    it('should serialize merge nodes', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'merge', label: 'Converge Here', children: [] },
      ];
      expect(serialize(nodes)).toBe('[merge] Converge Here');
    });

    it('should serialize parallel nodes', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'parallel', label: 'Fork Process', children: [] },
      ];
      expect(serialize(nodes)).toBe('[parallel] Fork Process');
    });

    it('should handle empty labels without trailing space', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'start', label: '', children: [] },
        { id: generateId(), type: 'end', label: '', children: [] },
        { id: generateId(), type: 'merge', label: '', children: [] },
      ];
      const result = serialize(nodes);
      const lines = result.split('\n');
      expect(lines[0]).toBe('[start]');
      expect(lines[1]).toBe('[end]');
      expect(lines[2]).toBe('[merge]');
    });

    it('should skip nodes with isComment === true', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'start', label: 'Begin', children: [] },
        { id: generateId(), type: 'process', label: 'This is a comment', children: [], isComment: true },
        { id: generateId(), type: 'end', label: 'End', children: [] },
      ];
      const result = serialize(nodes);
      const lines = result.split('\n');
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('[start] Begin');
      expect(lines[1]).toBe('[end] End');
    });

    it('should apply 2-space indentation per nesting level', () => {
      const nodes: OutlineNode[] = [
        {
          id: generateId(),
          type: 'start',
          label: 'Root',
          children: [
            {
              id: generateId(),
              type: 'process',
              label: 'Level 1',
              children: [
                {
                  id: generateId(),
                  type: 'decision',
                  label: 'Level 2',
                  children: [
                    { id: generateId(), type: 'end', label: 'Level 3', children: [] },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const result = serialize(nodes);
      const lines = result.split('\n');
      expect(lines[0]).toBe('[start] Root');
      expect(lines[1]).toBe('  [process] Level 1');
      expect(lines[2]).toBe('    [decision] Level 2');
      expect(lines[3]).toBe('      [end] Level 3');
    });

    it('should serialize nested tree with branches correctly', () => {
      const nodes: OutlineNode[] = [
        {
          id: generateId(),
          type: 'start',
          label: 'Begin',
          children: [
            {
              id: generateId(),
              type: 'decision',
              label: 'Check Status',
              children: [
                {
                  id: generateId(),
                  type: 'branch',
                  label: 'Yes',
                  children: [
                    { id: generateId(), type: 'process', label: 'Handle Success', children: [] },
                  ],
                },
                {
                  id: generateId(),
                  type: 'branch',
                  label: 'No',
                  children: [
                    { id: generateId(), type: 'process', label: 'Handle Failure', children: [] },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const result = serialize(nodes);
      const lines = result.split('\n');
      expect(lines[0]).toBe('[start] Begin');
      expect(lines[1]).toBe('  [decision] Check Status');
      expect(lines[2]).toBe('    [yes]');
      expect(lines[3]).toBe('      [process] Handle Success');
      expect(lines[4]).toBe('    [no]');
      expect(lines[5]).toBe('      [process] Handle Failure');
    });

    it('should serialize complex K8s-style auth flow correctly', () => {
      const nodes: OutlineNode[] = [
        {
          id: generateId(),
          type: 'start',
          label: 'API Request',
          children: [
            {
              id: generateId(),
              type: 'process',
              label: 'Extract Token',
              children: [
                {
                  id: generateId(),
                  type: 'decision',
                  label: 'Token Present?',
                  children: [
                    {
                      id: generateId(),
                      type: 'branch',
                      label: 'Yes',
                      children: [
                        {
                          id: generateId(),
                          type: 'process',
                          label: 'Validate JWT',
                          children: [
                            { id: generateId(), type: 'end', label: '200 OK', children: [] },
                          ],
                        },
                      ],
                    },
                    {
                      id: generateId(),
                      type: 'branch',
                      label: 'No',
                      children: [
                        { id: generateId(), type: 'end', label: '401 Unauthorized', children: [] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const result = serialize(nodes);
      const lines = result.split('\n');
      expect(lines.length).toBe(8);
      expect(lines[0]).toBe('[start] API Request');
      expect(lines[1]).toBe('  [process] Extract Token');
      expect(lines[2]).toBe('    [decision] Token Present?');
      expect(lines[3]).toBe('      [yes]');
      expect(lines[4]).toBe('        [process] Validate JWT');
      expect(lines[5]).toBe('          [end] 200 OK');
      expect(lines[6]).toBe('      [no]');
      expect(lines[7]).toBe('        [end] 401 Unauthorized');
    });

    it('should handle multiple root nodes', () => {
      const nodes: OutlineNode[] = [
        { id: generateId(), type: 'start', label: 'Flow 1', children: [] },
        { id: generateId(), type: 'start', label: 'Flow 2', children: [] },
      ];
      const result = serialize(nodes);
      const lines = result.split('\n');
      expect(lines.length).toBe(2);
      expect(lines[0]).toBe('[start] Flow 1');
      expect(lines[1]).toBe('[start] Flow 2');
    });

    it('should skip comment nodes at any depth', () => {
      const nodes: OutlineNode[] = [
        {
          id: generateId(),
          type: 'start',
          label: 'Root',
          children: [
            { id: generateId(), type: 'process', label: 'Commented', children: [], isComment: true },
            {
              id: generateId(),
              type: 'decision',
              label: 'Check',
              children: [
                { id: generateId(), type: 'branch', label: 'Yes', children: [], isComment: true },
                {
                  id: generateId(),
                  type: 'branch',
                  label: 'No',
                  children: [
                    { id: generateId(), type: 'end', label: 'Done', children: [] },
                  ],
                },
              ],
            },
          ],
        },
      ];
      const result = serialize(nodes);
      const lines = result.split('\n');
      expect(lines.length).toBe(4);
      expect(lines[0]).toBe('[start] Root');
      expect(lines[1]).toBe('  [decision] Check');
      expect(lines[2]).toBe('    [no]');
      expect(lines[3]).toBe('      [end] Done');
    });
  });
});
