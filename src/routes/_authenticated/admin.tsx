import { createFileRoute } from '@tanstack/react-router';
import { Admin } from '@/components/admin/Admin';
export const Route=createFileRoute('/_authenticated/admin')({head:()=>({meta:[{title:'管理後台｜台灣2026廢遊戲'},{name:'description',content:'台灣2026廢遊戲管理員內容工作台。'},{property:'og:title',content:'管理後台｜台灣2026廢遊戲'},{property:'og:description',content:'公告、版本更新與活動管理。'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex,nofollow'}]}),component:Admin});
