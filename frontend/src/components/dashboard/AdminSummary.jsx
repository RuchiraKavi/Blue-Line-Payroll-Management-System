import React, { useEffect, useState } from 'react'
import axios from 'axios'
import SummaryCard from './SummaryCard'
import { FaBuilding, FaCheckCircle, FaFileAlt, FaHourglassHalf, FaMoneyBillWave, FaThLarge, FaTimesCircle, FaUser } from 'react-icons/fa'

const API_BASE = 'http://localhost:5000/api'
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` })

const defaultStats = {
  totalEmployees: 0,
  totalDepartments: 0,
  monthlySalary: 0,
  leaveApplications: 0,
  leaveApproved: 0,
  leavePending: 0,
  leaveRejected: 0,
}

const AdminSummary = () => {
  const [stats, setStats] = useState(defaultStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError('')
        const res = await axios.get(`${API_BASE}/dashboard/stats`, { headers: getAuthHeader() })
        if (res.data.success && res.data.stats) {
          setStats(res.data.stats)
        }
      } catch (err) {
        console.error(err)
        const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load dashboard stats'
        setError(msg)
        setStats(defaultStats)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Redesigned Header Section */}
      <div className="relative bg-linear-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-xl mb-8 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-8">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
              <FaThLarge className="w-9 h-9 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-0.5">{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
              <p className="text-blue-100/90 text-sm mt-1">{dateStr}</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-blue-100/80 text-xs font-medium uppercase tracking-wider">Quick view</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Overview Cards - same style as Attendance analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          icon={<FaUser className="text-2xl text-white" />}
          text="Total Employees"
          number={stats.totalEmployees}
          variant="blue"
        />
        <SummaryCard
          icon={<FaBuilding className="text-2xl text-white" />}
          text="Total Departments"
          number={stats.totalDepartments}
          variant="gray"
        />
        <SummaryCard
          icon={<FaMoneyBillWave className="text-2xl text-white" />}
          text="Monthly Cost"
          number={typeof stats.monthlySalary === 'number' ? stats.monthlySalary.toLocaleString('en-US', { minimumFractionDigits: 2 }) : stats.monthlySalary}
          variant="green"
        />
      </div>

      {/* Leave Details Section - card with header like other admin pages */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaFileAlt className="text-blue-600" />
            Leave Details
          </h3>
          <p className="text-sm text-gray-600 mt-1">Leave applications by status</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              icon={<FaFileAlt className="text-2xl text-white" />}
              text="Leave Applications"
              number={stats.leaveApplications}
              variant="slate"
            />
            <SummaryCard
              icon={<FaCheckCircle className="text-2xl text-white" />}
              text="Leave Approved"
              number={stats.leaveApproved}
              variant="green"
            />
            <SummaryCard
              icon={<FaHourglassHalf className="text-2xl text-white" />}
              text="Leave Pending"
              number={stats.leavePending}
              variant="amber"
            />
            <SummaryCard
              icon={<FaTimesCircle className="text-2xl text-white" />}
              text="Leave Rejected"
              number={stats.leaveRejected}
              variant="red"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSummary
