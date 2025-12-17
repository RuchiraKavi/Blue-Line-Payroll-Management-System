import React from 'react'

const SummaryCard = ({icon, text, number}) => {
  return (
    <div className="w-86 bg-gray-500 p-5 rounded-xl shadow-md flex items-center gap-4 hover:bg-gray-700 transition">

        {/* ICON BOX */}
        <div className="p-3 bg-gray-900 rounded-lg text-blue-400 text-3xl">
            {icon}
        </div>

        {/* TEXT + NUMBER */}
        <div className="flex flex-col">
            <p className="text-gray-300 text-sm">{text}</p>
            <p className="text-2xl font-semibold text-white">{number}</p>
        </div>

    </div>

  )
}

export default SummaryCard