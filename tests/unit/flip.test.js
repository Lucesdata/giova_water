import { describe, it, expect } from 'vitest';
import { loadFlip, FLIP_VARS } from '../../src/lib/flip.js';

describe('flip loader', () => {
  it('keeps the motion budget of the entry animations: ≤ 250 ms, no delay, no stagger', () => {
    expect(FLIP_VARS.duration).toBeLessThanOrEqual(0.25);
    expect(FLIP_VARS.delay ?? 0).toBe(0);
    expect(FLIP_VARS.stagger).toBeUndefined();
  });

  it('loads Flip once and reuses it', async () => {
    const a = await loadFlip();
    const b = await loadFlip();
    expect(a).toBeTruthy();
    expect(typeof a.getState).toBe('function');
    expect(typeof a.from).toBe('function');
    expect(b).toBe(a);
  });
});
