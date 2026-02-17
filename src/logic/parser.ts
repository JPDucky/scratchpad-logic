import { preprocessLines, lexLine } from './lexer';
import { buildTree, validateBranches } from './tree';
import { resolveAnchors } from './resolver';
import type { ParseResult } from './types';

export function parse(text: string): ParseResult {
  // 1. Preprocess: split text, validate indentation
  const preprocessResult = preprocessLines(text);
  
  // 2. Lex: parse each line
  // NOTE: lexLine(content) returns ParsedLine with default indent/lineNumber
  // You must update these fields from preprocessResult.lines
  const parsedLines = preprocessResult.lines.map(line => {
    const parsed = lexLine(line.content);
    return { ...parsed, indent: line.indent, lineNumber: line.lineNumber };
  });
  
  // 3. Build tree
  const treeResult = buildTree(parsedLines);
  
  // 4. Validate branches (already done in buildTree, but call again to be sure)
  const validatedNodes = validateBranches(treeResult.nodes);
  
  // 5. Resolve anchors
  const resolveResult = resolveAnchors(validatedNodes, parsedLines);
  
  // 6. Collect errors and warnings
  const errors = [
    ...preprocessResult.errors,
    ...treeResult.errors
  ];
  
  const warnings = resolveResult.unresolvedGotos.map(
    anchor => `Unresolved goto reference: @${anchor}`
  );
  
  return {
    nodes: resolveResult.nodes,
    errors,
    warnings,
  };
}
