import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import heroIsland from "@/assets/hero-island.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "台灣2026廢遊戲｜打造你的世界（開發中預覽）" },
      { name: "description", content: "台灣2026廢遊戲：3D 沙盒島嶼，探索、創造地圖，未來支援多人連線。目前開發中，尚未開放。" },
      { property: "og:title", content: "台灣2026廢遊戲｜打造你的世界" },
      { property: "og:description", content: "3D 沙盒島嶼遊戲，開發中預覽網站，尚未正式上線。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const NAV = [
  { id: "intro", label: "遊戲介紹" },
  { id: "news", label: "最新公告" },
  { id: "vip", label: "VIP" },
  { id: "creator", label: "網紅認證" },
  { id: "official", label: "官方帳號" },
  { id: "support", label: "玩家支援" },
];

function Badge({ children, tone = "warning" }: { children: React.ReactNode; tone?: "warning" | "muted" | "primary" }) {
  const cls =
    tone === "warning"
      ? "bg-warning text-warning-foreground"
      : tone === "primary"
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{children}</span>;
}

function DisabledButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-2xl bg-muted px-6 font-bold text-muted-foreground"
    >
      {children}
    </button>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="font-display text-sm font-bold tracking-widest text-primary uppercase">{kicker}</p>
      <h2 className="mt-1 text-3xl font-black md:text-4xl">{title}</h2>
    </div>
  );
}

