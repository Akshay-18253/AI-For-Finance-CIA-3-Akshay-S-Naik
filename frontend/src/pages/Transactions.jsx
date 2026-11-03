import React from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { EmptyState } from '../components/common/Feedback'

export const Transactions = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#F1F5F9]">Transaction Ledger & History</h2>
      <EmptyState
        icon={ArrowLeftRight}
        title="Transaction Management Module"
        description="Comprehensive search, pagination, multi-faceted filtering, and detail inspector (Scheduled for Phase 5)."
      />
    </div>
  )
}
