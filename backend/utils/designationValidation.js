import Designation from "../models/Designation.js";
import DepartmentDesignation from "../models/DepartmentDesignation.js";
import { migrateLegacyDesignations } from "./designationMigration.js";

export const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const designationsMatch = (left, right) =>
  String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();

export const validateDesignationForDepartment = async (
  designationTitle,
  departmentId
) => {
  if (!designationTitle?.trim() || !departmentId) {
    return false;
  }

  await migrateLegacyDesignations();

  const trimmed = designationTitle.trim();
  const designation = await Designation.findOne({
    title: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
  });

  if (!designation) {
    return false;
  }

  const assignment = await DepartmentDesignation.findOne({
    department: departmentId,
    designation: designation._id,
  });

  return !!assignment;
};
