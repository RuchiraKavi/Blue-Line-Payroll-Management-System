const NIC_PATTERN = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MOBILE_PATTERN = /^0[1-9][0-9]{8}$/;

export const normalizeNic = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^[0-9]{9}[vVxX]$/.test(trimmed)) {
    return `${trimmed.slice(0, 9)}${trimmed.slice(9).toUpperCase()}`;
  }
  return trimmed;
};

export const normalizeMobileNumber = (value) =>
  String(value || "").trim().replace(/[\s-]/g, "");

export const calculateAge = (dob) => {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

export const getMaxDobForMinimumAge = (minimumAge = 18) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - minimumAge);
  return date.toISOString().slice(0, 10);
};

export const validateNic = (value) => {
  const normalized = normalizeNic(value);
  if (!normalized) return "NIC is required";
  if (!NIC_PATTERN.test(normalized)) {
    return "Invalid NIC format (use 9 digits + V/X or 12 digits)";
  }
  return null;
};

export const validateEmail = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Email is required";
  if (!EMAIL_PATTERN.test(trimmed)) return "Invalid email format";
  return null;
};

export const validateMobileNumber = (value) => {
  const normalized = normalizeMobileNumber(value);
  if (!normalized) return "Mobile number is required";
  if (!MOBILE_PATTERN.test(normalized)) {
    return "Invalid mobile number (use 10 digits starting with 0, e.g. 0771234567)";
  }
  return null;
};

export const validateAddress = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "Address is required";
  if (trimmed.length < 5) return "Address must be at least 5 characters";
  return null;
};

export const validateDobMinimumAge = (value, minimumAge = 18) => {
  if (!value) return "Date of birth is required";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Invalid date of birth";
  const age = calculateAge(parsed);
  if (age === null || age < minimumAge) {
    return `Employee must be at least ${minimumAge} years old`;
  }
  return null;
};
