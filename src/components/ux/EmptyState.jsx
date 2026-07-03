export default function EmptyState({
  title = "Nothing here",
  description = "There is no data to display yet.",
  action,
}) {
  return (
    <div className="border border-zinc-800 p-6 text-center space-y-3">
      <p className="text-sm uppercase tracking-widest text-zinc-400">
        {title}
      </p>

      <p className="text-xs text-zinc-600">
        {description}
      </p>

      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}