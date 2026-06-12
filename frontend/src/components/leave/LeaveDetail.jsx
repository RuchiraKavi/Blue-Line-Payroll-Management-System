import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import SelectInput from "../ui/SelectInput.jsx";
import LeaveActionModal from "./LeaveActionModal.jsx";
import { formatRoleLabel } from "../../utils/roleConstants.js";

const LeaveDetail = () => {
  const { id } = useParams(); // leave ID from route
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false); // to handle button state
  const [assignees, setAssignees] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const fetchLeave = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/leaves/detail/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setLeave(response.data.leave);
          const existing = response.data.leave?.assignedTo?._id;
          if (existing) setSelectedAssignee(String(existing));
        }
      } catch (error) {
        console.error(error);
        alert("Leave Loading Error");
      } finally {
        setLoading(false);
      }
    };

    fetchLeave();
  }, [id]);

  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        if (!leave || leave.status?.toLowerCase() !== "pending") return;
        const res = await axios.get(`http://localhost:5000/api/leaves/${id}/assignees`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.data?.success) setAssignees(res.data.assignees || []);
      } catch (error) {
        console.error("Assignees fetch error:", error);
        // Don't block the page if this fails
      }
    };
    fetchAssignees();
  }, [leave, id]);

  const handleAssign = async () => {
    if (!selectedAssignee) return;
    try {
      setAssigning(true);
      const res = await axios.put(
        `http://localhost:5000/api/leaves/${id}/assign`,
        { assignedTo: selectedAssignee },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (res.data?.success) {
        setLeave(res.data.leave);
        alert("Assigned successfully!");
      } else {
        alert(res.data?.message || "Failed to assign");
      }
    } catch (error) {
      console.error("Assign leave error:", error);
      alert(error.response?.data?.message || "Error assigning leave");
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (status, signatureDataUrl = null) => {
    try {
      setUpdating(true);
      const normalizedStatus = status.toLowerCase();
      const body = { status: normalizedStatus };
      if (signatureDataUrl) {
        body.signature_data_url = signatureDataUrl;
      }

      const response = await axios.put(
        `http://localhost:5000/api/leaves/${id}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setPendingAction(null);
        alert(`Leave ${status} successfully!`);
        navigate("/admin-dashboard/leaves?refresh=" + Date.now());
      } else {
        alert(response.data.message || "Failed to update leave status.");
      }
    } catch (error) {
      console.error("Leave Status Update Error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error updating leave status.";
      alert(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-700 font-semibold">
        Loading Leave Details...
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500 font-semibold">
        Leave not found!
      </div>
    );
  }

  // Calculate number of days safely
  const start = leave.startDate ? new Date(leave.startDate) : null;
  const end = leave.endDate ? new Date(leave.endDate) : null;
  let days = 0;
  if (start && end && !isNaN(start) && !isNaN(end)) {
    days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  const isPending = leave.status?.toLowerCase() === "pending";
  const isAssigned = Boolean(leave.assignedTo?._id);
  const isProcessed = !isPending;
  const approverName = leave.approvedBy?.name || "—";
  const approverRole = leave.approvedBy?.role ? formatRoleLabel(leave.approvedBy.role) : "—";

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex justify-center items-start md:items-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white text-left">
          <h2 className="text-3xl font-bold mb-1">
            {leave.employeeId?.userId?.name || "N/A"}
          </h2>
          <p className="text-sm opacity-80">
            Status:{" "}
            <span
              className={`px-2 py-1 rounded ${
                leave.status?.toLowerCase() === "approved"
                  ? "bg-green-100 text-green-700"
                  : leave.status?.toLowerCase() === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {leave.status?.charAt(0).toUpperCase() + leave.status?.slice(1)}
            </span>
          </p>
        </div>

        {/* Employee Image */}
        <div className="flex justify-center -mt-16">
          <img
            src={
              leave.employeeId?.userId?.profileImage
                ? `http://localhost:5000/uploads/${leave.employeeId.userId.profileImage}`
                : `https://via.placeholder.com/150`
            }
            alt="Employee"
            className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md"
          />
        </div>

        {/* Leave Details */}
        <div className="p-6 space-y-6">
          <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-center">
            Leave Details
          </h3>

          <div className="flex flex-col gap-3 text-left pl-6">
            <p><b>Employee Name:</b> {leave.employeeId?.userId?.name || "N/A"}</p>
            <p><b>Department:</b> {leave.employeeId?.department?.dep_name || "N/A"}</p>
            <p><b>Designation:</b> {leave.employeeId?.designation || "N/A"}</p>
            <p><b>Leave Type:</b> {({ casual: "Casual Leave", annual: "Annual Leave", sick: "Sick Leave", nopay: "No Pay" }[leave.leaveType] || leave.leaveType)}</p>
            <p><b>Days:</b> {days}</p>
            <p><b>Start Date:</b> {leave.startDate?.slice(0, 10)}</p>
            <p><b>End Date:</b> {leave.endDate?.slice(0, 10)}</p>
            <p className="md:col-span-2"><b>Reason:</b> {leave.reason}</p>
            <p><b>Applied At:</b> {leave.appliedAt?.slice(0, 10)}</p>
            <p>
              <b>Assigned To:</b>{" "}
              {leave.assignedTo?.userId?.name
                ? `${leave.assignedTo.userId.name}${
                    leave.assignedTo?.designation ? ` — ${leave.assignedTo.designation}` : ""
                  }${
                    leave.assignedTo?.department?.dep_name
                      ? ` (${leave.assignedTo.department.dep_name})`
                      : ""
                  }`
                : "Not assigned"}
            </p>
          </div>

          {/* Assignment Section */}
          {isPending && (
            <div className="mt-2 px-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="font-semibold text-gray-800 mb-2">Assign</div>
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                  <SelectInput
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    disabled={assigning || updating}
                    placeholder="Select employee…"
                    searchable={assignees.length > 7}
                    className="md:flex-1"
                    options={[
                      { value: "", label: "Select employee…" },
                      ...assignees.map((a) => ({
                        value: a.employeeMongoId,
                        label: a.designation
                          ? `${a.name} (${a.employee_id}) — ${a.designation}`
                          : `${a.name} (${a.employee_id})`,
                      })),
                    ]}
                  />

                  <button
                    onClick={handleAssign}
                    disabled={!selectedAssignee || assigning || updating}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      !selectedAssignee || assigning || updating
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {assigning ? "Assigning..." : "Assign"}
                  </button>
                </div>

                {assignees.length === 0 && (
                  <p className="text-sm text-amber-700 mt-2">
                    No other employees found with the same department and designation as the applicant.
                  </p>
                )}
                {!isAssigned && (
                  <p className="text-sm text-gray-600 mt-2">
                    You must assign someone from the same department and designation before approving.
                  </p>
                )}
              </div>
            </div>
          )}

          {isProcessed && (
            <div className="mt-2 px-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm text-gray-700">
                <p className="font-semibold text-gray-800">Decision</p>
                <p>
                  <b>Processed by:</b> {approverName}
                  {approverRole !== "—" ? ` (${approverRole})` : ""}
                </p>
                <div className="flex items-start gap-2">
                  <b>Signature:</b>
                  {leave.signature_data_url ? (
                    <img
                      src={leave.signature_data_url}
                      alt="Approver signature"
                      className="h-16 object-contain object-left max-w-[220px] border border-gray-200 rounded-lg bg-white p-2"
                    />
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {isPending && (
            <div className="flex justify-center gap-4 mt-4">
              <button
                type="button"
                onClick={() => setPendingAction("Approved")}
                disabled={updating || !isAssigned}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  updating || !isAssigned
                    ? "bg-green-200 text-green-700 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setPendingAction("Rejected")}
                disabled={updating}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      {pendingAction && (
        <LeaveActionModal
          action={pendingAction}
          onClose={() => !updating && setPendingAction(null)}
          onConfirm={(signatureDataUrl) => handleStatusUpdate(pendingAction, signatureDataUrl)}
          updating={updating}
        />
      )}
    </div>
  );
};

export default LeaveDetail;
