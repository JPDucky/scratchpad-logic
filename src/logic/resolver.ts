import type { OutlineNode } from '../types';
import type { ParsedLine } from './types';

/**
 * Build mapping from anchor names to node IDs by walking ParsedLine[] and OutlineNode[] in parallel
 */
function buildAnchorMap(lines: ParsedLine[], nodes: OutlineNode[]): Map<string, string> {
  const anchorMap = new Map<string, string>();
  const nodeStack: OutlineNode[] = [];

  // Flatten nodes into array matching line order
  function collectNodes(nodeList: OutlineNode[]): void {
    for (const node of nodeList) {
      nodeStack.push(node);
      collectNodes(node.children);
    }
  }
  collectNodes(nodes);

  let nodeIndex = 0;

  for (const line of lines) {
    // Skip comment lines since they don't create nodes
    if (line.syntaxFamily === 'comment') {
      continue;
    }

    if (nodeIndex >= nodeStack.length) {
      break;
    }

    const node = nodeStack[nodeIndex];
    nodeIndex++;

    if (line.anchor) {
      anchorMap.set(line.anchor, node.id);
    }
  }

  return anchorMap;
}

/**
 * Extract target anchor name from goto node label
 * Supports formats: "@targetName" or "targetName" or "@targetName some extra text"
 */
function extractTargetAnchor(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed) {
    return null;
  }

  // Extract anchor name - it's either "@name" or just "name"
  // Anchor pattern: [a-zA-Z0-9-]+
  const match = trimmed.match(/^@?([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

/**
 * Recursively walk tree and resolve goto targetIds
 */
function resolveGotoNodes(
  nodes: OutlineNode[],
  anchorMap: Map<string, string>,
  unresolvedGotos: string[]
): OutlineNode[] {
  return nodes.map((node) => {
    const resolvedChildren = resolveGotoNodes(node.children, anchorMap, unresolvedGotos);

    if (node.type === 'goto') {
      const targetAnchor = extractTargetAnchor(node.label);

      if (targetAnchor) {
        const targetId = anchorMap.get(targetAnchor);
        if (targetId) {
          return { ...node, children: resolvedChildren, targetId };
        } else {
          unresolvedGotos.push(targetAnchor);
          return { ...node, children: resolvedChildren };
        }
      }
    }

    if (resolvedChildren !== node.children) {
      return { ...node, children: resolvedChildren };
    }

    return node;
  });
}

/**
 * Resolve goto anchor references by setting targetId on goto nodes
 * 
 * @param nodes - Tree of OutlineNodes to resolve
 * @param lines - Original ParsedLine array (contains anchor info)
 * @returns Modified tree with targetIds set, plus list of unresolved anchor names
 */
export function resolveAnchors(
  nodes: OutlineNode[],
  lines: ParsedLine[]
): { nodes: OutlineNode[]; unresolvedGotos: string[] } {
  const anchorMap = buildAnchorMap(lines, nodes);
  const unresolvedGotos: string[] = [];
  const resolvedNodes = resolveGotoNodes(nodes, anchorMap, unresolvedGotos);

  return { nodes: resolvedNodes, unresolvedGotos };
}
