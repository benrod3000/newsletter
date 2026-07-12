export default function LoadingState({ label = "Loading" }) {
  return (
    <div className="border-brutal border-brutal-fg p-8 space-y-4">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-brutal-fg">
        {label}
      </p>

      <div className="space-y-2">
        <div className="h-3 bg-brutal-muted/30 animate-pulse border border-brutal-fg" />
        <div className="h-3 bg-brutal-muted/30 animate-pulse w-5/6 border border-brutal-fg" />
        <div className="h-3 bg-brutal-muted/30 animate-pulse w-2/3 border border-brutal-fg" />
      </div>
    </div>
  )
}