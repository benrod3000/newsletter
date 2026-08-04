import { useEffect } from 'react'
import { CHANGELOG } from '../../data/changelog'

export default function Changelog() {
  useEffect(() => { document.title = 'Changelog | Veloce' }, [])
  const entries = CHANGELOG

  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-heading uppercase tracking-tight leading-none">Changelog</h1>
      <div className="h-1 w-16 bg-brutal-yellow border-2 border-brutal-fg" />
      <p className="text-sm text-brutal-fg/70">Small improvements every week. Cleaner features. A smoother experience.</p>

      <div className="space-y-10">
        {entries.map((entry) => (
          <div key={entry.date}>
            <h2 className="font-heading text-xl uppercase tracking-wide text-brutal-green">{entry.date}</h2>
            <div className="mt-3 space-y-4">
              {entry.items.map((item, i) => (
                <div key={i}>
                  <h3 className="text-sm font-heading uppercase tracking-wide text-brutal-fg">{item.title}</h3>
                  <p className="mt-1 text-sm text-brutal-fg/70">{item.body}</p>
                  {item.list && (
                    <ul className="mt-2 space-y-1">
                      {item.list.map((li, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-brutal-fg/70">
                          <span className="text-brutal-green mt-1 shrink-0">→</span>
                          {li}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
