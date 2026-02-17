import { describe, it, expect } from 'vitest';
import { ALIAS_TABLE, SIGIL_MAP, resolveAlias, isKnownAlias } from '../aliases';

describe('aliases', () => {
  describe('ALIAS_TABLE', () => {
    it('should have 32 aliases total', () => {
      const count = Object.keys(ALIAS_TABLE).length;
      expect(count).toBe(32);
    });

    it('should have all start aliases', () => {
      expect(ALIAS_TABLE.start).toEqual({ canonicalType: 'start' });
      expect(ALIAS_TABLE.begin).toEqual({ canonicalType: 'start' });
      expect(ALIAS_TABLE.s).toEqual({ canonicalType: 'start' });
    });

    it('should have all end aliases', () => {
      expect(ALIAS_TABLE.end).toEqual({ canonicalType: 'end' });
      expect(ALIAS_TABLE.done).toEqual({ canonicalType: 'end' });
      expect(ALIAS_TABLE.finish).toEqual({ canonicalType: 'end' });
      expect(ALIAS_TABLE.e).toEqual({ canonicalType: 'end' });
    });

    it('should have all process aliases', () => {
      expect(ALIAS_TABLE.process).toEqual({ canonicalType: 'process' });
      expect(ALIAS_TABLE.proc).toEqual({ canonicalType: 'process' });
      expect(ALIAS_TABLE.step).toEqual({ canonicalType: 'process' });
      expect(ALIAS_TABLE.do).toEqual({ canonicalType: 'process' });
      expect(ALIAS_TABLE.action).toEqual({ canonicalType: 'process' });
      expect(ALIAS_TABLE.p).toEqual({ canonicalType: 'process' });
    });

    it('should have all decision aliases', () => {
      expect(ALIAS_TABLE.decision).toEqual({ canonicalType: 'decision' });
      expect(ALIAS_TABLE.decide).toEqual({ canonicalType: 'decision' });
      expect(ALIAS_TABLE.check).toEqual({ canonicalType: 'decision' });
      expect(ALIAS_TABLE.if).toEqual({ canonicalType: 'decision' });
      expect(ALIAS_TABLE.d).toEqual({ canonicalType: 'decision' });
    });

    it('should have all goto aliases', () => {
      expect(ALIAS_TABLE.goto).toEqual({ canonicalType: 'goto' });
      expect(ALIAS_TABLE.jump).toEqual({ canonicalType: 'goto' });
      expect(ALIAS_TABLE.go).toEqual({ canonicalType: 'goto' });
    });

    it('should have all yes-branch aliases with correct label', () => {
      expect(ALIAS_TABLE.yes).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
      expect(ALIAS_TABLE.true).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
      expect(ALIAS_TABLE.then).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
    });

    it('should have all no-branch aliases with correct label', () => {
      expect(ALIAS_TABLE.no).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
      expect(ALIAS_TABLE.false).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
      expect(ALIAS_TABLE.else).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
    });

    it('should have all parallel aliases', () => {
      expect(ALIAS_TABLE.parallel).toEqual({ canonicalType: 'parallel' });
      expect(ALIAS_TABLE.par).toEqual({ canonicalType: 'parallel' });
      expect(ALIAS_TABLE.fork).toEqual({ canonicalType: 'parallel' });
    });

    it('should have all merge aliases', () => {
      expect(ALIAS_TABLE.merge).toEqual({ canonicalType: 'merge' });
      expect(ALIAS_TABLE.join).toEqual({ canonicalType: 'merge' });
    });
  });

  describe('SIGIL_MAP', () => {
    it('should have 7 sigils total', () => {
      const count = Object.keys(SIGIL_MAP).length;
      expect(count).toBe(7);
    });

    it('should map > to start', () => {
      expect(SIGIL_MAP['>']).toEqual({ canonicalType: 'start' });
    });

    it('should map . to end', () => {
      expect(SIGIL_MAP['.']).toEqual({ canonicalType: 'end' });
    });

    it('should map - to process', () => {
      expect(SIGIL_MAP['-']).toEqual({ canonicalType: 'process' });
    });

    it('should map ? to decision', () => {
      expect(SIGIL_MAP['?']).toEqual({ canonicalType: 'decision' });
    });

    it('should map + to branch with Yes label', () => {
      expect(SIGIL_MAP['+']).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
    });

    it('should map -> to goto', () => {
      expect(SIGIL_MAP['->']). toEqual({ canonicalType: 'goto' });
    });

    it('should map --- to branch with No label', () => {
      expect(SIGIL_MAP['---']).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
    });
  });

  describe('resolveAlias', () => {
    it('should resolve lowercase aliases', () => {
      expect(resolveAlias('process')).toEqual({ canonicalType: 'process' });
      expect(resolveAlias('start')).toEqual({ canonicalType: 'start' });
      expect(resolveAlias('decision')).toEqual({ canonicalType: 'decision' });
    });

    it('should resolve uppercase aliases (case-insensitive)', () => {
      expect(resolveAlias('PROCESS')).toEqual({ canonicalType: 'process' });
      expect(resolveAlias('START')).toEqual({ canonicalType: 'start' });
      expect(resolveAlias('DECISION')).toEqual({ canonicalType: 'decision' });
    });

    it('should resolve mixed-case aliases (case-insensitive)', () => {
      expect(resolveAlias('Process')).toEqual({ canonicalType: 'process' });
      expect(resolveAlias('Start')).toEqual({ canonicalType: 'start' });
      expect(resolveAlias('Decision')).toEqual({ canonicalType: 'decision' });
    });

    it('should resolve yes/no aliases with correct branch labels', () => {
      expect(resolveAlias('yes')).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
      expect(resolveAlias('YES')).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
      expect(resolveAlias('no')).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
      expect(resolveAlias('NO')).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
    });

    it('should resolve true/false aliases with correct branch labels', () => {
      expect(resolveAlias('true')).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
      expect(resolveAlias('TRUE')).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
      expect(resolveAlias('false')).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
      expect(resolveAlias('FALSE')).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
    });

    it('should resolve then/else aliases with correct branch labels', () => {
      expect(resolveAlias('then')).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
      expect(resolveAlias('THEN')).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
      expect(resolveAlias('else')).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
      expect(resolveAlias('ELSE')).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
    });

    it('should resolve sigils (case-sensitive)', () => {
      expect(resolveAlias('>')).toEqual({ canonicalType: 'start' });
      expect(resolveAlias('.')).toEqual({ canonicalType: 'end' });
      expect(resolveAlias('-')).toEqual({ canonicalType: 'process' });
      expect(resolveAlias('?')).toEqual({ canonicalType: 'decision' });
      expect(resolveAlias('+')).toEqual({ canonicalType: 'branch', branchLabel: 'Yes' });
      expect(resolveAlias('->')).toEqual({ canonicalType: 'goto' });
      expect(resolveAlias('---')).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
    });

    it('should return null for unknown aliases', () => {
      expect(resolveAlias('unknown')).toBeNull();
      expect(resolveAlias('meeting')).toBeNull();
      expect(resolveAlias('blurb')).toBeNull();
      expect(resolveAlias('foo')).toBeNull();
      expect(resolveAlias('UNKNOWN')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(resolveAlias('')).toBeNull();
    });

    it('should return null for whitespace', () => {
      expect(resolveAlias(' ')).toBeNull();
      expect(resolveAlias('  ')).toBeNull();
    });
  });

  describe('isKnownAlias', () => {
    it('should return true for known aliases (lowercase)', () => {
      expect(isKnownAlias('process')).toBe(true);
      expect(isKnownAlias('start')).toBe(true);
      expect(isKnownAlias('decision')).toBe(true);
      expect(isKnownAlias('yes')).toBe(true);
      expect(isKnownAlias('no')).toBe(true);
    });

    it('should return true for known aliases (uppercase)', () => {
      expect(isKnownAlias('PROCESS')).toBe(true);
      expect(isKnownAlias('START')).toBe(true);
      expect(isKnownAlias('DECISION')).toBe(true);
      expect(isKnownAlias('YES')).toBe(true);
      expect(isKnownAlias('NO')).toBe(true);
    });

    it('should return true for known aliases (mixed case)', () => {
      expect(isKnownAlias('Process')).toBe(true);
      expect(isKnownAlias('Start')).toBe(true);
      expect(isKnownAlias('Decision')).toBe(true);
    });

    it('should return true for known sigils', () => {
      expect(isKnownAlias('>')).toBe(true);
      expect(isKnownAlias('.')).toBe(true);
      expect(isKnownAlias('-')).toBe(true);
      expect(isKnownAlias('?')).toBe(true);
      expect(isKnownAlias('+')).toBe(true);
      expect(isKnownAlias('->')).toBe(true);
      expect(isKnownAlias('---')).toBe(true);
    });

    it('should return false for unknown aliases', () => {
      expect(isKnownAlias('unknown')).toBe(false);
      expect(isKnownAlias('meeting')).toBe(false);
      expect(isKnownAlias('blurb')).toBe(false);
      expect(isKnownAlias('foo')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isKnownAlias('')).toBe(false);
    });

    it('should return false for whitespace', () => {
      expect(isKnownAlias(' ')).toBe(false);
      expect(isKnownAlias('  ')).toBe(false);
    });

    it('should return false for partial sigils', () => {
      expect(isKnownAlias('-')).toBe(true); // - is a valid sigil
      expect(isKnownAlias('--')).toBe(false); // -- is not a valid sigil
    });
  });

  describe('edge cases', () => {
    it('should handle all single-letter aliases', () => {
      expect(resolveAlias('s')).toEqual({ canonicalType: 'start' });
      expect(resolveAlias('e')).toEqual({ canonicalType: 'end' });
      expect(resolveAlias('p')).toEqual({ canonicalType: 'process' });
      expect(resolveAlias('d')).toEqual({ canonicalType: 'decision' });
    });

    it('should handle all single-letter aliases (uppercase)', () => {
      expect(resolveAlias('S')).toEqual({ canonicalType: 'start' });
      expect(resolveAlias('E')).toEqual({ canonicalType: 'end' });
      expect(resolveAlias('P')).toEqual({ canonicalType: 'process' });
      expect(resolveAlias('D')).toEqual({ canonicalType: 'decision' });
    });

    it('should handle "do" keyword (reserved word)', () => {
      expect(resolveAlias('do')).toEqual({ canonicalType: 'process' });
      expect(resolveAlias('DO')).toEqual({ canonicalType: 'process' });
      expect(resolveAlias('Do')).toEqual({ canonicalType: 'process' });
    });

    it('should handle "if" keyword (reserved word)', () => {
      expect(resolveAlias('if')).toEqual({ canonicalType: 'decision' });
      expect(resolveAlias('IF')).toEqual({ canonicalType: 'decision' });
      expect(resolveAlias('If')).toEqual({ canonicalType: 'decision' });
    });

    it('should distinguish between sigils and aliases', () => {
      // - is a sigil (process)
      expect(resolveAlias('-')).toEqual({ canonicalType: 'process' });
      // -> is a sigil (goto)
      expect(resolveAlias('->')).toEqual({ canonicalType: 'goto' });
      // --- is a sigil (branch/no)
      expect(resolveAlias('---')).toEqual({ canonicalType: 'branch', branchLabel: 'No' });
    });
  });
});
