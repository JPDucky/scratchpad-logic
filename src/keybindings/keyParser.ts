import type { ParsedKey } from './types';

export function parseKeyEvent(event: KeyboardEvent): ParsedKey {
  return {
    key: normalizeKey(event.key),
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  };
}

function normalizeKey(key: string): string {
  if (key === ' ') return 'Space';
  if (key === 'Escape') return 'Esc';
  if (key.length === 1) return key.toLowerCase();
  return key;
}

export function keyToString(parsed: ParsedKey): string {
  const parts: string[] = [];
  if (parsed.ctrl) parts.push('Ctrl');
  if (parsed.alt) parts.push('Alt');
  if (parsed.shift) parts.push('Shift');
  if (parsed.meta) parts.push('Meta');
  parts.push(parsed.key);
  return parts.join('+');
}

export function parseKeyString(keyString: string): ParsedKey {
  const parts = keyString.split('+');
  const key = parts.pop() ?? '';
  return {
    key: key.toLowerCase(),
    ctrl: parts.includes('Ctrl'),
    alt: parts.includes('Alt'),
    shift: parts.includes('Shift'),
    meta: parts.includes('Meta'),
  };
}

export function matchesKey(event: KeyboardEvent, keyString: string): boolean {
  const parsed = parseKeyEvent(event);
  const target = parseKeyString(keyString);
  
  return (
    parsed.key === target.key &&
    parsed.ctrl === target.ctrl &&
    parsed.alt === target.alt &&
    parsed.shift === target.shift &&
    parsed.meta === target.meta
  );
}

export function isModifierOnly(event: KeyboardEvent): boolean {
  return ['Control', 'Alt', 'Shift', 'Meta'].includes(event.key);
}

export function isPrintable(event: KeyboardEvent): boolean {
  return (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey
  );
}
