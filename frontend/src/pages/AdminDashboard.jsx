import React, { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.js';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/dashboard/AdminSidebar';
import Navbar from '../components/dashboard/Navbar';

function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      
      {/* SIDEBAR */}
      <AdminSidebar />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col bg-white">

        {/* FIXED NAVBAR */}
        <div className="fixed left-64 right-0 top-0 z-50">
          <Navbar />
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="mt-14 overflow-y-auto h-[calc(100vh-3.5rem)] p-6 bg-gray-100">
          <Outlet />
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;
