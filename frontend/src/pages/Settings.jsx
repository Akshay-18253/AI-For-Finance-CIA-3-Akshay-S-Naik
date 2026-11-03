import React from 'react'
import { Sliders } from 'lucide-react'
import { EmptyState } from '../components/common/Feedback'

export const Settings = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#F1F5F9]">System Settings & Scoring Thresholds</h2>
      <EmptyState
        icon={Sliders}
        title="Configuration Workspace"
        description="Threshold management (Low, Medium, High risk cutoffs), API connection options, and system telemetry (Scheduled for Phase 5)."
      />
    </div>
  )
}
