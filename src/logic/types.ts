import type { OutlineNode } from '../types';

export type SyntaxFamily = 'comment' | 'bracket' | 'keyword' | 'sigil' | 'inference' | 'default';

export interface ParsedLine {
  indent: number;
  syntaxFamily: SyntaxFamily;
  type: string;           // RAW string like "proc", "yes", "begin" — resolved later
  label: string;
  anchor?: string;
  isGoto: boolean;
  raw: string;
  lineNumber: number;
}

export interface ParseError {
  message: string;
  line: number;
  column?: number;
  source: string;
}

export interface ParseResult {
  nodes: OutlineNode[];   // Import from '../types'
  errors: ParseError[];
  warnings: string[];
}

export interface ParseOptions {
  strict?: boolean;       // Reserved for future configurability
}
