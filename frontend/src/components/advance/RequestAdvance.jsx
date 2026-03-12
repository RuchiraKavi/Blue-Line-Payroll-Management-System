import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaHandHoldingUsd, FaHistory } from "react-icons/fa";

const API_BASE = "http://localhost:5000/api";
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const RequestAdvance = () => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMyRequests = async () => {
    try {
      setListLoading(true);
      const res = await axios.get(`${API_BASE}/advance/my-requests`, { headers: getAuthHeader() });
      if (res.data.success && Array.isArray(res.data.requests)) {
        setRequests(res.data.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/advance/request`,
        { amount: num, reason: reason.trim() },
        { headers: getAuthHeader() }
      );
      if (res.data.success) {
        setSuccess("Advance payment request submitted successfully.");
        setAmount("");
        setReason("");
        fetchMyRequests();
      } else {
        setError(res.data.message || "Request failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (status) => {
    if (status === "Approved") return "bg-green-100 text-green-700";
    if (status === "Rejected") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-800";
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white">
              <FaHandHoldingUsd className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Request Advance Payment</h1>
              <p className="text-gray-600 mt-0.5">Submit a request for salary advance. It will be reviewed by admin.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">New request</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                {success}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs.) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                placeholder="e.g. 10000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                placeholder="Brief reason for advance..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg"
            >
              {loading ? "Submitting…" : "Submit request"}
            </button>
          </form>
        </div>

        {/* My requests */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <FaHistory className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">My advance requests</h2>
          </div>
          <div className="p-6">
            {listLoading ? (
              <div className="text-center py-8 text-gray-500">Loading…</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No advance requests yet.</div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div
                    key={r._id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">Rs. {Number(r.amount).toLocaleString()}</p>
                      {r.reason && <p className="text-sm text-gray-600 mt-0.5">{r.reason}</p>}
                      <p className="text-xs text-gray-500 mt-1">{formatDate(r.createdAt)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAdvance;
