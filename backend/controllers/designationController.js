import Designation from "../models/Designation.js";
import DepartmentDesignation from "../models/DepartmentDesignation.js";
import Department from "../models/Department.js";
import Employee from "../models/Employee.js";
import { migrateLegacyDesignations } from "../utils/designationMigration.js";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAllDesignations = async (req, res) => {
  try {
    await migrateLegacyDesignations();

    const designations = await Designation.find().sort({ title: 1 });

    return res.status(200).json({ success: true, designations });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Get all designations server error",
    });
  }
};

const createDesignation = async (req, res) => {
  try {
    await migrateLegacyDesignations();

    const { title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Designation title is required",
      });
    }

    const trimmedTitle = title.trim();

    const existing = await Designation.findOne({
      title: { $regex: new RegExp(`^${escapeRegex(trimmedTitle)}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This designation already exists",
      });
    }

    const designation = await Designation.create({ title: trimmedTitle });

    return res.status(201).json({
      success: true,
      designation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This designation already exists",
      });
    }
    return res.status(500).json({
      success: false,
      error: "Add designation server error",
    });
  }
};

const updateDesignation = async (req, res) => {
  try {
    await migrateLegacyDesignations();

    const { id } = req.params;
    const { title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Designation title is required",
      });
    }

    const designation = await Designation.findById(id);
    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    const trimmedTitle = title.trim();
    const oldTitle = designation.title;

    const duplicate = await Designation.findOne({
      _id: { $ne: id },
      title: { $regex: new RegExp(`^${escapeRegex(trimmedTitle)}$`, "i") },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "This designation already exists",
      });
    }

    designation.title = trimmedTitle;
    await designation.save();

    if (oldTitle !== trimmedTitle) {
      await Employee.updateMany(
        { designation: oldTitle },
        { designation: trimmedTitle }
      );
    }

    return res.status(200).json({
      success: true,
      designation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This designation already exists",
      });
    }
    return res.status(500).json({
      success: false,
      error: "Update designation server error",
    });
  }
};

const deleteDesignation = async (req, res) => {
  try {
    await migrateLegacyDesignations();

    const { id } = req.params;

    const designation = await Designation.findById(id);
    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    const assigned = await DepartmentDesignation.findOne({
      designation: id,
    });

    if (assigned) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete this designation because it is assigned to one or more departments",
      });
    }

    const inUse = await Employee.findOne({
      designation: designation.title,
    });

    if (inUse) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete this designation because employees are assigned to it",
      });
    }

    await Designation.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Designation deleted successfully",
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Delete designation server error",
    });
  }
};

const getDesignationsByDepartment = async (req, res) => {
  try {
    await migrateLegacyDesignations();

    const { departmentId } = req.params;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const assignments = await DepartmentDesignation.find({
      department: departmentId,
    })
      .populate("designation", "title")
      .sort({ "designation.title": 1 });

    const designations = assignments
      .filter((item) => item.designation)
      .map((item) => ({
        _id: item.designation._id,
        title: item.designation.title,
        assignmentId: item._id,
      }));

    return res.status(200).json({ success: true, designations });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Get designations server error",
    });
  }
};

const assignDesignationToDepartment = async (req, res) => {
  try {
    await migrateLegacyDesignations();

    const { departmentId } = req.params;
    const { designationId } = req.body;

    if (!designationId) {
      return res.status(400).json({
        success: false,
        message: "Designation is required",
      });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const designation = await Designation.findById(designationId);
    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    const existing = await DepartmentDesignation.findOne({
      department: departmentId,
      designation: designationId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This designation is already assigned to the department",
      });
    }

    const assignment = await DepartmentDesignation.create({
      department: departmentId,
      designation: designationId,
    });

    return res.status(201).json({
      success: true,
      assignment,
      designation: {
        _id: designation._id,
        title: designation.title,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This designation is already assigned to the department",
      });
    }
    return res.status(500).json({
      success: false,
      error: "Assign designation server error",
    });
  }
};

const unassignDesignationFromDepartment = async (req, res) => {
  try {
    await migrateLegacyDesignations();

    const { departmentId, designationId } = req.params;

    const designation = await Designation.findById(designationId);
    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    const assignment = await DepartmentDesignation.findOne({
      department: departmentId,
      designation: designationId,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Designation is not assigned to this department",
      });
    }

    const inUse = await Employee.findOne({
      department: departmentId,
      designation: designation.title,
    });

    if (inUse) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot remove this designation because employees in this department use it",
      });
    }

    await DepartmentDesignation.findByIdAndDelete(assignment._id);

    return res.status(200).json({
      success: true,
      message: "Designation removed from department successfully",
    });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Unassign designation server error",
    });
  }
};

export {
  getAllDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getDesignationsByDepartment,
  assignDesignationToDepartment,
  unassignDesignationFromDepartment,
};
