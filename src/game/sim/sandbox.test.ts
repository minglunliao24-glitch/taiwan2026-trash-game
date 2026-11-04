import { describe, expect, it } from 'vitest';
import { aimCell, initialWorld, restoreWorld, serializeWorld } from './sandbox';
import { placeBlock, removeBlock } from './rules';
describe('single-player sandbox', () => {
  it('restores placed and stacked blocks after saving', () => {
    const world = placeBlock(placeBlock(initialWorld(), 3, 3, 'brick'), 3, 3, 'stone');
    expect(restoreWorld(serializeWorld(world))).toEqual(world);
    expect(restoreWorld(serializeWorld(removeBlock(world, 3, 3))).filter(b => b.x === 3 && b.z === 3)).toEqual([{ x: 3, z: 3, level: 0, kind: 'brick' }]);
  });
  it('reset returns a separate original world', () => { const world = initialWorld(); world.pop(); expect(initialWorld()).toHaveLength(5); });
  it('targets the forward building cell and rejects outside ground', () => { expect(aimCell({ x: 0, z: 6 }, 0)).toEqual({ x: 5, z: 8 }); expect(aimCell({ x: 12, z: 12 }, 0)).toBeNull(); });
  it('retains empty worlds and rejects corrupt storage', () => { expect(restoreWorld(serializeWorld([]))).toEqual([]); expect(() => restoreWorld('{"version":1,"blocks":[{"x":99}]}')).toThrow(); });
});