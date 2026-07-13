export default function Panel({ children, className = '', title, accent = 'bg-brutal-yellow' }) {
  return (
    <div className={`border-3 border-brutal-fg bg-white ${className}`}>
      {title && (
        <div className={`border-b-3 border-brutal-fg ${accent} px-6 py-3`}>
          <p className="text-xs font-bold uppercase tracking-wider">{title}</p>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
