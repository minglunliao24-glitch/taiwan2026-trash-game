// Synthesized prototype cue: no downloaded recording is required.
export class GameAudio {
  private context?: AudioContext;
  play(enabled: boolean) {
    if (!enabled) return;
    try {
      this.context ??= new AudioContext();
      const ctx = this.context;
      void ctx.resume().catch(() => { /* Safari can lack an output device; keep the game playable. */ });
      const tone = ctx.createOscillator(); const gain = ctx.createGain();
      tone.type = 'sine'; tone.frequency.setValueAtTime(320, ctx.currentTime);
      tone.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + .12);
      gain.gain.setValueAtTime(.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .18);
      tone.connect(gain); gain.connect(ctx.destination); tone.start(); tone.stop(ctx.currentTime + .2);
    } catch { /* Unsupported audio never prevents playing. */ }
  }
  dispose() { void this.context?.close().catch(() => {}); }
}