import Designation from "../models/Designation.js";
import Department from "../models/Department.js";
import Employee from "../models/Employee.js";

const getDesignationsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const designations = await Designation.find({ department: departmentId }).sort({
      title: 1,
    });

    return res.status(200).json({ success: true, designations });
  } catch {
    return res.status(500).json({
      success: false,
      error: "Get designations server error",
    });
  }
};

const addDesignation = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Designation title is required",
      });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const trimmedTitle = title.trim();

    const existing = await Designation.findOne({
      department: departmentId,
      title: { $regex: new RegExp(`^${trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This designation already exists for this department",
      });
    }

    const newDesignation = new Designation({
      title: trimmedTitle,
      department: departmentId,
    });

    await newDesignation.save();

    return res.status(201).json({
      success: true,
      designation: newDesignation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This designation already exists for this department",
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
    const { departmentId, designationId } = req.params;
    const { title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Designation title is required",
      });
    }

    const designation = await Designation.findOne({
      _id: designationId,
      department: departmentId,
    });

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    const trimmedTitle = title.trim();
    const oldTitle = designation.title;

    const duplicate = await Designation.findOne({
      department: departmentId,
      _id: { $ne: designationId },
      title: { $regex: new RegExp(`^${trimmedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "This designation already exists for this department",
      });
    }

    designation.title = trimmedTitle;
    designation.updatedAt = new Date();
    await designation.save();

    if (oldTitle !== trimmedTitle) {
      await Employee.updateMany(
        { department: departmentId, designation: oldTitle },
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
        message: "This designation already exists for this department",
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
    const { departmentId, designationId } = req.params;

    const designation = await Designation.findOne({
      _id: designationId,
      department: departmentId,
    });

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
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
          "Cannot delete this designation because employees are assigned to it",
      });
    }

    await Designation.findByIdAndDelete(designationId);

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

export {
  getDesignationsByDepartment,
  addDesignation,
  updateDesignation,
  deleteDesignation,
};
