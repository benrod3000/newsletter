export default function Card({
  children,
  className = '',
  accent = false,
  accentColor = 'bg-brutal-yellow',
  hover = false,
  padding = 'p-5',
  ...props
}) {
  return (
    <div
      className={`border-3 border-brutal-fg bg-white
        ${accent ? `border-t-[6px] ${accentColor}` : ''}
        ${hover ? 'hover:shadow-brutal hover:-translate-y-0.5 transition-all' : ''}
        ${padding}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
