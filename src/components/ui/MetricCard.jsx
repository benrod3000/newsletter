/*
  The value used to sit beside the change indicator in a bare
  `flex items-end justify-between` with no gap, no min-w-0 and no shrink guard,
  at `.text-stat`'s clamp(2.5rem, 5vw, 4.5rem). That size tracks the *viewport*
  while the card tracks the *grid container*, so the two scale independently and
  there is no width at which they are guaranteed to fit - "10,310" is one
  unbreakable token, so it could not shrink and ran through the indicator.

  Both halves are now measured against the card itself: `cqi` sizes the number
  to its own container, and below 16rem of card the two stack instead of
  competing for one row. At lg:grid-cols-4 a card is ~124px wide, which is never
  enough for a stat and a delta side by side.
*/
export default function MetricCard({ label, value, trend, trendUp, change, accentColor = 'border-t-brutal-yellow', className = '' }) {
  return (
    <div className={`@container border-3 border-brutal-fg bg-white p-6 hover:shadow-brutal transition border-t-[6px] ${accentColor} ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-3">{label}</p>
      <div className="flex flex-col gap-1 @min-[16rem]:flex-row @min-[16rem]:items-end @min-[16rem]:justify-between @min-[16rem]:gap-3">
        <p className="text-stat text-[clamp(1.75rem,16cqi,3rem)] text-brutal-fg min-w-0 truncate">{value}</p>
        {(trend || change) && (
          <span className={`text-xs font-bold shrink-0 ${trendUp ? 'text-brutal-green' : 'text-brutal-red'}`}>
            {trendUp ? '↑' : '↓'} {trend || change}
          </span>
        )}
      </div>
    </div>
  )
}
