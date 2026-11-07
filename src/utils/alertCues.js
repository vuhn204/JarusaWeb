let audio = null

const getAudio = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!audio) audio = new AudioCtx()
  if (audio.state === 'suspended') audio.resume().catch(() => null)
  return audio
}

const tone = (ctx, freq, start, duration, volume = 0.12) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + start
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

export const primeAudio = () => {
  try {
    getAudio()
  } catch {
    return
  }
}

export const playCue = (type) => {
  try {
    const ctx = getAudio()
    if (!ctx) return
    if (type === 'err') {
      tone(ctx, 440, 0, 0.16)
      tone(ctx, 330, 0.2, 0.22)
    } else {
      tone(ctx, 880, 0, 0.14)
    }
  } catch {
    return
  }
}

export const canVibrate = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

export const vibrateCue = (type) => {
  if (!canVibrate()) return
  navigator.vibrate(type === 'err' ? [120, 60, 120] : [60])
}
