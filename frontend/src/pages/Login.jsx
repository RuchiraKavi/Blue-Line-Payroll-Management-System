import axios from 'axios'
import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Logo from '../assets/Logo.png';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState(null);
    const {login} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr(null);
        try{
            const response = await axios.post("http://localhost:5000/api/auth/login", {email, password});
            if(response.data.success){
                login(response.data.user);
                localStorage.setItem("token", response.data.token);
                if(response.data.user.role === 'admin'){
                    navigate('/admin-dashboard');
                }else{
                    navigate('/employee-dashboard');
                }
            }
        }
        catch(error){
            if(error.response && error.response.data){
                setErr(error.response.data.msg || error.response.data.error || "Login failed. Please try again.");
            }else{
                setErr("Server Error. Please try again.");
            }
        }
    };


  return (    <div className="min-h-screen flex">

      {/* Left Section with Image */}
      <div className="w-1/2 min-h-screen flex items-center justify-center bg-white-200 animate-fade-in-slide-up">
        <img
        src={Logo}
        alt="Blue Ocean"
        className="h-150 w-auto object-contain"
        />

      </div>

      {/* Right Section with Login Box */}
      <div className="w-1/2 min-h-screen flex items-center justify-center bg-gray-800 animate-fade-in-slide-left-1">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">

          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 animate-fade-in-slide-left-2">
            Login to Your Account
          </h2>

          {err && <p className="text-red-500 mb-4 animate-fade-in-slide-left-3">{err}</p>}

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
                className="
                  px-4 py-2 border border-gray-300 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-blue-400
                  focus:scale-105 transition transform duration-200
                  hover:border-blue-400 hover:shadow-md
                "
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
                className="
                  px-4 py-2 border border-gray-300 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-blue-400
                  focus:scale-105 transition transform duration-200
                  hover:border-blue-400 hover:shadow-md
                "
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold 
                         hover:bg-blue-700 transition duration-200 animate-fade-in-slide-left-4"
            >
              Login
            </button>
          </form>
        </div>
      </div>

    </div>

)
}

export default Login