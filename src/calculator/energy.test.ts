import { describe, it, expect } from 'vitest';
import { parseEnergyKilo, formatPower } from './energy.js';

describe('parseEnergyKilo', () => {
  it('parses watt units', () => {
    expect(parseEnergyKilo('500W')).toBe(0.5);
    expect(parseEnergyKilo('1000W')).toBe(1);
  });

  it('parses kilowatt units', () => {
    expect(parseEnergyKilo('375kW')).toBe(375);
    expect(parseEnergyKilo('90kW')).toBe(90);
    expect(parseEnergyKilo('0.5kW')).toBe(0.5);
  });

  it('parses megawatt units', () => {
    expect(parseEnergyKilo('2.5MW')).toBe(2500);
    expect(parseEnergyKilo('1MW')).toBe(1000);
  });

  it('parses gigawatt units', () => {
    expect(parseEnergyKilo('1.21GW')).toBe(1210000);
  });

  it('parses joule units', () => {
    expect(parseEnergyKilo('500J')).toBe(0.5);
    expect(parseEnergyKilo('1000J')).toBe(1);
  });

  it('parses kilojoule units', () => {
    expect(parseEnergyKilo('801kJ')).toBe(801);
    expect(parseEnergyKilo('5kJ')).toBe(5);
  });

  it('parses megajoule units', () => {
    expect(parseEnergyKilo('4MJ')).toBe(4000);
    expect(parseEnergyKilo('100MJ')).toBe(100000);
  });

  it('parses gigajoule units', () => {
    expect(parseEnergyKilo('8GJ')).toBe(8000000);
  });

  it('parses terajoule units', () => {
    expect(parseEnergyKilo('1TJ')).toBe(1000000000);
  });

  it('returns 0 for invalid input', () => {
    expect(parseEnergyKilo('')).toBe(0);
    expect(parseEnergyKilo('abc')).toBe(0);
    expect(parseEnergyKilo('kW')).toBe(0);
  });
});

describe('formatPower', () => {
  it('formats megawatts', () => {
    expect(formatPower(2500)).toBe('2.5 MW');
    expect(formatPower(1000)).toBe('1.0 MW');
    expect(formatPower(9600)).toBe('9.6 MW');
  });

  it('formats kilowatts', () => {
    expect(formatPower(375)).toBe('375 kW');
    expect(formatPower(90)).toBe('90 kW');
    expect(formatPower(1)).toBe('1 kW');
  });

  it('formats watts', () => {
    expect(formatPower(0.5)).toBe('500 W');
    expect(formatPower(0.4)).toBe('400 W');
    expect(formatPower(0.005)).toBe('5 W');
  });
});
