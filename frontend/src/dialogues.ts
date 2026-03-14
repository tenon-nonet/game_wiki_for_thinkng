export interface DialogueEntry {
  label: string
  text: string
}

const DIALOGUE_SEPARATOR = '\t'

export function defaultDialogueLabel(index: number) {
  return `#${index + 1}`
}

export function parseDialogueLine(line: string, index: number): DialogueEntry {
  const trimmed = line.trim()
  if (!trimmed) {
    return { label: defaultDialogueLabel(index), text: '' }
  }

  const separatorIndex = trimmed.indexOf(DIALOGUE_SEPARATOR)
  if (separatorIndex === -1) {
    return { label: defaultDialogueLabel(index), text: trimmed }
  }

  const label = trimmed.slice(0, separatorIndex).trim() || defaultDialogueLabel(index)
  const text = trimmed.slice(separatorIndex + 1).trim()
  return { label, text }
}

export function parseDialogueLines(lines: string[] | undefined): DialogueEntry[] {
  if (!lines?.length) {
    return [{ label: defaultDialogueLabel(0), text: '' }]
  }

  return lines.map((line, index) => parseDialogueLine(line, index))
}

export function serializeDialogueEntries(entries: DialogueEntry[]): string[] {
  return entries
    .map((entry, index) => ({
      label: entry.label.trim() || defaultDialogueLabel(index),
      text: entry.text.trim(),
    }))
    .filter((entry) => entry.text)
    .map((entry) => `${entry.label}${DIALOGUE_SEPARATOR}${entry.text}`)
}
