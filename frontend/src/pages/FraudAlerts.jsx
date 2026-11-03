import React from 'react'
import { ShieldAlert } from 'lucide-react'
import { EmptyState } from '../components/common/Feedback'

export const FraudAlerts = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#F1F5F9]">Fraud Alert Monitoring Center</h2>
      <EmptyState
        icon={ShieldAlert}
        title="Alert Management & Review Center"
        description="Suspicious transactions triage, analyst status workflow (Under Review, Confirmed Fraud, False Positive) (Scheduled for Phase 5)."
      />
    </div>
  )
}
