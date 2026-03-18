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

const BASE_URL = 'https://fromdex.com'

// Schema.org JSON-LD structured data
export function useStructuredData(data: Record<string, unknown>) {
  useEffect(() => {
    const id = 'structured-data-jsonld'
    let script = document.head.querySelector<HTMLScriptElement>(`#${id}`)
    if (!script) {
      script = document.createElement('script')
      script.id = id
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data })
    return () => {
      document.head.querySelector(`#${id}`)?.remove()
    }
  }, [data])
}

export function useGameStructuredData(opts: { id: number; name: string; description?: string; image?: string }) {
  useStructuredData({
    '@type': 'VideoGame',
    name: opts.name,
    description: opts.description ?? '',
    url: `${BASE_URL}/games/${opts.id}`,
    image: opts.image ? `${BASE_URL}${opts.image}` : undefined,
    publisher: { '@type': 'Organization', name: 'FromSoftware' },
  })
}

export function useCharacterStructuredData(opts: {
  type: 'boss' | 'npc'
  id: number
  name: string
  description?: string
  gameName?: string
  gameId?: number
}) {
  useStructuredData({
    '@type': 'WebPage',
    name: `${opts.name} | FROMDEX.com`,
    description: opts.description ?? '',
    url: `${BASE_URL}/${opts.type === 'boss' ? 'bosses' : 'npcs'}/${opts.id}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'FROMDEX', item: BASE_URL },
        ...(opts.gameName && opts.gameId
          ? [{ '@type': 'ListItem', position: 2, name: opts.gameName, item: `${BASE_URL}/games/${opts.gameId}` }]
          : []),
        { '@type': 'ListItem', position: opts.gameId ? 3 : 2, name: opts.name },
      ],
    },
  })
}

export function useItemStructuredData(opts: {
  id: number
  name: string
  description?: string
  gameName?: string
  gameId?: number
}) {
  useStructuredData({
    '@type': 'WebPage',
    name: `${opts.name} | FROMDEX.com`,
    description: opts.description ?? '',
    url: `${BASE_URL}/items/${opts.id}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'FROMDEX', item: BASE_URL },
        ...(opts.gameName && opts.gameId
          ? [{ '@type': 'ListItem', position: 2, name: opts.gameName, item: `${BASE_URL}/games/${opts.gameId}` }]
          : []),
        { '@type': 'ListItem', position: opts.gameId ? 3 : 2, name: opts.name },
      ],
    },
  })
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
