const rightsLines = [
  'ELDEN RING™ ©Bandai Namco Entertainment Inc. / ©FromSoftware, Inc.',
  'DARK SOULS™: REMASTERED ©Bandai Namco Entertainment Inc. / ©2011-2018 FromSoftware, Inc.',
  'DARK SOULS™ II: Scholar of the First Sin ©Bandai Namco Entertainment Inc. / ©2011-2018 FromSoftware, Inc.',
  'DARK SOULS™ III: The Fire Fades™ Edition ©Bandai Namco Entertainment Inc. / ©2011-2018 FromSoftware, Inc.',
  'Bloodborne™ ©2015 Sony Interactive Entertainment Inc. Developed by FromSoftware, Inc.',
]

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <p className="text-center text-sm text-zinc-300">
          本サイトは非公式ファンサイトです。各作品の権利は権利者に帰属します。
        </p>
        <div className="mx-auto mt-4 max-w-3xl space-y-1 text-center text-xs leading-4 text-zinc-500">
          {rightsLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </footer>
  )
}
