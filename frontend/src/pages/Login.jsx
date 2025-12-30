import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Logo from "../assets/Logo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [showChoice, setShowChoice] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        const user = response.data.user;

        login(user);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", user.role);

        if (user.role === "admin") {
          navigate("/admin-dashboard");
        } else if (user.role === "employee") {
          navigate("/employee-dashboard");
        } else if (user.role === "hr" || user.role === "accountant") {
          setShowChoice(true);
        }
      }
    } catch (error) {
      if (error.response?.data) {
        setErr(
          error.response.data.msg ||
            error.response.data.error ||
            "Login failed"
        );
      } else {
        setErr("Server error. Please try again.");
      }
    }
  };

  const goAdmin = () => {
    setShowChoice(false);
    navigate("/admin-dashboard");
  };

  const goEmployee = () => {
    setShowChoice(false);
    navigate("/employee-dashboard");
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Left Section - Logo */}
      <div className="w-1/2 min-h-screen flex items-center justify-center bg-white animate-fade-in-slide-up">
        <img
          src={Logo}
          alt="Blue Ocean"
          className="h-150 w-auto object-contain"
        />
      </div>

      {/* Right Section - Login Box */}
      <div className="w-1/2 min-h-screen flex items-center justify-center bg-gray-800 animate-fade-in-slide-left-1">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 animate-fade-in-slide-left-2">
            Login to Your Account
          </h2>

          {err && (
            <p className="text-red-500 mb-4 animate-fade-in-slide-left-3">{err}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="flex flex-col animate-fade-in-slide-left-3">
              <label htmlFor="email" className="text-gray-700 font-medium mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                required
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:scale-105 transition transform duration-200 hover:border-blue-400 hover:shadow-md"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col animate-fade-in-slide-left-4">
              <label htmlFor="password" className="text-gray-700 font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                required
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:scale-105 transition transform duration-200 hover:border-blue-400 hover:shadow-md"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 animate-fade-in-slide-left-4"
            >
              Login
            </button>
          </form>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 animate-fade-in">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Choose Your Workspace</h3>
              <p className="text-sm text-gray-500 mt-1">You can access both dashboards</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={goAdmin}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:bg-indigo-50 hover:border-indigo-500 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800">Admin Dashboard</p>
                  <p className="text-xs text-gray-500">Manage employees, departments & reports</p>
                </div>
                <span className="text-indigo-600 text-xl">🛠️</span>
              </button>

              <button
                onClick={goEmployee}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-500 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800">Employee Dashboard</p>
                  <p className="text-xs text-gray-500">View profile, leaves & activities</p>
                </div>
                <span className="text-blue-600 text-xl">👤</span>
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-5">
              You can switch dashboards later
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
