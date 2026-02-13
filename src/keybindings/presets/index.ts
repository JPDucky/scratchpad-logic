import type { Keymap } from '../types';
import { vimKeymap } from './vim';
import { standardKeymap } from './standard';

export const presets: Record<string, Keymap> = {
  vim: vimKeymap,
  standard: standardKeymap,
};

export function getPreset(id: string): Keymap | undefined {
  return presets[id];
}

export function listPresets(): Keymap[] {
  return Object.values(presets);
}

export { vimKeymap, standardKeymap };
