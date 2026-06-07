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
  if (!normalized) {
    return { ok: false, message: "NIC is required" };
  }
  if (!NIC_PATTERN.test(normalized)) {
    return {
      ok: false,
      message: "Invalid NIC format (use 9 digits + V/X or 12 digits)",
    };
  }
  return { ok: true, value: normalized };
};

export const validateEmail = (value) => {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, message: "Email is required" };
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { ok: false, message: "Invalid email format" };
  }
  return { ok: true, value: trimmed };
};

export const validateMobileNumber = (value) => {
  const normalized = normalizeMobileNumber(value);
  if (!normalized) {
    return { ok: false, message: "Mobile number is required" };
  }
  if (!MOBILE_PATTERN.test(normalized)) {
    return {
      ok: false,
      message: "Invalid mobile number (use 10 digits starting with 0, e.g. 0771234567)",
    };
  }
  return { ok: true, value: normalized };
};

export const validateAddress = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return { ok: false, message: "Address is required" };
  }
  if (trimmed.length < 5) {
    return { ok: false, message: "Address must be at least 5 characters" };
  }
  return { ok: true, value: trimmed };
};

export const validateDobMinimumAge = (value, minimumAge = 18) => {
  if (!value) {
    return { ok: false, message: "Date of birth is required" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, message: "Invalid date of birth" };
  }

  const age = calculateAge(parsed);
  if (age === null || age < minimumAge) {
    return {
      ok: false,
      message: `Employee must be at least ${minimumAge} years old`,
    };
  }

  return { ok: true, value: parsed };
};

export const validateEmployeeRegistrationFields = ({
  nic,
  email,
  mobile_number,
  address,
  dob,
  minimumAge = 18,
}) => {
  const nicResult = validateNic(nic);
  if (!nicResult.ok) return nicResult;

  const emailResult = validateEmail(email);
  if (!emailResult.ok) return emailResult;

  const mobileResult = validateMobileNumber(mobile_number);
  if (!mobileResult.ok) return mobileResult;

  const addressResult = validateAddress(address);
  if (!addressResult.ok) return addressResult;

  const dobResult = validateDobMinimumAge(dob, minimumAge);
  if (!dobResult.ok) return dobResult;

  return {
    ok: true,
    values: {
      nic: nicResult.value,
      email: emailResult.value,
      mobile_number: mobileResult.value,
      address: addressResult.value,
      dob: dobResult.value,
    },
  };
};
