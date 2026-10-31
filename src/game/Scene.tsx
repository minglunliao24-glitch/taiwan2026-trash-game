import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { createPlayer, movementInput, stepPlayer, type Block, type BlockKind, type Player } from './sim/rules';

export type GameMode = 'lobby' | 'world' | 'editor' | 'preview';
export type Controls = { keys: Set<string>; touch: { x: number; y: number }; jump: boolean; yaw: number; pitch: number; wave: number; paused: boolean };
export function createControls(): Controls { return { keys: new Set(), touch: { x: 0, y: 0 }, jump: false, yaw: 0, pitch: .45, wave: 0, paused: false }; }

function usePalette() {
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    const color = (name: string) => style.getPropertyValue(`--scene-${name}`).trim();
    return { sky: color('sky'), water: color('water'), grass: color('grass'), grassLight: color('grass-light'), rock: color('rock'), brick: color('brick'), sand: color('sand'), shirt: color('shirt'), skin: color('skin'), ink: color('ink'), leaf: color('leaf'), white: color('white'), gold: color('gold') };
  }, []);
}
type Palette = ReturnType<typeof usePalette>;
function groundTexture(p: Palette) {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = p.grass; ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 180; i++) { ctx.fillStyle = i % 2 ? p.grassLight : p.leaf; ctx.globalAlpha = .23; ctx.fillRect((i * 47) % 128, (i * 73) % 128, 2, 4); }
  }
  const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(7, 7); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function VoxelAvatar({ palette, player, controls }: { palette: Palette; player: Player; controls: Controls }) {
  const root = useRef<THREE.Group>(null); const leftLeg = useRef<THREE.Group>(null); const rightLeg = useRef<THREE.Group>(null); const arm = useRef<THREE.Group>(null);
  const shirt = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.fillStyle = palette.shirt; ctx.fillRect(0, 0, 512, 256); ctx.fillStyle = palette.white; ctx.textAlign = 'center'; ctx.font = 'bold 58px sans-serif'; ctx.fillText('我愛', 256, 110); ctx.font = 'bold 52px sans-serif'; ctx.fillText('ROBLOX！', 256, 181); }
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [palette]);
  useEffect(() => () => shirt.dispose(), [shirt]);
  // Animation is applied by the one scene stepper through this visual handle.
  useEffect(() => {
    const update = () => {
      if (!root.current) return;
      root.current.position.set(player.x, player.y, player.z); root.current.rotation.y = player.heading;
      const stride = Math.sin(player.distance * 5) * .4;
      if (leftLeg.current) leftLeg.current.rotation.x = stride;
      if (rightLeg.current) rightLeg.current.rotation.x = -stride;
      if (arm.current) arm.current.rotation.z = controls.wave > 0 ? -2.5 + Math.sin(controls.wave * 15) * .3 : -.08;
    };
    avatarHandles.set(player, update); return () => { avatarHandles.delete(player); };
  }, [player, controls]);
  return <group ref={root}>
    <mesh position={[0, 1.07, 0]} castShadow><boxGeometry args={[.64, .7, .34]} /><meshStandardMaterial color={palette.shirt} roughness={.8} /></mesh>
    <mesh position={[0, 1.07, .176]}><planeGeometry args={[.61, .45]} /><meshBasicMaterial map={shirt} /></mesh>
    <mesh position={[0, 1.69, 0]} castShadow><boxGeometry args={[.48, .48, .45]} /><meshStandardMaterial color={palette.skin} /></mesh>
    <mesh position={[0, 1.92, -.035]}><boxGeometry args={[.5, .15, .5]} /><meshStandardMaterial color={palette.ink} /></mesh>
    {[-.11, .11].map(x => <mesh key={x} position={[x, 1.72, .229]}><boxGeometry args={[.04, .065, .01]} /><meshBasicMaterial color={palette.ink} /></mesh>)}
    <mesh position={[0, 1.59, .229]}><boxGeometry args={[.11, .025, .01]} /><meshBasicMaterial color={palette.ink} /></mesh>
    <group ref={arm} position={[-.43, 1.32, 0]}><mesh position={[0, -.23, 0]} castShadow><boxGeometry args={[.2, .62, .27]} /><meshStandardMaterial color={palette.skin} /></mesh></group>
    <mesh position={[.43, 1.06, 0]} castShadow><boxGeometry args={[.2, .62, .27]} /><meshStandardMaterial color={palette.skin} /></mesh>
    {[{ x: -.17, ref: leftLeg }, { x: .17, ref: rightLeg }].map(({ x, ref }) => <group key={x} ref={ref} position={[x, .72, 0]}><mesh position={[0, -.3, 0]} castShadow><boxGeometry args={[.26, .6, .29]} /><meshStandardMaterial color={palette.ink} /></mesh><mesh position={[0, -.64, .055]} castShadow><boxGeometry args={[.28, .16, .4]} /><meshStandardMaterial color={palette.white} /></mesh></group>)}
  </group>;
}
const avatarHandles = new WeakMap<Player, () => void>();

