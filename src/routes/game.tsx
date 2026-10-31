import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
const Game = lazy(() => import('@/game/Game'));
export const Route = createFileRoute('/game')({
  ssr: false,
  head: () => ({ meta: [
    { title: '遊戲大廳｜台灣2026廢遊戲' },
    { name: 'description', content: '進入台灣2026廢遊戲單人沙盒原型，探索漂浮島嶼、創建本機示範地圖。' },
    { property: 'og:title', content: '遊戲大廳｜台灣2026廢遊戲' },
    { property: 'og:description', content: '可試玩的 3D 島嶼與本機地圖編輯器，開發中，無付款或雲端分享。' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: GamePage,
});
function GamePage() { return <Suspense fallback={<div className="game-loading">遊戲載入中</div>}><Game /></Suspense>; }