import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  RefreshCw,
  Shield,
  ShieldAlert,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { getAlerts, updateAlertStatus } from '../services/api'
import { Card } from '../components/common/Card'
import { RiskBadge, StatusBadge } from '../components/common/Badge'
import { LoadingSpinner, EmptyState } from '../components/common/Feedback'

export const FraudAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [severity, setSeverity] = useState('ALL')
  const [reviewStatus, setReviewStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionInProgress, setActionInProgress] = useState({})

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const data = await getAlerts({
        page,
        page_size: pageSize,
        severity: severity !== 'ALL' ? severity : undefined,
        review_status: reviewStatus !== 'ALL' ? reviewStatus : undefined,
      })
      setAlerts(data.alerts || [])
      setTotal(data.total || 0)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Failed to fetch fraud alerts:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [page, pageSize, severity, reviewStatus])

  const handleUpdateStatus = async (txnId, newStatus) => {
    try {
      setActionInProgress((prev) => ({ ...prev, [txnId]: true }))
      const updated = await updateAlertStatus(txnId, newStatus)
      setAlerts((prev) =>
        prev.map((a) =>
          a.transaction_id === txnId ? { ...a, review_status: updated.review_status } : a
        )
      )
    } catch (err) {
      console.error('Failed to update alert status:', err)
    } finally {
      setActionInProgress((prev) => ({ ...prev, [txnId]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Fraud Alert Monitoring Center
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Active alert triage queue for transactions exhibiting anomalous probability and rule deviations
          </p>
        </div>
        <button
          onClick={() => {
            setRefreshing(true)
            fetchAlerts()
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121B29] border border-[#253246] hover:border-[#3B82F6] text-xs font-medium text-[#F1F5F9] transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#3B82F6]' : ''}`} />
          Refresh Alerts
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#94A3B8] font-mono uppercase text-[11px] font-semibold flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Filter Alerts:
            </span>

            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-[#0E1520] p-1 rounded-lg border border-[#253246]">
              {['ALL', 'HIGH', 'MEDIUM'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => {
                    setSeverity(sev)
                    setPage(1)
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    severity === sev
                      ? 'bg-[#172335] text-[#F1F5F9] border border-[#3B82F6]/40'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  {sev === 'ALL' ? 'All Alerts' : `${sev} Risk`}
                </button>
              ))}
            </div>
          </div>

          {/* Review Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[#94A3B8] text-xs">Review Workflow:</span>
            <select
              value={reviewStatus}
              onChange={(e) => {
                setReviewStatus(e.target.value)
                setPage(1)
              }}
              className="bg-[#0E1520] border border-[#253246] rounded-lg px-2.5 py-1.5 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending Triage</option>
              <option value="Under Review">Under Active Review</option>
              <option value="Confirmed Fraud">Confirmed Fraud</option>
              <option value="False Positive">False Positive</option>
              <option value="Reviewed">Cleared / Reviewed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ALERTS QUEUE */}
      {loading ? (
        <LoadingSpinner label="Compiling active alert signals..." />
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All Alerts Triaged"
          description="No unreviewed suspicious incidents currently meet the selected filter criteria."
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const isProcessing = actionInProgress[alert.transaction_id]
            const isHigh = alert.risk_category === 'HIGH'

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-xl border transition-all ${
                  isHigh
                    ? 'bg-[#141A26] border-rose-500/30 hover:border-rose-500/60'
                    : 'bg-[#121B29] border-amber-500/30 hover:border-amber-500/60'
                }`}
              >
                {/* Header Row: ID, Amount, Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1F2B3E] gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isHigh ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
                      }`}
                    />
                    <div>
                      <span className="font-mono text-sm font-bold text-[#F1F5F9]">
                        {alert.transaction_id}
                      </span>
                      <span className="text-xs text-[#94A3B8] ml-2">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <RiskBadge category={alert.risk_category} score={alert.risk_score} />
                    <StatusBadge status={alert.review_status} />
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                  <div>
                    <span className="text-[#94A3B8] block text-[10px] uppercase font-mono">Amount</span>
                    <span className="font-mono text-base font-bold text-[#F1F5F9]">
                      ${alert.transaction_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#94A3B8] block text-[10px] uppercase font-mono">Channel / Merchant</span>
                    <span className="font-medium text-[#F1F5F9]">
                      {alert.transaction_type} • {alert.merchant_category}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#94A3B8] block text-[10px] uppercase font-mono">Fraud Probability</span>
                    <span className="font-mono font-semibold text-rose-400">
                      {((alert.fraud_probability || 0) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[#94A3B8] block text-[10px] uppercase font-mono">Security Context</span>
                    <span className="text-[#94A3B8]">
                      {alert.new_device ? 'New Device' : 'Known Device'} • {alert.location_distance} km away
                    </span>
                  </div>
                </div>

                {/* Suspicious Indicators Pill List */}
                {alert.suspicious_indicators && alert.suspicious_indicators.length > 0 && (
                  <div className="py-2">
                    <span className="text-[10px] uppercase font-mono text-[#94A3B8] block mb-1.5">
                      Triggered Risk Factors:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {alert.suspicious_indicators.map((ind, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-[#0E1520] border border-amber-500/20 text-amber-200 text-[11px] flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Triage Actions Footer */}
                <div className="pt-3 mt-2 border-t border-[#1F2B3E] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
                    Analyst Action Required:
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(alert.transaction_id, 'Under Review')}
                      disabled={isProcessing || alert.review_status === 'Under Review'}
                      className="px-3 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium disabled:opacity-40 transition-colors"
                    >
                      Under Review
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(alert.transaction_id, 'Confirmed Fraud')}
                      disabled={isProcessing || alert.review_status === 'Confirmed Fraud'}
                      className="px-3 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium disabled:opacity-40 transition-colors"
                    >
                      Confirm Fraud
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(alert.transaction_id, 'False Positive')}
                      disabled={isProcessing || alert.review_status === 'False Positive'}
                      className="px-3 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-medium disabled:opacity-40 transition-colors"
                    >
                      False Positive
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(alert.transaction_id, 'Reviewed')}
                      disabled={isProcessing || alert.review_status === 'Reviewed'}
                      className="px-3 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium disabled:opacity-40 transition-colors"
                    >
                      Clear Alert
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Pagination */}
          <div className="p-4 bg-[#0E1520] border border-[#253246] rounded-xl flex items-center justify-between text-xs">
            <span className="text-[#94A3B8]">
              Showing <span className="text-[#F1F5F9] font-mono font-bold">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="text-[#F1F5F9] font-mono font-bold">
                {Math.min(page * pageSize, total)}
              </span>{' '}
              of <span className="text-[#F1F5F9] font-mono font-bold">{total}</span> alerts
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded bg-[#172335] border border-[#253246] hover:border-[#3B82F6] text-[#F1F5F9] disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[#94A3B8]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded bg-[#172335] border border-[#253246] hover:border-[#3B82F6] text-[#F1F5F9] disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
