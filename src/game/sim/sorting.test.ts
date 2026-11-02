import { describe, expect, it } from 'vitest';
import { createRound, itemLimit, sortItem, tickRound } from './sorting';
const first = () => 0;
describe('garbage sorting round', () => {
  it('ends at exactly 60 seconds and ignores further input', () => { const end = tickRound(createRound(first), 60, first); expect(end.elapsed).toBe(60); expect(end.ended).toBe(true); expect(sortItem(end, 'general', first)).toBe(end); });
  it('awards 100 points for a correct category', () => { const s = sortItem(createRound(first), 'general', first); expect(s.score).toBe(100); expect(s.correct).toBe(1); expect(s.combo).toBe(1); });
  it('subtracts 50 on a mistake and breaks the combo', () => { const s = sortItem(sortItem(createRound(first), 'general', first), 'food', first); expect(s.score).toBe(50); expect(s.combo).toBe(0); expect(s.wrong).toBe(1); });
  it('never makes the score negative', () => { expect(sortItem(createRound(first), 'food', first).score).toBe(0); });
  it('awards double points starting with the fifth consecutive correct item', () => { let s = createRound(first); for (let i = 0; i < 5; i++) s = sortItem(s, 'general', first); expect(s.score).toBe(600); expect(s.bestCombo).toBe(5); });
  it('missed collection breaks a combo and spawns the next item', () => { const s = tickRound(sortItem(createRound(first), 'general', first), 5, first); expect(s.combo).toBe(0); expect(s.missed).toBe(1); expect(s.sequence).toBe(2); });
  it('increases difficulty every 15 seconds', () => { expect([0,15,30,45].map(itemLimit)).toEqual([5,4,3,2]); });
  it('handles large elapsed time and level boundaries', () => { const s = tickRound(createRound(first), 46, first); expect(s.elapsed).toBe(46); expect(s.missed).toBeGreaterThan(10); expect(s.ended).toBe(false); });
});