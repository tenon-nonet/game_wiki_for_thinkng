type MessageOverlayProps = {
  message: string
  onClose: () => void
}

export default function MessageOverlay({ message, onClose }: MessageOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/76 px-4">
      <div className="w-full max-w-3xl">
        <div className="mx-auto bg-gradient-to-b from-zinc-800/80 via-zinc-900/90 to-black/90 px-8 py-7 text-center shadow-[0_12px_36px_rgba(0,0,0,0.65)] backdrop-blur-[1px]">
          <div className="mx-auto mb-4 h-px w-[92%] bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
          <p className="text-[1.35rem] sm:text-[1.7rem] leading-tight font-serif font-medium tracking-[0.1em] text-amber-100/95 drop-shadow-[0_0_6px_rgba(251,191,36,0.28)]">
            {message}
          </p>
          <div className="mx-auto mt-4 h-px w-[92%] bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
        </div>
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-amber-100/55 bg-black/70 px-10 py-2 text-sm font-medium tracking-[0.18em] text-amber-50 hover:bg-black/85"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
