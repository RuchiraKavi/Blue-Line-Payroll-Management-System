import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaHandHoldingUsd, FaCheck, FaTimes, FaUndo } from "react-icons/fa";
import { usePagination } from "../../hooks/usePagination.js";
import TablePagination from "../ui/TablePagination.jsx";

const API_BASE = "http://localhost:5000/api";
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const AdvanceRequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [remarks, setRemarks] = useState({});

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/advance`, { headers: getAuthHeader() });
      if (res.data.success && Array.isArray(res.data.requests)) {
        setRequests(res.data.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const msg = (err.response?.data?.message || "").toLowerCase();
      if (status === 404 || msg.includes("not found") || msg.includes("no request")) {
        setRequests([]);
      } else {
        setError(err.response?.data?.message || "Failed to load advance requests");
        setRequests([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      await axios.put(
        `${API_BASE}/advance/${id}/status`,
        { status, remarks: remarks[id] || "" },
        { headers: getAuthHeader() }
      );
      fetchRequests();
      setRemarks((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  const name = (r) => r.employeeId?.userId?.name || r.employeeId?.name || "—";
  const empId = (r) => r.employeeId?.employee_id || "—";
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—");

  const statusBadge = (status) => {
    if (status === "Approved") return "bg-green-100 text-green-700";
    if (status === "Rejected") return "bg-red-100 text-red-700";
    if (status === "Revoked") return "bg-gray-100 text-gray-700";
    return "bg-amber-100 text-amber-800";
  };

  const pagination = usePagination(requests);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl mb-8 p-8 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white">
            <FaHandHoldingUsd className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Advance Payment Requests</h1>
            <p className="text-gray-600 mt-0.5">Review and approve or reject employee advance requests</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaHandHoldingUsd className="text-blue-600" />
            All requests
          </h3>
        </div>
        <div className="p-8">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No advance requests.</div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-linear-to-r from-gray-50 to-blue-50 text-gray-700 uppercase text-xs font-semibold border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">Employee</th>
                    <th className="px-6 py-4 text-left">Amount (Rs.)</th>
                    <th className="px-6 py-4 text-left">Reason</th>
                    <th className="px-6 py-4 text-left">Requested</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedItems.map((r) => (
                    <tr key={r._id} className="border-t border-gray-100 hover:bg-blue-50/50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{name(r)}</p>
                        <p className="text-xs text-gray-500">{empId(r)}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold">{Number(r.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{r.reason || "—"}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(r.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2 justify-center">
                          {r.status === "Pending" && (
                            <input
                              type="text"
                              placeholder="Remarks (optional)"
                              value={remarks[r._id] || ""}
                              onChange={(e) => setRemarks((prev) => ({ ...prev, [r._id]: e.target.value }))}
                              className="px-2 py-1 border border-gray-200 rounded-lg text-xs w-28"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => updateStatus(r._id, "Approved")}
                            disabled={updatingId === r._id || r.status !== "Pending"}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={r.status !== "Pending" ? "Already processed" : "Approve"}
                          >
                            <FaCheck /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(r._id, "Rejected")}
                            disabled={updatingId === r._id || r.status !== "Pending"}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={r.status !== "Pending" ? "Already processed" : "Reject"}
                          >
                            <FaTimes /> Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(r._id, "Revoked")}
                            disabled={updatingId === r._id || r.status !== "Approved"}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={r.status === "Approved" ? "Revoke this advance" : "Only approved advances can be revoked"}
                          >
                            <FaUndo /> Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                page={pagination.page}
                perPage={pagination.perPage}
                totalItems={pagination.totalItems}
                totalPages={pagination.totalPages}
                onPageChange={pagination.setPage}
                onPerPageChange={(n) => {
                  pagination.setPerPage(n);
                  pagination.setPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvanceRequestList;
