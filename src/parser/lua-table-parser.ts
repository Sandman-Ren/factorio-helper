/**
 * Minimal recursive-descent parser for Lua table literals.
 * Designed to extract data from Factorio's `data:extend({...})` blocks.
 *
 * Handles: strings, numbers, booleans, nil, nested tables.
 * Gracefully skips: function calls, variable references, arithmetic, string concat.
 * Skipped values become `undefined` in the output and are omitted from results.
 */

export type LuaValue =
  | string
  | number
  | boolean
  | null
  | LuaValue[]
  | { [key: string]: LuaValue };

export class LuaTableParser {
  private src: string;
  private pos: number;

  constructor(src: string) {
    this.src = src;
    this.pos = 0;
  }

  /** Find and parse all `data:extend({...})` blocks in the source. */
  extractDataExtend(): LuaValue[][] {
    const results: LuaValue[][] = [];
    const pattern = 'data:extend';

    while (this.pos < this.src.length) {
      const idx = this.src.indexOf(pattern, this.pos);
      if (idx === -1) break;

      this.pos = idx + pattern.length;
      this.skipWS();

      if (this.peek() !== '(') continue;
      this.pos++; // skip (
      this.skipWS();

      if (this.peek() !== '{') {
        // Not a table literal, skip
        this.skipBalanced('(', ')');
        continue;
      }

      const table = this.parseTable();
      if (Array.isArray(table)) {
        results.push(table);
      }

      this.skipWS();
      if (this.peek() === ')') this.pos++;
    }

    return results;
  }

  /** Parse a single Lua table value from the current position. For standalone use. */
  parseValuePublic(): LuaValue {
    this.skipWS();
    return this.parseValue();
  }

  // ─── Core parsing ────────────────────────────────────────────

  private parseValue(): LuaValue {
    this.skipWS();
    if (this.pos >= this.src.length) return undefined as unknown as LuaValue;

    const c = this.peek();

    // String
    if (c === '"' || c === "'") {
      const s = this.parseString(c);
      if (this.isOperatorNext()) {
        this.skipExpressionRemainder();
        return undefined as unknown as LuaValue;
      }
      return s;
    }

    // Long string [[...]] or [=[...]=]
    if (c === '[' && this.isLongStringStart()) {
      const s = this.parseLongString();
      if (this.isOperatorNext()) {
        this.skipExpressionRemainder();
        return undefined as unknown as LuaValue;
      }
      return s;
    }

    // Table
    if (c === '{') {
      return this.parseTable();
    }

    // Number (including negative)
    if (this.isNumberStart()) {
      const n = this.parseNumber();
      if (n !== undefined && !this.isOperatorNext()) {
        return n;
      }
      // Expression like `2 * kg` — skip remainder
      this.skipExpressionRemainder();
      return undefined as unknown as LuaValue;
    }

    // Identifier (true, false, nil, or variable)
    if (this.isIdentStart(c)) {
      const ident = this.parseIdent();

      if (ident === 'true') return true;
      if (ident === 'false') return false;
      if (ident === 'nil') return null;

      // "not" operator
      if (ident === 'not') {
        this.skipExpressionFull();
        return undefined as unknown as LuaValue;
      }

      // Variable reference — skip rest of expression (dot access, calls, etc.)
      this.skipExpressionRemainder();
      return undefined as unknown as LuaValue;
    }

    // Unary minus on non-numeric
    if (c === '-') {
      this.skipExpressionFull();
      return undefined as unknown as LuaValue;
    }

    // Length operator #
    if (c === '#') {
      this.skipExpressionFull();
      return undefined as unknown as LuaValue;
    }

    // Unknown — skip
    this.skipExpressionFull();
    return undefined as unknown as LuaValue;
  }

