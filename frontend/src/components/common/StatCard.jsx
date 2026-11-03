import React from 'react'

export const StatCard = ({
  title,
  value,
  subvalue,
  icon: Icon,
  badgeText,
  badgeType = 'neutral', // 'positive' | 'negative' | 'warning' | 'neutral'
  indicatorColor = 'blue',
}) => {
  const badgeStyles = {
    positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    negative: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    neutral: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  const iconBgStyles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    red: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }

  return (
    <div className="bg-[#121B29] border border-[#253246] rounded-xl p-5 relative overflow-hidden group hover:border-[#384964] transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#94A3B8] tracking-wider uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${iconBgStyles[indicatorColor] || iconBgStyles.blue}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl font-bold text-[#F1F5F9] font-mono tracking-tight">
          {value}
        </div>
        {badgeText && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeStyles[badgeType] || badgeStyles.neutral}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subvalue && (
        <p className="text-xs text-[#94A3B8] mt-2 flex items-center gap-1.5">
          {subvalue}
        </p>
      )}

      {/* Subtle indicator bar at top */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity ${
        indicatorColor === 'red' ? 'bg-rose-500' :
        indicatorColor === 'amber' ? 'bg-amber-500' :
        indicatorColor === 'green' ? 'bg-emerald-500' :
        indicatorColor === 'cyan' ? 'bg-cyan-400' : 'bg-blue-500'
      }`} />
    </div>
  )
}

