import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-red-600">403</h1>
      <p className="text-lg mt-2">Access Denied</p>
      <p className="text-gray-600 mt-1">
        You do not have permission to view this page.
      </p>

      <Link
        to="/admin-dashboard"
        className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
