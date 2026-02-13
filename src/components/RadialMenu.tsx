import { useState, useEffect, useCallback, useRef } from 'react';

export interface RadialMenuItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  action: () => void;
  disabled?: boolean;
}

interface RadialMenuProps {
  items: RadialMenuItem[];
  x: number;
  y: number;
  mode: 'mark' | 'menu';
  onClose: () => void;
  onExecute: (index: number | null) => void;
  onSwitchToMenuMode: () => void;
}

const INNER_RADIUS = 30;
const OUTER_RADIUS = 90;
const DEAD_ZONE = 15;

function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: radius * Math.cos(rad),
    y: radius * Math.sin(rad),
  };
}

function cartesianToPolar(x: number, y: number): { angle: number; distance: number } {
  const distance = Math.sqrt(x * x + y * y);
  let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;
  return { angle, distance };
}

export function RadialMenu({ items, x, y, mode, onClose, onExecute, onSwitchToMenuMode }: RadialMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoveredIndexRef = useRef<number | null>(null);

  const sliceAngle = 360 / items.length;

  // Keep ref in sync for use in event handlers
  useEffect(() => {
    hoveredIndexRef.current = hoveredIndex;
  }, [hoveredIndex]);

  const getIndexFromPosition = useCallback((clientX: number, clientY: number): number | null => {
    const dx = clientX - x;
    const dy = clientY - y;
    const { angle, distance } = cartesianToPolar(dx, dy);

    if (distance < DEAD_ZONE) {
      return null;
    }

    return Math.floor(((angle + sliceAngle / 2) % 360) / sliceAngle);
  }, [x, y, sliceAngle]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    setMousePos({ x: dx, y: dy });

    const index = getIndexFromPosition(e.clientX, e.clientY);
    setHoveredIndex(index);
  }, [x, y, getIndexFromPosition]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (mode === 'mark') {
      e.preventDefault();
      if (hoveredIndexRef.current === null) {
        onSwitchToMenuMode();
      } else {
        onExecute(hoveredIndexRef.current);
      }
    }
  }, [mode, onExecute, onSwitchToMenuMode]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (mode === 'menu') {
      e.preventDefault();
      onExecute(hoveredIndexRef.current);
    }
  }, [mode, onExecute]);

  const handleContextMenu = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleClick);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleMouseUp, handleClick, handleContextMenu, handleKeyDown]);

  const createSlicePath = (index: number): string => {
    const startAngle = index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    
    const innerStart = polarToCartesian(startAngle, INNER_RADIUS);
    const innerEnd = polarToCartesian(endAngle, INNER_RADIUS);
    const outerStart = polarToCartesian(startAngle, OUTER_RADIUS);
    const outerEnd = polarToCartesian(endAngle, OUTER_RADIUS);
    
    const largeArc = sliceAngle > 180 ? 1 : 0;
    
    return `
      M ${innerStart.x} ${innerStart.y}
      L ${outerStart.x} ${outerStart.y}
      A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
      L ${innerEnd.x} ${innerEnd.y}
      A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
      Z
    `;
  };

  const getLabelPosition = (index: number): { x: number; y: number } => {
    const midAngle = index * sliceAngle + sliceAngle / 2;
    const labelRadius = (INNER_RADIUS + OUTER_RADIUS) / 2;
    return polarToCartesian(midAngle, labelRadius);
  };

  const size = OUTER_RADIUS * 2 + 40;
  
  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ 
        left: x - size / 2, 
        top: y - size / 2,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        className="pointer-events-auto"
      >
        {items.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const labelPos = getLabelPosition(index);
          
          return (
            <g key={item.id}>
              <path
                d={createSlicePath(index)}
                fill={isHovered ? item.color : '#1e293b'}
                stroke="#475569"
                strokeWidth={1}
                opacity={item.disabled ? 0.4 : 1}
                className="transition-colors duration-100"
              />
              <text
                x={labelPos.x}
                y={labelPos.y - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isHovered ? 'white' : '#94a3b8'}
                fontSize="16"
                className="pointer-events-none select-none"
              >
                {item.icon}
              </text>
              <text
                x={labelPos.x}
                y={labelPos.y + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isHovered ? 'white' : '#94a3b8'}
                fontSize="9"
                fontWeight={isHovered ? 600 : 400}
                className="pointer-events-none select-none"
              >
                {item.label}
              </text>
            </g>
          );
        })}
        
        {/* Center dead zone / cancel area */}
        <circle
          cx={0}
          cy={0}
          r={INNER_RADIUS - 2}
          fill="#0f172a"
          stroke="#475569"
          strokeWidth={1}
        />
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={hoveredIndex === null ? '#94a3b8' : '#475569'}
          fontSize="8"
          className="pointer-events-none select-none uppercase tracking-wider"
        >
          {hoveredIndex === null ? 'Cancel' : ''}
        </text>
        
        {/* Direction indicator */}
        <line
          x1={0}
          y1={0}
          x2={mousePos.x * 0.3}
          y2={mousePos.y * 0.3}
          stroke="#64748b"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.5}
        />
        <circle cx={0} cy={0} r={4} fill="#64748b" />

        {/* Mode indicator */}
        <text
          x={0}
          y={OUTER_RADIUS + 15}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#64748b"
          fontSize="8"
          className="pointer-events-none select-none"
        >
          {mode === 'mark' ? 'Release to select' : 'Click to select'}
        </text>
      </svg>
    </div>
  );
}



