import React, { useState } from "react";
import { FaUser } from "react-icons/fa";
import { getUploadUrl } from "../../utils/apiConfig.js";

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

const ProfileAvatar = ({
  name = "",
  filename = "",
  sizeClass = "w-12 h-12",
  textClass = "text-sm",
  className = "",
}) => {
  const [failed, setFailed] = useState(false);
  const url = getUploadUrl(filename);
  const extra = className ? ` ${className}` : "";

  if (!url || failed) {
    return (
      <div
        className={`${sizeClass} shrink-0 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-indigo-700 font-semibold ${textClass}${extra}`}
        title={name || "No photo"}
        aria-hidden={!name}
      >
        {name ? initialsFromName(name) : <FaUser className="h-5 w-5 text-indigo-500" />}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name ? `${name} profile` : "Profile"}
      className={`${sizeClass} shrink-0 rounded-full object-cover border border-gray-200 bg-gray-50${extra}`}
      onError={() => setFailed(true)}
    />
  );
};

export default ProfileAvatar;
