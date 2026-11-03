import React from 'react'

export const Card = ({ children, className = '', title, subtitle, headerAction }) => {
  return (
    <div
      className={`bg-[#121B29] border border-[#253246] rounded-xl p-5 shadow-sm transition-all hover:border-[#2f3f58] ${className}`}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1f2b3e]">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-[#F1F5F9] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