function Island({ palette }: { palette: Palette }) {
  const texture = useMemo(() => groundTexture(palette), [palette]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group>
    <mesh position={[0, -.42, 0]} receiveShadow><cylinderGeometry args={[13.3, 12, .8, 12]} /><meshStandardMaterial map={texture} roughness={.96} /></mesh>
    <mesh position={[0, -1.55, 0]}><cylinderGeometry args={[12, 9, 1.5, 12]} /><meshStandardMaterial color={palette.sand} flatShading /></mesh>
    <mesh position={[0, -4, 0]}><cylinderGeometry args={[9, 2.5, 3.6, 9]} /><meshStandardMaterial color={palette.rock} flatShading /></mesh>
    <mesh position={[0, -8, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[300, 300]} /><meshStandardMaterial color={palette.water} roughness={.3} metalness={.1} /></mesh>
    {/* Small voxel groves are deliberately generated scenery, not hero model stand-ins. */}
    {[[-8, -6], [-10, 0], [8, -6], [9, 2], [-7, 6]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>
      <mesh position={[0, 1, 0]} castShadow><boxGeometry args={[.38, 2, .38]} /><meshStandardMaterial color={palette.sand} /></mesh>
      <mesh position={[0, 2.35, 0]} castShadow><boxGeometry args={[2.2, 1.4, 2]} /><meshStandardMaterial color={palette.leaf} roughness={.9} /></mesh>
      <mesh position={[.15, 3.2, 0]} castShadow><boxGeometry args={[1.45, .65, 1.4]} /><meshStandardMaterial color={palette.grassLight} /></mesh>
    </group>)}
    <group position={[-4, 0, -8]}>
      {[-1.2, 1.2].map(x => <mesh key={x} position={[x, 1.6, 0]} castShadow><boxGeometry args={[.6, 3.2, .75]} /><meshStandardMaterial color={palette.white} roughness={.55} /></mesh>)}
      <mesh position={[0, 3.5, 0]} castShadow><boxGeometry args={[3.2, .65, .9]} /><meshStandardMaterial color={palette.brick} /></mesh>
    </group>
    <group position={[5.5, 0, -7]}>
      <mesh position={[0, .3, 0]}><cylinderGeometry args={[1.2, 1.5, .6, 6]} /><meshStandardMaterial color={palette.rock} /></mesh>
      <mesh position={[0, 1.8, 0]}><octahedronGeometry args={[.8]} /><meshStandardMaterial color={palette.gold} metalness={.35} roughness={.3} /></mesh>
    </group>
    {[[-6, 10], [8, 8], [12, -5]].map(([x, z], i) => <mesh key={i} position={[x, -3, z]} rotation={[.3, i, .1]}><octahedronGeometry args={[1.5]} /><meshStandardMaterial color={palette.rock} flatShading /></mesh>)}
    <mesh position={[0, .012, 7]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.4, 1.6, 24]} /><meshBasicMaterial color={palette.white} /></mesh>
  </group>;
}

function WorldContents({ mode, blocks, controls, player, onCell, onReady }: SceneProps & { player: Player }) {
  const palette = usePalette(); const first = useRef(false); const editorMode = mode === 'editor';
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, .05);
    if (mode === 'world' || mode === 'preview') {
      if (!controls.paused) {
        const input = movementInput(controls.keys, controls.touch); input.jump ||= controls.jump;
        stepPlayer(player, input, controls.yaw, dt, blocks); controls.jump = false;
        controls.wave = Math.max(0, controls.wave - dt);
      }
      const horizontal = 6.5 * Math.cos(controls.pitch);
      target.set(player.x + Math.sin(controls.yaw) * horizontal, player.y + 1.6 + Math.sin(controls.pitch) * 6.5, player.z + Math.cos(controls.yaw) * horizontal);
      look.set(player.x, player.y + 1.15, player.z);
    } else if (editorMode) { target.set(0, 15, 10); look.set(0, 0, 0); }
    else { target.set(23, 17, 26); look.set(-1, 0, 0); }
    camera.position.lerp(target, first.current ? 1 - Math.exp(-9 * dt) : 1); camera.lookAt(look);
    avatarHandles.get(player)?.();
    if (!first.current) { first.current = true; onReady(); }
  });
  const blockColor: Record<BlockKind, string> = { grass: palette.grassLight, stone: palette.rock, brick: palette.brick };
  return <>
    <color attach="background" args={[palette.sky]} />
    <fog attach="fog" args={[palette.sky, 45, 180]} />
    <hemisphereLight args={[palette.white, palette.water, 1.6]} />
    <directionalLight position={[12, 20, 8]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-bias={-.001} />
    <Suspense fallback={null}><Environment resolution={32}><Lightformer position={[0, 12, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[20, 20, 1]} intensity={1.5} color={palette.white} /><Lightformer position={[-10, 4, 0]} rotation={[0, Math.PI / 2, 0]} scale={[10, 10, 1]} color={palette.sky} intensity={1} /></Environment></Suspense>
    <Island palette={palette} />
    {editorMode && Array.from({ length: 100 }, (_, i) => { const x = i % 10, z = Math.floor(i / 10); return <mesh key={i} position={[x - 4.5, .035, z - 4.5]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={e => { e.stopPropagation(); onCell(x, z); }}><planeGeometry args={[.94, .94]} /><meshStandardMaterial color={(x + z) % 2 ? palette.grass : palette.grassLight} /></mesh>; })}
    {blocks.map(b => <mesh key={`${b.x}/${b.z}/${b.level}`} position={[b.x - 4.5, b.level * .8 + .4, b.z - 4.5]} castShadow receiveShadow onPointerDown={e => { if (editorMode) { e.stopPropagation(); onCell(b.x, b.z); } }}><boxGeometry args={[.96, .8, .96]} /><meshStandardMaterial color={blockColor[b.kind]} roughness={b.kind === 'stone' ? .6 : .9} /></mesh>)}
    {!editorMode && <VoxelAvatar palette={palette} player={player} controls={controls} />}
  </>;
}
type SceneProps = { mode: GameMode; blocks: Block[]; controls: Controls; onCell: (x: number, z: number) => void; onReady: () => void };
export default function Scene(props: SceneProps) {
  const player = useMemo(() => createPlayer(), []);
  useEffect(() => { Object.assign(player, createPlayer()); props.controls.keys.clear(); props.controls.touch = { x: 0, y: 0 }; props.controls.yaw = 0; }, [props.mode, player, props.controls]);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const game = { get state() { return { ...player, mode: props.mode }; }, sim(seconds: number) { for (let i = 0; i < Math.min(seconds * 60, 3600); i++) { const input = movementInput(props.controls.keys, props.controls.touch); input.jump ||= props.controls.jump; stepPlayer(player, input, props.controls.yaw, 1 / 60, props.blocks); props.controls.jump = false; } }, jump() { props.controls.jump = true; }, get controls() { return { touch: props.controls.touch, yaw: props.controls.yaw }; } };
    const win = window as Window & { __game?: typeof game }; win.__game = game;
    return () => { delete win.__game; };
  }, [player, props.mode, props.blocks, props.controls]);
  return <Canvas shadows dpr={[1, 1.4]} camera={{ fov: 48, near: .1, far: 250, position: [23, 17, 26] }} gl={{ antialias: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); }); }}>
    <WorldContents {...props} player={player} />
  </Canvas>;
}