/**
 * Marking Menu State
 * 
 * Implements Kurtenbach & Buxton (1994) marking menu behavior:
 * - Press + wait (~333ms) → menu appears → drag to select → release executes (novice mode)
 * - Press + immediately move → NO menu shown → gesture direction → release executes (expert mode)
 * 
 * The key insight: expert mode is INVISIBLE. The menu never appears.
 */

interface RadialMenuState {
  isOpen: boolean;          // Whether the visual menu is displayed
  x: number;                // Menu center X (press position)
  y: number;                // Menu center Y (press position)
  nodeId: string | null;    // Node the menu was opened on
  mode: 'mark' | 'menu';    // 'mark' = release-to-select, 'menu' = click-to-select
}

interface PressState {
  isPressed: boolean;       // Is right mouse currently down?
  startX: number;           // Initial press X position
  startY: number;           // Initial press Y position
  startTime: number;        // When press started (for timing)
  nodeId: string | null;    // Node pressed on
  hasMoved: boolean;        // Has user moved beyond threshold? (triggers expert mode)
  expertModeActive: boolean; // In invisible expert/mark mode?
}

// Kurtenbach & Buxton recommend ~333ms (1/3 second)
const PRESS_AND_WAIT_DELAY = 333;
// Movement threshold to trigger expert mode (pixels)
const MOVEMENT_THRESHOLD = 10;

