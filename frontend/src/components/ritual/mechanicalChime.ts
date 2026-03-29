/** 短促机械感提示音（需用户已与页面交互后浏览器才允许播放） */
export function playMechanicalChime(freq = 980, durationSec = 0.07, gain = 0.04) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = "triangle"
    osc.frequency.value = freq
    g.gain.value = gain
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + durationSec)
  } catch {
    /* ignore */
  }
}

export function playSettlementChime() {
  playMechanicalChime(720, 0.12, 0.028)
}
