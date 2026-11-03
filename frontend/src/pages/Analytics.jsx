import React, { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import {
  Activity,
  Calendar,
  CreditCard,
  DollarSign,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { getAnalytics } from '../services/api'
import { Card } from '../components/common/Card'
import { StatCard } from '../components/common/StatCard'
import { LoadingSpinner } from '../components/common/Feedback'

const CATEGORY_COLORS = ['#3B82F6', '#22D3EE', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#EC4899']

export const Analytics = () => {
  const [days, setDays] = useState(14)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const data = await getAnalytics(days)
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [days])

  if (loading) {
    return <LoadingSpinner label="Compiling aggregate financial risk telemetry..." />
  }

  const fraudRate =
    analytics?.total_transactions > 0
      ? ((analytics.total_flagged / analytics.total_transactions) * 100).toFixed(2)
      : '0.00'

  return (
    <div className="space-y-6">
      {/* Header & Date Range Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-[#3B82F6]" />
            Deep-Dive Risk & Fraud Analytics
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Statistical portfolio distribution, payment channel risk vectors, and merchant vulnerability analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Historical Range Filter */}
          <div className="flex items-center gap-1 bg-[#121B29] border border-[#253246] p-1 rounded-lg text-xs">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  days === d
                    ? 'bg-[#172335] text-[#F1F5F9] border border-[#3B82F6]/40 font-bold'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setRefreshing(true)
              fetchAnalyticsData()
            }}
            className="p-2 rounded-lg bg-[#121B29] border border-[#253246] hover:border-[#3B82F6] text-[#94A3B8] hover:text-[#F1F5F9] transition-all"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#3B82F6]' : ''}`} />
          </button>
        </div>
      </div>

      {/* METRIC KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Transactions"
          value={analytics?.total_transactions?.toLocaleString() || '0'}
          subvalue={`Transactions recorded across past ${days} days`}
          icon={CreditCard}
          indicatorColor="blue"
        />
        <StatCard
          title="Average Ticket Size"
          value={`$${analytics?.avg_transaction_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
          subvalue="Mean transaction settlement value"
          icon={DollarSign}
          indicatorColor="cyan"
        />
        <StatCard
          title="Flagged Anomaly Rate"
          value={`${fraudRate}%`}
          subvalue={`${analytics?.total_flagged || 0} flagged incidents`}
          icon={ShieldAlert}
          indicatorColor="red"
          badgeText="Active Surveillance"
          badgeType="warning"
        />
        <StatCard
          title="High Risk Incidents"
          value={analytics?.risk_distribution?.High?.toLocaleString() || '0'}
          subvalue="Scores exceeding 70/100 threshold"
          icon={Activity}
          indicatorColor="amber"
          badgeText="Critical"
          badgeType="negative"
        />
      </div>

      {/* CHART SECTION 1: Time Series & Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Time-Series Area Chart (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title={`Chronological Volume Over Time (${days} Days)`}
            subtitle="Daily transaction velocity: Normal operations vs. Flagged risk events"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.volume_over_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorFlag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2B3E" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
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
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Settled"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="flagged"
                    name="Flagged Anomalies"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFlag)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Channel Breakdown (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            title="Vulnerability by Payment Channel"
            subtitle="Total transactions vs. Flagged suspicious ratio by channel"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.fraud_by_type || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2B3E" vertical={false} />
                  <XAxis dataKey="type" stroke="#64748B" fontSize={10} tickLine={false} />
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
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="total" name="Total Volume" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="flagged" name="Flagged Risk" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* CHART SECTION 2: Merchant Category & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Merchant Category Breakdown (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title="Fraud Exposure by Merchant Category"
            subtitle="Volume and risk concentration across retail and digital merchant sectors"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics?.fraud_by_category || []}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2B3E" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="category" stroke="#94A3B8" fontSize={11} tickLine={false} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0E1520',
                      borderColor: '#253246',
                      borderRadius: '8px',
                      color: '#F1F5F9',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="total" name="Total Volume" fill="#253246" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="flagged" name="Flagged Suspicious" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Risk Distribution Radar / Metrics (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            title="Risk Tier Exposure Summary"
            subtitle="Distribution of accounts across configured risk score bands"
          >
            <div className="space-y-4 pt-2">
              {/* Low Risk Bar */}
              <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Low Risk (0 - 29)
                  </span>
                  <span className="font-mono text-[#F1F5F9] font-bold">
                    {analytics?.risk_distribution?.Low || 0} transactions
                  </span>
                </div>
                <div className="w-full bg-[#172335] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((analytics?.risk_distribution?.Low || 0) / (analytics?.total_transactions || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Medium Risk Bar */}
              <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Medium Risk (30 - 69)
                  </span>
                  <span className="font-mono text-[#F1F5F9] font-bold">
                    {analytics?.risk_distribution?.Medium || 0} transactions
                  </span>
                </div>
                <div className="w-full bg-[#172335] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((analytics?.risk_distribution?.Medium || 0) / (analytics?.total_transactions || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* High Risk Bar */}
              <div className="p-3 bg-[#0E1520] border border-[#253246] rounded-lg">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    High Risk (70 - 100)
                  </span>
                  <span className="font-mono text-[#F1F5F9] font-bold">
                    {analytics?.risk_distribution?.High || 0} transactions
                  </span>
                </div>
                <div className="w-full bg-[#172335] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((analytics?.risk_distribution?.High || 0) / (analytics?.total_transactions || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3 bg-[#172335]/60 border border-[#253246] rounded-lg text-xs text-[#94A3B8]">
                <span className="text-[#F1F5F9] font-semibold block mb-0.5">Analyst Guidance:</span>
                Transactions in the High-Risk category exhibit multiple overlapping fraud typologies and are automatically routed to the Fraud Alert Monitoring Center.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
