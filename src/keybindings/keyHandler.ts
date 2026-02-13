import type { Mode, KeyBinding, AppContext, KeyHandlerState } from './types';
import { getAction } from './actions';
import { parseKeyEvent, keyToString, isModifierOnly } from './keyParser';

const SEQUENCE_TIMEOUT = 1000;

export class KeyHandler {
  private bindings: KeyBinding[] = [];
  private state: KeyHandlerState = {
    pendingKeys: [],
    lastKeyTime: 0,
    count: 0,
  };
  
  constructor(bindings: KeyBinding[] = []) {
    this.bindings = bindings;
  }
  
  setBindings(bindings: KeyBinding[]): void {
    this.bindings = bindings;
  }
  
  addBinding(binding: KeyBinding): void {
    this.bindings.push(binding);
  }
  
  removeBinding(key: string, mode: Mode | Mode[] | '*'): void {
    this.bindings = this.bindings.filter(
      (b) => !(b.key === key && this.modeMatches(b.mode, mode as Mode))
    );
  }
  
  handleKeyDown(event: KeyboardEvent, ctx: AppContext): boolean {
    if (isModifierOnly(event)) {
      return false;
    }
    
    const now = Date.now();
    const parsed = parseKeyEvent(event);
    const keyStr = keyToString(parsed);
    
    if (now - this.state.lastKeyTime > SEQUENCE_TIMEOUT) {
      this.resetState();
    }
    
    if (this.isCountKey(parsed.key) && this.state.pendingKeys.length === 0) {
      this.state.count = this.state.count * 10 + parseInt(parsed.key, 10);
      this.state.lastKeyTime = now;
      return true;
    }
    
    this.state.pendingKeys.push(keyStr);
    this.state.lastKeyTime = now;
    
    const sequence = this.state.pendingKeys.join(' ');
    
    const exactMatch = this.findBinding(sequence, ctx.mode, ctx);
    if (exactMatch) {
      this.executeBinding(exactMatch, ctx);
      this.resetState();
      return true;
    }
    
    const partialMatch = this.hasPartialMatch(sequence, ctx.mode);
    if (partialMatch) {
      return true;
    }
    
    this.resetState();
    return false;
  }
  
  private findBinding(
    sequence: string, 
    mode: Mode, 
    ctx: AppContext
  ): KeyBinding | undefined {
    return this.bindings.find((binding) => {
      if (binding.key !== sequence) return false;
      if (!this.modeMatches(binding.mode, mode)) return false;
      if (binding.when && !binding.when(ctx)) return false;
      return true;
    });
  }
  
  private hasPartialMatch(sequence: string, mode: Mode): boolean {
    return this.bindings.some((binding) => {
      if (!this.modeMatches(binding.mode, mode)) return false;
      return binding.key.startsWith(sequence) && binding.key !== sequence;
    });
  }
  
  private modeMatches(bindingMode: Mode | Mode[] | '*', currentMode: Mode): boolean {
    if (bindingMode === '*') return true;
    if (Array.isArray(bindingMode)) {
      return bindingMode.includes(currentMode);
    }
    return bindingMode === currentMode;
  }
  
  private executeBinding(binding: KeyBinding, ctx: AppContext): void {
    const action = getAction(binding.action);
    if (!action) {
      console.warn(`Action not found: ${binding.action}`);
      return;
    }
    
    const count = this.state.count || 1;
    for (let i = 0; i < count; i++) {
      action.execute(ctx);
    }
  }
  
  private isCountKey(key: string): boolean {
    return /^[1-9]$/.test(key) || (key === '0' && this.state.count > 0);
  }
  
  private resetState(): void {
    this.state = {
      pendingKeys: [],
      lastKeyTime: 0,
      count: 0,
    };
  }
  
  getState(): KeyHandlerState {
    return { ...this.state };
  }
  
  getPendingSequence(): string {
    const countStr = this.state.count > 0 ? String(this.state.count) : '';
    return countStr + this.state.pendingKeys.join(' ');
  }
}

export function createKeyHandler(bindings: KeyBinding[] = []): KeyHandler {
  return new KeyHandler(bindings);
}
