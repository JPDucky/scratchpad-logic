import { useMode, usePendingKeys } from '../keybindings';
import type { Mode } from '../keybindings';

const MODE_DISPLAY: Record<Mode, { label: string; color: string }> = {
  'normal': { label: 'NORMAL', color: 'bg-slate-600' },
  'outline-normal': { label: 'OUTLINE', color: 'bg-blue-600' },
  'outline-insert': { label: 'OUTLINE (INSERT)', color: 'bg-green-600' },
  'visual-normal': { label: 'VISUAL', color: 'bg-purple-600' },
  'visual-edit': { label: 'VISUAL (EDIT)', color: 'bg-green-600' },
  'visual-move': { label: 'VISUAL (MOVE)', color: 'bg-orange-600' },
};

export function ModeIndicator() {
  const mode = useMode();
  const pendingKeys = usePendingKeys();
  const { label, color } = MODE_DISPLAY[mode];
  
  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 z-50">
      {pendingKeys && (
        <div className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300 font-mono">
          {pendingKeys}
        </div>
      )}
      <div className={`px-3 py-1.5 ${color} rounded text-xs font-bold text-white tracking-wider`}>
        -- {label} --
      </div>
    </div>
  );
}
