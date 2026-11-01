import { z } from 'zod';
export const kinds = ['announcement', 'release', 'event'] as const;
export const labels = { announcement: '公告', release: '版本更新', event: '活動' };
export const contentSchema = z.object({
 id: z.string().uuid(), kind: z.enum(kinds), title: z.string().trim().min(1).max(160), summary: z.string().max(500), body: z.string().max(50000),
 category: z.string().trim().min(1).max(60), status: z.enum(['draft','published']), pinned: z.boolean(), cover_path: z.string().nullable(),
 created_at: z.string().datetime({ offset: true }), published_at: z.string().datetime({ offset: true }).nullable(),
 starts_at: z.string().datetime({ offset: true }).nullable(), ends_at: z.string().datetime({ offset: true }).nullable(), location: z.string().max(500),
 registration_url: z.string().refine(v => !v || /^https?:\/\//.test(v) && URL.canParse(v), '報名連結必須使用 http 或 https'),
}).superRefine((v,ctx) => {
 if(v.status === 'published' && !v.published_at) ctx.addIssue({code:'custom',message:'發布日期必填',path:['published_at']});
 if(v.kind === 'event' && (!v.starts_at || !v.ends_at || Date.parse(v.ends_at)<=Date.parse(v.starts_at))) ctx.addIssue({code:'custom',message:'活動結束時間必須晚於開始時間',path:['ends_at']});
 if(v.cover_path && !v.cover_path.startsWith(`${v.id}/`)) ctx.addIssue({code:'custom',message:'封面路徑不正確',path:['cover_path']});
});
export type ContentInput = z.infer<typeof contentSchema>;
export function bootstrapEligible(expected: string | undefined, actual: string | undefined, confirmed: boolean) { return Boolean(expected?.trim() && actual && confirmed && expected.trim().toLowerCase() === actual.toLowerCase()); }
export function validateImage(file: { type: string; size: number }) { return ['image/jpeg','image/png','image/webp'].includes(file.type) && file.size > 0 && file.size <= 5*1024*1024; }
