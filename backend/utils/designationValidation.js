import Designation from "../models/Designation.js";

export const validateDesignationForDepartment = async (designationTitle, departmentId) => {
  if (!designationTitle?.trim() || !departmentId) {
    return false;
  }

  const trimmed = designationTitle.trim();
  const designation = await Designation.findOne({
    department: departmentId,
    title: { $regex: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });

  return !!designation;
};