  private parseTable(): LuaValue[] | { [key: string]: LuaValue } {
    this.pos++; // skip {
    this.skipWS();

    const named: Record<string, LuaValue> = {};
    const positional: LuaValue[] = [];
    let hasNamed = false;

    while (this.pos < this.src.length && this.peek() !== '}') {
      this.skipWS();
      if (this.peek() === '}') break;

      // Computed key: [expr] = value
      if (this.peek() === '[' && !this.isLongStringStart()) {
        this.pos++; // skip [
        this.skipUntilBalanced('[', ']');
        this.skipWS();
        if (this.peek() === '=') {
          this.pos++;
          this.parseValue(); // skip the value too
        }
        this.skipSeparator();
        continue;
      }

      // Check for named entry: identifier =
      const savedPos = this.pos;
      if (this.isIdentStart(this.peek())) {
        const ident = this.parseIdent();
        this.skipWS();
        if (this.peek() === '=' && this.src[this.pos + 1] !== '=') {
          // Named entry: key = value
          this.pos++; // skip =
          const value = this.parseValue();
          if (value !== undefined) {
            named[ident] = value;
          }
          hasNamed = true;
          this.skipSeparator();
          continue;
        }
        // Not a named entry — restore position and parse as positional
        this.pos = savedPos;
      }

      // Positional entry
      const value = this.parseValue();
      if (value !== undefined) {
        positional.push(value);
      }
      this.skipSeparator();
    }

    if (this.pos < this.src.length && this.peek() === '}') {
      this.pos++; // skip }
    }

    if (hasNamed) {
      // Merge positional entries with numeric keys
      for (let i = 0; i < positional.length; i++) {
        named[String(i + 1)] = positional[i]!;
      }
      return named;
    }

    return positional;
  }

  private parseString(quote: string): string {
    this.pos++; // skip opening quote
    let result = '';
    while (this.pos < this.src.length) {
      const c = this.src[this.pos]!;
      if (c === '\\') {
        this.pos++;
        const escaped = this.src[this.pos];
        switch (escaped) {
          case 'n': result += '\n'; break;
          case 't': result += '\t'; break;
          case 'r': result += '\r'; break;
          case '\\': result += '\\'; break;
          case "'": result += "'"; break;
          case '"': result += '"'; break;
          default: result += escaped ?? ''; break;
        }
        this.pos++;
      } else if (c === quote) {
        this.pos++; // skip closing quote
        return result;
      } else {
        result += c;
        this.pos++;
      }
    }
    return result;
  }

  private isLongStringStart(): boolean {
    if (this.src[this.pos] !== '[') return false;
    let i = this.pos + 1;
    while (i < this.src.length && this.src[i] === '=') i++;
    return this.src[i] === '[';
  }

  private parseLongString(): string {
    this.pos++; // skip first [
    let level = 0;
    while (this.pos < this.src.length && this.src[this.pos] === '=') {
      level++;
      this.pos++;
    }
    this.pos++; // skip second [

    const closing = ']' + '='.repeat(level) + ']';
    const endIdx = this.src.indexOf(closing, this.pos);
    if (endIdx === -1) {
      // Unterminated — consume rest
      const result = this.src.slice(this.pos);
      this.pos = this.src.length;
      return result;
    }
    const result = this.src.slice(this.pos, endIdx);
    this.pos = endIdx + closing.length;
    return result;
  }

  private isNumberStart(): boolean {
    const c = this.peek();
    if (c >= '0' && c <= '9') return true;
    if (c === '.') {
      const next = this.src[this.pos + 1];
      return next !== undefined && next >= '0' && next <= '9';
    }
    if (c === '-') {
      // Look ahead past minus and whitespace for a digit
      let i = this.pos + 1;
      while (i < this.src.length && (this.src[i] === ' ' || this.src[i] === '\t')) i++;
      const next = this.src[i];
      if (next === undefined) return false;
      if (next >= '0' && next <= '9') return true;
      if (next === '.' && this.src[i + 1] !== undefined && this.src[i + 1]! >= '0' && this.src[i + 1]! <= '9') return true;
    }
    return false;
  }

