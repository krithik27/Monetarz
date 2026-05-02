import { describe, it, expect } from 'vitest';
import { parseSpend } from '@/lib/parser';

describe('Parser', () => {
  it('should parse simple spend entries', () => {
    const result = parseSpend('coffee 150');
    expect(result.amount).toBe(150);
    expect(result.description).toBe('Coffee');
    expect(result.category).toBe('food');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should parse complex entries with currency', () => {
    const result = parseSpend('uber ride $300');
    expect(result.amount).toBe(300);
    expect(result.description).toBe('Uber ride');
    expect(result.category).toBe('transport');
  });

  it('should handle zero amounts', () => {
    const result = parseSpend('free coffee 0');
    expect(result.amount).toBe(0);
    expect(result.description).toBe('Free coffee');
  });

  it('should mark low confidence entries', () => {
    const result = parseSpend('xyz 123');
    expect(result.confidence).toBeLessThan(0.8);
    expect(result.needsReview).toBe(true);
  });

  it('should handle income entries', () => {
    const result = parseSpend('salary 50000');
    expect(result.category).toBe('salary');
    expect(result.amount).toBe(50000);
  });
});
