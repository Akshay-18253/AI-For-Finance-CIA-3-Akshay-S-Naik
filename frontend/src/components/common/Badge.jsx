import React from 'react'

export const RiskBadge = ({ category, score }) => {
  const cat = (category || 'LOW').toUpperCase()

  let style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  let dotColor = 'bg-emerald-400'

  if (cat === 'HIGH') {
    style = 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    dotColor = 'bg-rose-400'
  } else if (cat === 'MEDIUM') {
    style = 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    dotColor = 'bg-amber-400'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider border ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
      {cat}
      {score !== undefined && score !== null && (
        <span className="opacity-75 font-mono ml-0.5">({score})</span>
      )}
    </span>
  )
}

export const StatusBadge = ({ status }) => {
  const s = status || 'Pending'

  const styles = {
    Pending: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    'Under Review': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Reviewed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Confirmed Fraud': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    'False Positive': 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  }

  const currentStyle = styles[s] || styles.Pending

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${currentStyle}`}
    >
      {s}
    </span>
  )
}
