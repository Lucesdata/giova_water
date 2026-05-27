import { describe, it, expect } from 'vitest';
import { jitter } from '../../src/components/primitives.jsx';

describe('jitter', () => {
  it('returns base when amp is 0', () => {
    expect(jitter(10, 0, 1)).toBe(10);
  });
  it('stays within base ± amp for any seed', () => {
    for (let seed = 0; seed < 50; seed++) {
      const v = jitter(0, 1, seed);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
  it('is deterministic for the same seed', () => {
    expect(jitter(5, 2, 42)).toBe(jitter(5, 2, 42));
  });
});
