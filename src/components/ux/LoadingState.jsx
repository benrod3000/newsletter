export default function LoadingState({ label = "Loading" }) {
  return (
    <div className="border-3 border-brutal-fg bg-white p-8 space-y-6" role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 bg-brutal-fg animate-skeleton" />
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-brutal-fg/50">
          {label}
        </p>
      </div>

      <div className="space-y-3" aria-hidden="true">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-4/6" />
      </div>

      <div className="space-y-3 pt-2">
        <div className="skeleton h-10 w-full" />
        <div className="skeleton h-10 w-full" />
        <div className="skeleton h-10 w-3/4" />
      </div>
    </div>
  )
}