export default function MetricCard({ label, value, trend, trendUp, className = '' }) {
  return (
    <div className={`border-3 border-brutal-fg bg-white p-6 hover:shadow-brutal transition ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-brutal-muted mb-3">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-stat text-brutal-fg leading-none">{value}</p>
        {trend && (
          <span className={`text-xs font-bold ${trendUp ? 'text-brutal-green' : 'text-brutal-red'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  )
}
