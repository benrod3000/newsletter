export default function EmptyState({
  title = "Nothing here",
  description = "There is no data to display yet.",
  icon = "□",
  action,
}) {
  return (
    <div className="border-3 border-brutal-fg bg-white p-10 text-center space-y-5 animate-fade-up">
      <div className="text-4xl text-brutal-muted/40 font-heading">{icon}</div>

      <div className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brutal-fg">
          {title}
        </p>
        <p className="text-xs text-brutal-muted max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {action && (
        <div className="pt-2">
          <button
            onClick={action.onClick}
            className="px-5 py-2.5 border-3 border-brutal-fg bg-brutal-yellow text-brutal-fg font-bold text-xs uppercase tracking-wider hover:shadow-brutal active:translate-y-0.5 transition"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  )
}