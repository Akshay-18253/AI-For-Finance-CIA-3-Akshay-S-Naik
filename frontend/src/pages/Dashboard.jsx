import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Database,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { getDashboardSummary, getAnalytics } from '../services/api'
import { StatCard } from '../components/common/StatCard'
import { Card } from '../components/common/Card'
import { RiskBadge, StatusBadge } from '../components/common/Badge'
import { LoadingSpinner } from '../components/common/Feedback'

const RISK_COLORS = {
  Low: '#22C55E',
  Medium: '#F59E0B',
  High: '#EF4444',
}

const PIE_COLORS = ['#22C55E', '#EF4444']

export const Dashboard = () => {
  const [summary, setSummary] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setError(null)
      const [sumData, anaData] = await Promise.all([
        getDashboardSummary(),
        getAnalytics(14),
      ])
      setSummary(sumData)
      setAnalytics(anaData)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return <LoadingSpinner label="Compiling live fraud telemetry..." />
  }

  if (error) {
    return (
      <div className="p-8 border border-rose-500/30 rounded-xl bg-rose-500/10 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-rose-300">Connection Failed</h3>
        <p className="text-xs text-[#94A3B8] mt-1 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-[#172335] border border-[#253246] hover:border-[#3B82F6] rounded-lg text-xs font-medium text-[#F1F5F9] transition-all"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  // Format data for Recharts
  const pieData = [
    {
      name: 'Legitimate',
      value: (analytics?.total_transactions || 0) - (analytics?.total_flagged || 0),
    },
    { name: 'Flagged / Fraud', value: analytics?.total_flagged || 0 },
  ]

  const barData = [
    { name: 'Low Risk', count: analytics?.risk_distribution?.Low || 0, fill: RISK_COLORS.Low },
    { name: 'Medium Risk', count: analytics?.risk_distribution?.Medium || 0, fill: RISK_COLORS.Medium },
    { name: 'High Risk', count: analytics?.risk_distribution?.High || 0, fill: RISK_COLORS.High },
  ]

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F1F5F9] tracking-tight">
            Institutional Fraud Telemetry
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Continuous real-time surveillance across live transaction streams and anomaly scoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121B29] border border-[#253246] hover:border-[#3B82F6] text-xs font-medium text-[#F1F5F9] transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#3B82F6]' : ''}`} />
            Refresh Telemetry
          </button>
          <Link
            to="/analyzer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-xs font-medium text-white transition-all shadow-sm shadow-blue-500/20"
          >
            Analyze Transaction
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Transactions"
          value={summary?.total_transactions?.toLocaleString() || '0'}
          subvalue="Surveillance ledger volume"
          icon={Database}
          indicatorColor="blue"
        />
        <StatCard
          title="Flagged Transactions"
          value={summary?.flagged_transactions?.toLocaleString() || '0'}
          subvalue="Medium & High risk alerts"
          icon={ShieldAlert}
          indicatorColor="amber"
          badgeText="Surveillance Active"
          badgeType="warning"
        />
        <StatCard
          title="Fraud Detection Rate"
          value={`${summary?.fraud_detection_rate || 0}%`}
          subvalue="Model-flagged incident ratio"
          icon={TrendingUp}
          indicatorColor="cyan"
          badgeText="Calibrated"
          badgeType="positive"
        />
        <StatCard
          title="High-Risk Transactions"
          value={summary?.high_risk_transactions?.toLocaleString() || '0'}
          subvalue="Critical anomalies requiring action"
          icon={Activity}
          indicatorColor="red"
          badgeText="High Priority"
          badgeType="negative"
        />
      </div>

      {/* VISUALIZATION SECTION: Charts A, B, C */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: Daily Transaction Volume (2 Columns) */}
        <Card
          className="lg:col-span-2"
          title="Transaction Activity & Risk Trends"
          subtitle="14-day chronological volume: Legitimate baseline vs. Flagged suspicious events"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.volume_over_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLegit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2B3E" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1520',
                    borderColor: '#253246',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="legitimate"
                  name="Legitimate Transactions"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLegit)"
                />
                <Area
                  type="monotone"
                  dataKey="flagged"
                  name="Flagged Anomalies"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFlagged)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart B: Fraud Distribution Donut */}
        <Card
          title="Portfolio Distribution"
          subtitle="Legitimate vs. Flagged transactions"
        >
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1520',
                    borderColor: '#253246',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around pt-2 border-t border-[#1F2B3E] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[#94A3B8]">Legit:</span>
              <span className="font-mono text-[#F1F5F9]">
                {((pieData[0].value / (analytics?.total_transactions || 1)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[#94A3B8]">Fraud:</span>
              <span className="font-mono text-[#F1F5F9]">
                {((pieData[1].value / (analytics?.total_transactions || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* RISK CATEGORY BAR CHART & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart C: Risk Categorization */}
        <Card
          title="Risk Category Breakdown"
          subtitle="Classification tiers: Low (0-29), Medium (30-69), High (70-100)"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2B3E" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1520',
                    borderColor: '#253246',
                    borderRadius: '8px',
                    color: '#F1F5F9',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Section D: Recent Suspicious Activity Table (2 columns) */}
        <Card
          className="lg:col-span-2"
          title="Recent Suspicious Incidents"
          subtitle="Real-time alert queue of elevated-risk transactions requiring analyst triage"
          headerAction={
            <Link
              to="/alerts"
              className="text-xs font-medium text-[#3B82F6] hover:text-[#22D3EE] flex items-center gap-1 transition-colors"
            >
              Alert Center
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[#94A3B8] border-b border-[#1F2B3E] uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="pb-3 font-semibold">Transaction ID</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Channel / Category</th>
                  <th className="pb-3 font-semibold">Risk Score</th>
                  <th className="pb-3 font-semibold">Severity</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2B3E]/60">
                {summary?.recent_suspicious?.map((txn) => (
                  <tr key={txn.id} className="hover:bg-[#172335]/50 transition-colors">
                    <td className="py-3 font-mono font-medium text-[#F1F5F9]">
                      {txn.transaction_id}
                    </td>
                    <td className="py-3 font-mono font-semibold text-[#F1F5F9]">
                      ${txn.transaction_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-[#94A3B8]">
                      <span className="text-[#F1F5F9]">{txn.transaction_type}</span> • {txn.merchant_category}
                    </td>
                    <td className="py-3 font-mono">
                      <span className={`font-bold ${
                        txn.risk_score >= 70 ? 'text-rose-400' :
                        txn.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {txn.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3">
                      <RiskBadge category={txn.risk_category} />
                    </td>
                    <td className="py-3">
                      <StatusBadge status={txn.review_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
