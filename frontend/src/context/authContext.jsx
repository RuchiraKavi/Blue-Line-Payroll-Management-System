import axios from "axios";
import React, { useState, useEffect } from "react";
import { UserContext } from "./UserContext.jsx";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token is expired
  const isTokenExpired = () => {
    const expirationTime = localStorage.getItem("tokenExpiration");
    if (!expirationTime) return true;
    return Date.now() > parseInt(expirationTime);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiration");
  };

  // Initial token verification on app load
  useEffect(() => {
    const verifyUser = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const expirationTime = localStorage.getItem("tokenExpiration");

        // If no token or expiration time, user is not logged in
        if (!token || !expirationTime) {
          setUser(null);
          setLoading(false);
          return;
        }

        // If token expiration has passed, logout
        if (isTokenExpired()) {
          logout();
          setLoading(false);
          return;
        }

        // Token exists and not expired, verify with backend
        const response = await axios.get(
          "http://localhost:5000/api/auth/verify",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setUser(response.data.user);
          setLoading(false);
        } else {
          logout();
          setLoading(false);
        }
      } catch (error) {
        console.error("Token verification failed:", error.message);
        logout();
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  // Check token expiration every minute
  useEffect(() => {
    if (!user) return;

    const tokenCheckInterval = setInterval(() => {
      if (isTokenExpired()) {
        logout();
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(tokenCheckInterval);
  }, [user]);

  const login = (userData) => {
    setUser(userData);
    // Calculate expiration time (1 hour = 3600000 milliseconds)
    const expirationTime = Date.now() + 3600000;
    localStorage.setItem("tokenExpiration", expirationTime.toString());
  };

  return (
    <UserContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export default AuthProvider;
