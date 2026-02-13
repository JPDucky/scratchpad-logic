import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Mode, AppContext, Keymap } from './types';
import { KeyHandler } from './keyHandler';
import { vimKeymap } from './presets';
import { navigateSpatially } from '../utils/spatialNavigation';

interface KeybindingContextValue {
  mode: Mode;
  pendingKeys: string;
  keymap: Keymap;
  setKeymap: (keymap: Keymap) => void;
  appContext: AppContext;
}

const KeybindingContext = createContext<KeybindingContextValue | null>(null);

export interface StoreActions {
  getAdjacentNodeId: (id: string, direction: 'up' | 'down') => string | null;
  getFirstNodeId: () => string | null;
  getLastNodeId: () => string | null;
  setFocusedId: (id: string | null) => void;
  deleteNode: (id: string) => void;
  yankNode: (id: string) => void;
  pasteNodeAfter: (afterId: string) => string | null;
  indentNode: (id: string) => void;
  outdentNode: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  addSibling: (afterId: string) => string;
  setGotoTarget: (gotoNodeId: string, targetId: string) => void;
}

let globalStoreActionsRef: StoreActions | null = null;

export function setStoreActionsRef(actions: StoreActions): void {
  globalStoreActionsRef = actions;
}

export function getStoreActionsRef(): StoreActions | null {
  return globalStoreActionsRef;
}

interface KeybindingProviderProps {
  children: ReactNode;
  initialKeymap?: Keymap;
}

