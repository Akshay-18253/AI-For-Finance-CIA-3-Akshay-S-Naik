import React, { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { getTransactions, getTransactionDetail, updateAlertStatus } from '../services/api'
import { Card } from '../components/common/Card'
import { RiskBadge, StatusBadge } from '../components/common/Badge'
import { LoadingSpinner, EmptyState } from '../components/common/Feedback'

export const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // Filters
  const [search, setSearch] = useState('')
  const [riskCategory, setRiskCategory] = useState('ALL')
  const [transactionType, setTransactionType] = useState('ALL')
  const [merchantCategory, setMerchantCategory] = useState('ALL')
  const [reviewStatus, setReviewStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modal Detail
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        risk_category: riskCategory !== 'ALL' ? riskCategory : undefined,
        transaction_type: transactionType !== 'ALL' ? transactionType : undefined,
        merchant_category: merchantCategory !== 'ALL' ? merchantCategory : undefined,
        review_status: reviewStatus !== 'ALL' ? reviewStatus : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }
      const data = await getTransactions(params)
      setTransactions(data.transactions || [])
      setTotal(data.total || 0)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, pageSize, riskCategory, transactionType, merchantCategory, reviewStatus, sortBy, sortOrder])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchTransactions()
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const handleOpenDetail = async (txnId) => {
    try {
      setModalLoading(true)
      const detail = await getTransactionDetail(txnId)
      setSelectedTxn(detail)
    } catch (err) {
      console.error('Failed to load transaction detail:', err)
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTxn) return
    try {
      setUpdatingStatus(true)
      const updated = await updateAlertStatus(selectedTxn.transaction_id, newStatus)
      setSelectedTxn((prev) => ({ ...prev, review_status: updated.review_status }))
      // Refresh row in table
      setTransactions((prev) =>
        prev.map((t) =>
          t.transaction_id === selectedTxn.transaction_id
            ? { ...t, review_status: updated.review_status }
            : t
        )
      )
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F1F5F9] tracking-tight">
            Transaction Ledger & Surveillance History
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Query, filter, and inspect financial transactions and machine learning risk evaluations
          </p>
        </div>
        <button
          onClick={() => {
            setRefreshing(true)
            fetchTransactions()
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121B29] border border-[#253246] hover:border-[#3B82F6] text-xs font-medium text-[#F1F5F9] transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#3B82F6]' : ''}`} />
          Refresh Ledger
        </button>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by TXN ID or merchant category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0E1520] border border-[#253246] rounded-lg pl-9 pr-20 py-2 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#172335] hover:bg-[#3B82F6] rounded text-[11px] font-medium text-[#F1F5F9] transition-colors"
            >
              Search
            </button>
          </form>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Risk filter */}
            <select
              value={riskCategory}
              onChange={(e) => {
                setRiskCategory(e.target.value)
                setPage(1)
              }}
              className="bg-[#0E1520] border border-[#253246] rounded-lg px-2.5 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>

            {/* Type filter */}
            <select
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value)
                setPage(1)
              }}
              className="bg-[#0E1520] border border-[#253246] rounded-lg px-2.5 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="ALL">All Types</option>
              <option value="Payment">Payment</option>
              <option value="Transfer">Transfer</option>
              <option value="Withdrawal">Withdrawal</option>
              <option value="Deposit">Deposit</option>
            </select>

            {/* Merchant filter */}
            <select
              value={merchantCategory}
              onChange={(e) => {
                setMerchantCategory(e.target.value)
                setPage(1)
              }}
              className="bg-[#0E1520] border border-[#253246] rounded-lg px-2.5 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="ALL">All Categories</option>
              <option value="Retail">Retail</option>
              <option value="Grocery">Grocery</option>
              <option value="Travel">Travel</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Electronics">Electronics</option>
              <option value="Online Services">Online Services</option>
              <option value="Other">Other</option>
            </select>

            {/* Review Status filter */}
            <select
              value={reviewStatus}
              onChange={(e) => {
                setReviewStatus(e.target.value)
                setPage(1)
              }}
              className="bg-[#0E1520] border border-[#253246] rounded-lg px-2.5 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6]"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Confirmed Fraud">Confirmed Fraud</option>
              <option value="False Positive">False Positive</option>
            </select>

            {/* Reset Filters */}
            {(riskCategory !== 'ALL' || transactionType !== 'ALL' || merchantCategory !== 'ALL' || reviewStatus !== 'ALL' || search) && (
              <button
                onClick={() => {
                  setRiskCategory('ALL')
                  setTransactionType('ALL')
                  setMerchantCategory('ALL')
                  setReviewStatus('ALL')
                  setSearch('')
                  setPage(1)
                }}
                className="px-2.5 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 text-xs transition-colors"
                title="Reset Filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Querying ledger records..." />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No Matching Transactions"
            description="Adjust your search query or filter settings to view transaction records."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E1520] text-[#94A3B8] border-b border-[#253246] uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                  <th
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-[#3B82F6] transition-colors"
                    onClick={() => handleSort('transaction_amount')}
                  >
                    <span className="flex items-center gap-1">
                      Amount ($)
                      {sortBy === 'transaction_amount' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </span>
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Channel / Category</th>
                  <th
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-[#3B82F6] transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    <span className="flex items-center gap-1">
                      Timestamp
                      {sortBy === 'created_at' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </span>
                  </th>
                  <th
                    className="py-3.5 px-4 font-semibold cursor-pointer hover:text-[#3B82F6] transition-colors"
                    onClick={() => handleSort('risk_score')}
                  >
                    <span className="flex items-center gap-1">
                      Risk Score
                      {sortBy === 'risk_score' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </span>
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Classification</th>
                  <th className="py-3.5 px-4 font-semibold">Review Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2B3E]">
                {transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    onClick={() => handleOpenDetail(txn.transaction_id)}
                    className="hover:bg-[#172335]/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-[#F1F5F9] group-hover:text-[#3B82F6] transition-colors">
                      {txn.transaction_id}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#F1F5F9]">
                      ${txn.transaction_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-[#94A3B8]">
                      <span className="text-[#F1F5F9] font-medium">{txn.transaction_type}</span> • {txn.merchant_category}
                    </td>
                    <td className="py-3 px-4 text-[#94A3B8] font-mono text-[11px]">
                      {new Date(txn.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`font-bold ${
                          txn.risk_score >= 70 ? 'text-rose-400' :
                          txn.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {txn.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge category={txn.risk_category} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={txn.review_status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDetail(txn.transaction_id)
                        }}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[#1E2D44] transition-colors"
                        title="Inspect Transaction"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION BAR */}
        <div className="p-4 bg-[#0E1520] border-t border-[#253246] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-[#94A3B8]">
            Showing <span className="font-mono text-[#F1F5F9]">{transactions.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-mono text-[#F1F5F9]">
              {Math.min(page * pageSize, total)}
            </span>{' '}
            of <span className="font-mono text-[#F1F5F9]">{total.toLocaleString()}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-[#172335] border border-[#253246] hover:border-[#3B82F6] text-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs px-2 text-[#94A3B8]">
              Page <span className="text-[#F1F5F9] font-bold">{page}</span> of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded bg-[#172335] border border-[#253246] hover:border-[#3B82F6] text-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* TRANSACTION DETAIL MODAL INSPECTOR */}
      {selectedTxn && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121B29] border border-[#253246] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#1F2B3E]">
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase font-mono tracking-wider">
                  Transaction Audit Inspector
                </span>
                <h3 className="text-lg font-bold text-[#F1F5F9] font-mono mt-0.5">
                  {selectedTxn.transaction_id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge category={selectedTxn.risk_category} score={selectedTxn.risk_score} />
                <button
                  onClick={() => setSelectedTxn(null)}
                  className="p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] rounded-lg hover:bg-[#172335] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4">
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Amount</span>
                  <span className="text-base font-bold font-mono text-[#F1F5F9] mt-0.5 block">
                    ${selectedTxn.transaction_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Fraud Prob</span>
                  <span className="text-base font-bold font-mono text-[#3B82F6] mt-0.5 block">
                    {((selectedTxn.fraud_probability || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Channel</span>
                  <span className="text-xs font-semibold text-[#F1F5F9] mt-0.5 block">
                    {selectedTxn.transaction_type}
                  </span>
                </div>
                <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-mono block">Merchant</span>
                  <span className="text-xs font-semibold text-[#F1F5F9] mt-0.5 block">
                    {selectedTxn.merchant_category}
                  </span>
                </div>
              </div>

              {/* Behavioral Telemetry Attributes */}
              <div className="p-4 bg-[#0E1520] border border-[#253246] rounded-lg space-y-2 text-xs">
                <h4 className="font-semibold text-[#F1F5F9] uppercase tracking-wider text-[11px] font-mono border-b border-[#1F2B3E] pb-2">
                  Behavioral & Device Telemetry
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">Transaction Hour:</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{selectedTxn.transaction_hour}:00 hrs</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">Recent 24h Velocity:</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{selectedTxn.recent_transaction_count} events</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">Account Age:</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{selectedTxn.account_age_days} days</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">Baseline Distance:</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{selectedTxn.location_distance} km</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">Previous Avg Amount:</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">${selectedTxn.previous_transaction_amount?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">Security Flags:</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">
                      {selectedTxn.new_device ? 'New Device' : 'Known Device'} •{' '}
                      {selectedTxn.international_transaction ? 'International' : 'Domestic'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Heuristic Diagnostic Observations */}
              <div>
                <h4 className="font-semibold text-[#F1F5F9] uppercase tracking-wider text-[11px] font-mono mb-2">
                  Diagnostic Observations & Rule Triggers
                </h4>
                {selectedTxn.suspicious_indicators && selectedTxn.suspicious_indicators.length > 0 ? (
                  <ul className="space-y-1.5">
                    {selectedTxn.suspicious_indicators.map((ind, i) => (
                      <li
                        key={i}
                        className="text-xs p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-2"
                      >
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#94A3B8] p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
                    No anomalous rule deviations flagged for this transaction.
                  </p>
                )}
              </div>

              {/* Review Status Action Bar */}
              <div className="p-4 bg-[#172335] border border-[#253246] rounded-lg">
                <span className="text-[11px] text-[#94A3B8] uppercase font-mono block mb-2">
                  Current Review Workflow: <span className="text-[#F1F5F9] font-bold">{selectedTxn.review_status}</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus('Under Review')}
                    disabled={updatingStatus || selectedTxn.review_status === 'Under Review'}
                    className="px-3 py-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-medium disabled:opacity-40 transition-colors"
                  >
                    Mark Under Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Confirmed Fraud')}
                    disabled={updatingStatus || selectedTxn.review_status === 'Confirmed Fraud'}
                    className="px-3 py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium disabled:opacity-40 transition-colors"
                  >
                    Confirm Fraud
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('False Positive')}
                    disabled={updatingStatus || selectedTxn.review_status === 'False Positive'}
                    className="px-3 py-1.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-medium disabled:opacity-40 transition-colors"
                  >
                    Mark False Positive
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Reviewed')}
                    disabled={updatingStatus || selectedTxn.review_status === 'Reviewed'}
                    className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium disabled:opacity-40 transition-colors"
                  >
                    Clear as Reviewed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
