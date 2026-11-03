import React from 'react'
import { LineChart } from 'lucide-react'
import { EmptyState } from '../components/common/Feedback'

export const Analytics = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#F1F5F9]">Risk Analytics & Portfolio Insights</h2>
      <EmptyState
        icon={LineChart}
        title="Deep-Dive Analytics Workspace"
        description="Multi-metric portfolio trends, channel distributions, and time-series breakdowns (Scheduled for Phase 5)."
      />
    </div>
  )
}
