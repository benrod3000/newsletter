import { useAuthStore } from '../../stores/authStore'
import { useRef } from 'react'
import { useReveal } from '../../App'
import DashboardLayout from '../../layouts/DashboardLayout'

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">
        {label}
      </p>
      <p className="text-2xl font-bold mt-2">
        {value}
      </p>
    </div>
  )
}

export default function DashboardHome() {
  const { email, workspaceId } = useAuthStore()
  const ref = useRef(null)

  useReveal(ref, {
    y: 10,
    duration: 0.6,
    stagger: 0.06,
  })

  return (
    <DashboardLayout
      title="Dashboard"
      description="Overview of your workspace activity"
    >
      <div ref={ref} className="space-y-10">

        {/* KPI GRID */}
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard label="Total Subscribers" value="—" />
          <StatCard label="Campaigns Sent" value="—" />
          <StatCard label="Avg Open Rate" value="—" />
          <StatCard label="Avg Click Rate" value="—" />
        </div>

        {/* WORKSPACE INFO */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
          <h3 className="font-bold mb-4 text-white">
            Workspace Info
          </h3>

          <p className="text-sm text-zinc-400">
            <strong>Email:</strong> {email}
          </p>

          <p className="text-sm text-zinc-400 mt-2">
            <strong>Workspace ID:</strong> {workspaceId}
          </p>
        </div>

      </div>
    </DashboardLayout>
  )
}
