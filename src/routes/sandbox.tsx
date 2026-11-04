import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
const Sandbox = lazy(() => import('@/game/Sandbox'));
export const Route = createFileRoute('/sandbox')({
  ssr: false,
  head: () => ({ meta: [
    { title: '漂浮島嶼單人測試版｜台灣2026廢遊戲' },
    { name: 'description', content: '探索漂浮島嶼、放置與拆除方塊，建造自己的世界。桌機與觸控操作，本機保存的單人沙盒測試版。' },
    { property: 'og:title', content: '漂浮島嶼單人測試版｜台灣2026廢遊戲' },
    { property: 'og:description', content: '自己的島，自己蓋。原創 3D 漂浮島嶼沙盒，僅本機單人測試，無多人與付款功能。' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: SandboxPage,
});
function SandboxPage() { return <Suspense fallback={<div className="game-loading" role="status">單人島嶼載入中</div>}><Sandbox /></Suspense>; }