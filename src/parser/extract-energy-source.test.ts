import { describe, it, expect } from 'vitest';
import { extractEnergySource } from './extract-energy-source.js';

describe('extractEnergySource', () => {
  it('defaults to electric when energy_source is missing', () => {
    const result = extractEnergySource({});
    expect(result).toEqual({ energy_type: 'electric' });
  });

  it('defaults to electric when energy_source is not an object', () => {
    expect(extractEnergySource({ energy_source: 'invalid' })).toEqual({ energy_type: 'electric' });
    expect(extractEnergySource({ energy_source: 42 })).toEqual({ energy_type: 'electric' });
    expect(extractEnergySource({ energy_source: null })).toEqual({ energy_type: 'electric' });
  });

  it('defaults to electric when energy_source is an array', () => {
    const result = extractEnergySource({ energy_source: ['foo'] });
    expect(result).toEqual({ energy_type: 'electric' });
  });

  it('returns electric for explicit electric type', () => {
    const result = extractEnergySource({ energy_source: { type: 'electric' } });
    expect(result).toEqual({ energy_type: 'electric' });
  });

  it('returns burner with fuel_categories', () => {
    const result = extractEnergySource({
      energy_source: { type: 'burner', fuel_categories: ['chemical', 'nuclear'] },
    });
    expect(result).toEqual({
      energy_type: 'burner',
      fuel_categories: ['chemical', 'nuclear'],
    });
  });

  it('returns burner with default chemical category when fuel_categories missing', () => {
    const result = extractEnergySource({
      energy_source: { type: 'burner' },
    });
    expect(result).toEqual({
      energy_type: 'burner',
      fuel_categories: ['chemical'],
    });
  });

  it('filters non-string entries from fuel_categories', () => {
    const result = extractEnergySource({
      energy_source: { type: 'burner', fuel_categories: ['chemical', 42, null] },
    });
    expect(result).toEqual({
      energy_type: 'burner',
      fuel_categories: ['chemical'],
    });
  });

  it('returns void for void type', () => {
    const result = extractEnergySource({ energy_source: { type: 'void' } });
    expect(result).toEqual({ energy_type: 'void' });
  });

  it('defaults to electric for unknown type', () => {
    const result = extractEnergySource({ energy_source: { type: 'heat' } });
    expect(result).toEqual({ energy_type: 'electric' });
  });
});
