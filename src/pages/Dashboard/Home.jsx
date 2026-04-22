import { useAuthStore } from '../../stores/authStore'

export default function DashboardHome() {
  const { email, workspaceId } = useAuthStore()

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      
      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60">
          <p className="text-xs font-medium uppercase text-zinc-500">Total Subscribers</p>
          <p className="text-2xl font-bold mt-2">—</p>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60">
          <p className="text-xs font-medium uppercase text-zinc-500">Campaigns Sent</p>
          <p className="text-2xl font-bold mt-2">—</p>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60">
          <p className="text-xs font-medium uppercase text-zinc-500">Avg Open Rate</p>
          <p className="text-2xl font-bold mt-2">—</p>
        </div>
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/60">
          <p className="text-xs font-medium uppercase text-zinc-500">Avg Click Rate</p>
          <p className="text-2xl font-bold mt-2">—</p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <h3 className="font-bold mb-4">Workspace Info</h3>
        <p className="text-sm text-zinc-400">
          <strong>Email:</strong> {email}
        </p>
        <p className="text-sm text-zinc-400 mt-2">
          <strong>Workspace ID:</strong> {workspaceId}
        </p>
      </div>
    </div>
  )
}
