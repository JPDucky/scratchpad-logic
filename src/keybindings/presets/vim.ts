import type { Keymap } from '../types';

export const vimKeymap: Keymap = {
  id: 'vim',
  name: 'Vim',
  description: 'Vim-style modal keybindings',
  bindings: [
    // ============================================
    // NORMAL MODE (top-level)
    // ============================================
    { key: 'i', action: 'mode.outline', mode: 'normal', description: 'Enter outline mode' },
    { key: 'v', action: 'mode.visual', mode: 'normal', description: 'Enter visual (flowchart) mode' },
    
    // ============================================
    // OUTLINE-NORMAL MODE
    // ============================================
    { key: 'Esc', action: 'mode.normal', mode: 'outline-normal', description: 'Back to normal mode' },
    
    // Navigation
    { key: 'j', action: 'cursor.down', mode: 'outline-normal', description: 'Move down' },
    { key: 'k', action: 'cursor.up', mode: 'outline-normal', description: 'Move up' },
    { key: 'h', action: 'cursor.left', mode: 'outline-normal', description: 'Collapse / go to parent' },
    { key: 'l', action: 'cursor.right', mode: 'outline-normal', description: 'Expand / go to child' },
    
    // Editing
    { key: 'i', action: 'mode.outline.insert', mode: 'outline-normal', description: 'Enter insert mode' },
    { key: 'a', action: 'mode.outline.insert', mode: 'outline-normal', description: 'Append (enter insert)' },
    { key: 'o', action: 'node.addBelow', mode: 'outline-normal', description: 'Add node below' },
    { key: 'Shift+o', action: 'node.addAbove', mode: 'outline-normal', description: 'Add node above' },
    
    // Delete/yank/paste
    { key: 'd d', action: 'node.delete', mode: 'outline-normal', description: 'Delete node' },
    { key: 'y y', action: 'node.yank', mode: 'outline-normal', description: 'Yank node' },
    { key: 'p', action: 'node.paste', mode: 'outline-normal', description: 'Paste node' },
    
    // Hierarchy
    { key: '> >', action: 'node.indent', mode: 'outline-normal', description: 'Indent node' },
    { key: '< <', action: 'node.outdent', mode: 'outline-normal', description: 'Outdent node' },
    { key: 'Shift+j', action: 'node.moveDown', mode: 'outline-normal', description: 'Move node down' },
    { key: 'Shift+k', action: 'node.moveUp', mode: 'outline-normal', description: 'Move node up' },
    
    // ============================================
    // OUTLINE-INSERT MODE
    // ============================================
    { key: 'Esc', action: 'mode.outline', mode: 'outline-insert', description: 'Back to outline-normal' },
    
    // ============================================
    // VISUAL-NORMAL MODE (flowchart)
    // ============================================
    { key: 'Esc', action: 'mode.normal', mode: 'visual-normal', description: 'Back to normal mode' },
    
    // Navigation (visual/spatial)
    { key: 'j', action: 'cursor.down', mode: 'visual-normal', description: 'Move cursor down visually' },
    { key: 'k', action: 'cursor.up', mode: 'visual-normal', description: 'Move cursor up visually' },
    { key: 'h', action: 'cursor.left', mode: 'visual-normal', description: 'Move cursor left visually' },
    { key: 'l', action: 'cursor.right', mode: 'visual-normal', description: 'Move cursor right visually' },
    
    // Editing
    { key: 'i', action: 'mode.visual.edit', mode: 'visual-normal', description: 'Edit node text' },
    { key: 'm', action: 'mode.visual.move', mode: 'visual-normal', description: 'Enter move mode' },
    { key: 'Enter', action: 'node.addBelow', mode: 'visual-normal', description: 'Add node below' },
    { key: 'o', action: 'node.addBelow', mode: 'visual-normal', description: 'Add node below' },
    { key: 'Shift+o', action: 'node.addAbove', mode: 'visual-normal', description: 'Add node above' },
    
    // Delete/yank/paste
    { key: 'd d', action: 'node.delete', mode: 'visual-normal', description: 'Delete node' },
    { key: 'y y', action: 'node.yank', mode: 'visual-normal', description: 'Yank node' },
    { key: 'p', action: 'node.paste', mode: 'visual-normal', description: 'Paste node' },
    
    // ============================================
    // VISUAL-EDIT MODE (editing node text)
    // ============================================
    { key: 'Esc', action: 'edit.exit', mode: 'visual-edit', description: 'Exit text edit' },
    { key: 'Enter', action: 'edit.exit', mode: 'visual-edit', description: 'Confirm and exit' },
    // Shift+Enter for newline is handled specially (not an action)
    
    // ============================================
    // VISUAL-MOVE MODE (moving node)
    // ============================================
    { key: 'Esc', action: 'move.cancel', mode: 'visual-move', description: 'Cancel move' },
    { key: 'p', action: 'move.confirm', mode: 'visual-move', description: 'Place node here' },
    { key: 'Enter', action: 'move.confirm', mode: 'visual-move', description: 'Place node here' },
    
    // Navigation (move ghost)
    { key: 'j', action: 'cursor.down', mode: 'visual-move', description: 'Move ghost down' },
    { key: 'k', action: 'cursor.up', mode: 'visual-move', description: 'Move ghost up' },
    { key: 'h', action: 'cursor.left', mode: 'visual-move', description: 'Move ghost left' },
    { key: 'l', action: 'cursor.right', mode: 'visual-move', description: 'Move ghost right' },
  ],
};
