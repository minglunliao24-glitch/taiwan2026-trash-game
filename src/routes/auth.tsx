import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { adminStatus } from '@/lib/cms/content.functions';
export const Route=createFileRoute('/auth')({head:()=>({meta:[{title:'管理員登入｜台灣2026廢遊戲'},{name:'description',content:'台灣2026廢遊戲網站管理員電子郵件登入。'},{property:'og:title',content:'管理員登入｜台灣2026廢遊戲'},{property:'og:description',content:'安全登入網站管理後台。'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex,nofollow'}]}),component:Auth});
function Auth(){const navigate=useNavigate();const qc=useQueryClient();const check=useServerFn(adminStatus);const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [signed,setSigned]=useState(false);
 useEffect(()=>{let live=true;supabase.auth.getUser().then(({data})=>{if(live)setSigned(Boolean(data.user));});return()=>{live=false;};},[]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const result=await supabase.auth.signInWithPassword({email,password});if(result.error)throw new Error('登入失敗，請確認電子郵件、密碼與帳號是否已啟用。');setPassword('');setSigned(true);await check();await navigate({to:'/admin'});}catch(e){setError(e instanceof Error?e.message:'登入失敗');}finally{setBusy(false);}}
 async function signOut(){await qc.cancelQueries();qc.clear();await supabase.auth.signOut();setSigned(false);}
 return <main className="min-h-screen px-4 py-14"><div className="mx-auto max-w-md"><Link to="/" className="font-bold text-primary">台灣2026廢遊戲</Link><h1 className="mt-8 text-3xl font-black">管理員登入</h1><p className="mt-3 mb-8 text-muted-foreground">僅限獲授權的網站管理員。</p>{signed?<div className="space-y-4"><p>目前已登入。</p><Button asChild><Link to="/admin">進入管理後台</Link></Button><Button variant="outline" onClick={signOut}>登出</Button></div>:<form onSubmit={submit} className="space-y-5"><label className="block font-bold">電子郵件<Input autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="block font-bold">密碼<Input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="text-destructive">{error}</p>}<Button disabled={busy} type="submit" className="w-full">{busy?'登入中…':'登入'}</Button></form>}<p className="mt-8 text-sm text-muted-foreground">帳號與首次授權請聯絡網站擁有者。</p><Button asChild variant="link" className="mt-4 px-0"><Link to="/">返回官網</Link></Button></div></main>;
}
