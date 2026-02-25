import { describe, it, expect } from 'vitest';
import { LuaTableParser, parseLuaPrototypes } from './lua-table-parser.js';

describe('LuaTableParser', () => {
  it('parses simple record table', () => {
    const parser = new LuaTableParser('{name = "iron-plate", amount = 5}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({ name: 'iron-plate', amount: 5 });
  });

  it('parses simple array table', () => {
    const parser = new LuaTableParser('{"a", "b", "c"}');
    const result = parser.parseValuePublic();
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('parses nested tables', () => {
    const parser = new LuaTableParser('{type = "recipe", ingredients = {{type = "item", name = "iron-ore", amount = 1}}}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({
      type: 'recipe',
      ingredients: [{ type: 'item', name: 'iron-ore', amount: 1 }],
    });
  });

  it('parses booleans and nil', () => {
    const parser = new LuaTableParser('{a = true, b = false, c = nil}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({ a: true, b: false, c: null });
  });

  it('parses negative numbers', () => {
    const parser = new LuaTableParser('{x = -3, y = 0.5, z = -0.25}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({ x: -3, y: 0.5, z: -0.25 });
  });

  it('skips function calls gracefully', () => {
    const parser = new LuaTableParser('{name = "test", sound = sounds.foo(), value = 42}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({ name: 'test', value: 42 });
  });

  it('skips variable references', () => {
    const parser = new LuaTableParser('{name = "test", color = item_tints.yellowing_coal, amount = 10}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({ name: 'test', amount: 10 });
  });

  it('skips arithmetic expressions', () => {
    const parser = new LuaTableParser('{name = "test", weight = 2 * kg, amount = 5}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({ name: 'test', amount: 5 });
  });

  it('skips string concatenation', () => {
    const parser = new LuaTableParser('{name = "prefix-" .. number, type = "item"}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({ type: 'item' });
  });

  it('handles line comments', () => {
    const parser = new LuaTableParser(`{
      name = "test", -- this is a comment
      amount = 5 -- another comment
    }`);
    const result = parser.parseValuePublic();
    expect(result).toEqual({ name: 'test', amount: 5 });
  });

  it('handles block comments', () => {
    const parser = new LuaTableParser('{name = "test", --[[block comment]] amount = 5}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({ name: 'test', amount: 5 });
  });

  it('extracts data:extend blocks', () => {
    const source = `
      data:extend({
        {type = "item", name = "iron-plate", stack_size = 100},
        {type = "item", name = "copper-plate", stack_size = 100}
      })
    `;
    const parser = new LuaTableParser(source);
    const blocks = parser.extractDataExtend();
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toHaveLength(2);
    expect((blocks[0]![0] as Record<string, unknown>)['name']).toBe('iron-plate');
    expect((blocks[0]![1] as Record<string, unknown>)['name']).toBe('copper-plate');
  });

  it('handles multiple data:extend blocks', () => {
    const source = `
      data:extend({{type = "item", name = "a"}})
      data:extend({{type = "item", name = "b"}})
    `;
    const parser = new LuaTableParser(source);
    const blocks = parser.extractDataExtend();
    expect(blocks).toHaveLength(2);
  });

  it('skips complex nested function calls', () => {
    const parser = new LuaTableParser('{name = "test", box = util.by_pixel(0, 67 * 0.5), speed = 1.5}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({ name: 'test', speed: 1.5 });
  });

  it('extracts table from function-wrapped entry (funcname { ... })', () => {
    const parser = new LuaTableParser('{generate_foo {type = "bar", name = "baz"}, {type = "plain", name = "qux"}}');
    const result = parser.parseValuePublic();
    expect(result).toEqual([
      { type: 'bar', name: 'baz' },
      { type: 'plain', name: 'qux' },
    ]);
  });

  it('extracts data:extend block without parentheses', () => {
    const source = `
      data:extend
      {
        {type = "item", name = "iron-plate", stack_size = 100}
      }
    `;
    const parser = new LuaTableParser(source);
    const blocks = parser.extractDataExtend();
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toHaveLength(1);
    expect((blocks[0]![0] as Record<string, unknown>)['name']).toBe('iron-plate');
  });

  it('still skips dotted function calls with table args', () => {
    const parser = new LuaTableParser('{name = "test", sprite = util.draw_as_glow {x = 48}, speed = 1.5}');
    const result = parser.parseValuePublic();
    expect(result).toEqual({ name: 'test', speed: 1.5 });
  });
});

describe('parseLuaPrototypes', () => {
  it('extracts prototype entries as records', () => {
    const source = `
      data:extend({
        {
          type = "recipe",
          name = "iron-plate",
          category = "smelting",
          energy_required = 3.2,
          ingredients = {{type = "item", name = "iron-ore", amount = 1}},
          results = {{type = "item", name = "iron-plate", amount = 1}}
        }
      })
    `;
    const entries = parseLuaPrototypes(source);
    expect(entries).toHaveLength(1);
    expect(entries[0]!['name']).toBe('iron-plate');
    expect(entries[0]!['category']).toBe('smelting');
    expect(entries[0]!['energy_required']).toBe(3.2);
  });
});
