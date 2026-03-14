import { useEffect } from 'react'

type MetaOptions = {
  title: string
  description: string
}

const DEFAULT_OG_IMAGE = '/favicon_fromdex.png'

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value)
  })
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector)
  if (!element) {
    element = document.createElement('link')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value)
  })
}

export function excerpt(text?: string | null, maxLength = 120) {
  const normalized = text?.replace(/\s+/g, ' ').trim() ?? ''
  if (!normalized) return ''
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized
}

export function usePageMeta({ title, description }: MetaOptions) {
  useEffect(() => {
    document.title = title

    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: window.location.href })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_OG_IMAGE })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: DEFAULT_OG_IMAGE })
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: window.location.href })
  }, [description, title])
}
