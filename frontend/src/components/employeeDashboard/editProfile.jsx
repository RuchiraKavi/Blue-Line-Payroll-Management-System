import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DateInput from "../ui/DateInput.jsx";
import { getUploadUrl } from "../../utils/apiConfig.js";
import {
  getMaxDobForMinimumAge,
  validateAddress,
  validateDobMinimumAge,
  validateEmail,
  validateMobileNumber,
  validateNic,
} from "../../utils/employeeFieldValidation.js";

const API_BASE = "http://localhost:5000/api";

function toDateInputValue(value) {
  if (!value) return "";
  // Handle ISO strings, Date objects, or plain YYYY-MM-DD strings
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

const EditProfile = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [employee, setEmployee] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    nic: "",
    address: "",
    mobile_number: "",
    dob: "",
    gender: "",
    marital_status: "",
    bank_name: "",
    bank_branch: "",
    bank_account_number: "",
  });

  const [imageFile, setImageFile] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${API_BASE}/employees/me/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          const emp = res.data.employee;
          setEmployee(emp);
          setForm({
            name: emp.userId?.name || "",
            email: emp.userId?.email || "",
            nic: emp.nic || "",
            address: emp.address || "",
            mobile_number: emp.mobile_number || "",
            dob: toDateInputValue(emp.dob),
            gender: emp.gender || "",
            marital_status: emp.marital_status || "",
            bank_name: emp.bank_details?.bank_name || "",
            bank_branch: emp.bank_details?.bank_branch || "",
            bank_account_number: emp.bank_details?.bank_account_number || "",
          });
        } else {
          setError(res.data.message || "Failed to load profile.");
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Profile loading error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic client-side validation (server will still validate).
    if (!form.name.trim()) return setError("Name is required");

    const nicError = validateNic(form.nic);
    if (nicError) return setError(nicError);

    const emailError = validateEmail(form.email);
    if (emailError) return setError(emailError);

    const mobileError = validateMobileNumber(form.mobile_number);
    if (mobileError) return setError(mobileError);

    const addressError = validateAddress(form.address);
    if (addressError) return setError(addressError);

    const dobError = validateDobMinimumAge(form.dob);
    if (dobError) return setError(dobError);

    if (!form.gender.trim()) return setError("Gender is required");
    if (!form.marital_status.trim()) return setError("Marital status is required");
    if (!form.bank_name.trim()) return setError("Bank name is required");
    if (!form.bank_branch.trim()) return setError("Bank branch is required");
    if (!form.bank_account_number.trim()) return setError("Account number is required");

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("nic", form.nic);
      fd.append("address", form.address);
      fd.append("mobile_number", form.mobile_number);
      fd.append("dob", form.dob);
      fd.append("gender", form.gender);
      fd.append("marital_status", form.marital_status);
      fd.append("bank_name", form.bank_name);
      fd.append("bank_branch", form.bank_branch);
      fd.append("bank_account_number", form.bank_account_number);
      if (imageFile) fd.append("image", imageFile);

      const res = await axios.put(`${API_BASE}/employees/me/profile`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        setSuccess("Profile updated successfully.");
        setTimeout(() => navigate("/employee-dashboard/profile"), 900);
      } else {
        setError(res.data.message || "Failed to update profile");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Profile</h2>
        <p className="text-sm text-gray-600 mb-6">Update personal information and bank details only.</p>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIC</label>
              <input name="nic" value={form.nic} onChange={handleChange} placeholder="e.g. 200012345678 or 991234567V" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input name="mobile_number" type="tel" value={form.mobile_number} onChange={handleChange} placeholder="e.g. 0771234567" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea name="address" rows={3} value={form.address} onChange={handleChange} placeholder="Permanent / residential address" className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm resize-y" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DOB</label>
              <DateInput name="dob" value={form.dob} onChange={handleChange} max={getMaxDobForMinimumAge(18)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
              <p className="mt-1 text-xs text-gray-500">Must be at least 18 years old</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <input name="gender" value={form.gender} onChange={handleChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" placeholder="e.g. Male/Female" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
              <input name="marital_status" value={form.marital_status} onChange={handleChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" placeholder="e.g. Single/Married" />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bank Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input name="bank_name" value={form.bank_name} onChange={handleChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                <input name="bank_branch" value={form.bank_branch} onChange={handleChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input name="bank_account_number" value={form.bank_account_number} onChange={handleChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm" />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile Image (optional)</h3>
            <div className="flex items-center gap-4">
              {employee?.userId?.profileImage ? (
                <img
                  src={getUploadUrl(employee.userId.profileImage) || undefined}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200" />
              )}
              <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-indigo-700 transition text-sm">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                {imageFile ? "Change Image" : "Upload Image"}
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => navigate("/employee-dashboard/profile")}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition font-semibold"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;

