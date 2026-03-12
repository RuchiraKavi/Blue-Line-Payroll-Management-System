import React from 'react'

const variants = {
  blue: {
    card: 'border-blue-200',
    icon: 'bg-linear-to-br from-blue-400 to-blue-600',
    value: 'text-blue-700',
  },
  gray: {
    card: 'border-gray-200',
    icon: 'bg-linear-to-br from-gray-400 to-gray-600',
    value: 'text-gray-700',
  },
  green: {
    card: 'border-green-200',
    icon: 'bg-linear-to-br from-green-400 to-green-600',
    value: 'text-green-700',
  },
  amber: {
    card: 'border-amber-200',
    icon: 'bg-linear-to-br from-amber-400 to-amber-600',
    value: 'text-amber-800',
  },
  red: {
    card: 'border-red-200',
    icon: 'bg-linear-to-br from-red-400 to-red-600',
    value: 'text-red-700',
  },
  slate: {
    card: 'border-slate-200',
    icon: 'bg-linear-to-br from-slate-400 to-slate-600',
    value: 'text-slate-700',
  },
}

const SummaryCard = ({ icon, text, number, variant = 'blue' }) => {
  const v = variants[variant] || variants.blue
  return (
    <div className={`bg-white rounded-xl border-2 ${v.card} p-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] flex items-center gap-4`}>
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${v.icon} text-white text-2xl shadow-lg`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-600">{text}</p>
        <p className={`text-2xl font-bold ${v.value} truncate`}>{number}</p>
      </div>
    </div>
  )
}

export default SummaryCard
