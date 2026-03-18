import { useEffect, useRef, useState } from 'react'

const TEXT = 'FROMDEX'
const CHAR_DELAY = 160  // ms per character
const HOLD_AFTER = 700  // pause after all chars appear
const FADE_DURATION = 800 // ms for fade out

type Props = {
  onComplete: () => void
}

export default function IntroAnimation({ onComplete }: Props) {
  const [displayed, setDisplayed] = useState('')
  const [fading, setFading] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    let charIndex = 0
    const typeInterval = setInterval(() => {
      charIndex++
      setDisplayed(TEXT.slice(0, charIndex))
      if (charIndex >= TEXT.length) {
        clearInterval(typeInterval)
        setTimeout(() => setCursorVisible(false), HOLD_AFTER / 2)
        setTimeout(() => setFading(true), HOLD_AFTER)
        setTimeout(() => onCompleteRef.current(), HOLD_AFTER + FADE_DURATION)
      }
    }, CHAR_DELAY)

    return () => clearInterval(typeInterval)
  }, []) // マウント時のみ実行

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{
        opacity: fading ? 0 : 1,
        transition: fading ? `opacity ${FADE_DURATION}ms ease-in-out` : 'none',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <span className="font-mono font-bold tracking-[0.2em] text-white"
        style={{ fontSize: 'clamp(2.5rem, 10vw, 6rem)' }}
      >
        {displayed}
        {cursorVisible && (
          <span
            className="inline-block bg-white ml-1 align-middle animate-pulse"
            style={{ width: '0.1em', height: '0.9em' }}
          />
        )}
      </span>
    </div>
  )
}
