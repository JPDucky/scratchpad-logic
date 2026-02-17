import type { OutlineNode, NodeType } from '../types';
import type { ParsedLine, ParseError } from './types';
import { resolveAlias } from './aliases';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function buildIndentError(line: ParsedLine, message: string): ParseError {
  return {
    message,
    line: line.lineNumber,
    column: 1,
    source: 'tree',
  };
}

export function validateBranches(nodes: OutlineNode[]): OutlineNode[] {
  return nodes.map((node) => {
    const children = validateBranches(node.children);

    if (node.type === 'decision') {
      const hasBranchChild = children.some((child) => child.type === 'branch');
      if (!hasBranchChild) {
        return {
          ...node,
          children: [
            { id: generateId(), type: 'branch', label: 'Yes', children },
            { id: generateId(), type: 'branch', label: 'No', children: [] },
          ],
        };
      }
    }

    return { ...node, children };
  });
}

export function buildTree(lines: ParsedLine[]): { nodes: OutlineNode[]; errors: ParseError[] } {
  const nodes: OutlineNode[] = [];
  const errors: ParseError[] = [];
  const stack: Array<{ node: OutlineNode; indent: number }> = [];

  for (const line of lines) {
    if (line.syntaxFamily === 'comment') {
      continue;
    }

    const resolution = resolveAlias(line.type);
    const resolvedType = (resolution?.canonicalType ?? 'process') as NodeType;
    let label = line.label;

    if (resolution?.branchLabel) {
      label = line.label ? line.label : resolution.branchLabel;
    }

    const node: OutlineNode = {
      id: generateId(),
      type: resolvedType,
      label,
      children: [],
    };

    while (stack.length > 0 && line.indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    if (!parent) {
      if (line.indent > 0) {
        errors.push(buildIndentError(line, 'Indentation without parent node.'));
      }
      nodes.push(node);
      stack.push({ node, indent: line.indent });
      continue;
    }

    if (line.indent > parent.indent + 1) {
      errors.push(buildIndentError(line, 'Indentation jumps more than one level.'));
    }

    parent.node.children.push(node);
    stack.push({ node, indent: line.indent });
  }

  return { nodes: validateBranches(nodes), errors };
}
