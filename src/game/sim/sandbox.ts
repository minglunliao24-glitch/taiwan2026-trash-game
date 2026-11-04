import { DEFAULT_BLOCKS, readMap, type Block, type Player } from './rules';

export const SANDBOX_STORAGE = 'taiwan2026-sandbox-v1';
export function initialWorld(): Block[] { return DEFAULT_BLOCKS.map(block => ({ ...block })); }
export function aimCell(player: Pick<Player, 'x' | 'z'>, yaw: number) {
  const x = Math.round(player.x - Math.sin(yaw) * 2.5 + 4.5);
  const z = Math.round(player.z - Math.cos(yaw) * 2.5 + 4.5);
  return x >= 0 && x < 10 && z >= 0 && z < 10 ? { x, z } : null;
}
export function restoreWorld(raw: string): Block[] {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('blocks' in value) || !Array.isArray(value.blocks)) throw new Error('Invalid save');
  const blocks = readMap(value.blocks);
  if (blocks.length !== value.blocks.length) throw new Error('Invalid blocks');
  return blocks;
}
export function serializeWorld(blocks: Block[]): string { return JSON.stringify({ version: 1, blocks }); }