  private parseNumber(): number | undefined {
    const start = this.pos;

    if (this.peek() === '-') this.pos++;

    // Hex
    if (this.peek() === '0' && (this.src[this.pos + 1] === 'x' || this.src[this.pos + 1] === 'X')) {
      this.pos += 2;
      while (this.pos < this.src.length && /[0-9a-fA-F]/.test(this.src[this.pos]!)) this.pos++;
      return parseInt(this.src.slice(start, this.pos), undefined);
    }

    // Decimal
    while (this.pos < this.src.length && this.src[this.pos]! >= '0' && this.src[this.pos]! <= '9') this.pos++;
    if (this.pos < this.src.length && this.src[this.pos] === '.') {
      this.pos++;
      while (this.pos < this.src.length && this.src[this.pos]! >= '0' && this.src[this.pos]! <= '9') this.pos++;
    }
    // Exponent
    if (this.pos < this.src.length && (this.src[this.pos] === 'e' || this.src[this.pos] === 'E')) {
      this.pos++;
      if (this.pos < this.src.length && (this.src[this.pos] === '+' || this.src[this.pos] === '-')) this.pos++;
      while (this.pos < this.src.length && this.src[this.pos]! >= '0' && this.src[this.pos]! <= '9') this.pos++;
    }

    const str = this.src.slice(start, this.pos);
    const num = Number(str);
    return isNaN(num) ? undefined : num;
  }

  private parseIdent(): string {
    const start = this.pos;
    while (this.pos < this.src.length && this.isIdentChar(this.src[this.pos]!)) {
      this.pos++;
    }
    return this.src.slice(start, this.pos);
  }

  // ─── Expression skipping ────────────────────────────────────

  /** Check if next non-whitespace is a binary operator (meaning current value is part of a larger expression). */
  private isOperatorNext(): boolean {
    const saved = this.pos;
    this.skipWS();
    const c = this.peek();
    const isOp =
      c === '+' ||
      c === '*' ||
      c === '/' ||
      c === '%' ||
      c === '^' ||
      (c === '.' && this.src[this.pos + 1] === '.');
    this.pos = saved;
    return isOp;
  }

  /** Skip the remainder of an expression after the initial primary has been parsed.
   *  Handles: .field, :method(), (args), [index], operators */
  private skipExpressionRemainder(): void {
    while (this.pos < this.src.length) {
      this.skipWS();
      const c = this.peek();

      // Dot access: .field
      if (c === '.' && this.src[this.pos + 1] !== '.') {
        this.pos++;
        if (this.isIdentStart(this.peek())) {
          this.parseIdent();
        }
        continue;
      }

      // String concat or other binary op
      if (c === '.' && this.src[this.pos + 1] === '.') {
        this.pos += 2;
        this.skipExpressionFull();
        return;
      }

      // Method call: :method(args)
      if (c === ':') {
        this.pos++;
        if (this.isIdentStart(this.peek())) {
          this.parseIdent();
        }
        this.skipWS();
        if (this.peek() === '(') {
          this.skipBalanced('(', ')');
        }
        continue;
      }

      // Function call or string arg
      if (c === '(') {
        this.skipBalanced('(', ')');
        continue;
      }

      // Index access
      if (c === '[' && !this.isLongStringStart()) {
        this.skipBalanced('[', ']');
        continue;
      }

      // String argument (Lua allows `f"str"` or `f'str'`)
      if (c === '"' || c === "'") {
        this.parseString(c);
        continue;
      }

      // Long string argument
      if (c === '[' && this.isLongStringStart()) {
        this.parseLongString();
        continue;
      }

      // Table argument (Lua allows `f{table}`)
      if (c === '{') {
        this.skipBalanced('{', '}');
        continue;
      }

      // Binary operator — skip rest of expression
      if (c === '+' || c === '*' || c === '/' || c === '%' || c === '^') {
        this.pos++;
        this.skipExpressionFull();
        return;
      }

      // Comparison operators
      if ((c === '=' || c === '~' || c === '<' || c === '>') &&
          this.src[this.pos + 1] === '=') {
        this.pos += 2;
        this.skipExpressionFull();
        return;
      }
      if (c === '<' || c === '>') {
        this.pos++;
        this.skipExpressionFull();
        return;
      }

      // Keyword operators
      if (this.isIdentStart(c)) {
        const saved = this.pos;
        const word = this.parseIdent();
        if (word === 'and' || word === 'or') {
          this.skipExpressionFull();
          return;
        }
        this.pos = saved;
      }

      // Nothing more to consume
      break;
    }
  }

