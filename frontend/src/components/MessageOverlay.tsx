type MessageOverlayProps = {
  message: string
  onClose: () => void
  closeLabel?: string
}

export default function MessageOverlay({
  message,
  onClose,
  closeLabel = '閉じる',
}: MessageOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/68 px-4 backdrop-blur-md">
      <div className="w-full max-w-3xl">
        <div className="mx-auto rounded-sm bg-gradient-to-b from-zinc-800/68 via-zinc-900/76 to-black/82 px-8 py-7 text-center shadow-[0_18px_54px_rgba(0,0,0,0.62)] ring-1 ring-amber-100/8 backdrop-blur-xl">
          <div className="mx-auto mb-4 h-px w-[94%] bg-gradient-to-r from-transparent via-amber-200/52 to-transparent" />
          <p className="text-[1.35rem] leading-tight font-serif font-medium tracking-[0.1em] text-amber-100/95 drop-shadow-[0_0_6px_rgba(251,191,36,0.28)] sm:text-[1.7rem]">
            {message}
          </p>
          <div className="mx-auto mt-4 h-px w-[94%] bg-gradient-to-r from-transparent via-amber-200/52 to-transparent" />
        </div>
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-amber-100/55 bg-black/70 px-10 py-2 text-sm font-medium tracking-[0.18em] text-amber-50 hover:bg-black/85"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
