import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Flame, Leaf, Pause, Play, Recycle, RotateCcw, Trophy, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import street from '@/assets/trash-street.jpg';
import { createRound, itemLimit, multiplier, ROUND_SECONDS, sortItem, tickRound, type Category } from './sim/sorting';

const BINS = [
  { category: 'general', label: '一般垃圾', key: '1', icon: Trash2, sample: '衛生紙・零食袋・陶瓷' },
  { category: 'recycling', label: '資源回收', key: '2', icon: Recycle, sample: '寶特瓶・鋁罐・報紙' },
  { category: 'food', label: '廚餘', key: '3', icon: Leaf, sample: '果皮・果核・剩飯' },
] as const;
type Mode = 'lobby' | 'playing' | 'results';
export default function SortingGame() {
  const [mode, setMode] = useState<Mode>('lobby');
  const [round, setRound] = useState(() => createRound(() => 0));
  const [paused, setPaused] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [feedback, setFeedback] = useState<{ good: boolean; text: string } | null>(null);
  const live = useRef(round);
  live.current = round;
  const last = useRef(0);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const start = useCallback(() => { const next = createRound(); live.current = next; setRound(next); setFeedback(null); setPaused(false); setMode('playing'); last.current = performance.now(); }, []);
  const collect = useCallback((category: Category) => {
    if (mode !== 'playing' || paused || instructions || live.current.ended) return;
    const old = live.current;
    const good = old.item.category === category;
    const next = sortItem(old, category);
    live.current = next; setRound(next);
    setFeedback({ good, text: good ? `分類成功！+${next.score - old.score}` : `${old.item.name} → ${BINS.find(b => b.category === old.item.category)?.label}，−50 分` });
  }, [mode, paused, instructions]);
  useEffect(() => {
    if (mode !== 'playing' || paused || instructions) return;
    last.current = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(); const delta = (now - last.current) / 1000; last.current = now;
      const old = live.current; const next = tickRound(old, delta);
      live.current = next; setRound(next);
      if (next.missed > old.missed) setFeedback({ good: false, text: '沒追上垃圾車！連擊中斷。' });
      if (next.ended) setMode('results');
    }, 50);
    return () => window.clearInterval(timer);
  }, [mode, paused, instructions]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.repeat || instructions || e.target instanceof HTMLInputElement) return;
      const bin = BINS.find(b => e.code === `Digit${b.key}` || e.code === `Numpad${b.key}`);
      const arrowCategory = e.code === 'ArrowLeft' ? 'general' : e.code === 'ArrowDown' ? 'recycling' : e.code === 'ArrowRight' ? 'food' : null;
      if (mode === 'playing' && (bin || arrowCategory)) { e.preventDefault(); collect(bin?.category ?? arrowCategory ?? 'general'); }
      if (mode === 'playing' && (e.code === 'Escape' || e.code === 'KeyP')) { e.preventDefault(); setPaused(p => !p); }
    };
    const visibility = () => { if (document.hidden && mode === 'playing') setPaused(true); };
    const blur = () => { if (mode === 'playing') setPaused(true); };
    window.addEventListener('keydown', keydown); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); };
  }, [mode, collect, instructions]);
  useEffect(() => { if (!feedback) return; const timer = window.setTimeout(() => setFeedback(null), 1400); return () => clearTimeout(timer); }, [feedback]);
  useEffect(() => { if (mode === 'results') resultHeading.current?.focus(); }, [mode]);
  const remaining = Math.max(0, Math.ceil(ROUND_SECONDS - round.elapsed));
  const level = Math.min(4, 1 + Math.floor(round.elapsed / 15));
  const attempts = round.correct + round.wrong + round.missed;
  return <div className="sorting-shell">
    <header className="sorting-header">
      <Button asChild variant="ghost" size="icon" title="返回官網" aria-label="返回官網"><Link to="/"><ArrowLeft /></Link></Button>
      <Link to="/" className="sorting-wordmark">台灣 2026 廢遊戲<span>垃圾分類街機</span></Link>
      <span className="sorting-badge">試玩版</span>
      <div className="sorting-header-actions"><Button variant="ghost" size="icon" title="玩法說明" aria-label="玩法說明" onClick={() => setInstructions(true)}><BookOpen /></Button>{mode === 'playing' && <Button variant="ghost" size="icon" title="暫停" aria-label="暫停" onClick={() => setPaused(true)}><Pause /></Button>}</div>
    </header>
    <main className={`sorting-main sorting-${mode}`}>
      {mode === 'lobby' ? <>
        <section className="sorting-lobby-scene"><img src={street} width={1536} height={1024} alt="台灣街頭的黃色垃圾車與三種分類桶" /><div className="sorting-lobby-copy"><span className="sorting-kicker">街頭任務 01 ／ 垃圾車來了</span><h1>台灣 2026<br />廢遊戲<span>垃圾不落地，連擊不客氣。</span></h1><div className="sorting-lobby-cta"><Button onClick={start} className="sorting-start"><Play />開始遊玩<ArrowRight /></Button><Button variant="outline" onClick={() => setInstructions(true)}><BookOpen />玩法說明</Button></div></div><span className="sorting-scene-tag">今日任務：當個分類狠角色。</span></section>
        <section className="sorting-lobby-bottom"><div><Clock3 /><strong>60 秒</strong><span>垃圾車不等人</span></div><div><Recycle /><strong>3 種分類</strong><span>分對才是王道</span></div><div><Flame /><strong>連擊 × 4</strong><span>越準，越有分</span></div></section>
        <p className="sorting-local-note">單人本機試玩・不需帳號・不需付費</p>
      </> : mode === 'results' ? <section className="sorting-results"><Trophy className="sorting-trophy" /><span className="sorting-kicker">垃圾車收工了 ／ 挑戰完成</span><h1 tabIndex={-1} ref={resultHeading}>{round.correct >= 25 ? '你是分類里長伯！' : round.correct >= 10 ? '巷口分類小能手！' : '明天再追一次垃圾車！'}</h1><span className="sorting-result-score">{round.score.toLocaleString()}<small>總分</small></span><div className="sorting-result-stats"><div><strong>{round.correct}</strong><span>正確分類</span></div><div><strong>{round.bestCombo}</strong><span>最高連擊</span></div><div><strong>{attempts ? Math.round(round.correct / attempts * 100) : 0}%</strong><span>分類成功率</span></div></div><p className="sorting-result-note">錯誤分類 {round.wrong} 次 ／ 沒收集到 {round.missed} 件</p><div className="sorting-result-actions"><Button className="sorting-start" onClick={start}><RotateCcw />再玩一次</Button><Button variant="outline" onClick={() => { setMode('lobby'); setFeedback(null); }}>返回大廳</Button></div></section> : <>
        <section className="sorting-hud" aria-label="遊戲狀態"><div className={remaining <= 10 ? 'sorting-time urgent' : 'sorting-time'}><Clock3 /><strong>{remaining.toString().padStart(2, '0')}</strong><span>秒</span></div><div className="sorting-score"><span>即時分數</span><strong data-testid="score">{round.score.toLocaleString()}</strong></div><div className="sorting-combo"><Flame /><strong data-testid="combo">{round.combo}</strong><span>連擊 <b>×{multiplier(round.combo)}</b></span></div></section>
        <div className="sorting-level"><span>街頭任務 ／ 垃圾車來了</span><strong>第 {level} 段・{level === 4 ? '火力全開' : level === 3 ? '手速加快' : level === 2 ? '垃圾變多了' : '暖身時間'}</strong></div>
        <section className="sorting-playfield" aria-label="待分類垃圾"><img className="sorting-street-strip" src={street} width={1536} height={1024} alt="" /><div className="sorting-item-area" key={round.sequence}><span className="sorting-item-label">收集這件垃圾</span><span className="sorting-item-emoji" role="img" aria-label={round.item.name}>{round.item.emoji}</span><h1 data-testid="current-item">{round.item.name}</h1><div className="sorting-item-timer" role="progressbar" aria-label="此垃圾剩餘收集時間" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(100 * Math.max(0, 1 - round.itemAge / itemLimit(round.elapsed)))}><span style={{ width: `${100 * Math.max(0, 1 - round.itemAge / itemLimit(round.elapsed))}%` }} /></div></div><div className={`sorting-feedback ${feedback ? feedback.good ? 'good' : 'bad' : ''}`} role="status">{feedback ? <>{feedback.good ? <Check /> : <X />}{feedback.text}</> : <span>垃圾已收集，送進正確的桶！</span>}</div></section>
        <section className="sorting-bins" aria-label="垃圾分類桶">{BINS.map(b => <Button key={b.category} variant="outline" className={`sorting-bin bin-${b.category}`} aria-label={`分類到${b.label}`} onClick={() => collect(b.category)} disabled={paused || instructions}><span className="sorting-bin-key">{b.key}</span><b.icon /><strong>{b.label}</strong><span className="sorting-bin-sample">{b.sample}</span><span className="sorting-bin-bottom">投進這桶 <ArrowRight /></span></Button>)}</section>
        <p className="sorting-keyboard-note">鍵盤 1 / 2 / 3 或 ← / ↓ / → 分類・P 暫停</p>
      </>}
    </main>
    <footer className="sorting-footer"><span>© 2026 台灣2026廢遊戲</span><span>分數不是金幣・無儲值</span></footer>
    <Dialog open={instructions} onOpenChange={setInstructions}><DialogContent className="sorting-dialog"><DialogTitle>垃圾車來了，怎麼玩？</DialogTitle><DialogDescription>60 秒內，把畫面上的垃圾收集到正確的分類桶。</DialogDescription><ol className="sorting-instructions"><li><b>看垃圾，選桶子。</b> 點分類桶，或按 1／2／3；方向鍵 ←／↓／→ 也可以。</li><li><b>正確 +100 分，錯誤 −50 分。</b> 每連續分對 5 件增加倍率，最高 ×4；分錯或來不及，連擊歸零。</li><li><b>垃圾車越開越快。</b> 每 15 秒提升難度，單件收集時間從 5 秒縮短到 2 秒。</li></ol><div className="sorting-examples">{BINS.map(b => <div key={b.category}><b.icon /><strong>{b.label}</strong><span>{b.sample}</span></div>)}</div><p className="text-sm text-muted-foreground">此為簡化遊戲規則；實際垃圾分類請依當地清潔隊公告。暫停或離開分頁時倒數暫停。</p><Button onClick={() => setInstructions(false)}>知道了</Button></DialogContent></Dialog>
    <Dialog open={paused && mode === 'playing' && !instructions} onOpenChange={setPaused}><DialogContent className="sorting-dialog"><DialogTitle>先喘口氣，垃圾車等你。</DialogTitle><DialogDescription>倒數已暫停，分數與連擊保留。</DialogDescription><Button onClick={() => setPaused(false)}><Play />繼續遊玩</Button><Button variant="outline" onClick={() => { setPaused(false); setMode('lobby'); }}>結束並返回大廳</Button></DialogContent></Dialog>
  </div>;
}