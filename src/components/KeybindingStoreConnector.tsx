import { useEffect, useRef } from 'react';
import { useOutline } from '../store';
import { useKeybindings, setStoreActionsRef } from '../keybindings';

export function KeybindingStoreConnector() {
  const {
    focusedId,
    setFocusedId,
    getAdjacentNodeId,
    getFirstNodeId,
    getLastNodeId,
    deleteNode,
    yankNode,
    pasteNodeAfter,
    indentNode,
    outdentNode,
    moveUp,
    moveDown,
    addSibling,
    setGotoTarget,
  } = useOutline();
  
  const { appContext, mode } = useKeybindings();
  const prevFocusedIdRef = useRef<string | null>(null);

  useEffect(() => {
    setStoreActionsRef({
      getAdjacentNodeId,
      getFirstNodeId,
      getLastNodeId,
      setFocusedId,
      deleteNode,
      yankNode,
      pasteNodeAfter,
      indentNode,
      outdentNode,
      moveUp,
      moveDown,
      addSibling,
      setGotoTarget,
    });
  }, [
    getAdjacentNodeId,
    getFirstNodeId,
    getLastNodeId,
    setFocusedId,
    deleteNode,
    yankNode,
    pasteNodeAfter,
    indentNode,
    outdentNode,
    moveUp,
    moveDown,
    addSibling,
    setGotoTarget,
  ]);

  useEffect(() => {
    if (focusedId !== prevFocusedIdRef.current) {
      prevFocusedIdRef.current = focusedId;
      if (focusedId !== appContext.focusedNodeId) {
        appContext.focusNode(focusedId);
      }
    }
  }, [focusedId, appContext]);

  useEffect(() => {
    if (!focusedId && mode !== 'normal') {
      const firstId = getFirstNodeId();
      if (firstId) {
        setFocusedId(firstId);
      }
    }
  }, [mode, focusedId, getFirstNodeId, setFocusedId]);

  return null;
}