export function useRadialMenu(onExpertModeExecute?: (index: number | null) => void) {
  const [state, setState] = useState<RadialMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    nodeId: null,
    mode: 'menu',
  });
  
  const pressStateRef = useRef<PressState>({
    isPressed: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    nodeId: null,
    hasMoved: false,
    expertModeActive: false,
  });
  
  const onExpertModeExecuteRef = useRef(onExpertModeExecute);
  onExpertModeExecuteRef.current = onExpertModeExecute;
  
  const waitTimerRef = useRef<number | null>(null);
  const currentMouseRef = useRef({ x: 0, y: 0 });
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  const clearWaitTimer = useCallback(() => {
    if (waitTimerRef.current !== null) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  const removeGlobalMouseMove = useCallback(() => {
    if (mouseMoveHandlerRef.current) {
      window.removeEventListener('mousemove', mouseMoveHandlerRef.current);
      mouseMoveHandlerRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearWaitTimer();
    removeGlobalMouseMove();
    pressStateRef.current = {
      isPressed: false,
      startX: 0,
      startY: 0,
      startTime: 0,
      nodeId: null,
      hasMoved: false,
      expertModeActive: false,
    };
    setState(s => ({ ...s, isOpen: false, nodeId: null }));
  }, [clearWaitTimer, removeGlobalMouseMove]);

  const switchToMenuMode = useCallback(() => {
    setState(s => ({ ...s, mode: 'menu' }));
  }, []);

  const showMenuAfterWait = useCallback((x: number, y: number, nodeId: string) => {
    if (!pressStateRef.current.hasMoved && pressStateRef.current.isPressed) {
      setState({ isOpen: true, x, y, nodeId, mode: 'mark' });
    }
  }, []);

  const mouseUpHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  const removeGlobalMouseUp = useCallback(() => {
    if (mouseUpHandlerRef.current) {
      window.removeEventListener('mouseup', mouseUpHandlerRef.current);
      mouseUpHandlerRef.current = null;
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 2) return;
    
    e.preventDefault();
    
    const x = e.clientX;
    const y = e.clientY;
    
    pressStateRef.current = {
      isPressed: true,
      startX: x,
      startY: y,
      startTime: Date.now(),
      nodeId,
      hasMoved: false,
      expertModeActive: false,
    };
    
    currentMouseRef.current = { x, y };
    
    const handleMove = (moveEvent: MouseEvent) => {
      if (!pressStateRef.current.isPressed) return;
      
      currentMouseRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };
      
      if (!pressStateRef.current.hasMoved) {
        const dx = moveEvent.clientX - pressStateRef.current.startX;
        const dy = moveEvent.clientY - pressStateRef.current.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > MOVEMENT_THRESHOLD) {
          pressStateRef.current.hasMoved = true;
          pressStateRef.current.expertModeActive = true;
          clearWaitTimer();
        }
      }
    };
    
    const handleUp = (_upEvent: MouseEvent) => {
      const wasExpertMode = pressStateRef.current.expertModeActive && pressStateRef.current.hasMoved;
      
      removeGlobalMouseMove();
      removeGlobalMouseUp();
      clearWaitTimer();
      
      if (wasExpertMode && onExpertModeExecuteRef.current) {
        const dx = currentMouseRef.current.x - pressStateRef.current.startX;
        const dy = currentMouseRef.current.y - pressStateRef.current.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance >= MOVEMENT_THRESHOLD) {
          let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          if (angle < 0) angle += 360;
          const sliceAngle = 360 / 8;
          const index = Math.floor(((angle + sliceAngle / 2) % 360) / sliceAngle);
          onExpertModeExecuteRef.current(index);
        }
      }
      
      pressStateRef.current.isPressed = false;
      pressStateRef.current.expertModeActive = false;
      pressStateRef.current.hasMoved = false;
    };
    
    mouseMoveHandlerRef.current = handleMove;
    mouseUpHandlerRef.current = handleUp;
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    
    clearWaitTimer();
    waitTimerRef.current = window.setTimeout(() => {
      showMenuAfterWait(x, y, nodeId);
    }, PRESS_AND_WAIT_DELAY);
  }, [clearWaitTimer, showMenuAfterWait, removeGlobalMouseMove, removeGlobalMouseUp]);

  const handleMouseMove = useCallback((_e: React.MouseEvent) => {}, []);

  const handleMouseUp = useCallback((_e: React.MouseEvent) => {}, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Get direction-based selection for expert mode (invisible gesture)
  const getExpertModeDirection = useCallback((): number | null => {
    if (!pressStateRef.current.expertModeActive) return null;
    
    const dx = currentMouseRef.current.x - pressStateRef.current.startX;
    const dy = currentMouseRef.current.y - pressStateRef.current.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Must have moved enough to have a direction
    if (distance < MOVEMENT_THRESHOLD) return null;
    
    // Calculate angle and convert to slice index (8 slices)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    const sliceAngle = 360 / 8;
    return Math.floor(((angle + sliceAngle / 2) % 360) / sliceAngle);
  }, []);

  // Check if we're in expert mode (invisible gesture tracking)
  const isInExpertMode = useCallback((): boolean => {
    return pressStateRef.current.expertModeActive && pressStateRef.current.isPressed;
  }, []);

  const getPressOrigin = useCallback((): { x: number; y: number } | null => {
    if (!pressStateRef.current.isPressed && !pressStateRef.current.expertModeActive) {
      return null;
    }
    return { x: pressStateRef.current.startX, y: pressStateRef.current.startY };
  }, []);

  const getActiveNodeId = useCallback((): string | null => {
    return state.nodeId || pressStateRef.current.nodeId;
  }, [state.nodeId]);

  return {
    state,
    close,
    switchToMenuMode,
    getExpertModeDirection,
    isInExpertMode,
    getPressOrigin,
    getActiveNodeId,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onContextMenu: handleContextMenu,
    },
  };
}
