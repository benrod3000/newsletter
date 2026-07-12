export default function EmptyState({
  title = "Nothing here",
  description = "There is no data to display yet.",
  action,
}) {
  return (
    <div className="border-brutal border-brutal-fg bg-brutal-surface p-8 text-center space-y-4">
      <p className="text-sm font-bold uppercase tracking-[0.15em] text-brutal-fg">
        {title}
      </p>

      <p className="text-sm text-brutal-muted">
        {description}
      </p>

      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}