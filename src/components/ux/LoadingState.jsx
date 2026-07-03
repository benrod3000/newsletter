export default function LoadingState({ label = "Loading" }) {
  return (
    <div className="border border-zinc-800 p-6 space-y-3">
      <p className="text-xs uppercase tracking-widest text-zinc-500">
        {label}
      </p>

      <div className="space-y-2">
        <div className="h-2 bg-zinc-800 animate-pulse" />
        <div className="h-2 bg-zinc-800 animate-pulse w-5/6" />
        <div className="h-2 bg-zinc-800 animate-pulse w-2/3" />
      </div>
    </div>
  )
}