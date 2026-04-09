import { describe, it, expect } from 'vitest';
import { formatAmount, getCurrencySymbol, Money } from '@/lib/money';

describe('Money Utilities', () => {
  it('should format amounts correctly for INR', () => {
    expect(formatAmount(150, 'INR')).toBe('₹150');
    expect(formatAmount(1500, 'INR')).toBe('₹1,500');
    expect(formatAmount(1500000, 'INR')).toBe('₹15,00,000');
  });

  it('should format amounts correctly for USD', () => {
    expect(formatAmount(150, 'USD')).toBe('$150');
    expect(formatAmount(1500, 'USD')).toBe('$1,500');
    expect(formatAmount(1500000, 'USD')).toBe('$15,00,000');
  });

  it('should format amounts correctly for EUR', () => {
    expect(formatAmount(150, 'EUR')).toBe('€150');
    expect(formatAmount(1500, 'EUR')).toBe('€1,500');
  });

  it('should return correct currency symbols', () => {
    expect(getCurrencySymbol('INR')).toBe('₹');
    expect(getCurrencySymbol('USD')).toBe('$');
    expect(getCurrencySymbol('EUR')).toBe('€');
  });

  it('should handle zero amounts', () => {
    expect(formatAmount(0, 'INR')).toBe('₹0');
    expect(formatAmount(0, 'USD')).toBe('$0');
  });

  it('should handle negative amounts', () => {
    expect(formatAmount(-150, 'INR')).toBe('₹-150');
    expect(formatAmount(-150, 'USD')).toBe('$-150');
  });

  it('should default to INR for unknown currency', () => {
    expect(formatAmount(150, 'INR')).toBe('₹150');
    expect(getCurrencySymbol('INR')).toBe('₹');
  });
});
