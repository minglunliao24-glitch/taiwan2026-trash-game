export const STARTING_GOLD = 10_000;
export const GRID_SIZE = 10;
export const SPEED = 4.8;
export const JUMP_SPEED = 7.4;
export const GRAVITY = 22;
export type BlockKind = 'grass' | 'stone' | 'brick';
export type Block = { x: number; z: number; level: number; kind: BlockKind };
export type Player = { x: number; y: number; z: number; vy: number; heading: number; grounded: boolean; distance: number };
export type Input = { x: number; forward: number; jump: boolean };
export function createPlayer(): Player { return { x: 0, y: 0, z: 8, vy: 0, heading: Math.PI, grounded: true, distance: 0 }; }
export function createProfile() { return { name: '島嶼旅人', gold: STARTING_GOLD }; }
export function movementInput(keys: Set<string>, touch: { x: number; y: number }): Input {
  let x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + touch.x;
  let forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown')) - touch.y;
  const length = Math.max(1, Math.hypot(x, forward)); x /= length; forward /= length;
  return { x, forward, jump: keys.has('Space') };
}
export function cameraMovement(input: Input, yaw: number) {
  return { x: input.x * Math.cos(yaw) - input.forward * Math.sin(yaw), z: -input.x * Math.sin(yaw) - input.forward * Math.cos(yaw) };
}
export function placeBlock(blocks: Block[], x: number, z: number, kind: BlockKind): Block[] {
  if (!Number.isInteger(x) || !Number.isInteger(z) || x < 0 || z < 0 || x >= GRID_SIZE || z >= GRID_SIZE) return blocks;
  const stack = blocks.filter(b => b.x === x && b.z === z);
  const level = stack.length ? Math.max(...stack.map(b => b.level)) + 1 : 0;
  if (level >= 4) return blocks;
  return [...blocks, { x, z, level, kind }];
}
export function removeBlock(blocks: Block[], x: number, z: number) {
  const stack = blocks.filter(b => b.x === x && b.z === z);
  if (!stack.length) return blocks;
  const top = Math.max(...stack.map(b => b.level));
  return blocks.filter(b => b.x !== x || b.z !== z || b.level !== top);
}
export function readMap(value: unknown): Block[] {
  if (!Array.isArray(value) || value.length > 400) return [];
  const clean: Block[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const b = item as Partial<Block>;
    if (typeof b.x !== 'number' || typeof b.z !== 'number' || typeof b.level !== 'number') continue;
    if (![b.x, b.z, b.level].every(Number.isInteger) || b.x < 0 || b.x >= GRID_SIZE || b.z < 0 || b.z >= GRID_SIZE || b.level < 0 || b.level > 3) continue;
    if (b.kind !== 'grass' && b.kind !== 'stone' && b.kind !== 'brick') continue;
    if (clean.some(c => c.x === b.x && c.z === b.z && c.level === b.level)) continue;
    clean.push({ x: b.x, z: b.z, level: b.level, kind: b.kind });
  }
  return clean;
}
export const DEFAULT_BLOCKS: Block[] = [
  { x: 2, z: 2, level: 0, kind: 'stone' }, { x: 2, z: 2, level: 1, kind: 'stone' },
  { x: 7, z: 3, level: 0, kind: 'brick' }, { x: 7, z: 4, level: 0, kind: 'brick' },
  { x: 4, z: 2, level: 0, kind: 'grass' },
];
function blocked(x: number, z: number, y: number, blocks: Block[]) {
  return blocks.some(b => Math.abs(x - (b.x - 4.5)) < .72 && Math.abs(z - (b.z - 4.5)) < .72 && y < (b.level + 1) * .8 - .05);
}
export function stepPlayer(p: Player, input: Input, yaw: number, delta: number, blocks: Block[]) {
  const dt = Math.min(Math.max(delta, 0), .05);
  const m = cameraMovement(input, yaw);
  const oldX = p.x, oldZ = p.z;
  if (input.jump && p.grounded) { p.vy = JUMP_SPEED; p.grounded = false; }
  p.vy -= GRAVITY * dt;
  const previousY = p.y;
  p.y += p.vy * dt;
  let floor = 0;
  for (const b of blocks) {
    const top = (b.level + 1) * .8;
    if (Math.abs(p.x - (b.x - 4.5)) < .67 && Math.abs(p.z - (b.z - 4.5)) < .67 && previousY >= top - .08 && p.vy <= 0) floor = Math.max(floor, top);
  }
  if (p.y <= floor) { p.y = floor; p.vy = 0; p.grounded = true; } else { p.grounded = false; }
  const nx = p.x + m.x * SPEED * dt;
  if (Math.hypot(nx, p.z) < 12.7 && !blocked(nx, p.z, p.y, blocks)) p.x = nx;
  const nz = p.z + m.z * SPEED * dt;
  if (Math.hypot(p.x, nz) < 12.7 && !blocked(p.x, nz, p.y, blocks)) p.z = nz;
  if (Math.hypot(m.x, m.z) > .05) p.heading = Math.atan2(m.x, m.z);
  p.distance += Math.hypot(p.x - oldX, p.z - oldZ);
}