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
  
  // 4. Resolve anchors BEFORE validateBranches (validateBranches inserts
  //    synthetic branch nodes that desync the parallel walk with parsedLines)
  const resolveResult = resolveAnchors(treeResult.nodes, parsedLines);
  
  // 5. Validate branches (auto-wrap decision children in Yes/No branches)
  const validatedNodes = validateBranches(resolveResult.nodes);
  
  // 6. Collect errors and warnings
  const errors = [
    ...preprocessResult.errors,
    ...treeResult.errors
  ];
  
  const warnings = resolveResult.unresolvedGotos.map(
    anchor => `Unresolved goto reference: @${anchor}`
  );
  
  return {
    nodes: validatedNodes,
    errors,
    warnings,
  };
}