function ShieldCheck({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--official)" stopOpacity="0.75" />
          <stop offset="1" stopColor="var(--official)" />
        </linearGradient>
      </defs>
      <path d="M32 2 60 12v22c0 17-12 30-28 36C16 64 4 51 4 34V12Z" fill="url(#sg)" />
      <path d="M32 8 54 16v18c0 13-9 24-22 29C19 58 10 47 10 34V16Z" fill="var(--official-foreground)" opacity="0.15" />
      <path d="m20 36 8 8 17-18" fill="none" stroke="var(--official-foreground)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Index() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:p-3">
        跳至主要內容
      </a>

      <div className="bg-warning py-2 text-center text-sm font-bold text-warning-foreground">
        預覽測試版網站・遊戲開發中，尚未正式上線
      </div>

      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="主要導覽">
          <a href="#top" className="flex items-center gap-2 font-black">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-display text-primary-foreground shadow-block">26</span>
            <span className="text-lg">台灣2026廢遊戲</span>
          </a>
          <ul className="hidden gap-1 lg:flex">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="rounded-xl px-3 py-2 font-medium hover:bg-muted">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#play" className="hidden rounded-xl bg-sunset px-4 py-2 font-bold text-secondary-foreground shadow-block lg:inline-flex">
            遊戲入口
          </a>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl border lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "關閉選單" : "開啟選單"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-xl" aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </nav>
        {open && (
          <ul id="mobile-nav" className="border-t bg-background px-4 py-3 lg:hidden">
            {[...NAV, { id: "play", label: "遊戲入口" }].map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-medium hover:bg-muted">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </header>

      <main id="main">
        {/* Hero */}
        <section id="top" className="relative overflow-hidden bg-sky">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
            <div>
              <Badge>開發中・預覽版</Badge>
              <h1 className="mt-4 text-4xl leading-tight font-black md:text-6xl">
                打造<span className="text-brand-grad">你的世界</span>，
                <br />
                展開屬於你的冒險
              </h1>
              <p className="mt-5 max-w-md text-lg text-muted-foreground">
                在漂浮的 3D 沙盒島嶼上自由探索、蓋房子、設計地圖。台灣2026廢遊戲正在努力開發中。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#play" className="inline-flex min-h-12 items-center rounded-2xl bg-brand px-6 font-bold text-primary-foreground shadow-block">
                  查看遊戲入口
                </a>
                <a href="#intro" className="inline-flex min-h-12 items-center rounded-2xl border-2 border-foreground/15 bg-card px-6 font-bold">
                  了解遊戲
                </a>
              </div>
            </div>
            <img
              src={heroIsland}
              alt="漂浮在天空中的方塊風格 3D 島嶼，有房屋、樹木與瀑布"
              width={1280}
              height={960}
              className="float-slow w-full rounded-3xl shadow-soft"
            />
          </div>
        </section>

        {/* Intro */}
        <section id="intro" className="mx-auto max-w-6xl px-4 py-20">
          <SectionTitle kicker="About" title="遊戲介紹" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🏝️", t: "3D 沙盒島嶼", d: "每位玩家都從一座專屬的漂浮島嶼開始。" },
              { icon: "🧭", t: "自由探索", d: "山林、瀑布與隱藏角落，等你發現。" },
              { icon: "🧱", t: "創造地圖", d: "用方塊打造你的地圖，設計自己的玩法。", },
                 { icon: "🤝", t: "多人連線", d: "開發中；目前提供單人本機原型。", soon: true },
            ].map((f) => (
              <div key={f.t} className="rounded-3xl border bg-card p-6 shadow-soft">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-3xl" aria-hidden="true">{f.icon}</div>
                <h3 className="mt-4 text-xl font-bold">{f.t}</h3>
                <p className="mt-2 text-muted-foreground">{f.d}</p>
                {f.soon && <div className="mt-3"><Badge tone="muted">未來規劃</Badge></div>}
              </div>
            ))}
          </div>
        </section>

        {/* News */}
        <section id="news" className="bg-muted/60 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle kicker="News" title="最新公告" />
            <ul className="space-y-4">
              {[
                 { tag: "開發進度", t: "單人原型開放試玩", d: "遊戲入口可進入大廳與漂浮島嶼；目前為開發中本機示範，非正式版。" },
                 { tag: "開發進度", t: "本機地圖編輯器", d: "可放置與移除方塊、預覽地圖，儲存僅限這台裝置，尚無雲端分享。" },
                { tag: "規劃中", t: "VIP 與網紅認證制度規劃", d: "相關制度仍在規劃，目前不接受申請或付款。" },
              ].map((n) => (
                <li key={n.t} className="flex flex-col gap-2 rounded-2xl bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:gap-5">
                  <Badge tone={n.tag === "規劃中" ? "muted" : "warning"}>{n.tag}</Badge>
                  <div>
                    <h3 className="font-bold">{n.t}</h3>
                    <p className="text-muted-foreground">{n.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* VIP + Creator */}
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-20 md:grid-cols-2">
          <div id="vip" className="rounded-3xl bg-sunset p-8 text-secondary-foreground shadow-block">
            <p className="font-display text-sm font-bold tracking-widest uppercase">VIP</p>
            <h2 className="mt-1 text-3xl font-black">VIP 會員（規劃中）</h2>
            <p className="mt-4 text-5xl font-black font-display">NT$30<span className="text-lg font-bold"> / 月（預計）</span></p>
            <ul className="mt-4 list-disc space-y-1 pl-5">
              <li>VIP 方案尚未推出，內容仍可能調整</li>
              <li>目前不提供任何購買或付款功能</li>
              <li>正式推出前會另行公告</li>
            </ul>
            <div className="mt-6"><DisabledButton>尚未開放購買</DisabledButton></div>
          </div>
          <div id="creator" className="rounded-3xl border bg-card p-8 shadow-soft">
            <p className="font-display text-sm font-bold tracking-widest text-primary uppercase">Creator</p>
            <h2 className="mt-1 text-3xl font-black">網紅認證申請</h2>
            <div className="mt-3"><Badge tone="muted">規劃中・尚未開放申請</Badge></div>
            <p className="mt-4 text-muted-foreground">
              未來將提供內容創作者認證，讓玩家更容易辨識創作者帳號。申請資格與流程仍在規劃中，目前不受理任何申請。
            </p>
            <div className="mt-6"><DisabledButton>申請尚未開放</DisabledButton></div>
          </div>
        </section>

        {/* Official */}
        <section id="official" className="bg-muted/60 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <SectionTitle kicker="Official" title="官方帳號" />
            <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-card shadow-soft">
              <div className="h-24 bg-official-grad" />
              <div className="-mt-10 px-6 pb-6">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-card shadow-soft">
                  <ShieldCheck className="h-14 w-14" />
                </div>
                <h3 className="mt-3 flex items-center gap-2 text-2xl font-black">
                  台灣人會飛（官方）
                  <ShieldCheck className="h-6 w-6" />
                </h3>
                <p className="mt-2 text-muted-foreground">
                  台灣2026廢遊戲官方帳號，負責發布開發進度與公告。
                </p>
                <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  此區僅為官方帳號介紹展示，不提供登入或任何管理功能。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Play */}
        <section id="play" className="mx-auto max-w-6xl px-4 py-20">
          <div className="rounded-3xl bg-brand p-8 text-center text-primary-foreground shadow-block md:p-14">
            <h2 className="text-3xl font-black md:text-4xl">遊戲入口</h2>
             <p className="mx-auto mt-3 max-w-md opacity-90">單人 3D 島嶼原型可試玩。地圖與個人資料僅為本機示範，遊戲仍在開發中。</p>
            <div className="mt-8 flex justify-center">
               <Button asChild variant="outline" className="min-h-14 px-8 text-lg font-black text-foreground"><Link to="/game">進入遊戲大廳</Link></Button>
            </div>
          </div>
        </section>

        {/* Support */}
        <section id="support" className="mx-auto max-w-6xl px-4 pb-20">
          <SectionTitle kicker="Support" title="玩家支援" />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border bg-card p-6">
              <h3 className="text-xl font-bold">聯絡我們</h3>
              <p className="mt-2 text-muted-foreground">正式聯絡管道尚未公布，公布後會更新於此。</p>
              <div className="mt-4"><Badge tone="muted">聯絡方式準備中</Badge></div>
            </div>
            <div className="rounded-3xl border bg-card p-6">
              <h3 className="text-xl font-bold">常見問題</h3>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                 <li><b className="text-foreground">現在可以玩嗎？</b> 可試玩單人原型，正式遊戲開發中。</li>
                <li><b className="text-foreground">需要付費嗎？</b> 目前沒有任何付款功能。</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer id="privacy" className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
          <div>
            <p className="text-lg font-black">台灣2026廢遊戲</p>
            <p className="mt-1 text-sm text-muted-foreground">預覽測試版網站，尚未正式上線。</p>
          </div>
          <div>
            <p className="font-bold">隱私權說明</p>
             <p className="mt-1 text-sm text-muted-foreground">原型不提供真實帳號或付款。遊戲名稱、設定與示範地圖僅儲存在本機。正式隱私權政策準備中。</p>
          </div>
          <nav aria-label="頁尾導覽">
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {NAV.map((n) => (
                <li key={n.id}><a href={`#${n.id}`} className="hover:text-primary">{n.label}</a></li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="pb-6 text-center text-xs text-muted-foreground">© 2026 台灣2026廢遊戲・開發中</p>
      </footer>
    </div>
  );
}
