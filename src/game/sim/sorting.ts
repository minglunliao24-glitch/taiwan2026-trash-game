export type Category = 'general' | 'recycling' | 'food';
export const ROUND_SECONDS = 60;
export const ITEMS = [
  { name: '用過的衛生紙', emoji: '🧻', category: 'general', note: '用過的紙，別讓回收桶哭哭。' },
  { name: '洋芋片包裝袋', emoji: '🍿', category: 'general', note: '零食吃完，包裝進一般垃圾。' },
  { name: '破掉的陶瓷杯', emoji: '☕', category: 'general', note: '陶瓷不是玻璃回收喔！' },
  { name: '空寶特瓶', emoji: '🧴', category: 'recycling', note: '倒空洗淨，回收再出發。' },
  { name: '空鋁罐', emoji: '🥫', category: 'recycling', note: '金屬罐，回收桶報到！' },
  { name: '乾淨的舊報紙', emoji: '📰', category: 'recycling', note: '乾淨紙類，可以再利用。' },
  { name: '香蕉皮', emoji: '🍌', category: 'food', note: '不是溜滑梯，是廚餘！' },
  { name: '蘋果果核', emoji: '🍎', category: 'food', note: '果核交給廚餘桶。' },
  { name: '剩下的白飯', emoji: '🍚', category: 'food', note: '下次少盛一點，阿嬤會開心。' },
] as const;
export type SortItem = typeof ITEMS[number];
export type Round = { elapsed: number; itemAge: number; item: SortItem; score: number; combo: number; bestCombo: number; correct: number; wrong: number; missed: number; ended: boolean; sequence: number };
export function pickItem(random = Math.random): SortItem { return ITEMS[Math.min(ITEMS.length - 1, Math.max(0, Math.floor(random() * ITEMS.length)))]; }
export function createRound(random = Math.random): Round { return { elapsed: 0, itemAge: 0, item: pickItem(random), score: 0, combo: 0, bestCombo: 0, correct: 0, wrong: 0, missed: 0, ended: false, sequence: 0 }; }
export function itemLimit(elapsed: number) { return Math.max(2, 5 - Math.floor(elapsed / 15)); }
export function multiplier(combo: number) { return Math.min(4, 1 + Math.floor(combo / 5)); }
export function sortItem(state: Round, category: Category, random = Math.random): Round {
  if (state.ended) return state;
  const correct = state.item.category === category;
  const combo = correct ? state.combo + 1 : 0;
  return { ...state, item: pickItem(random), itemAge: 0, sequence: state.sequence + 1, combo, bestCombo: Math.max(state.bestCombo, combo), score: correct ? state.score + 100 * multiplier(combo) : Math.max(0, state.score - 50), correct: state.correct + Number(correct), wrong: state.wrong + Number(!correct) };
}
export function tickRound(state: Round, seconds: number, random = Math.random): Round {
  if (state.ended || !Number.isFinite(seconds) || seconds <= 0) return state;
  let next = { ...state };
  let remaining = Math.min(seconds, ROUND_SECONDS - state.elapsed);
  while (remaining > 0 && !next.ended) {
    const limit = itemLimit(next.elapsed);
    const untilLevel = 15 - next.elapsed % 15;
    const step = Math.min(remaining, ROUND_SECONDS - next.elapsed, Math.max(0, limit - next.itemAge), untilLevel);
    next.elapsed += step; next.itemAge += step; remaining -= step;
    if (next.elapsed >= ROUND_SECONDS) { next.ended = true; break; }
    if (next.itemAge >= itemLimit(next.elapsed)) { next = { ...next, missed: next.missed + 1, combo: 0, itemAge: 0, item: pickItem(random), sequence: next.sequence + 1 }; }
  }
  return next;
}