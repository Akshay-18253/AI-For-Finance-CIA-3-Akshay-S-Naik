import React from 'react'

export const LoadingSpinner = ({ label = 'Processing Intelligence Stream...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative w-10 h-10 mb-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#253246] border-t-[#3B82F6] animate-spin" />
        <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-b-[#22D3EE] animate-spin animate-reverse" />
      </div>
      <p className="text-sm font-medium text-[#94A3B8] tracking-wide">{label}</p>
    </div>
  )
}

export const EmptyState = ({
  icon: Icon,
  title = 'No Records Found',
  description = 'No transaction data matching the applied filters.',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#253246] rounded-xl bg-[#0E1520]/50 my-4">
      {Icon && (
        <div className="p-3 bg-[#172335] rounded-xl text-[#94A3B8] mb-3 border border-[#253246]">
          <Icon className="w-6 h-6 text-[#3B82F6]" />
        </div>
      )}
      <h4 className="text-base font-semibold text-[#F1F5F9] mb-1">{title}</h4>
      <p className="text-xs text-[#94A3B8] max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}

