export default function Annotation({ children, className = '' }) {
  return (
    <p className={`annotation font-mono text-[11px] text-brutal-muted tracking-tight ${className}`}>
      <span className="text-brutal-green/70">{'// '}</span>
      {children}
      <span className="term-cursor text-brutal-green">▍</span>
    </p>
  )
}
