import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const STEPS = [
  {
    key: 'catalog',
    title: '目録',
    subtitle: 'CATALOG',
    description: 'ゲーム内の全アイテム・ボス・NPCを一覧で確認できる\n未登録のものに情報を追加したり、既存の情報の編集もできる',
    link: '/catalog',
    linkLabel: '目録を見る →',
    videoSrc: '/tutorials/catalog.mp4',
  },
  {
    key: 'encyclopedia',
    title: '図録',
    subtitle: 'ENCYCLOPEDIA',
    description: '収録された画像と情報をカード形式で閲覧できる\nコメントの投稿や、説明の編集、画像の差し替えも可能',
    link: '/items',
    linkLabel: '図録を見る →',
    videoSrc: '/tutorials/encyclopedia.mp4',
  },
  {
    key: 'graph',
    title: '相関図',
    subtitle: 'RELATION GRAPH',
    description: 'ボスやNPCの相関図を作成できる\n組織・協力・敵対などの関係を線で結び、全てを俯瞰できる',
    link: '/relation-graph',
    linkLabel: '相関図を見る →',
    videoSrc: '/tutorials/graph.mp4',
  },
  {
    key: 'board',
    title: '掲示板',
    subtitle: 'BOARDS',
    description: 'ゲームごとの掲示板と総合掲示板を用意している\nなんでも好きなことを書き込めるが、荒らしはやめてね',
    link: '/boards',
    linkLabel: '掲示板を見る →',
    videoSrc: '/tutorials/board.mp4',
  },
]

const STORAGE_KEY = 'fromdex_tutorial_seen'

type Props = {
  forceOpen?: boolean
  onClose?: () => void
}

export default function TutorialModal({ forceOpen, onClose }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (forceOpen) {
      setOpen(true)
      setStep(0)
      return
    }
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true)
    }
  }, [forceOpen])

  const close = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
    onClose?.()
  }

  if (!open) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="relative w-full max-w-xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">

        {/* 閉じるボタン */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 text-zinc-500 hover:text-zinc-200 transition text-xl leading-none"
          aria-label="閉じる"
        >
          ✕
        </button>

        {/* ヘッダー */}
        <div className="px-6 pt-5 pb-3 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium tracking-[0.28em] text-zinc-500">FROMDEX GUIDE</p>
            <h2 className="text-base font-semibold text-zinc-100 mt-0.5">サイトの使い方</h2>
          </div>
          <span className="text-xs text-zinc-500">{step + 1} / {STEPS.length}</span>
        </div>

        {/* 動画エリア */}
        <div className="bg-zinc-950 w-full aspect-video flex items-center justify-center overflow-hidden">
          <video
            key={current.videoSrc}
            src={current.videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onTimeUpdate={(e) => { if (e.currentTarget.currentTime >= 10) e.currentTarget.currentTime = 0 }}
            onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none' }}
          />
          {/* 動画がない場合のフォールバック */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 pointer-events-none select-none">
            <p className="text-4xl mb-2 opacity-30">▶</p>
            <p className="text-xs tracking-widest opacity-30">VIDEO</p>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-5">
          <div className="mb-3">
            <p className="text-[10px] font-medium tracking-[0.24em] text-amber-400/80">{current.subtitle}</p>
            <h3 className="text-xl font-bold text-zinc-100 mt-0.5">{current.title}</h3>
          </div>
          <p className="text-sm leading-6 text-zinc-400 whitespace-pre-line">{current.description}</p>
          <Link
            to={current.link}
            onClick={close}
            className="mt-3 inline-block text-xs text-zinc-500 hover:text-zinc-300 transition underline underline-offset-2"
          >
            {current.linkLabel}
          </Link>
        </div>

        {/* フッター：ドット＋ボタン */}
        <div className="px-6 pb-5 flex items-center justify-between">
          {/* ステップドット */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition ${i === step ? 'bg-amber-400' : 'bg-zinc-700 hover:bg-zinc-500'}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-1.5 text-sm rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition"
              >
                前へ
              </button>
            )}
            {isLast ? (
              <button
                onClick={close}
                className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-1.5 text-sm font-semibold tracking-[0.06em] text-amber-50 shadow-[0_0_18px_rgba(245,158,11,0.14)] transition hover:border-amber-300/90 hover:text-white"
              >
                はじめる
              </button>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center justify-center rounded-md border border-amber-400/70 bg-gradient-to-b from-amber-300/30 via-amber-500/20 to-transparent px-5 py-1.5 text-sm font-semibold tracking-[0.06em] text-amber-50 shadow-[0_0_18px_rgba(245,158,11,0.14)] transition hover:border-amber-300/90 hover:text-white"
              >
                次へ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