  /** Skip a full expression from the current position (primary + any continuations). */
  private skipExpressionFull(): void {
    this.skipWS();
    const c = this.peek();

    // Skip primary
    if (c === '"' || c === "'") {
      this.parseString(c);
    } else if (c === '[' && this.isLongStringStart()) {
      this.parseLongString();
    } else if (c === '{') {
      this.skipBalanced('{', '}');
    } else if (c === '(') {
      this.skipBalanced('(', ')');
    } else if (c === '-' && this.src[this.pos + 1] === '-') {
      this.skipComment();
      this.skipExpressionFull();
      return;
    } else if (c === '#' || c === '-' || (this.isIdentStart(c) && this.parseIdentPeek() === 'not')) {
      this.pos++;
      if (c !== '#' && c !== '-') {
        // 'not' keyword — already consumed 'n', consume rest
        this.pos--; // restore
        this.parseIdent(); // consume 'not'
      }
      this.skipExpressionFull();
      return;
    } else if (this.isIdentStart(c)) {
      this.parseIdent();
    } else if (this.isNumberStart()) {
      this.parseNumber();
    } else {
      // Unknown character, advance one to avoid infinite loop
      this.pos++;
      return;
    }

    // Skip continuations
    this.skipExpressionRemainder();
  }

  private parseIdentPeek(): string {
    const saved = this.pos;
    const ident = this.parseIdent();
    this.pos = saved;
    return ident;
  }

  // ─── Utilities ──────────────────────────────────────────────

  private peek(): string {
    return this.src[this.pos] ?? '\0';
  }

  private skipWS(): void {
    while (this.pos < this.src.length) {
      const c = this.src[this.pos]!;
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
        this.pos++;
        continue;
      }
      // Line comment
      if (c === '-' && this.src[this.pos + 1] === '-') {
        this.skipComment();
        continue;
      }
      break;
    }
  }

  private skipComment(): void {
    this.pos += 2; // skip --
    // Block comment --[[ ... ]]
    if (this.pos < this.src.length && this.src[this.pos] === '[') {
      const afterDash = this.pos;
      let level = 0;
      this.pos++; // skip [
      while (this.pos < this.src.length && this.src[this.pos] === '=') {
        level++;
        this.pos++;
      }
      if (this.pos < this.src.length && this.src[this.pos] === '[') {
        this.pos++; // skip second [
        const closing = ']' + '='.repeat(level) + ']';
        const endIdx = this.src.indexOf(closing, this.pos);
        if (endIdx !== -1) {
          this.pos = endIdx + closing.length;
        } else {
          this.pos = this.src.length;
        }
        return;
      }
      // Not a block comment, restore
      this.pos = afterDash;
    }
    // Line comment — skip to end of line
    while (this.pos < this.src.length && this.src[this.pos] !== '\n') {
      this.pos++;
    }
  }

  private skipSeparator(): void {
    this.skipWS();
    if (this.pos < this.src.length && (this.peek() === ',' || this.peek() === ';')) {
      this.pos++;
    }
  }

  private skipBalanced(open: string, close: string): void {
    if (this.peek() !== open) return;
    this.pos++; // skip open
    this.skipUntilBalanced(open, close);
  }

  private skipUntilBalanced(open: string, close: string): void {
    let depth = 1;
    while (this.pos < this.src.length && depth > 0) {
      const c = this.src[this.pos]!;
      if (c === '"' || c === "'") {
        this.parseString(c);
        continue;
      }
      if (c === '[' && this.isLongStringStart()) {
        this.parseLongString();
        continue;
      }
      if (c === '-' && this.src[this.pos + 1] === '-') {
        this.skipComment();
        continue;
      }
      if (c === open) depth++;
      if (c === close) depth--;
      this.pos++;
    }
  }

  private isIdentStart(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  private isIdentChar(c: string): boolean {
    return this.isIdentStart(c) || (c >= '0' && c <= '9');
  }
}

/**
 * Parse a Lua source file and extract all prototype entries from data:extend blocks.
 * Returns a flat array of all entries across all data:extend calls.
 */
export function parseLuaPrototypes(source: string): Record<string, LuaValue>[] {
  const parser = new LuaTableParser(source);
  const blocks = parser.extractDataExtend();
  const entries: Record<string, LuaValue>[] = [];

  for (const block of blocks) {
    for (const entry of block) {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        entries.push(entry as Record<string, LuaValue>);
      }
    }
  }

  return entries;
}
