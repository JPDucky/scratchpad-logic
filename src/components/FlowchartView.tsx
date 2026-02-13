import { useMemo, useEffect, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import type { Node, Edge, NodeMouseHandler } from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import type { OutlineNode, NodeType } from '../types';
import { NODE_TYPE_CONFIG } from '../types';
import { useOutline } from '../store';
import { useMode, useKeybindings } from '../keybindings';
import { setNodePositions } from '../utils/spatialNavigation';
import { RadialMenu } from './RadialMenu';
import type { RadialMenuItem } from './RadialMenu';

const nodeWidth = 180;
const nodeHeight = 50;

function getLayoutedElements(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 70 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function getNodeStyle(type: NodeType, isSelected: boolean): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: nodeWidth,
    height: nodeHeight,
    color: 'white',
    border: isSelected ? '3px solid #a855f7' : 'none',
    boxShadow: isSelected 
      ? '0 0 20px rgba(168, 85, 247, 0.5), 0 4px 6px -1px rgba(0, 0, 0, 0.3)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  };

  switch (type) {
    case 'start':
      return { ...baseStyle, backgroundColor: '#22c55e', borderRadius: '25px' };
    case 'end':
      return { ...baseStyle, backgroundColor: '#ef4444', borderRadius: '25px' };
    case 'process':
      return { ...baseStyle, backgroundColor: '#3b82f6', borderRadius: '8px' };
    case 'decision':
      return {
        ...baseStyle,
        backgroundColor: '#f97316',
        borderRadius: '8px',
        width: 100,
        height: 50,
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      };
    case 'merge':
      return {
        ...baseStyle,
        backgroundColor: '#6b7280',
        borderRadius: '50%',
        width: 40,
        height: 40,
        padding: 0,
      };
    case 'parallel':
      return { ...baseStyle, backgroundColor: '#a855f7', borderRadius: '8px' };
    default:
      return baseStyle;
  }
}

interface GotoEdge {
  sourceParentId: string;
  targetId: string;
}

function convertOutlineToFlow(
  outline: OutlineNode[], 
  focusedId: string | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const gotoEdges: GotoEdge[] = [];

  function traverse(
    items: OutlineNode[], 
    parentId: string | null = null, 
    edgeLabel?: string,
    continuationId?: string
  ) {
    items.forEach((item) => {
      if (item.isComment) return;
      
      const isBranch = item.type === 'branch';
      const isGoto = item.type === 'goto';
      const isParallel = item.type === 'parallel';
      
      if (isBranch) {
        item.children.forEach((child) => {
          traverse([child], parentId, item.label || 'Branch', continuationId);
        });
        return;
      }
      
      if (isGoto) {
        if (item.targetId && parentId) {
          gotoEdges.push({ sourceParentId: parentId, targetId: item.targetId });
        }
        return;
      }
      
      if (isParallel) {
        const forkId = `fork-${item.id}`;
        const joinId = `join-${item.id}`;
        
        // Fork Node
        nodes.push({
          id: forkId,
          data: { label: '⸛' },
          position: { x: 0, y: 0 },
          style: { 
            width: nodeWidth, 
            height: 16, 
            backgroundColor: '#a855f7', 
            borderRadius: '4px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
          },
          type: 'default',
        });

        if (parentId) {
          edges.push({
            id: `${parentId}-${forkId}`,
            source: parentId,
            target: forkId,
            label: edgeLabel,
            style: { stroke: '#64748b', strokeWidth: 2 },
            labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 },
            labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
            labelBgPadding: [4, 4] as [number, number],
            labelBgBorderRadius: 4,
          });
        }
        
        // Join Node
        nodes.push({
          id: joinId,
          data: { label: '⸛' },
          position: { x: 0, y: 0 },
          style: { 
            width: nodeWidth, 
            height: 16, 
            backgroundColor: '#a855f7', 
            borderRadius: '4px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
          },
          type: 'default',
        });

        // Traverse children to connect Fork -> Child ... -> Join
        if (item.children.length > 0) {
          item.children.forEach((child) => {
            traverse([child], forkId, undefined, joinId);
          });
        } else {
          // Empty parallel, connect fork to join
          edges.push({
            id: `${forkId}-${joinId}`,
            source: forkId,
            target: joinId,
            style: { stroke: '#64748b', strokeWidth: 2 },
          });
        }
        
        // Connect Join to Continuation
        if (continuationId) {
          edges.push({
            id: `${joinId}-${continuationId}`,
            source: joinId,
            target: continuationId,
            style: { stroke: '#64748b', strokeWidth: 2 },
          });
        }
        return;
      }
      
      const isDecision = item.type === 'decision';
      const isSelected = item.id === focusedId;
      
      nodes.push({
        id: item.id,
        data: {
          label: isDecision ? (
            <div style={{ fontSize: '10px', lineHeight: 1.2, textAlign: 'center' }}>
              {item.label || NODE_TYPE_CONFIG[item.type].label}
            </div>
          ) : (
            item.label || NODE_TYPE_CONFIG[item.type].label
          ),
        },
        position: { x: 0, y: 0 },
        style: getNodeStyle(item.type, isSelected),
      });

      if (parentId) {
        edges.push({
          id: `${parentId}-${item.id}`,
          source: parentId,
          target: item.id,
          label: edgeLabel,
          style: { stroke: '#64748b', strokeWidth: 2 },
          labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 },
          labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
          labelBgPadding: [4, 4] as [number, number],
          labelBgBorderRadius: 4,
        });
      }

      if (item.children.length > 0) {
        item.children.forEach((child) => {
          traverse([child], item.id, undefined, continuationId);
        });
      } else if (continuationId) {
        edges.push({
          id: `${item.id}-${continuationId}`,
          source: item.id,
          target: continuationId,
          style: { stroke: '#64748b', strokeWidth: 2 },
        });
      }
    });
  }

  traverse(outline);
  
  const layouted = getLayoutedElements(nodes, edges);
  
  gotoEdges.forEach(({ sourceParentId, targetId }) => {
    const sourceExists = layouted.nodes.some(n => n.id === sourceParentId);
    const targetExists = layouted.nodes.some(n => n.id === targetId);
    
    if (sourceExists && targetExists) {
      layouted.edges.push({
        id: `goto-${sourceParentId}-${targetId}`,
        source: sourceParentId,
        target: targetId,
        type: 'default',
        animated: true,
        style: { 
          stroke: '#06b6d4', 
          strokeWidth: 2, 
          strokeDasharray: '5,5',
        },
        labelStyle: { fill: '#06b6d4', fontSize: 10, fontWeight: 500 },
        labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
        labelBgPadding: [2, 4] as [number, number],
        labelBgBorderRadius: 4,
        label: 'jump',
      });
    }
  });
  
  return layouted;
}

