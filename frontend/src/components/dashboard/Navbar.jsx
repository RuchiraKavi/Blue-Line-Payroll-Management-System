import React from 'react'
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';

const Navbar = ({ showWelcome = true }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear authentication data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to login page
        navigate('/login');
    };
    return (
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 px-6 text-white font-poppins">

            {/* LEFT SIDE — WELCOME */}
            {showWelcome ? (
                <div className="flex items-center gap-3 text-lg leading-none">
                    <FaUser className="text-gray-400 shrink-0" />
                    <p className="m-0">
                        Welcome <span className="font-semibold">{user.name}</span>
                    </p>
                </div>
            ) : (
                <div></div>
            )}

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