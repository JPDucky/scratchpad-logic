import { useState, useCallback, useRef, useEffect } from 'react';
import { OutlineEditor } from './OutlineEditor';
import { FlowchartView } from './FlowchartView';
import { Header } from './Header';
import { ModeIndicator } from './ModeIndicator';
import { useKeybindings } from '../keybindings';

const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 800;
const DEFAULT_PANEL_WIDTH = 400;

export function Layout() {
  const { mode, appContext } = useKeybindings();
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isOutlineFocused = mode.startsWith('outline');
  const isVisualFocused = mode.startsWith('visual');

  const handleOutlineClick = () => {
    if (!isOutlineFocused) {
      appContext.setMode('outline-normal');
    }
  };

  const handleVisualClick = () => {
    if (!isVisualFocused) {
      appContext.setMode('visual-normal');
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    const clampedWidth = Math.min(Math.max(newWidth, MIN_PANEL_WIDTH), MAX_PANEL_WIDTH);
    setPanelWidth(clampedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950">
      <Header />
      <div ref={containerRef} className="flex-1 flex min-h-0">
        <div 
          onClick={handleOutlineClick}
          style={{ width: panelWidth }}
          className={`flex-shrink-0 transition-colors cursor-pointer ${
            isOutlineFocused 
              ? 'ring-2 ring-inset ring-blue-500/30' 
              : ''
          }`}
        >
          <OutlineEditor />
        </div>
        <div
          onMouseDown={handleMouseDown}
          className={`w-1 flex-shrink-0 cursor-col-resize transition-colors ${
            isDragging 
              ? 'bg-blue-500' 
              : 'bg-slate-800 hover:bg-slate-600'
          }`}
        />
        <div 
          onClick={handleVisualClick}
          className={`flex-1 transition-colors cursor-pointer ${
            isVisualFocused 
              ? 'ring-2 ring-inset ring-purple-500/30' 
              : 'hover:bg-slate-900/50'
          }`}
        >
          <FlowchartView />
        </div>
      </div>
      <ModeIndicator />
    </div>
  );
}
