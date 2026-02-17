import { isKnownAlias, SIGIL_MAP } from './aliases';
import type { ParseError, ParsedLine, SyntaxFamily } from './types';

export interface PreprocessedLine {
  content: string;
  indent: number;
  lineNumber: number;
}

export interface PreprocessResult {
  lines: PreprocessedLine[];
  errors: ParseError[];
}

const ANCHOR_PATTERN = /^@([a-zA-Z0-9-]+)$/;

function buildTabError(lineNumber: number, column: number): ParseError {
  return {
    message: 'Found tab character where spaces expected. Use 2 spaces for indentation.',
    line: lineNumber,
    column,
    source: 'lexer',
  };
}

function buildIndentError(lineNumber: number, spaces: number): ParseError {
  const expected = spaces + 1;
  return {
    message: `Indentation must be a multiple of 2 spaces. Found ${spaces} spaces (expected 0 or ${expected}).`,
    line: lineNumber,
    column: 1,
    source: 'lexer',
  };
}

export function preprocessLines(text: string): PreprocessResult {
  const errors: ParseError[] = [];
  const lines: PreprocessedLine[] = [];
  const rawLines = text.split(/\r?\n/);

  for (let index = 0; index < rawLines.length; index += 1) {
    let line = rawLines[index];
    const lineNumber = index + 1;

    if (line.includes('\t')) {
      errors.push(buildTabError(lineNumber, line.indexOf('\t') + 1));
      continue;
    }

    if (line.trim().length === 0) {
      continue;
    }

    const indentMatch = line.match(/^ */);
    const spaceCount = indentMatch ? indentMatch[0].length : 0;
    if (spaceCount % 2 !== 0) {
      errors.push(buildIndentError(lineNumber, spaceCount));
      continue;
    }

    const indent = spaceCount / 2;
    let content = line.slice(spaceCount);
    content = content.replace(/\s+$/, '');

    let combined = content;
    let combinedLineNumber = lineNumber;

    while (combined.endsWith('\\')) {
      combined = combined.slice(0, -1).replace(/\s+$/, '');
      index += 1;
      if (index >= rawLines.length) {
        break;
      }
      const nextLine = rawLines[index];
      const nextLineNumber = index + 1;

      if (nextLine.includes('\t')) {
        errors.push(buildTabError(nextLineNumber, nextLine.indexOf('\t') + 1));
      } else {
        const nextIndentMatch = nextLine.match(/^ */);
        const nextSpaces = nextIndentMatch ? nextIndentMatch[0].length : 0;
        if (nextSpaces % 2 !== 0) {
          errors.push(buildIndentError(nextLineNumber, nextSpaces));
        }
      }

      const nextTrimmed = nextLine.trim();
      combined = combined.length > 0 ? `${combined} ${nextTrimmed}` : nextTrimmed;
    }

    lines.push({
      content: combined.trim(),
      indent,
      lineNumber: combinedLineNumber,
    });
  }

  return { lines, errors };
}

export function detectFamily(content: string): SyntaxFamily {
  const trimmed = content.trim();

  if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
    return 'comment';
  }

  if (trimmed.startsWith('[')) {
    return 'bracket';
  }

  const keywordMatch = trimmed.match(/^([A-Za-z0-9-]+)(\s+@[A-Za-z0-9-]+)?:(\s|$)/);
  if (keywordMatch) {
    const keyword = keywordMatch[1];
    if (isKnownAlias(keyword)) {
      return 'keyword';
    }
  }

  if (trimmed.startsWith('->') || trimmed.startsWith('---')) {
    return 'sigil';
  }

  if (trimmed.startsWith('>') || trimmed.startsWith('.') || trimmed.startsWith('?') || trimmed.startsWith('+') || trimmed.startsWith('-')) {
    return 'sigil';
  }

  if (trimmed.endsWith('?')) {
    return 'inference';
  }

  return 'default';
}

function parseAnchorToken(token: string | undefined): string | undefined {
  if (!token) {
    return undefined;
  }
  const match = token.match(ANCHOR_PATTERN);
  return match ? match[1] : undefined;
}

export function parseLine(
  content: string,
  family: SyntaxFamily,
): { type: string; label: string; anchor?: string; isGoto: boolean } {
  const trimmed = content.trim();

  if (family === 'comment') {
    return { type: 'comment', label: '', anchor: undefined, isGoto: false };
  }

  if (family === 'bracket') {
    const closingIndex = trimmed.indexOf(']');
    if (!trimmed.startsWith('[') || closingIndex === -1) {
      return { type: '', label: '', anchor: undefined, isGoto: false };
    }
    const inside = trimmed.slice(1, closingIndex).trim();
    const after = trimmed.slice(closingIndex + 1).trim();
    const tokens = inside.length ? inside.split(/\s+/) : [];
    const type = tokens[0] ? tokens[0].toLowerCase() : '';
    const anchorToken = tokens.find((token) => token.startsWith('@'));
    const anchor = parseAnchorToken(anchorToken);
    return { type, label: after, anchor, isGoto: false };
  }

  if (family === 'keyword') {
    const colonIndex = trimmed.indexOf(':');
    const left = colonIndex === -1 ? trimmed : trimmed.slice(0, colonIndex);
    const right = colonIndex === -1 ? '' : trimmed.slice(colonIndex + 1);
    const leftTokens = left.trim().split(/\s+/).filter(Boolean);
    const type = leftTokens[0] ? leftTokens[0].toLowerCase() : '';
    const anchorToken = leftTokens.find((token) => token.startsWith('@'));
    const anchor = parseAnchorToken(anchorToken);
    const label = right.startsWith(' ') ? right.slice(1) : right;
    return { type, label: label.trim(), anchor, isGoto: false };
  }

  if (family === 'sigil') {
    let sigil = '';
    if (trimmed.startsWith('->')) {
      sigil = '->';
    } else if (trimmed.startsWith('---')) {
      sigil = '---';
    } else {
      sigil = trimmed.charAt(0);
    }
    const resolution = SIGIL_MAP[sigil];
    const type = resolution ? resolution.canonicalType : '';
    const isGoto = sigil === '->';
    const remainder = trimmed.slice(sigil.length).trim();
    if (!remainder) {
      return { type, label: '', anchor: undefined, isGoto };
    }
    const tokens = remainder.split(/\s+/);
    const possibleAnchor = parseAnchorToken(tokens[0]);
    if (possibleAnchor) {
      const label = tokens.slice(1).join(' ').trim();
      return { type, label, anchor: possibleAnchor, isGoto };
    }
    return { type, label: remainder, anchor: undefined, isGoto };
  }

  if (family === 'inference') {
    return { type: 'decision', label: trimmed, anchor: undefined, isGoto: false };
  }

  return { type: 'process', label: trimmed, anchor: undefined, isGoto: false };
}

export function lexLine(content: string): ParsedLine {
  const syntaxFamily = detectFamily(content);
  const parsed = parseLine(content, syntaxFamily);
  return {
    indent: 0,
    syntaxFamily,
    type: parsed.type,
    label: parsed.label,
    anchor: parsed.anchor,
    isGoto: parsed.isGoto,
    raw: content,
    lineNumber: 1,
  };
}
