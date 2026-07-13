export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-white border-brutal-fg text-brutal-fg',
    yellow: 'bg-brutal-yellow border-brutal-fg text-brutal-fg',
    green: 'bg-brutal-green border-brutal-fg text-white',
    red: 'bg-brutal-red border-brutal-fg text-white',
    muted: 'bg-brutal-surface border-brutal-fg text-brutal-muted',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 border-2 text-[10px] font-bold uppercase tracking-wider ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  )
}
