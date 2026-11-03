import React from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, User, CheckCircle2 } from 'lucide-react'

const pageTitles = {
  '/': 'Executive Dashboard & Live Telemetry',
  '/analyzer': 'AI Transaction Risk Analyzer',
  '/transactions': 'Transaction Ledger & History',
  '/alerts': 'Fraud Alert Monitoring Center',
  '/analytics': 'Risk Analytics & Portfolio Insights',
  '/model': 'Machine Learning Model Performance',
  '/settings': 'System & Scoring Threshold Settings',
}

export const TopNav = ({ collapsed }) => {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Fraud Intelligence Platform'

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-[#0E1520]/90 backdrop-blur-md border-b border-[#253246] z-20 transition-all duration-300 flex items-center justify-between px-6 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-[#F1F5F9] tracking-tight">
          {title}
        </h1>
        <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#172335] text-[#22D3EE] border border-[#253246]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
          Live Inference
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <div className="relative hidden lg:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search TXN-ID or merchant..."
            className="w-full bg-[#121B29] border border-[#253246] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] transition-colors"
          />
        </div>

        {/* System Health Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121B29] border border-[#253246] text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[#94A3B8]">Status:</span>
          <span className="font-medium text-emerald-400">Operational</span>
        </div>

        {/* Alerts Notification */}
        <button
          className="relative p-2 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172335] border border-transparent hover:border-[#253246] transition-all"
          title="Fraud Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0E1520]" />
        </button>

        {/* Profile Placeholder */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#253246]">
          <div className="w-8 h-8 rounded-lg bg-[#172335] border border-[#253246] flex items-center justify-center text-[#3B82F6]">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-medium text-[#F1F5F9]">Risk Analyst</span>
            <span className="text-[10px] text-[#94A3B8]">Admin Console</span>
          </div>
        </div>
      </div>
    </header>
  )
}
