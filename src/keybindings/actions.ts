import type { Action } from './types';

export const actions: Record<string, Action> = {
  'mode.normal': {
    id: 'mode.normal',
    execute: (ctx) => ctx.setMode('normal'),
    description: 'Return to normal mode',
    category: 'mode',
  },
  
  'mode.outline': {
    id: 'mode.outline',
    execute: (ctx) => ctx.setMode('outline-normal'),
    description: 'Enter outline mode',
    category: 'mode',
  },
  
  'mode.visual': {
    id: 'mode.visual',
    execute: (ctx) => ctx.setMode('visual-normal'),
    description: 'Enter visual (flowchart) mode',
    category: 'mode',
  },
  
  'mode.outline.insert': {
    id: 'mode.outline.insert',
    execute: (ctx) => ctx.setMode('outline-insert'),
    description: 'Enter insert mode in outline',
    category: 'mode',
  },
  
  'mode.visual.edit': {
    id: 'mode.visual.edit',
    execute: (ctx) => {
      ctx.enterTextEdit();
      ctx.setMode('visual-edit');
    },
    description: 'Edit selected node text',
    category: 'mode',
  },
  
  'mode.visual.move': {
    id: 'mode.visual.move',
    execute: (ctx) => {
      ctx.enterMoveMode();
      ctx.setMode('visual-move');
    },
    description: 'Enter move mode for selected node',
    category: 'mode',
  },
  
  'move.confirm': {
    id: 'move.confirm',
    execute: (ctx) => {
      ctx.confirmMove();
      ctx.setMode('visual-normal');
    },
    description: 'Confirm node placement',
    category: 'move',
  },
  
  'move.cancel': {
    id: 'move.cancel',
    execute: (ctx) => {
      ctx.cancelMove();
      ctx.setMode('visual-normal');
    },
    description: 'Cancel move operation',
    category: 'move',
  },
  
  'edit.exit': {
    id: 'edit.exit',
    execute: (ctx) => {
      ctx.exitTextEdit();
      ctx.setMode('visual-normal');
    },
    description: 'Exit text edit mode',
    category: 'edit',
  },
  
  'cursor.up': {
    id: 'cursor.up',
    execute: (ctx) => ctx.cursorUp(),
    description: 'Move cursor up',
    category: 'navigation',
  },
  
  'cursor.down': {
    id: 'cursor.down',
    execute: (ctx) => ctx.cursorDown(),
    description: 'Move cursor down',
    category: 'navigation',
  },
  
  'cursor.left': {
    id: 'cursor.left',
    execute: (ctx) => ctx.cursorLeft(),
    description: 'Move cursor left',
    category: 'navigation',
  },
  
  'cursor.right': {
    id: 'cursor.right',
    execute: (ctx) => ctx.cursorRight(),
    description: 'Move cursor right',
    category: 'navigation',
  },
  
  'node.delete': {
    id: 'node.delete',
    execute: (ctx) => {
      if (ctx.focusedNodeId) {
        ctx.deleteNode(ctx.focusedNodeId);
      }
    },
    description: 'Delete current node',
    category: 'edit',
  },
  
  'node.yank': {
    id: 'node.yank',
    execute: (ctx) => {
      if (ctx.focusedNodeId) {
        ctx.yankNode(ctx.focusedNodeId);
      }
    },
    description: 'Yank (copy) current node',
    category: 'edit',
  },
  
  'node.paste': {
    id: 'node.paste',
    execute: (ctx) => ctx.pasteNode(),
    description: 'Paste yanked node',
    category: 'edit',
  },
  
  'node.indent': {
    id: 'node.indent',
    execute: (ctx) => {
      if (ctx.focusedNodeId) {
        ctx.indentNode(ctx.focusedNodeId);
      }
    },
    description: 'Indent node (make child of previous sibling)',
    category: 'hierarchy',
  },
  
  'node.outdent': {
    id: 'node.outdent',
    execute: (ctx) => {
      if (ctx.focusedNodeId) {
        ctx.outdentNode(ctx.focusedNodeId);
      }
    },
    description: 'Outdent node (move to parent level)',
    category: 'hierarchy',
  },
  
  'node.moveUp': {
    id: 'node.moveUp',
    execute: (ctx) => {
      if (ctx.focusedNodeId) {
        ctx.moveNodeUp(ctx.focusedNodeId);
      }
    },
    description: 'Move node up among siblings',
    category: 'hierarchy',
  },
  
  'node.moveDown': {
    id: 'node.moveDown',
    execute: (ctx) => {
      if (ctx.focusedNodeId) {
        ctx.moveNodeDown(ctx.focusedNodeId);
      }
    },
    description: 'Move node down among siblings',
    category: 'hierarchy',
  },
  
  'node.addBelow': {
    id: 'node.addBelow',
    execute: (ctx) => ctx.addNodeBelow(),
    description: 'Add new node below current',
    category: 'edit',
  },
  
  'node.addAbove': {
    id: 'node.addAbove',
    execute: (ctx) => ctx.addNodeAbove(),
    description: 'Add new node above current',
    category: 'edit',
  },
  
  'node.changeType': {
    id: 'node.changeType',
    execute: (ctx) => {
      if (ctx.focusedNodeId) {
        ctx.changeNodeType(ctx.focusedNodeId);
      }
    },
    description: 'Change node type',
    category: 'edit',
  },
};

export function getAction(id: string): Action | undefined {
  return actions[id];
}

export function registerAction(action: Action): void {
  actions[action.id] = action;
}

export function listActions(): Action[] {
  return Object.values(actions);
}

export function listActionsByCategory(category: string): Action[] {
  return Object.values(actions).filter((a) => a.category === category);
}
