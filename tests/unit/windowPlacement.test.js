import { describe, it, expect } from 'vitest';
import { computeInitialBounds, clampBoundsToWorkArea } from '../../src/main/windowPlacement.js';

describe('windowPlacement', () => {
  it('positions initial window near bottom-right 25%', () => {
    const bounds = computeInitialBounds({ width: 1920, height: 1080 }, { width: 420, height: 520 });
    expect(bounds.x).toBeGreaterThan(1200);
    expect(bounds.y).toBeGreaterThan(500);
  });

  it('clamps out-of-screen bounds into work area', () => {
    const fixed = clampBoundsToWorkArea(
      { x: 9999, y: 9999, width: 420, height: 520 },
      { x: 0, y: 0, width: 1920, height: 1080 }
    );
    expect(fixed.x).toBeLessThanOrEqual(1500);
    expect(fixed.y).toBeLessThanOrEqual(560);
  });
});
