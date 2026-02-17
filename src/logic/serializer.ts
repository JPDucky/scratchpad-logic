import type { OutlineNode } from '../types';

/**
 * Serializes an array of OutlineNode trees to .logic text format using bracket syntax.
 * 
 * - Recursively walks the tree structure
 * - Nodes with isComment === true are completely omitted
 * - Uses 2-space indentation per nesting level
 * - Empty labels produce no trailing space (e.g., `[start]` not `[start] `)
 * - Branch nodes map labels: "Yes" → `[yes]`, "No" → `[no]`
 * 
 * @param nodes - Array of root-level OutlineNode objects
 * @returns String representation in .logic bracket syntax
 */
export function serialize(nodes: OutlineNode[]): string {
  const lines: string[] = [];
  
  function serializeNode(node: OutlineNode, depth: number): void {
    // Skip comment nodes entirely
    if (node.isComment) {
      return;
    }
    
    const indent = '  '.repeat(depth);
    let line = indent;
    
    // Map node type to bracket syntax
    switch (node.type) {
      case 'start':
        line += '[start]';
        break;
      case 'end':
        line += '[end]';
        break;
      case 'process':
        line += '[process]';
        break;
      case 'decision':
        line += '[decision]';
        break;
      case 'branch':
        // Special handling for branch nodes: "Yes" → [yes], "No" → [no]
        if (node.label.toLowerCase() === 'yes') {
          line += '[yes]';
        } else if (node.label.toLowerCase() === 'no') {
          line += '[no]';
        } else {
          // Custom branch label
          line += '[yes]';
          if (node.label) {
            line += ' ' + node.label;
          }
        }
        // Skip appending label again for branch nodes
        lines.push(line);
        // Process children
        for (const child of node.children) {
          serializeNode(child, depth + 1);
        }
        return;
      case 'goto':
        line += '[goto]';
        break;
      case 'merge':
        line += '[merge]';
        break;
      case 'parallel':
        line += '[parallel]';
        break;
    }
    
    // Append label if non-empty
    if (node.label) {
      line += ' ' + node.label;
    }
    
    lines.push(line);
    
    // Process children
    for (const child of node.children) {
      serializeNode(child, depth + 1);
    }
  }
  
  // Process all root nodes
  for (const node of nodes) {
    serializeNode(node, 0);
  }
  
  return lines.join('\n');
}
