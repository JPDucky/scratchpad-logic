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
  const [activeIndex, setActiveIndex] = useState(() => {
    const index = types.findIndex(([type]) => type === currentType);
    return Math.max(index, 0);
  });
  
  if (isBranch) return null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setActiveIndex((index) => (index + 1) % types.length);
        return;
      }

      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setActiveIndex((index) => (index - 1 + types.length) % types.length);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        const [type] = types[activeIndex] ?? [];
        if (type) {
          onSelect(type);
          onClose();
        }
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
  }, [activeIndex, onClose, onSelect, types]);

  return (
    <div 
      ref={menuRef}
      className="absolute left-0 top-6 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 min-w-32"
    >
      {types.map(([type, config], index) => (
        <button
          key={type}
          onClick={() => {
            onSelect(type);
            onClose();
          }}
          className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 hover:bg-slate-700 ${
            index === activeIndex ? 'bg-slate-700' : ''
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
  jumpLabel?: string;
  onFocusNode: (id: string | null) => void;
  onSelectAsGotoTarget: (targetId: string) => void;
  onStartGotoSelection: (gotoNodeId: string) => void;
  findNodeById: (id: string) => OutlineNode | null;
  radialMenuHandlers: RadialMenuHandlers;
  appContext: ReturnType<typeof useKeybindings>['appContext'];
  typeMenuTargetId: string | null;
  onToggleTypeMenu: (nodeId: string) => void;
  onCloseTypeMenu: () => void;
}

function OutlineNodeItem({ 
  node, 
  depth, 
  mode, 
  focusedNodeId, 
  selectingGotoTarget,
  jumpLabel,
  onFocusNode,
  onSelectAsGotoTarget,
  onStartGotoSelection,
  findNodeById,
  radialMenuHandlers,
  appContext,
  typeMenuTargetId,
  onToggleTypeMenu,
  onCloseTypeMenu,
}: OutlineNodeItemProps) {
  const {
    updateNode,
    addSibling,
    deleteNode,
    getAdjacentNodeId,
    toggleComment,
    indentNode,
    outdentNode,
  } = useOutline();

  const inputRef = useRef<HTMLInputElement>(null);
  const [lastKeyPress, setLastKeyPress] = useState<{key: string, time: number} | null>(null);
  const config = NODE_TYPE_CONFIG[node.type];
  const isTypeMenuOpen = typeMenuTargetId === node.id;
  
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
    if ((e.key === 'j' || e.key === 'k') && lastKeyPress) {
      const now = Date.now();
      if (lastKeyPress.key === e.key && (now - lastKeyPress.time) < 300) {
        e.preventDefault();
        const input = e.currentTarget;
        const value = input.value;
        const newValue = value.slice(0, -1);
        updateNode(node.id, { label: newValue });
        appContext.setMode('outline-normal');
        setLastKeyPress(null);
        return;
      }
    }
    
    setLastKeyPress({ key: e.key, time: Date.now() });
    
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
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        outdentNode(node.id);
      } else {
        indentNode(node.id);
      }
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
    <div className={depth > 0 ? "ml-1 pl-1 border-l border-slate-700/50" : ""}>
      <div
        className={rowClasses}
        onClick={handleRowClick}
        onMouseDown={handleMouseDown}
        onMouseMove={radialMenuHandlers.onMouseMove}
        onMouseUp={radialMenuHandlers.onMouseUp}
        onContextMenu={handleContextMenu}
      >
        <div className="relative">
          {jumpLabel && (
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 min-w-[20px] h-5 bg-yellow-400 text-slate-900 text-xs font-bold rounded flex items-center justify-center px-1 shadow-sm z-10 border border-yellow-500">
              {jumpLabel}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isBranch) onToggleTypeMenu(node.id);
            }}
            className={`w-5 h-5 rounded ${config.color} flex items-center justify-center text-xs text-white ${isBranch ? 'opacity-60 cursor-not-allowed' : 'hover:ring-2 hover:ring-white/30'} transition-all`}
            title={isBranch ? 'Branch (locked to decision)' : `Type: ${config.label}`}
          >
            {config.icon}
          </button>
          {isTypeMenuOpen && !isBranch && (
            <NodeTypeSelector
              currentType={node.type}
              onSelect={(type) => updateNode(node.id, { type })}
              onClose={onCloseTypeMenu}
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
            onChange={(e) => {
              const value = e.target.value;
              updateNode(node.id, { label: value });
              if (value.startsWith('// ') && !node.isComment) {
                toggleComment(node.id);
              }
            }}
            onFocus={() => onFocusNode(node.id)}
            onKeyDown={handleKeyDown}
            placeholder="Enter text..."
            className={`flex-1 bg-transparent border-none outline-none ${node.isComment ? 'text-slate-500 italic opacity-70' : 'text-slate-200'} placeholder-slate-500 text-sm py-0.5`}
          />
        ) : (
          <span className={`flex-1 text-sm py-0.5 ${
            node.isComment 
              ? 'text-slate-500 italic opacity-70' 
              : node.label 
                ? 'text-slate-200' 
                : 'text-slate-500 italic'
          }`}>
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
          jumpLabel={jumpLabel}
          onFocusNode={onFocusNode}
          onSelectAsGotoTarget={onSelectAsGotoTarget}
          onStartGotoSelection={onStartGotoSelection}
          findNodeById={findNodeById}
          radialMenuHandlers={radialMenuHandlers}
          appContext={appContext}
          typeMenuTargetId={typeMenuTargetId}
          onToggleTypeMenu={onToggleTypeMenu}
          onCloseTypeMenu={onCloseTypeMenu}
        />
      ))}
    </div>
  );
}

