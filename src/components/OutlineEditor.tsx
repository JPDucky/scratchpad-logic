import { useRef, useEffect, useState, useCallback } from 'react';
import type { OutlineNode, NodeType } from '../types';
import { NODE_TYPE_CONFIG } from '../types';
import { useOutline } from '../store';
import { useKeybindings } from '../keybindings';
import { RadialMenu, useRadialMenu } from './RadialMenu';
import type { RadialMenuItem } from './RadialMenu';

function NodeTypeSelector({
  currentType,
  onSelect,
  onClose,
  isBranch,
}: {
  currentType: NodeType;
  onSelect: (type: NodeType) => void;
  onClose: () => void;
  isBranch: boolean;
}) {
  const allTypes = Object.entries(NODE_TYPE_CONFIG) as [NodeType, typeof NODE_TYPE_CONFIG[NodeType]][];
  const types = allTypes.filter(([type]) => type !== 'branch');
  const menuRef = useRef<HTMLDivElement>(null);
  
  if (isBranch) return null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className="absolute left-0 top-6 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 min-w-32"
    >
      {types.map(([type, config]) => (
        <button
          key={type}
          onClick={() => {
            onSelect(type);
            onClose();
          }}
          className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-slate-700 ${
            type === currentType ? 'bg-slate-700' : ''
          }`}
        >
          <span className={`w-4 h-4 rounded-sm ${config.color} flex items-center justify-center text-xs text-white`}>
            {config.icon}
          </span>
          <span className="text-slate-200">{config.label}</span>
        </button>
      ))}
    </div>
  );
}

interface RadialMenuHandlers {
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

interface OutlineNodeItemProps {
  node: OutlineNode;
  depth: number;
  mode: string;
  focusedNodeId: string | null;
  selectingGotoTarget: string | null;
  onFocusNode: (id: string | null) => void;
  onSelectAsGotoTarget: (targetId: string) => void;
  onStartGotoSelection: (gotoNodeId: string) => void;
  findNodeById: (id: string) => OutlineNode | null;
  radialMenuHandlers: RadialMenuHandlers;
}

function OutlineNodeItem({ 
  node, 
  depth, 
  mode, 
  focusedNodeId, 
  selectingGotoTarget,
  onFocusNode,
  onSelectAsGotoTarget,
  onStartGotoSelection,
  findNodeById,
  radialMenuHandlers,
}: OutlineNodeItemProps) {
  const {
    updateNode,
    addSibling,
    deleteNode,
    getAdjacentNodeId,
  } = useOutline();

  const inputRef = useRef<HTMLInputElement>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const config = NODE_TYPE_CONFIG[node.type];
  
  const isFocused = focusedNodeId === node.id;
  const isInsertMode = mode === 'outline-insert';
  const showCursor = isFocused && (mode === 'outline-normal' || mode.startsWith('visual'));
  const isBranch = node.type === 'branch';
  const isGoto = node.type === 'goto';
  const isSelectingTarget = selectingGotoTarget !== null;
  const isThisGotoSelecting = selectingGotoTarget === node.id;

  useEffect(() => {
    if (isFocused && isInsertMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused, isInsertMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newId = addSibling(node.id);
      setTimeout(() => onFocusNode(newId), 0);
    } else if (e.key === 'Backspace' && node.label === '') {
      e.preventDefault();
      const prevId = getAdjacentNodeId(node.id, 'up');
      deleteNode(node.id);
      if (prevId) setTimeout(() => onFocusNode(prevId), 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevId = getAdjacentNodeId(node.id, 'up');
      if (prevId) onFocusNode(prevId);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextId = getAdjacentNodeId(node.id, 'down');
      if (nextId) onFocusNode(nextId);
    }
  };

  const getGotoTargetLabel = (): string => {
    if (!isGoto) return '';
    if (!node.targetId) return '→ [Select target...]';
    const target = findNodeById(node.targetId);
    return target ? `→ ${target.label || NODE_TYPE_CONFIG[target.type].label}` : '→ [Invalid target]';
  };

  const handleRowClick = () => {
    if (isSelectingTarget && selectingGotoTarget !== node.id) {
      onSelectAsGotoTarget(node.id);
    } else {
      onFocusNode(node.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    radialMenuHandlers.onContextMenu(e);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    radialMenuHandlers.onMouseDown(e, node.id);
  };

  const rowClasses = [
    'flex items-center gap-2 py-1 group rounded-sm transition-colors',
    showCursor && 'bg-blue-500/20 ring-1 ring-blue-500/50',
    isSelectingTarget && selectingGotoTarget !== node.id && 'cursor-crosshair hover:bg-cyan-500/20 hover:ring-1 hover:ring-cyan-500/50',
    isThisGotoSelecting && 'bg-cyan-500/30 ring-1 ring-cyan-500',
  ].filter(Boolean).join(' ');

  return (
    <div>
      <div
        className={rowClasses}
        style={{ paddingLeft: `${depth * 24}px` }}
        onClick={handleRowClick}
        onMouseDown={handleMouseDown}
        onMouseMove={radialMenuHandlers.onMouseMove}
        onMouseUp={radialMenuHandlers.onMouseUp}
        onContextMenu={handleContextMenu}
      >
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isBranch) setShowTypeSelector(!showTypeSelector);
            }}
            className={`w-5 h-5 rounded ${config.color} flex items-center justify-center text-xs text-white ${isBranch ? 'opacity-60 cursor-not-allowed' : 'hover:ring-2 hover:ring-white/30'} transition-all`}
            title={isBranch ? 'Branch (locked to decision)' : `Type: ${config.label}`}
          >
            {config.icon}
          </button>
          {showTypeSelector && !isBranch && (
            <NodeTypeSelector
              currentType={node.type}
              onSelect={(type) => updateNode(node.id, { type })}
              onClose={() => setShowTypeSelector(false)}
              isBranch={isBranch}
            />
          )}
        </div>
        {isGoto ? (
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm py-0.5 text-cyan-400">{getGotoTargetLabel()}</span>
            {isFocused && !isThisGotoSelecting && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartGotoSelection(node.id);
                }}
                className="text-xs px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 rounded text-white"
              >
                {node.targetId ? 'Change' : 'Select'}
              </button>
            )}
            {isThisGotoSelecting && (
              <span className="text-xs text-cyan-300 animate-pulse">Click a target node...</span>
            )}
          </div>
        ) : isInsertMode && isFocused ? (
          <input
            ref={inputRef}
            type="text"
            value={node.label}
            onChange={(e) => updateNode(node.id, { label: e.target.value })}
            onFocus={() => onFocusNode(node.id)}
            onKeyDown={handleKeyDown}
            placeholder="Enter text..."
            className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 text-sm py-0.5"
          />
        ) : (
          <span className={`flex-1 text-sm py-0.5 ${node.label ? 'text-slate-200' : 'text-slate-500 italic'}`}>
            {node.label || 'Enter text...'}
          </span>
        )}
      </div>
      {node.children.map((child) => (
        <OutlineNodeItem 
          key={child.id} 
          node={child} 
          depth={depth + 1} 
          mode={mode}
          focusedNodeId={focusedNodeId}
          selectingGotoTarget={selectingGotoTarget}
          onFocusNode={onFocusNode}
          onSelectAsGotoTarget={onSelectAsGotoTarget}
          onStartGotoSelection={onStartGotoSelection}
          findNodeById={findNodeById}
          radialMenuHandlers={radialMenuHandlers}
        />
      ))}
    </div>
  );
}

export function OutlineEditor() {
  const { nodes, findNodeById, updateNode, addSibling, addChild, deleteNode } = useOutline();
  const { mode, appContext } = useKeybindings();
  const [commandPrefix, setCommandPrefix] = useState<'ctrl-x' | null>(null);
  const commandTimeoutRef = useRef<number | null>(null);
  const appContextRef = useRef(appContext);

  useEffect(() => {
    appContextRef.current = appContext;
  }, [appContext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only active in outline-normal mode
      if (mode !== 'outline-normal') return;

      // Check for Ctrl-X prefix activation
      if (!commandPrefix && e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        e.stopPropagation();
        setCommandPrefix('ctrl-x');
        
        // Clear existing timeout
        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        
        // Set new timeout to clear prefix after 3s
        commandTimeoutRef.current = window.setTimeout(() => {
          setCommandPrefix(null);
        }, 3000);
        return;
      }

      // Handle commands when prefix is active
      if (commandPrefix === 'ctrl-x') {
        e.preventDefault();
        e.stopPropagation();
        
        // Clear timeout
        if (commandTimeoutRef.current) {
          clearTimeout(commandTimeoutRef.current);
          commandTimeoutRef.current = null;
        }

        const focusedId = appContextRef.current.focusedNodeId;
        if (!focusedId) {
          setCommandPrefix(null);
          return;
        }

        switch (e.key) {
          case 'p':
            updateNode(focusedId, { type: 'process' });
            setCommandPrefix(null);
            break;
          case 'd':
            updateNode(focusedId, { type: 'decision' });
            setCommandPrefix(null);
            break;
          case 'e':
            updateNode(focusedId, { type: 'end' });
            setCommandPrefix(null);
            break;
          case 's':
            updateNode(focusedId, { type: 'start' });
            setCommandPrefix(null);
            break;
          case 'm':
            updateNode(focusedId, { type: 'merge' });
            setCommandPrefix(null);
            break;
          case 'g':
            updateNode(focusedId, { type: 'goto' });
            setCommandPrefix(null);
            break;
          case 'Escape':
            setCommandPrefix(null);
            break;
          default:
            setCommandPrefix(null);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
    };
  }, [mode, commandPrefix, updateNode]);
  
  const getRadialMenuItemsForNode = useCallback((nodeId: string | null): RadialMenuItem[] => {
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
  }, [findNodeById, addSibling, addChild, deleteNode, updateNode, appContext]);

  const radialMenuRef = useRef<ReturnType<typeof useRadialMenu> | null>(null);

  const handleExpertModeExecute = useCallback((index: number | null) => {
    const nodeId = radialMenuRef.current?.getActiveNodeId() ?? null;
    const items = getRadialMenuItemsForNode(nodeId);
    if (index !== null && items[index] && !items[index].disabled) {
      items[index].action();
    }
  }, [getRadialMenuItemsForNode]);

  const radialMenu = useRadialMenu(handleExpertModeExecute);
  radialMenuRef.current = radialMenu;

  const handleSelectAsGotoTarget = (targetId: string) => {
    appContext.confirmGotoTarget(targetId);
  };

  const handleRadialMenuExecute = useCallback((index: number | null) => {
    const nodeId = radialMenu.getActiveNodeId();
    const items = getRadialMenuItemsForNode(nodeId);
    if (index !== null && items[index] && !items[index].disabled) {
      items[index].action();
    }
    radialMenu.close();
  }, [radialMenu, getRadialMenuItemsForNode]);

  return (
    <div className="h-full overflow-auto scrollbar-thin p-4 bg-slate-900">
      <h2 className="text-slate-400 text-xs uppercase tracking-wider mb-4 font-medium">Outline</h2>
      {appContext.selectingGotoTarget && (
        <div className="mb-4 p-2 bg-cyan-900/50 border border-cyan-500 rounded text-sm text-cyan-200 flex items-center justify-between">
          <span>Click a node to set as jump target</span>
          <button 
            onClick={() => appContext.cancelGotoTargetSelection()}
            className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded"
          >
            Cancel
          </button>
        </div>
      )}
      <div className="space-y-0.5">
        {nodes.map((node) => (
          <OutlineNodeItem 
            key={node.id} 
            node={node} 
            depth={0} 
            mode={mode}
            focusedNodeId={appContext.focusedNodeId}
            selectingGotoTarget={appContext.selectingGotoTarget}
            onFocusNode={appContext.focusNode}
            onSelectAsGotoTarget={handleSelectAsGotoTarget}
            onStartGotoSelection={appContext.startGotoTargetSelection}
            findNodeById={findNodeById}
            radialMenuHandlers={radialMenu.handlers}
          />
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center h-8">
        <p className="text-slate-500 text-xs">
          <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">i</kbd> edit •{' '}
          <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">j/k</kbd> navigate •{' '}
          <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">Ctrl-X</kbd> type
        </p>
        {commandPrefix === 'ctrl-x' && (
          <div className="px-2 py-0.5 bg-cyan-900/50 border border-cyan-500/50 rounded text-cyan-400 text-xs font-mono font-bold animate-pulse">
            -- CTRL-X --
          </div>
        )}
      </div>
      
      {radialMenu.state.isOpen && (
        <RadialMenu
          items={getRadialMenuItemsForNode(radialMenu.state.nodeId)}
          x={radialMenu.state.x}
          y={radialMenu.state.y}
          mode={radialMenu.state.mode}
          onClose={radialMenu.close}
          onExecute={handleRadialMenuExecute}
          onSwitchToMenuMode={radialMenu.switchToMenuMode}
        />
      )}
    </div>
  );
}
