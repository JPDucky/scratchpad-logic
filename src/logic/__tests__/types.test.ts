import { describe, it, expect } from 'vitest';
import type {
  SyntaxFamily,
  ParsedLine,
  ParseError,
  ParseResult,
  ParseOptions,
} from '../types';
import type { OutlineNode } from '../../types';

describe('Parser Types', () => {
  describe('SyntaxFamily', () => {
    it('should accept valid syntax family values', () => {
      const families: SyntaxFamily[] = [
        'comment',
        'bracket',
        'keyword',
        'sigil',
        'inference',
        'default',
      ];
      expect(families).toHaveLength(6);
    });
  });

  describe('ParsedLine', () => {
    it('should construct a ParsedLine with required fields', () => {
      const line: ParsedLine = {
        indent: 0,
        syntaxFamily: 'keyword',
        type: 'start',
        label: 'Begin Process',
        isGoto: false,
        raw: 'start: Begin Process',
        lineNumber: 1,
      };

      expect(line.indent).toBe(0);
      expect(line.syntaxFamily).toBe('keyword');
      expect(line.type).toBe('start');
      expect(line.label).toBe('Begin Process');
      expect(line.isGoto).toBe(false);
      expect(line.raw).toBe('start: Begin Process');
      expect(line.lineNumber).toBe(1);
    });

    it('should construct a ParsedLine with optional anchor field', () => {
      const line: ParsedLine = {
        indent: 1,
        syntaxFamily: 'sigil',
        type: 'goto',
        label: 'Jump to Step',
        anchor: 'step-5',
        isGoto: true,
        raw: 'goto: Jump to Step @step-5',
        lineNumber: 5,
      };

      expect(line.anchor).toBe('step-5');
      expect(line.isGoto).toBe(true);
    });
  });

  describe('ParseError', () => {
    it('should construct a ParseError with required fields', () => {
      const error: ParseError = {
        message: 'Invalid syntax',
        line: 3,
        source: 'parser',
      };

      expect(error.message).toBe('Invalid syntax');
      expect(error.line).toBe(3);
      expect(error.source).toBe('parser');
    });

    it('should construct a ParseError with optional column field', () => {
      const error: ParseError = {
        message: 'Unexpected token',
        line: 7,
        column: 15,
        source: 'lexer',
      };

      expect(error.column).toBe(15);
    });
  });

  describe('ParseResult', () => {
    it('should construct a ParseResult with nodes, errors, and warnings', () => {
      const node: OutlineNode = {
        id: 'node-1',
        type: 'start',
        label: 'Start',
        children: [],
      };

      const result: ParseResult = {
        nodes: [node],
        errors: [],
        warnings: [],
      };

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe('node-1');
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should construct a ParseResult with errors and warnings', () => {
      const error: ParseError = {
        message: 'Syntax error',
        line: 2,
        source: 'parser',
      };

      const result: ParseResult = {
        nodes: [],
        errors: [error],
        warnings: ['Unused label detected'],
      };

      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toBe('Unused label detected');
    });
  });

  describe('ParseOptions', () => {
    it('should construct ParseOptions with optional strict field', () => {
      const options: ParseOptions = {
        strict: true,
      };

      expect(options.strict).toBe(true);
    });

    it('should construct ParseOptions without strict field', () => {
      const options: ParseOptions = {};

      expect(options.strict).toBeUndefined();
    });
  });
});