export function OutlineEditor() {
  const { nodes, findNodeById, updateNode, addSibling, addChild, deleteNode, toggleComment, indentNode, outdentNode } = useOutline();
  const { mode, appContext } = useKeybindings();
  const [typeMenuTargetId, setTypeMenuTargetId] = useState<string | null>(null);
  const [exCommand, setExCommand] = useState<string>('');
  const [showExCommand, setShowExCommand] = useState<boolean>(false);
  const [jumpLabels, setJumpLabels] = useState<Record<string, string>>({});
  const appContextRef = useRef(appContext);
  const handleToggleTypeMenu = useCallback((nodeId: string) => {
    setTypeMenuTargetId((current) => (current === nodeId ? null : nodeId));
  }, []);
  const handleCloseTypeMenu = useCallback(() => {
    setTypeMenuTargetId(null);
  }, []);

  // Generate jump labels when selectingGotoTarget becomes active
  useEffect(() => {
    if (!appContext.selectingGotoTarget) {
      setJumpLabels({});
      return;
    }

    const labels: Record<string, string> = {};
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let charIndex = 0;

    const traverse = (nodeList: OutlineNode[], selectingId: string, isDescendantOfSelecting: boolean) => {
      for (const node of nodeList) {
        const isSelecting = node.id === selectingId;
        const isDescendant = isDescendantOfSelecting || isSelecting;

        if (!isSelecting && !isDescendantOfSelecting) {
          // Assign label
          if (charIndex < chars.length) {
            labels[node.id] = chars[charIndex];
            charIndex++;
          } else {
            // fallback for many nodes: use double letters aa, ab, ac...
            const first = chars[Math.floor((charIndex - chars.length) / chars.length)];
            const second = chars[(charIndex - chars.length) % chars.length];
            labels[node.id] = first + second;
            charIndex++;
          }
        }

        traverse(node.children, selectingId, isDescendant);
      }
    };

    traverse(nodes, appContext.selectingGotoTarget, false);
    setJumpLabels(labels);
  }, [appContext.selectingGotoTarget, nodes]);

  useEffect(() => {
    appContextRef.current = appContext;
  }, [appContext]);

  const jumpLabelsRef = useRef(jumpLabels);
  useEffect(() => {
    jumpLabelsRef.current = jumpLabels;
  }, [jumpLabels]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Ex-Command Input
      if (showExCommand) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setShowExCommand(false);
          setExCommand('');
        }
        // Let the input handle its own keys
        return;
      }
      
      // Handle Jump Label Selection
      if (appContextRef.current.selectingGotoTarget) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          appContextRef.current.cancelGotoTargetSelection();
          return;
        }

        // Check if key matches a jump label
        const targetId = Object.entries(jumpLabelsRef.current).find(([_, label]) => label === e.key)?.[0];
        if (targetId) {
          e.preventDefault();
          e.stopPropagation();
          appContextRef.current.confirmGotoTarget(targetId);
          return;
        }
      }

      // Only active in outline-normal mode
      if (mode !== 'outline-normal') return;

      if (typeMenuTargetId) {
        if (e.key === 'e') {
          e.preventDefault();
          e.stopPropagation();
          setTypeMenuTargetId(null);
        }
        return;
      }

      // Handle Tab/Shift+Tab for indent/outdent (prevent browser focus)
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        const focusedId = appContextRef.current.focusedNodeId;
        if (!focusedId) return;
        if (e.shiftKey) {
          outdentNode(focusedId);
        } else {
          indentNode(focusedId);
        }
        return;
      }

      // Handle / for toggle comment
      if (e.key === '/') {
        e.preventDefault();
        e.stopPropagation();
        const focusedId = appContextRef.current.focusedNodeId;
        if (focusedId) {
          toggleComment(focusedId);
        }
        return;
      }

      // Start Ex-Command
      if (!showExCommand && e.key === ':') {
        e.preventDefault();
        e.stopPropagation();
        setShowExCommand(true);
        return;
      }

      if (e.key === 'e') {
        e.preventDefault();
        e.stopPropagation();
        const focusedId = appContextRef.current.focusedNodeId;
        if (focusedId) {
          const focusedNode = findNodeById(focusedId);
          if (focusedNode?.type === 'branch') return;
          setTypeMenuTargetId((current) => (current === focusedId ? null : focusedId));
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [mode, showExCommand, toggleComment]);

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
    <div className="h-full flex flex-col bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 pb-2 z-10 bg-slate-900">
        <h2 className="text-slate-400 text-xs uppercase tracking-wider font-medium">Outline</h2>
        {appContext.selectingGotoTarget && (
          <div className="mt-2 p-2 bg-cyan-900/50 border border-cyan-500 rounded text-sm text-cyan-200 flex items-center justify-between">
            <span>Click a node to set as jump target</span>
            <button 
              onClick={() => appContext.cancelGotoTargetSelection()}
              className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-4 scrollbar-thin relative">
        <div className="space-y-0.5 pb-4">
          {nodes.map((node) => (
            <OutlineNodeItem 
              key={node.id} 
              node={node} 
              depth={0} 
              mode={mode}
              focusedNodeId={appContext.focusedNodeId}
              selectingGotoTarget={appContext.selectingGotoTarget}
              jumpLabel={jumpLabels[node.id]}
              onFocusNode={appContext.focusNode}
              onSelectAsGotoTarget={handleSelectAsGotoTarget}
              onStartGotoSelection={appContext.startGotoTargetSelection}
              findNodeById={findNodeById}
              radialMenuHandlers={radialMenu.handlers}
              appContext={appContext}
              typeMenuTargetId={typeMenuTargetId}
              onToggleTypeMenu={handleToggleTypeMenu}
              onCloseTypeMenu={handleCloseTypeMenu}
            />
          ))}
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="flex-shrink-0 p-4 py-2 border-t border-slate-700 bg-slate-900 z-20 relative">
        <div className="flex justify-between items-center h-8">
          <p className="text-slate-500 text-xs">
            <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">i</kbd> edit •{' '}
            <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">j/k</kbd> navigate •{' '}
            <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">Tab</kbd> indent •{' '}
            <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">e</kbd> type •{' '}
            <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">/</kbd> comment
          </p>
          {typeMenuTargetId && (
            <div className="px-2 py-0.5 bg-cyan-900/50 border border-cyan-500/50 rounded text-cyan-400 text-xs font-mono font-bold animate-pulse">
              -- TYPE --
            </div>
          )}
        </div>

        {/* Ex-Command Overlay inside Footer area */}
        {showExCommand && (
          <div className="absolute inset-0 bg-slate-900 border-t border-slate-700 p-2 z-50 flex items-center">
            <input
              type="text"
              value={exCommand}
              onChange={(e) => setExCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  if (exCommand === 'jump') {
                    const focusedId = appContextRef.current.focusedNodeId;
                    if (focusedId) {
                      appContext.startGotoTargetSelection(focusedId);
                    }
                  }
                  setShowExCommand(false);
                  setExCommand('');
                } else if (e.key === 'Escape') {
                  e.stopPropagation();
                  setShowExCommand(false);
                  setExCommand('');
                }
              }}
              autoFocus
              className="w-full bg-slate-800 text-slate-200 px-2 py-1 rounded text-sm font-mono border border-slate-600 focus:border-blue-500 outline-none"
              placeholder="Enter command..."
            />
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
