import type { Keymap } from '../types';

export const standardKeymap: Keymap = {
  id: 'standard',
  name: 'Standard',
  description: 'Standard keybindings for non-vim users',
  bindings: [
    { key: 'Tab', action: 'mode.outline', mode: 'normal' },
    { key: 'Shift+Tab', action: 'mode.visual', mode: 'normal' },
    
    { key: 'Esc', action: 'mode.normal', mode: ['outline-normal', 'visual-normal'] },
    
    { key: 'ArrowDown', action: 'cursor.down', mode: ['outline-normal', 'visual-normal'] },
    { key: 'ArrowUp', action: 'cursor.up', mode: ['outline-normal', 'visual-normal'] },
    { key: 'ArrowLeft', action: 'cursor.left', mode: ['outline-normal', 'visual-normal'] },
    { key: 'ArrowRight', action: 'cursor.right', mode: ['outline-normal', 'visual-normal'] },
    
    { key: 'Enter', action: 'mode.outline.insert', mode: 'outline-normal' },
    { key: 'Enter', action: 'mode.visual.edit', mode: 'visual-normal' },
    { key: 'Esc', action: 'edit.exit', mode: ['outline-insert', 'visual-edit'] },
    
    { key: 'Delete', action: 'node.delete', mode: ['outline-normal', 'visual-normal'] },
    { key: 'Ctrl+c', action: 'node.yank', mode: ['outline-normal', 'visual-normal'] },
    { key: 'Ctrl+v', action: 'node.paste', mode: ['outline-normal', 'visual-normal'] },
    
    { key: 'Tab', action: 'node.indent', mode: 'outline-normal' },
    { key: 'Shift+Tab', action: 'node.outdent', mode: 'outline-normal' },
    
    { key: 'Ctrl+ArrowUp', action: 'node.moveUp', mode: 'outline-normal' },
    { key: 'Ctrl+ArrowDown', action: 'node.moveDown', mode: 'outline-normal' },
    
    { key: 'Ctrl+m', action: 'mode.visual.move', mode: 'visual-normal' },
    { key: 'Enter', action: 'move.confirm', mode: 'visual-move' },
    { key: 'Esc', action: 'move.cancel', mode: 'visual-move' },
  ],
};
