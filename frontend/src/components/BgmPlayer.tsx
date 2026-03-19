import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY_VOLUME = 'bgm_volume'

export default function BgmPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME)
    return saved !== null ? parseFloat(saved) : 0.4
  })
  const [showVolume, setShowVolume] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    audio.loop = true
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
    localStorage.setItem(STORAGE_KEY_VOLUME, String(volume))
  }, [volume])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      try {
        await audio.play()
        setPlaying(true)
      } catch {
        // autoplay blocked
      }
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {showVolume && (
        <div className="flex items-center gap-2 rounded-full bg-zinc-900/90 border border-zinc-700 px-3 py-2 shadow-lg backdrop-blur">
          <svg className="w-3 h-3 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-amber-400"
          />
        </div>
      )}
      <div className="flex items-center gap-1 rounded-full bg-zinc-900/90 border border-zinc-700 shadow-lg backdrop-blur overflow-hidden">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-10 h-10 text-amber-400 hover:text-amber-300 hover:bg-zinc-800 transition"
          title={playing ? '一時停止' : '再生'}
        >
          {playing ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
        <button
          onClick={() => setShowVolume((v) => !v)}
          className="flex items-center justify-center w-8 h-10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          title="音量"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            {volume === 0 ? (
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            ) : volume < 0.5 ? (
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            ) : (
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            )}
          </svg>
        </button>
      </div>
      <audio ref={audioRef} src="/bgm.mp3" preload="none" />
    </div>
  )
}
