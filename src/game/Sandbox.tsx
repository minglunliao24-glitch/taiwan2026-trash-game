import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowUp, Coins, HelpCircle, LoaderCircle, Plus, RotateCcw, Save, Trash2, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createControls } from './Scene';
import { placeBlock, removeBlock, type BlockKind } from './sim/rules';
import { initialWorld, restoreWorld, SANDBOX_STORAGE, serializeWorld } from './sim/sandbox';
const Scene = lazy(() => import('./Scene'));
class Boundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.onError(); }
  override render() { return this.state.failed ? null : this.props.children; }
}
const TOOLS = [{ kind: 'grass', label: '草地' }, { kind: 'stone', label: '石塊' }, { kind: 'brick', label: '磚塊' }] as const;
export default function Sandbox() {
  const [started, setStarted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState('');
  const [blocks, setBlocks] = useState(initialWorld);
  const [tool, setTool] = useState<BlockKind>('brick');
  const [notice, setNotice] = useState('');
  const [saveState, setSaveState] = useState('正在讀取本機世界');
  const [help, setHelp] = useState(false);
  const [reset, setReset] = useState(false);
  const [aim, setAim] = useState<{ x: number; z: number } | null>(null);
  const controls = useRef(createControls()).current;
  const stick = useRef<HTMLSpanElement>(null);
  const stickId = useRef<number | null>(null);
  const camera = useRef<{ id: number; x: number; y: number } | null>(null);
  useEffect(() => {
    try { const raw = localStorage.getItem(SANDBOX_STORAGE); if (raw) setBlocks(restoreWorld(raw)); } catch { setNotice('本機存檔無法讀取，已載入初始島嶼。'); }
    const canvas = document.createElement('canvas');
    try { const gl = canvas.getContext('webgl2'); if (!gl) setFailed('這台裝置不支援所需的 WebGL 2，請使用較新的瀏覽器。'); else gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch { setFailed('無法啟動 3D 畫面，請關閉其他分頁後重試。'); }
    setLoaded(true);
  }, []);
  const save = useCallback(() => {
    try { localStorage.setItem(SANDBOX_STORAGE, serializeWorld(blocks)); setSaveState('已儲存於本機'); return true; }
    catch { setSaveState('儲存失敗'); setNotice('此瀏覽器無法保存世界，離開後可能遺失。'); return false; }
  }, [blocks]);
  useEffect(() => { if (!loaded) return; setSaveState('儲存中…'); const timer = setTimeout(save, 350); return () => clearTimeout(timer); }, [loaded, save]);
  const act = useCallback((remove: boolean) => {
    if (!started || help || reset || failed) return;
    if (!aim) { setNotice('走近島中央的建造網格，再面向想蓋的位置。'); return; }
    setBlocks(old => {
      const next = remove ? removeBlock(old, aim.x, aim.z) : placeBlock(old, aim.x, aim.z, tool);
      return next;
    });
    setNotice(remove ? '已拆除目標最上層方塊；空格不會改變。' : '已放置方塊；每格最多堆疊四層。');
  }, [started, help, reset, failed, aim, tool]);
  const action = useRef(act);
  useEffect(() => { action.current = act; }, [act]);
  useEffect(() => {
    const clear = () => { controls.keys.clear(); controls.jump = false; controls.touch = { x: 0, y: 0 }; stickId.current = null; camera.current = null; if (stick.current) stick.current.style.transform = ''; };
    controls.paused = help || reset || !started || Boolean(failed); clear();
    const down = (e: KeyboardEvent) => {
      if (controls.paused) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.code === 'Space' && !e.repeat) controls.jump = true;
      else if (e.code === 'KeyE' && !e.repeat) action.current(false);
      else if (e.code === 'KeyQ' && !e.repeat) action.current(true);
      else if (e.code === 'Digit1') setTool('grass');
      else if (e.code === 'Digit2') setTool('stone');
      else if (e.code === 'Digit3') setTool('brick');
      else if (e.code === 'Escape') setHelp(true);
      else if (e.code !== 'Space') controls.keys.add(e.code);
    };
    const up = (e: KeyboardEvent) => controls.keys.delete(e.code);
    const lost = () => setFailed('3D 畫面已中斷；已儲存的世界仍保留，請重新載入。');
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear); window.addEventListener('webglcontextlost', lost, true);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); window.removeEventListener('webglcontextlost', lost, true); };
  }, [controls, started, help, reset, failed]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);
  function move(e: PointerEvent<HTMLDivElement>) {
    if (stickId.current !== e.pointerId) return;
    const r = e.currentTarget.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / 38, y = (e.clientY - r.top - r.height / 2) / 38;
    const length = Math.max(1, Math.hypot(x, y)); x /= length; y /= length; controls.touch = { x, y }; if (stick.current) stick.current.style.transform = `translate(${x * 38}px, ${y * 38}px)`;
  }
  function release(e: PointerEvent<HTMLDivElement>) { if (stickId.current !== e.pointerId) return; stickId.current = null; controls.touch = { x: 0, y: 0 }; if (stick.current) stick.current.style.transform = ''; }
  return <div className={`game-shell sandbox-shell ${!started ? 'game-lobby' : ''}`}>
    {loaded && !failed && <div className="game-scene" data-scene-ready={ready ? '1' : undefined}><Boundary onError={() => setFailed('島嶼無法載入，請重新整理後再試。')}><Suspense fallback={null}><Scene mode={started ? 'world' : 'lobby'} blocks={blocks} controls={controls} building={started} onCell={() => {}} onAim={setAim} onReady={() => setReady(true)} /></Suspense></Boundary></div>}
    <header className="game-header"><div className="game-brand"><Button asChild variant="outline" size="icon" title="返回首頁" aria-label="返回首頁"><Link to="/"><ArrowLeft /></Link></Button><strong>台灣2026廢遊戲</strong><span className="game-dev">單人測試版</span></div><div className="game-balance"><Coins /><strong>10,000</strong></div></header>
    {!ready && !failed && <div className="scene-status" role="status"><LoaderCircle className="animate-spin" />漂浮島嶼載入中</div>}
    {!started && !failed && <main className="lobby-content"><div className="lobby-eyebrow">本機單人 <span>02 / 島嶼建造</span></div><h1>遊戲大廳</h1><p className="lobby-brand-title">自己的島，自己蓋。</p><div className="lobby-profile"><strong>島嶼旅人</strong><span className="local-label">{blocks.length} 個建造方塊</span></div><div className="lobby-actions"><Button className="start-game" disabled={!ready || !loaded} onClick={() => { setReady(false); setStarted(true); setHelp(true); }}><Play />進入漂浮島嶼</Button></div><p className="lobby-status">單人測試版・僅本機保存・線上功能開發中</p><p className="panel-note">{saveState}</p></main>}
    {started && !failed && <>
      <div className="world-location"><span>漂浮島嶼・{blocks.length} 方塊</span><strong>{saveState}</strong></div>
      <div className="sandbox-commands"><Button variant="outline" size="icon" aria-label="操作提示" title="操作提示" onClick={() => setHelp(true)}><HelpCircle /></Button><Button variant="outline" size="icon" aria-label="儲存世界" title="儲存世界" onClick={() => { if (save()) setNotice('世界已儲存，重新整理後可繼續建造。'); }}><Save /></Button><Button variant="outline" size="icon" aria-label="重置世界" title="重置世界" onClick={() => setReset(true)}><RotateCcw /></Button></div>
      <div className="camera-zone sandbox-camera" aria-label="拖曳調整鏡頭" onPointerDown={e => { if (camera.current) return; camera.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { const p = camera.current; if (!p || p.id !== e.pointerId) return; controls.yaw -= (e.clientX - p.x) * .006; controls.pitch = Math.max(.12, Math.min(1, controls.pitch + (e.clientY - p.y) * .004)); p.x = e.clientX; p.y = e.clientY; }} onPointerUp={e => { if (camera.current?.id === e.pointerId) camera.current = null; }} onPointerCancel={() => { camera.current = null; }} />
      <div className="sandbox-target">{aim ? `建造目標 ${aim.x + 1}・${aim.z + 1}` : '走近中央網格即可建造'}</div>
      <div className="sandbox-hotbar" role="group" aria-label="快捷工具列">{TOOLS.map((t, i) => <Button key={t.kind} variant={tool === t.kind ? 'default' : 'outline'} aria-label={`選擇${t.label}`} aria-pressed={tool === t.kind} onClick={() => setTool(t.kind)}><span className={`block-swatch swatch-${t.kind}`} /><span>{t.label}</span><small>{i + 1}</small></Button>)}</div>
      <div className="touch-stick" role="group" aria-label="移動搖桿" onPointerDown={e => { if (stickId.current !== null) return; stickId.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={move} onPointerUp={release} onPointerCancel={release}><span className="stick-cross">＋</span><span className="stick-thumb" ref={stick} /><span className="stick-label">移動</span></div>
      <div className="sandbox-actions"><Button variant="outline" aria-label="拆除方塊" onClick={() => act(true)}><Trash2 /><span>拆除</span></Button><Button aria-label="放置方塊" onClick={() => act(false)}><Plus /><span>放置</span></Button><Button variant="secondary" aria-label="跳躍" onClick={() => { controls.jump = true; }}><ArrowUp /><span>跳躍</span></Button></div>
    </>}
    {notice && <div className="game-toast" role="status">{notice}</div>}
    {help && !failed && <div className="game-modal-backdrop"><section className="game-modal sandbox-help" role="dialog" aria-modal="true" aria-labelledby="sandbox-help-title"><Button variant="ghost" size="icon" className="modal-close" aria-label="關閉操作提示" onClick={() => setHelp(false)}><X /></Button><span className="panel-kicker">本機單人測試版</span><h2 id="sandbox-help-title">先蓋一間小厝吧！</h2><ul><li>WASD／方向鍵或左下搖桿移動；空白鍵／跳躍按鈕跳躍。</li><li>拖曳島嶼畫面轉動鏡頭；黃色標記是前方建造位置。</li><li>走近中央網格，用 1／2／3 切換方塊；E 放置、Q 拆除，也可點右下按鈕。</li><li>重複放置堆高牆面（最多四層），保留門口；最上層橫排方塊可做屋頂。</li><li>世界自動儲存在這台瀏覽器，也可按儲存。清除瀏覽器資料將失去世界；尚無雲端分享或多人連線。</li></ul><Button className="w-full" onClick={() => setHelp(false)}><Play />開始探索</Button></section></div>}
    {reset && <div className="game-modal-backdrop"><section className="game-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title"><h2 id="reset-title">重置世界？</h2><p className="panel-note">你蓋的方塊與本機存檔將替換為初始島嶼，無法復原。</p><div className="flex gap-3"><Button variant="outline" onClick={() => setReset(false)}>取消</Button><Button variant="destructive" onClick={() => { setBlocks(initialWorld()); setReset(false); setNotice('已重置世界，正在保存初始島嶼。'); }}>確認重置</Button></div></section></div>}
    {failed && <div className="game-fallback" role="alert"><h2>3D 畫面暫時無法使用</h2><p>{failed}</p><Button onClick={() => window.location.reload()}><RotateCcw />重新載入</Button><Button asChild variant="outline"><Link to="/">返回首頁</Link></Button></div>}
  </div>;
}