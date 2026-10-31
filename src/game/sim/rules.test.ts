import { describe, expect, it } from 'vitest';
import { cameraMovement, createPlayer, createProfile, movementInput, placeBlock, readMap, removeBlock, stepPlayer } from './rules';
describe('遊戲原型規則', () => {
  it('玩家起始只有 10,000 金幣', () => { expect(createProfile().gold).toBe(10_000); });
  it('探索與跳躍不花費金幣', () => { const profile = createProfile(); const p = createPlayer(); for (let i = 0; i < 120; i++) stepPlayer(p, { x: 1, forward: 0, jump: i === 0 }, 0, 1 / 60, []); expect(profile.gold).toBe(10_000); expect(p.distance).toBeGreaterThan(1); });
  it('可放置方塊再移除頂層', () => { const map = placeBlock(placeBlock([], 2, 3, 'grass'), 2, 3, 'brick'); expect(map).toEqual([{ x: 2, z: 3, level: 0, kind: 'grass' }, { x: 2, z: 3, level: 1, kind: 'brick' }]); expect(removeBlock(map, 2, 3)).toEqual([map[0]]); });
  it('鍵盤與觸控前進方向一致', () => { expect(movementInput(new Set(['KeyW']), { x: 0, y: 0 })).toEqual(movementInput(new Set(), { x: 0, y: -1 })); expect(movementInput(new Set(['ArrowRight']), { x: 0, y: 0 }).x).toBe(1); });
  it('前進相對於鏡頭而非固定世界方向', () => { const m = cameraMovement({ x: 0, forward: 1, jump: false }, Math.PI / 2); expect(m.x).toBeCloseTo(-1); expect(m.z).toBeCloseTo(0); });
  it('跳躍離地後回到地面', () => { const p = createPlayer(); stepPlayer(p, { x: 0, forward: 0, jump: true }, 0, .05, []); expect(p.y).toBeGreaterThan(0); for (let i = 0; i < 120; i++) stepPlayer(p, { x: 0, forward: 0, jump: false }, 0, 1 / 60, []); expect(p.y).toBe(0); expect(p.grounded).toBe(true); });
  it('不能穿過方塊', () => { const p = createPlayer(); p.x = -4.5; p.z = -2; const blocks = placeBlock([], 0, 4, 'stone'); for (let i = 0; i < 120; i++) stepPlayer(p, { x: 0, forward: -1, jump: false }, 0, 1 / 60, blocks); expect(p.z).toBeLessThan(-1.2); });
  it('讀取本機地圖時排除無效資料', () => { expect(readMap([{ x: 99, z: 0, level: 0, kind: 'grass' }, { x: 1, z: 2, level: 0, kind: 'brick' }])).toEqual([{ x: 1, z: 2, level: 0, kind: 'brick' }]); });
});