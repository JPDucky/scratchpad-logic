export type NodeType = 'start' | 'end' | 'process' | 'decision' | 'merge' | 'branch' | 'goto';

export interface OutlineNode {
  id: string;
  type: NodeType;
  label: string;
  children: OutlineNode[];
  targetId?: string;
  isComment?: boolean;
}

export interface Document {
  id: string;
  name: string;
  nodes: OutlineNode[];
  createdAt: number;
  updatedAt: number;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export const NODE_TYPE_CONFIG: Record<NodeType, { label: string; color: string; icon: string }> = {
  start: { label: 'Start', color: 'bg-green-500', icon: '▶' },
  end: { label: 'End', color: 'bg-red-500', icon: '■' },
  process: { label: 'Process', color: 'bg-blue-500', icon: '●' },
  decision: { label: 'Decision', color: 'bg-orange-500', icon: '◆' },
  merge: { label: 'Merge', color: 'bg-gray-500', icon: '○' },
  branch: { label: 'Branch', color: 'bg-yellow-500', icon: '↳' },
  goto: { label: 'Go To', color: 'bg-cyan-500', icon: '↩' },
};
