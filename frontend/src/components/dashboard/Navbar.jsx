import React from 'react'
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';

const Navbar = () => {
    const {user} = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear authentication data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        navigate('/login');
    };
  return (
    <div className="flex items-center justify-between h-14 px-6 bg-gray-900 text-white border-b border-gray-800 font-poppins">
        
        {/* LEFT SIDE — WELCOME */}
        <div className="flex items-center gap-3 text-lg">
            <FaUser className="text-gray-400" />
            <p>
                Welcome <span className="font-semibold">{user.name}</span>
            </p>
        </div>

        {/* RIGHT SIDE — LOGOUT BUTTON */}
        <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition"
        >
            Logout
        </button>
    </div>

  )
}

export default Navbar