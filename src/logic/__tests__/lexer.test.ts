import { describe, it, expect } from 'vitest';
import { preprocessLines, detectFamily, parseLine, lexLine } from '../lexer';

describe('lexer', () => {
  describe('preprocessLines', () => {
    it('skips empty and whitespace-only lines', () => {
      const result = preprocessLines('\n  \nstart');
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]).toEqual({ content: 'start', indent: 0, lineNumber: 3 });
      expect(result.errors).toHaveLength(0);
    });

    it('counts indentation in 2-space units', () => {
      const result = preprocessLines('  start');
      expect(result.lines[0]).toEqual({ content: 'start', indent: 1, lineNumber: 1 });
    });

    it('returns error for tab characters', () => {
      const result = preprocessLines('\tstart');
      expect(result.lines).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('tab');
    });

    it('returns error for non-2-space indentation', () => {
      const result = preprocessLines('   start');
      expect(result.lines).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('2 spaces');
    });

    it('joins lines with backslash continuation', () => {
      const result = preprocessLines('start \\\n  middle');
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]).toEqual({ content: 'start middle', indent: 0, lineNumber: 1 });
    });

    it('joins multiple continuation lines', () => {
      const result = preprocessLines('start \\\n  middle \\\n    end');
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]).toEqual({ content: 'start middle end', indent: 0, lineNumber: 1 });
    });
  });

  describe('detectFamily', () => {
    it('detects comment lines with // or #', () => {
      expect(detectFamily('// comment')).toBe('comment');
      expect(detectFamily('# comment')).toBe('comment');
    });

    it('detects bracket lines', () => {
      expect(detectFamily('[start] label')).toBe('bracket');
    });

    it('detects keywords only when in alias table', () => {
      expect(detectFamily('start: label')).toBe('keyword');
      expect(detectFamily('process @form: label')).toBe('keyword');
      expect(detectFamily('meeting: topic')).toBe('default');
    });

    it('requires colon to be followed by space or end', () => {
      expect(detectFamily('start:label')).toBe('default');
      expect(detectFamily('start:')).toBe('keyword');
    });

    it('detects sigils with correct priority', () => {
      expect(detectFamily('-> target')).toBe('sigil');
      expect(detectFamily('---')).toBe('sigil');
      expect(detectFamily('- process')).toBe('sigil');
    });

    it('detects inference when line ends with ?', () => {
      expect(detectFamily('Is this valid?')).toBe('inference');
    });

    it('defaults when no other family matches', () => {
      expect(detectFamily('Do something')).toBe('default');
    });

    it('respects priority order (comment over bracket)', () => {
      expect(detectFamily('//# comment')).toBe('comment');
      expect(detectFamily('[start]?')).toBe('bracket');
    });
  });

  describe('parseLine', () => {
    it('parses bracket syntax with label', () => {
      expect(parseLine('[start] label', 'bracket')).toEqual({
        type: 'start',
        label: 'label',
        anchor: undefined,
        isGoto: false,
      });
    });

    it('parses bracket syntax with alias type', () => {
      expect(parseLine('[proc] label', 'bracket')).toEqual({
        type: 'proc',
        label: 'label',
        anchor: undefined,
        isGoto: false,
      });
    });

    it('parses bracket syntax with no label', () => {
      expect(parseLine('[yes]', 'bracket')).toEqual({
        type: 'yes',
        label: '',
        anchor: undefined,
        isGoto: false,
      });
    });

    it('parses bracket syntax with anchor', () => {
      expect(parseLine('[goto @target]', 'bracket')).toEqual({
        type: 'goto',
        label: '',
        anchor: 'target',
        isGoto: false,
      });
      expect(parseLine('[process @anchor] label', 'bracket')).toEqual({
        type: 'process',
        label: 'label',
        anchor: 'anchor',
        isGoto: false,
      });
    });

    it('parses bracket syntax with unknown type', () => {
      expect(parseLine('[unknown] label', 'bracket')).toEqual({
        type: 'unknown',
        label: 'label',
        anchor: undefined,
        isGoto: false,
      });
    });

    it('handles bracket syntax without closing bracket', () => {
      expect(parseLine('[', 'bracket')).toEqual({
        type: '',
        label: '',
        anchor: undefined,
        isGoto: false,
      });
    });

    it('parses keyword syntax with label', () => {
      expect(parseLine('start: label', 'keyword')).toEqual({
        type: 'start',
        label: 'label',
        anchor: undefined,
        isGoto: false,
      });
    });

    it('parses keyword syntax with anchor', () => {
      expect(parseLine('process @form: label', 'keyword')).toEqual({
        type: 'process',
        label: 'label',
        anchor: 'form',
        isGoto: false,
      });
    });

    it('parses keyword syntax with empty label', () => {
      expect(parseLine('yes:', 'keyword')).toEqual({
        type: 'yes',
        label: '',
        anchor: undefined,
        isGoto: false,
      });
    });

    it('parses sigil syntax for standard types', () => {
      expect(parseLine('> Start', 'sigil')).toEqual({
        type: 'start',
        label: 'Start',
        anchor: undefined,
        isGoto: false,
      });
      expect(parseLine('- Process', 'sigil')).toEqual({
        type: 'process',
        label: 'Process',
        anchor: undefined,
        isGoto: false,
      });
      expect(parseLine('? Question?', 'sigil')).toEqual({
        type: 'decision',
        label: 'Question?',
        anchor: undefined,
        isGoto: false,
      });
      expect(parseLine('+ ', 'sigil')).toEqual({
        type: 'branch',
        label: '',
        anchor: undefined,
        isGoto: false,
      });
    });

    it('parses sigil syntax for dash disambiguation', () => {
      expect(parseLine('---', 'sigil')).toEqual({
        type: 'branch',
        label: '',
        anchor: undefined,
        isGoto: false,
      });
      expect(parseLine('-> @target', 'sigil')).toEqual({
        type: 'goto',
        label: '',
        anchor: 'target',
        isGoto: true,
      });
      expect(parseLine('-> target', 'sigil')).toEqual({
        type: 'goto',
        label: 'target',
        anchor: undefined,
        isGoto: true,
      });
      expect(parseLine('-', 'sigil')).toEqual({
        type: 'process',
        label: '',
        anchor: undefined,
        isGoto: false,
      });
    });

    it('parses sigil syntax with anchor', () => {
      expect(parseLine('- @form label', 'sigil')).toEqual({
        type: 'process',
        label: 'label',
        anchor: 'form',
        isGoto: false,
      });
    });

    it('parses inference syntax to decision', () => {
      expect(parseLine('Is this valid?', 'inference')).toEqual({
        type: 'decision',
        label: 'Is this valid?',
        anchor: undefined,
        isGoto: false,
      });
    });

    it('parses default syntax to process', () => {
      expect(parseLine('Do something', 'default')).toEqual({
        type: 'process',
        label: 'Do something',
        anchor: undefined,
        isGoto: false,
      });
    });
  });

  describe('lexLine', () => {
    it('composes family detection and parsing', () => {
      const result = lexLine('start: Begin Process');
      expect(result.syntaxFamily).toBe('keyword');
      expect(result.type).toBe('start');
      expect(result.label).toBe('Begin Process');
      expect(result.isGoto).toBe(false);
      expect(result.raw).toBe('start: Begin Process');
    });
  });
});