export function KeybindingProvider({ 
  children, 
  initialKeymap = vimKeymap,
}: KeybindingProviderProps) {
  const [mode, setMode] = useState<Mode>('normal');
  const [keymap, setKeymap] = useState<Keymap>(initialKeymap);
  const [pendingKeys, setPendingKeys] = useState('');
  const [focusedNodeId, setFocusedNodeIdState] = useState<string | null>(null);
  const [clipboardNodeId, setClipboardNodeId] = useState<string | null>(null);
  const [selectingGotoTarget, setSelectingGotoTarget] = useState<string | null>(null);
  
  const keyHandlerRef = useRef<KeyHandler>(new KeyHandler(keymap.bindings));
  const focusedNodeIdRef = useRef(focusedNodeId);
  focusedNodeIdRef.current = focusedNodeId;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  
  useEffect(() => {
    keyHandlerRef.current.setBindings(keymap.bindings);
  }, [keymap]);

  const setFocusedNodeId = useCallback((id: string | null) => {
    setFocusedNodeIdState(id);
    focusedNodeIdRef.current = id;
    getStoreActionsRef()?.setFocusedId(id);
  }, []);
  
  const appContext: AppContext = {
    mode,
    focusedNodeId,
    selectedNodeIds: focusedNodeId ? [focusedNodeId] : [],
    clipboardNodeId,
    selectingGotoTarget,
    
    setMode: useCallback((newMode: Mode) => {
      setMode(newMode);
    }, []),
    
    focusNode: useCallback((id: string | null) => {
      setFocusedNodeId(id);
    }, [setFocusedNodeId]),
    
    cursorUp: useCallback(() => {
      const store = getStoreActionsRef();
      if (!store) return;
      const currentId = focusedNodeIdRef.current;
      const currentMode = modeRef.current;
      
      if (currentMode.startsWith('visual')) {
        const nextId = navigateSpatially(currentId, 'up');
        if (nextId) setFocusedNodeId(nextId);
      } else {
        if (currentId) {
          const prevId = store.getAdjacentNodeId(currentId, 'up');
          if (prevId) setFocusedNodeId(prevId);
        } else {
          const firstId = store.getFirstNodeId();
          if (firstId) setFocusedNodeId(firstId);
        }
      }
    }, [setFocusedNodeId]),
    
    cursorDown: useCallback(() => {
      const store = getStoreActionsRef();
      if (!store) return;
      const currentId = focusedNodeIdRef.current;
      const currentMode = modeRef.current;
      
      if (currentMode.startsWith('visual')) {
        const nextId = navigateSpatially(currentId, 'down');
        if (nextId) setFocusedNodeId(nextId);
      } else {
        if (currentId) {
          const nextId = store.getAdjacentNodeId(currentId, 'down');
          if (nextId) setFocusedNodeId(nextId);
        } else {
          const firstId = store.getFirstNodeId();
          if (firstId) setFocusedNodeId(firstId);
        }
      }
    }, [setFocusedNodeId]),
    
    cursorLeft: useCallback(() => {
      const currentId = focusedNodeIdRef.current;
      const currentMode = modeRef.current;
      
      if (currentMode.startsWith('visual')) {
        const nextId = navigateSpatially(currentId, 'left');
        if (nextId) setFocusedNodeId(nextId);
      }
    }, [setFocusedNodeId]),
    
    cursorRight: useCallback(() => {
      const currentId = focusedNodeIdRef.current;
      const currentMode = modeRef.current;
      
      if (currentMode.startsWith('visual')) {
        const nextId = navigateSpatially(currentId, 'right');
        if (nextId) setFocusedNodeId(nextId);
      }
    }, [setFocusedNodeId]),
    
    deleteNode: useCallback((id: string) => {
      const store = getStoreActionsRef();
      if (!store) return;
      const nextId = store.getAdjacentNodeId(id, 'down') || store.getAdjacentNodeId(id, 'up');
      store.deleteNode(id);
      if (nextId) setFocusedNodeId(nextId);
    }, [setFocusedNodeId]),
    
    yankNode: useCallback((id: string) => {
      const store = getStoreActionsRef();
      if (!store) return;
      setClipboardNodeId(id);
      store.yankNode(id);
    }, []),
    
    pasteNode: useCallback(() => {
      const store = getStoreActionsRef();
      const currentId = focusedNodeIdRef.current;
      if (!store || !currentId) return;
      const newId = store.pasteNodeAfter(currentId);
      if (newId) setFocusedNodeId(newId);
    }, [setFocusedNodeId]),
    
    indentNode: useCallback((id: string) => {
      getStoreActionsRef()?.indentNode(id);
    }, []),
    
    outdentNode: useCallback((id: string) => {
      getStoreActionsRef()?.outdentNode(id);
    }, []),
    
    moveNodeUp: useCallback((id: string) => {
      getStoreActionsRef()?.moveUp(id);
    }, []),
    
    moveNodeDown: useCallback((id: string) => {
      getStoreActionsRef()?.moveDown(id);
    }, []),
    
    enterTextEdit: useCallback(() => {}, []),
    
    exitTextEdit: useCallback(() => {}, []),
    
    enterMoveMode: useCallback(() => {}, []),
    
    confirmMove: useCallback(() => {}, []),
    
    cancelMove: useCallback(() => {}, []),
    
    changeNodeType: useCallback((_id: string) => {}, []),
    
    addNodeBelow: useCallback(() => {
      const store = getStoreActionsRef();
      const currentId = focusedNodeIdRef.current;
      if (!store || !currentId) return;
      const newId = store.addSibling(currentId);
      setFocusedNodeId(newId);
    }, [setFocusedNodeId]),
    
    addNodeAbove: useCallback(() => {}, []),
    
    startGotoTargetSelection: useCallback((gotoNodeId: string) => {
      setSelectingGotoTarget(gotoNodeId);
    }, []),
    
    cancelGotoTargetSelection: useCallback(() => {
      setSelectingGotoTarget(null);
    }, []),
    
    confirmGotoTarget: useCallback((targetId: string) => {
      const store = getStoreActionsRef();
      const gotoNodeId = selectingGotoTarget;
      if (!store || !gotoNodeId) return;
      store.setGotoTarget(gotoNodeId, targetId);
      setSelectingGotoTarget(null);
    }, [selectingGotoTarget]),
  };
  
  const appContextRef = useRef(appContext);
  appContextRef.current = appContext;
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;
      
      const currentMode = appContextRef.current.mode;
      
      if (isInputFocused && currentMode !== 'outline-insert' && currentMode !== 'visual-edit') {
        return;
      }
      
      if (currentMode === 'outline-insert' || currentMode === 'visual-edit') {
        if (event.key === 'Escape' || (event.key === 'c' && event.ctrlKey)) {
          event.preventDefault();
          keyHandlerRef.current.handleKeyDown(event, appContextRef.current);
          setPendingKeys(keyHandlerRef.current.getPendingSequence());
          return;
        }
        return;
      }
      
      const handled = keyHandlerRef.current.handleKeyDown(event, appContextRef.current);
      setPendingKeys(keyHandlerRef.current.getPendingSequence());
      
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <KeybindingContext.Provider
      value={{
        mode,
        pendingKeys,
        keymap,
        setKeymap,
        appContext,
      }}
    >
      {children}
    </KeybindingContext.Provider>
  );
}

export function useKeybindings(): KeybindingContextValue {
  const ctx = useContext(KeybindingContext);
  if (!ctx) throw new Error('useKeybindings must be used within KeybindingProvider');
  return ctx;
}

export function useMode(): Mode {
  return useKeybindings().mode;
}

export function usePendingKeys(): string {
  return useKeybindings().pendingKeys;
}
