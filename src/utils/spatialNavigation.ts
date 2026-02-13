export interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

function getCenterX(node: NodePosition): number {
  return node.x + node.width / 2;
}

function getCenterY(node: NodePosition): number {
  return node.y + node.height / 2;
}

export function findNearestNode(
  currentId: string,
  direction: Direction,
  nodes: NodePosition[]
): string | null {
  const current = nodes.find(n => n.id === currentId);
  if (!current) return null;

  const currentCenterX = getCenterX(current);
  const currentCenterY = getCenterY(current);

  const candidates = nodes.filter(node => {
    if (node.id === currentId) return false;
    
    const nodeCenterX = getCenterX(node);
    const nodeCenterY = getCenterY(node);
    
    const dx = nodeCenterX - currentCenterX;
    const dy = nodeCenterY - currentCenterY;
    
    const threshold = 10;
    
    switch (direction) {
      case 'up':
        return dy < -threshold;
      case 'down':
        return dy > threshold;
      case 'left':
        return dx < -threshold;
      case 'right':
        return dx > threshold;
    }
  });

  if (candidates.length === 0) return null;

  let best: NodePosition | null = null;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    const candidateCenterX = getCenterX(candidate);
    const candidateCenterY = getCenterY(candidate);
    
    const dx = Math.abs(candidateCenterX - currentCenterX);
    const dy = Math.abs(candidateCenterY - currentCenterY);
    
    let score: number;
    
    if (direction === 'up' || direction === 'down') {
      score = dy + dx * 0.5;
    } else {
      score = dx + dy * 0.5;
    }
    
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best?.id ?? null;
}

let nodePositionsCache: NodePosition[] = [];

export function setNodePositions(positions: NodePosition[]): void {
  nodePositionsCache = positions;
}

export function getNodePositions(): NodePosition[] {
  return nodePositionsCache;
}

export function navigateSpatially(
  currentId: string | null,
  direction: Direction
): string | null {
  if (!currentId) {
    return nodePositionsCache[0]?.id ?? null;
  }
  return findNearestNode(currentId, direction, nodePositionsCache);
}
