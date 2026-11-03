import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Cpu,
  ArrowLeftRight,
  ShieldAlert,
  LineChart,
  Brain,
  Sliders,
  Shield,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/analyzer', label: 'Transaction Analyzer', icon: Cpu },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/alerts', label: 'Fraud Alerts', icon: ShieldAlert, badge: 'Live' },
  { path: '/analytics', label: 'Analytics', icon: LineChart },
  { path: '/model', label: 'Model Performance', icon: Brain },
  { path: '/settings', label: 'Settings', icon: Sliders },
]

export const Sidebar = ({ collapsed, setCollapsed }) => {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0E1520] border-r border-[#253246] z-30 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#253246]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#F1F5F9] tracking-wider uppercase font-mono">
                FRAUD INTELLIGENCE
              </span>
              <span className="text-[10px] text-[#22D3EE] font-medium tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-ping" />
                ENTERPRISE ENGINE
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#94A3B8] hover:text-[#F1F5F9] p-1.5 rounded-lg hover:bg-[#172335] transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#172335] text-[#F1F5F9] border border-[#3B82F6]/40 shadow-sm shadow-blue-500/10'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#121B29] border border-transparent'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-[#3B82F6]" />
              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[#253246] bg-[#0A101A]">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ML Engine
              </span>
              <span className="font-mono text-[#F1F5F9]">v1.0.0</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-md bg-[#121B29] border border-[#253246] text-[11px] text-[#94A3B8] text-center">
              DEMONSTRATION WORKSPACE
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="System Operational (v1.0.0)">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  )
}
