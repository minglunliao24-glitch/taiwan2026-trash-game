import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
const Game = lazy(() => import('@/game/SortingGame'));
export const Route = createFileRoute('/game')({
  ssr: false,
  head: () => ({ meta: [
    { title: '垃圾分類街機｜台灣 2026 廢遊戲' },
    { name: 'description', content: '台灣 2026 廢遊戲：60 秒垃圾分類挑戰，收集垃圾、挑戰連擊，用鍵盤或觸控追上垃圾車！' },
    { property: 'og:title', content: '垃圾分類街機｜台灣 2026 廢遊戲' },
    { property: 'og:description', content: '一般垃圾、資源回收、廚餘，60 秒挑戰你的分類反應！免費本機試玩版。' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: GamePage,
});
function GamePage() { return <Suspense fallback={<div className="game-loading">遊戲載入中</div>}><Game /></Suspense>; }