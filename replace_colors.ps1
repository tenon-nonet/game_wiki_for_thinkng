$srcDir = "c:\Users\nonet\OneDrive\ドキュメント\game-wiki\frontend\src"
Get-ChildItem -Path $srcDir -Recurse -Include *.tsx,*.css | ForEach-Object {
  $c = Get-Content $_.FullName -Raw -Encoding UTF8
  $c = $c -replace 'indigo-600', 'red-800'
  $c = $c -replace 'indigo-500', 'red-700'
  $c = $c -replace 'indigo-400', 'red-500'
  $c = $c -replace 'indigo-300', 'red-400'
  $c = $c -replace 'indigo-900', 'red-950'
  $c = $c -replace 'bg-gray-950', 'bg-black'
  $c = $c -replace 'bg-gray-900', 'bg-zinc-900'
  $c = $c -replace 'bg-gray-800', 'bg-zinc-800'
  $c = $c -replace 'bg-gray-700', 'bg-zinc-700'
  [System.IO.File]::WriteAllText($_.FullName, $c, [System.Text.Encoding]::UTF8)
  Write-Host "Updated: $($_.Name)"
}
Write-Host "All done."
