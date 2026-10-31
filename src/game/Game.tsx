import { Component, lazy, Suspense, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowUp, Check, Coins, Hammer, Home, LoaderCircle, Menu, Music2, Play, RotateCcw, Save, Settings, Trash2, UserRound, Volume2, X, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { createControls, type GameMode } from './Scene';
import { createProfile, DEFAULT_BLOCKS, placeBlock, readMap, removeBlock, type Block, type BlockKind } from './sim/rules';
import { GameAudio } from './audio';
const Scene = lazy(() => import('./Scene'));
const STORAGE = 'taiwan2026-local-demo-v1';
type Panel = 'profile' | 'settings' | 'pause' | null;
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? <div className="game-fallback"><h2>3D 畫面暫時無法載入</h2><p>請重新整理，或關閉其他分頁後再試。</p><Button onClick={() => window.location.reload()}><RotateCcw />重新載入</Button><Button asChild variant="outline"><Link to="/">返回官網</Link></Button></div> : this.props.children; }
}
export default function Game() {
  const [mode, setMode] = useState<GameMode>('lobby');
  const [panel, setPanel] = useState<Panel>(null);
  const [profile, setProfile] = useState(createProfile);
  const [draftName, setDraftName] = useState('');
  const [sound, setSound] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS);
  const [tool, setTool] = useState<BlockKind | 'remove'>('grass');
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savedMap, setSavedMap] = useState<Block[]>(DEFAULT_BLOCKS);
  const controls = useRef(createControls()).current;
  const audio = useRef<GameAudio | null>(null);
  const joystick = useRef<HTMLDivElement>(null);
  const stick = useRef<HTMLSpanElement>(null);
  const activeStick = useRef<number | null>(null);
  const cameraPointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const playing = mode === 'world' || mode === 'preview';
  useEffect(() => {
    audio.current = new GameAudio();
    try { const raw = localStorage.getItem(STORAGE); if (raw) { const saved = JSON.parse(raw); if (typeof saved.name === 'string') setProfile({ ...createProfile(), name: saved.name.slice(0, 16) || '島嶼旅人' }); if (typeof saved.sound === 'boolean') setSound(saved.sound); if (Array.isArray(saved.blocks)) { const map = readMap(saved.blocks); setBlocks(map); setSavedMap(map); } } } catch { setNotice('本機資料無法讀取，已使用預設地圖。'); }
    setLoaded(true);
    return () => audio.current?.dispose();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE, JSON.stringify({ name: profile.name, sound, blocks: savedMap })); } catch { setNotice('此瀏覽器無法儲存；離開後資料可能遺失。'); }
  }, [profile.name, sound, savedMap, loaded]);
  useEffect(() => {
    controls.paused = Boolean(panel);
    controls.keys.clear(); controls.touch = { x: 0, y: 0 }; controls.jump = false;
    if (stick.current) stick.current.style.transform = 'translate(0px, 0px)';
  }, [panel, mode, controls]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4500); return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!playing || panel || e.target instanceof HTMLInputElement) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.code === 'Space' && !e.repeat) { controls.jump = true; audio.current?.play(sound); }
      else if (e.code === 'Escape') setPanel('pause');
      else if (e.code !== 'Space') controls.keys.add(e.code);
    };
    const up = (e: KeyboardEvent) => controls.keys.delete(e.code);
    const clear = () => { controls.keys.clear(); controls.touch = { x: 0, y: 0 }; controls.jump = false; cameraPointer.current = null; activeStick.current = null; if (stick.current) stick.current.style.transform = 'translate(0px, 0px)'; };
    const lost = () => setContextLost(true);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear); window.addEventListener('webglcontextlost', lost, true);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); window.removeEventListener('webglcontextlost', lost, true); };
  }, [playing, panel, controls, sound]);
  function changeMode(next: GameMode) { setMode(next); setPanel(null); setReady(false); controls.jump = false; controls.pitch = .45; }
  function openPanel(next: Panel) { setDraftName(profile.name); setPanel(next); }
  function cell(x: number, z: number) { setBlocks(old => tool === 'remove' ? removeBlock(old, x, z) : placeBlock(old, x, z, tool)); }
  function moveStick(e: PointerEvent<HTMLDivElement>) {
    if (activeStick.current !== e.pointerId || !joystick.current) return;
    const r = joystick.current.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / 42, y = (e.clientY - r.top - r.height / 2) / 42;
    const length = Math.max(1, Math.hypot(x, y)); x /= length; y /= length; controls.touch = { x, y };
    if (stick.current) stick.current.style.transform = `translate(${x * 42}px, ${y * 42}px)`;
  }
  function releaseStick(e: PointerEvent<HTMLDivElement>) { if (activeStick.current !== e.pointerId) return; activeStick.current = null; controls.touch = { x: 0, y: 0 }; if (stick.current) stick.current.style.transform = 'translate(0px, 0px)'; }
  return <div className={`game-shell game-${mode}`}>
    <div className="game-scene" data-scene-ready={ready ? '1' : undefined}>
      <SceneBoundary><Suspense fallback={<div className="game-loading"><LoaderCircle className="animate-spin" />島嶼載入中</div>}><Scene mode={mode} blocks={blocks} controls={controls} onCell={cell} onReady={() => setReady(true)} /></Suspense></SceneBoundary>
    </div>
    {!ready && <div className="scene-status" role="status"><LoaderCircle className="animate-spin" />島嶼載入中</div>}
    <header className="game-header">
      <div className="game-brand"><Button asChild variant="ghost" size="icon" title="返回官方網站" aria-label="返回官方網站"><Link to="/"><ArrowLeft /></Link></Button><Link to="/" className="font-black">台灣2026廢遊戲</Link><span className="game-dev">開發中</span></div>
      <div className="game-balance" aria-label="金幣餘額"><Coins /><strong>{profile.gold.toLocaleString('en-US')}</strong><span>金幣</span></div>
      {mode !== 'lobby' && <Button variant="outline" className="game-menu-button" size="icon" aria-label="遊戲選單" onClick={() => openPanel('pause')}><Menu /></Button>}
    </header>
    {mode === 'lobby' && <main className="lobby-content">
      <div className="lobby-eyebrow">本機試玩版 <span>01 / 漂浮島嶼</span></div>
      <h1>遊戲大廳</h1>
      <p className="lobby-brand-title">台灣2026廢遊戲</p>
      <div className="lobby-profile"><div className="profile-icon"><UserRound /></div><div><span>玩家</span><strong>{profile.name}</strong></div><span className="local-label">本機示範</span></div>
      <div className="lobby-actions">
        <Button className="start-game" onClick={() => { audio.current?.play(sound); changeMode('world'); }}><Play />開始遊玩<ArrowUp className="start-arrow" /></Button>
        <Button className="create-map" variant="outline" onClick={() => changeMode('editor')}><Hammer />創建地圖</Button>
        <div className="lobby-secondary"><Button variant="outline" onClick={() => openPanel('profile')}><UserRound />個人資料</Button><Button variant="outline" onClick={() => openPanel('settings')}><Settings />設定</Button></div>
      </div>
      <p className="lobby-status"><span />單人原型・無儲值・無雲端分享</p>
    </main>}
    {playing && <>
      <div className="world-location"><span>{mode === 'preview' ? '我的地圖・本機預覽' : '漂浮島嶼'}</span><strong>{profile.name}</strong></div>
      <div className="camera-zone" aria-label="拖曳調整鏡頭" onPointerDown={e => { if (cameraPointer.current) return; cameraPointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { const p = cameraPointer.current; if (!p || p.id !== e.pointerId) return; controls.yaw -= (e.clientX - p.x) * .006; controls.pitch = Math.max(.12, Math.min(1, controls.pitch + (e.clientY - p.y) * .004)); p.x = e.clientX; p.y = e.clientY; }} onPointerUp={e => { if (cameraPointer.current?.id === e.pointerId) cameraPointer.current = null; }} onPointerCancel={() => { cameraPointer.current = null; }} />
      <div className="touch-stick" ref={joystick} aria-label="移動搖桿" role="group" onPointerDown={e => { if (activeStick.current !== null) return; activeStick.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); moveStick(e); }} onPointerMove={moveStick} onPointerUp={releaseStick} onPointerCancel={releaseStick}><span className="stick-cross">＋</span><span className="stick-thumb" ref={stick} /><span className="stick-label">移動</span></div>
      <div className="touch-actions"><Button variant="outline" className="wave-control" title="揮手" aria-label="揮手" onPointerDown={e => { e.preventDefault(); controls.wave = 2; audio.current?.play(sound); }}><Hand /></Button><Button className="jump-control" title="跳躍" aria-label="跳躍" onPointerDown={e => { e.preventDefault(); controls.jump = true; audio.current?.play(sound); }}><ArrowUp /><span>跳躍</span></Button></div>
      {mode === 'preview' && <Button variant="outline" className="back-editor" onClick={() => changeMode('editor')}><Hammer />返回編輯</Button>}
    </>}
    {mode === 'editor' && <>
      <div className="editor-heading"><h1>創建地圖</h1><span>本機示範・{blocks.length} 方塊</span></div>
      <div className="editor-toolbar"><div className="editor-tools" role="group" aria-label="方塊工具">
        {([{ kind: 'grass', label: '草地' }, { kind: 'stone', label: '石塊' }, { kind: 'brick', label: '磚塊' }] as const).map(b => <Button key={b.kind} variant={tool === b.kind ? 'default' : 'outline'} aria-label={`放置${b.label}`} aria-pressed={tool === b.kind} onClick={() => setTool(b.kind)}><span className={`block-swatch swatch-${b.kind}`} />{b.label}</Button>)}
        <Button variant={tool === 'remove' ? 'default' : 'outline'} aria-label="移除方塊" aria-pressed={tool === 'remove'} onClick={() => setTool('remove')}><Trash2 /></Button>
      </div><div className="editor-commands"><Button variant="outline" aria-label="清空地圖" title="清空地圖" onClick={() => setConfirmClear(true)}><RotateCcw /></Button><Button variant="outline" onClick={() => { setSavedMap([...blocks]); setNotice('地圖已儲存於本機，僅限示範，無雲端分享。'); }}><Save />儲存本機</Button><Button onClick={() => changeMode('preview')}><Play />預覽</Button></div></div>
    </>}
    {notice && <div className="game-toast" role="status"><Check />{notice}</div>}
    {panel && <div className="game-modal-backdrop"><section className="game-modal" role="dialog" aria-modal="true" aria-labelledby="panel-title"><Button variant="ghost" size="icon" className="modal-close" aria-label="關閉" onClick={() => setPanel(null)}><X /></Button>
      <span className="panel-kicker">台灣2026廢遊戲</span><h2 id="panel-title">{panel === 'profile' ? '個人資料' : panel === 'settings' ? '設定' : '遊戲選單'}</h2>
      {panel === 'profile' && <><div className="modal-avatar"><UserRound /></div><label htmlFor="player-name">玩家名稱</label><Input id="player-name" maxLength={16} value={draftName} onChange={e => setDraftName(e.target.value)} /><p className="panel-note">本機示範資料・沒有真實帳號</p><div className="profile-coins"><Coins />10,000 金幣</div><Button className="w-full" onClick={() => { setProfile({ ...createProfile(), name: draftName.trim() || '島嶼旅人' }); setPanel(null); setNotice('個人資料已更新於本機。'); }}><Save />儲存資料</Button></>}
      {panel === 'settings' && <><div className="setting-row"><span><Volume2 />音效</span><Switch aria-label="音效" checked={sound} onCheckedChange={setSound} /></div><div className="setting-row"><span><Music2 />背景音樂 <small>開發中</small></span><Switch aria-label="背景音樂（開發中）" disabled checked={false} /></div><p className="panel-note">設定僅儲存在這台裝置。</p><Button variant="outline" className="w-full" onClick={() => audio.current?.play(sound)}><Volume2 />試聽音效</Button></>}
      {panel === 'pause' && <div className="pause-actions"><Button onClick={() => setPanel(null)}><Play />繼續{mode === 'editor' ? '編輯' : '遊玩'}</Button><Button variant="outline" onClick={() => openPanel('settings')}><Settings />設定</Button><Button variant="outline" onClick={() => changeMode('lobby')}><Home />返回大廳</Button></div>}
    </section></div>}
    {confirmClear && <div className="game-modal-backdrop"><section className="game-modal" role="dialog" aria-modal="true" aria-labelledby="clear-title"><h2 id="clear-title">清空目前地圖？</h2><p className="panel-note">尚未儲存的方塊將被移除。</p><div className="flex gap-3"><Button variant="outline" onClick={() => setConfirmClear(false)}>取消</Button><Button variant="destructive" onClick={() => { setBlocks([]); setConfirmClear(false); }}>清空地圖</Button></div></section></div>}
    {contextLost && <div className="game-modal-backdrop"><div className="game-modal" role="alert"><h2>3D 畫面已中斷</h2><p className="panel-note">請重新載入，已儲存的本機地圖仍會保留。</p><Button onClick={() => window.location.reload()}><RotateCcw />重新載入</Button></div></div>}
    {mode === 'lobby' && <footer className="game-footer"><span>原創沙盒原型</span><span>© 2026 台灣2026廢遊戲</span></footer>}
  </div>;
}