function FlowchartInner() {
  const { nodes: outlineNodes, findNodeById, updateNode, addSibling, addChild, deleteNode } = useOutline();
  const { fitView } = useReactFlow();
  const mode = useMode();
  const { appContext } = useKeybindings();
  
  const [radialMenu, setRadialMenu] = useState<{ 
    isOpen: boolean; 
    x: number; 
    y: number; 
    nodeId: string | null;
  }>({
    isOpen: false, x: 0, y: 0, nodeId: null,
  });
  
  const isVisualMode = mode.startsWith('visual');

  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () => convertOutlineToFlow(outlineNodes, appContext.focusedNodeId),
    [outlineNodes, appContext.focusedNodeId]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
    
    setNodePositions(flowNodes.map(node => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      width: nodeWidth,
      height: nodeHeight,
    })));
  }, [flowNodes, flowEdges, setNodes, setEdges, fitView]);

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (appContext.selectingGotoTarget) {
      appContext.confirmGotoTarget(node.id);
      return;
    }
    
    appContext.focusNode(node.id);
    if (!isVisualMode) {
      appContext.setMode('visual-normal');
    }
  }, [appContext, isVisualMode]);

  const handleNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setRadialMenu({ isOpen: true, x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const closeRadialMenu = useCallback(() => {
    setRadialMenu(s => ({ ...s, isOpen: false, nodeId: null }));
  }, []);

  const getRadialMenuItems = useCallback((): RadialMenuItem[] => {
    const nodeId = radialMenu.nodeId;
    if (!nodeId) return [];
    
    const node = findNodeById(nodeId);
    const isBranch = node?.type === 'branch';
    const isGoto = node?.type === 'goto';

    return [
      {
        id: 'add-sibling',
        label: 'Add Below',
        icon: '↓',
        color: '#3b82f6',
        action: () => {
          const newId = addSibling(nodeId);
          appContext.focusNode(newId);
          appContext.setMode('outline-insert');
        },
      },
      {
        id: 'add-child',
        label: 'Add Child',
        icon: '↘',
        color: '#22c55e',
        action: () => {
          const newId = addChild(nodeId);
          appContext.focusNode(newId);
          appContext.setMode('outline-insert');
        },
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: '✎',
        color: '#a855f7',
        disabled: isGoto,
        action: () => {
          appContext.focusNode(nodeId);
          appContext.setMode('outline-insert');
        },
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: '✕',
        color: '#ef4444',
        action: () => {
          deleteNode(nodeId);
        },
      },
      {
        id: 'type-process',
        label: 'Process',
        icon: '●',
        color: '#3b82f6',
        disabled: isBranch,
        action: () => updateNode(nodeId, { type: 'process' }),
      },
      {
        id: 'type-decision',
        label: 'Decision',
        icon: '◆',
        color: '#f97316',
        disabled: isBranch,
        action: () => updateNode(nodeId, { type: 'decision' }),
      },
      {
        id: 'type-goto',
        label: 'Jump',
        icon: '↩',
        color: '#06b6d4',
        disabled: isBranch,
        action: () => {
          updateNode(nodeId, { type: 'goto' });
          setTimeout(() => appContext.startGotoTargetSelection(nodeId), 50);
        },
      },
      {
        id: 'type-end',
        label: 'End',
        icon: '■',
        color: '#ef4444',
        disabled: isBranch,
        action: () => updateNode(nodeId, { type: 'end' }),
      },
    ];
  }, [radialMenu.nodeId, findNodeById, addSibling, addChild, deleteNode, updateNode, appContext]);

  const handleRadialMenuExecute = useCallback((index: number | null) => {
    const items = getRadialMenuItems();
    if (index !== null && items[index] && !items[index].disabled) {
      items[index].action();
    }
    closeRadialMenu();
  }, [getRadialMenuItems, closeRadialMenu]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        className="bg-slate-950"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
      </ReactFlow>
      
      {radialMenu.isOpen && (
        <RadialMenu
          items={getRadialMenuItems()}
          x={radialMenu.x}
          y={radialMenu.y}
          mode="menu"
          onClose={closeRadialMenu}
          onExecute={handleRadialMenuExecute}
          onSwitchToMenuMode={() => {}}
        />
      )}
    </>
  );
}

export function FlowchartView() {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <FlowchartInner />
      </ReactFlowProvider>
    </div>
  );
}
