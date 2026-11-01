import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';
import { contentSchema, bootstrapEligible } from './validation';

export const publicContent = createServerFn({method:'GET'}).handler(async () => {
 const url=process.env['SUPABASE_URL']; const key=process.env['SUPABASE_PUBLISHABLE_KEY'];
 if(!url || !key) throw new Error('目前無法讀取公告');
 const db=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers); if(key.startsWith('sb_') && headers.get('Authorization')===`Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey',key); return fetch(input,{...init,headers});}}});
 const {data,error}=await db.from('site_content').select('*').eq('status','published').lte('published_at',new Date().toISOString()).order('pinned',{ascending:false}).order('published_at',{ascending:false});
 if(error) throw new Error('公告暫時無法載入，請稍後重試');
 return data;
});
export const adminStatus = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
 const {data,error}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
 if(error) throw new Error('無法驗證管理權限'); return Boolean(data);
});
export const bootstrapAdmin = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
 const {data,error}=await context.supabase.auth.getUser();
 if(error || !bootstrapEligible(process.env['ADMIN_BOOTSTRAP_EMAIL'],data.user?.email,Boolean(data.user?.email_confirmed_at))) throw new Error('尚未設定首次管理員電子郵件，或此帳號不符合授權條件。');
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 const result=await supabaseAdmin.rpc('bootstrap_admin',{_user_id:context.userId,_email:data.user?.email ?? ''});
 if(result.error || !result.data) throw new Error('首次授權已完成或無法授權，請由網站擁有者確認。');
 return true;
});
export const listContent=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
 const role=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'}); if(role.error || !role.data) throw new Error('沒有管理員權限');
 const {data,error}=await context.supabase.from('site_content').select('*').order('pinned',{ascending:false}).order('created_at',{ascending:false}); if(error) throw new Error('內容載入失敗'); return data;
});
export const saveContent=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>contentSchema.parse(input)).handler(async({context,data})=>{
 const role=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'}); if(role.error || !role.data) throw new Error('沒有管理員權限');
 const result=await context.supabase.from('site_content').upsert(data).select().single(); if(result.error) throw new Error('儲存失敗，請檢查日期與欄位後重試'); return result.data;
});
export const deleteContent=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>z.object({id:z.string().uuid()}).parse(input)).handler(async({context,data})=>{
 const role=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'}); if(role.error || !role.data) throw new Error('沒有管理員權限');
 const result=await context.supabase.from('site_content').delete().eq('id',data.id).select('id'); if(result.error || !result.data?.length) throw new Error('刪除失敗'); return true;
});
