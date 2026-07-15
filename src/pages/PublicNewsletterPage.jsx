import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'https://newsletter-core.vercel.app'

export default function PublicNewsletterPage() {
  const { slug } = useParams()
  const [html, setHtml] = useState('')
  const [meta, setMeta] = useState({ title: '', error: false })

  useEffect(() => {
    if (!slug) return
    fetch(`${API_BASE}/newsletter/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Not found')
        const text = await res.text()
        const match = text.match(/<div class="content">([\s\S]*)<\/div>\s*<\/body>/i)
        const metaMatch = text.match(/<title>([^<]*)<\/title>/)
        const title = metaMatch ? metaMatch[1] : 'Newsletter'
        if (metaMatch) setMeta({ title, error: false })
        document.title = title
        setHtml(match ? match[1] : text)
      })
      .catch(() => {
        setMeta({ title: 'Not found', error: true })
        document.title = 'Not found | Veloce'
      })
  }, [slug])

  if (meta.error) {
    return (
      <main className="min-h-screen bg-brutal-bg flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-4xl font-heading uppercase tracking-tight">Not Found</h1>
          <p className="text-sm text-brutal-muted">This newsletter hasn't been published yet or doesn't exist.</p>
          <Link to="/" className="inline-block px-4 py-2 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal transition">
            ← Back to Veloce
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-[650px] mx-auto px-4 py-6">
        <div className="mb-8 border-b-2 border-gray-100 pb-4">
          <Link to="/" className="font-heading text-xl uppercase tracking-wider text-brutal-fg hover:text-brutal-green transition-colors">
            Veloce
          </Link>
        </div>
        {html ? (
          <article className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        )}
      </div>
    </main>
  )
}
