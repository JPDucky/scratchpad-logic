export type Mode =
  | 'normal'
  | 'outline-normal'
  | 'outline-insert'
  | 'visual-normal'
  | 'visual-edit'
  | 'visual-move';

export interface AppContext {
  mode: Mode;
  focusedNodeId: string | null;
  selectedNodeIds: string[];
  clipboardNodeId: string | null;
  selectingGotoTarget: string | null;
  
  setMode: (mode: Mode) => void;
  focusNode: (id: string | null) => void;
  
  cursorUp: () => void;
  cursorDown: () => void;
  cursorLeft: () => void;
  cursorRight: () => void;
  
  deleteNode: (id: string) => void;
  yankNode: (id: string) => void;
  pasteNode: () => void;
  
  indentNode: (id: string) => void;
  outdentNode: (id: string) => void;
  moveNodeUp: (id: string) => void;
  moveNodeDown: (id: string) => void;
  
  enterTextEdit: () => void;
  exitTextEdit: () => void;
  
  enterMoveMode: () => void;
  confirmMove: () => void;
  cancelMove: () => void;
  
  changeNodeType: (id: string) => void;
  addNodeBelow: () => void;
  addNodeAbove: () => void;
  
  startGotoTargetSelection: (gotoNodeId: string) => void;
  cancelGotoTargetSelection: () => void;
  confirmGotoTarget: (targetId: string) => void;
}

export interface Action {
  id: string;
  execute: (ctx: AppContext) => void;
  description: string;
  category?: string;
}

export interface KeyBinding {
  key: string;
  action: string;
  mode: Mode | Mode[] | '*';
  when?: (ctx: AppContext) => boolean;
  description?: string;
}

export interface Keymap {
  id: string;
  name: string;
  description: string;
  bindings: KeyBinding[];
}

export interface KeyHandlerState {
  pendingKeys: string[];
  lastKeyTime: number;
  count: number;
}

export type KeySequence = string[];

export interface ParsedKey {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}
