import Employee from "../models/Employee.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import Department from "../models/Department.js";

/* ================= MULTER SETUP ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".jpg", ".jpeg", ".png"].includes(ext)) {
      return cb(new Error("Only images are allowed"));
    }
    cb(null, true);
  },
});

/* ================= GET LAST EMPLOYEE ID ================= */
const getLastEmployeeId = async (req, res) => {
  try {
    // Find the last employee by sorting in descending order
    const lastEmployee = await Employee.findOne()
      .sort({ _id: -1 })
      .select("employee_id");

    let nextId = "BL001"; // Default first ID

    if (lastEmployee && lastEmployee.employee_id) {
      // Extract the numeric part from employee_id (e.g., "BL001" -> "001")
      const match = lastEmployee.employee_id.match(/(\d+)$/);
      if (match) {
        const lastNumber = parseInt(match[1]);
        const nextNumber = lastNumber + 1;
        // Pad with zeros to maintain 3-digit format
        nextId = `BL${String(nextNumber).padStart(3, "0")}`;
      }
    }

    return res.status(200).json({
      success: true,
      nextId,
      lastId: lastEmployee?.employee_id || null,
    });
  } catch (error) {
    console.error("Get Last Employee ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching next employee ID",
    });
  }
};

/* ================= ADD EMPLOYEE ================= */
const addEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employee_id,
      nic,
      dob,
      gender,
      marital_status,
      joined_date,
      resigned_date,
      designation,
      department,
      basic_salary,
      role,
      bank_name,
      bank_branch,
      bank_account_number,
    } = req.body;

    /* ---------------- ROLE NORMALIZATION ---------------- */
    const normalizeRole = (r) => {
      if (!r) return r;
      const x = String(r).toLowerCase();
      if (x === "hr_manager") return "hr";
      if (x === "account_manager" || x === "accountant") return "accountant";
      return x;
    };

    const assignerRole = normalizeRole(req.user?.role);

    const adminAllowed = [
      "admin",
      "hr",
      "accountant",
      "manager",
      "employee",
      "intern",
    ];

    const hrAllowed = ["hr", "manager", "employee", "intern"];

    if (!assignerRole || (assignerRole !== "admin" && assignerRole !== "hr")) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you are not allowed to add employees",
      });
    }

    const assignedRole = normalizeRole(role) || "employee";
    const allowedForAssigner =
      assignerRole === "admin" ? adminAllowed : hrAllowed;

    if (!allowedForAssigner.includes(assignedRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: you cannot assign role '${role}'`,
      });
    }

    /* ---------------- VALIDATION ---------------- */
    if (
      !name ||
      !email ||
      !password ||
      !nic ||
      !dob ||
      !joined_date ||
      !designation ||
      !department ||
      !basic_salary ||
      !bank_name ||
      !bank_branch ||
      !bank_account_number
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    /* ---------------- EMPLOYEE ID GENERATION ---------------- */
    let finalEmployeeId = employee_id;

    if (!finalEmployeeId) {
      const lastEmployee = await Employee.findOne()
        .sort({ _id: -1 })
        .select("employee_id");

      let nextId = "BL001";

      if (lastEmployee?.employee_id) {
        const match = lastEmployee.employee_id.match(/(\d+)$/);
        if (match) {
          const nextNumber = parseInt(match[1]) + 1;
          nextId = `BL${String(nextNumber).padStart(3, "0")}`;
        }
      }

      finalEmployeeId = nextId;
    }

    /* ---------------- DUPLICATE CHECKS ---------------- */
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email already exists" });

    if (await Employee.findOne({ employee_id: finalEmployeeId }))
      return res.status(400).json({ success: false, message: "Employee ID already exists" });

    if (await Employee.findOne({ nic }))
      return res.status(400).json({ success: false, message: "NIC already exists" });

    /* ---------------- CREATE USER ---------------- */
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      profileImage: req.file ? req.file.filename : null,
    });

    const savedUser = await newUser.save();

    /* ---------------- DEFAULT LEAVE ASSIGNMENT ---------------- */
    let leaveBalance = {
      casual: 0,
      annual: 0,
      sick: 0,
    };

    // Interns get only 7 casual leaves
    // All other roles get 7 casual + 14 annual + 21 sick
    if (assignedRole === "intern") {
      leaveBalance.casual = 7;
    } else {
      leaveBalance.casual = 7;
      leaveBalance.annual = 14;
      leaveBalance.sick = 21;
    }

    /* ---------------- CREATE EMPLOYEE ---------------- */
    const newEmployee = new Employee({
      userId: savedUser._id,
      employee_id: finalEmployeeId,
      email,
      nic,
      dob,
      gender,
      marital_status,
      joined_date,
      resigned_date: resigned_date || null,
      designation,
      department,
      basic_salary,
      role: assignedRole,
      bank_details: {
        bank_name,
        bank_branch,
        bank_account_number,
      },
      leave_balance: leaveBalance,
      image: req.file ? req.file.filename : null,
    });

    await newEmployee.save();

    /* ---------------- RESPONSE ---------------- */
    res.status(201).json({
      success: true,
      message: "Employee created successfully",
    });

  } catch (error) {
    console.error("Add Employee Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/* ================= GET ALL EMPLOYEES ================= */
const getEmployee = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("userId", "name role profileImage") // include role
      .populate("department", "dep_name");

    // Return all employees that have a linked user (don't restrict by user.role)
    const employeesWithUser = employees.filter((emp) => emp.userId);

    return res.status(200).json({
      success: true,
      employees: employeesWithUser,
    });
  } catch (error) {
    console.error("Get Employees Error:", error);
    return res.status(500).json({
      success: false,
      message: "Get employees server error",
    });
  }
};



/* ================= VIEW SINGLE EMPLOYEE ================= */
const viewEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate("userId", { password: 0 })
      .populate("department");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "View employee server error",
    });
  }
};

/* ================= REMOVE EMPLOYEE ================= */
const removeEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find employee
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // 2️⃣ Delete uploaded image if exists
    if (employee.image) {
      const imagePath = path.join("public", "uploads", employee.image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.warn("Could not delete image:", err.message);
        }
      });
    }

    // 3️⃣ Get linked userId BEFORE deleting employee
    const userId = employee.userId;

    // 4️⃣ Delete employee
    await Employee.findByIdAndDelete(id);

    // 5️⃣ Delete linked user
    if (userId) {
      await User.findByIdAndDelete(userId);
    }

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting employee",
    });
  }
};


/* ================= UPDATE EMPLOYEE ================= */
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      nic,
      email,
      employee_id,
      dob,
      gender,
      marital_status,
      joined_date,
      resigned_date,
      designation,
      department,
      basic_salary,
      role,
      bank_name,
      bank_branch,
      bank_account_number,
    } = req.body;

    /* ================= FIND EMPLOYEE ================= */
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const user = await User.findById(employee.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* ================= IMAGE HANDLING ================= */
    let imagePath = employee.image;
    if (req.file) {
      imagePath = req.file.filename;
    }

    /* ================= ROLE-SAFE UPDATE ================= */
    const callerRole = String(req.user?.role || "").toLowerCase();
    const callerUserId = req.user?.id ? String(req.user.id) : String(req.user?._id);

    // Employees are allowed to edit: personal info + bank details only (and optional profile image).
    // They must also be editing their own record.
    if (callerRole === "employee") {
      if (String(employee.userId) !== callerUserId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: you can only edit your own profile",
        });
      }

      const updateUser = {};
      if (typeof name === "string" && name.trim() !== "") updateUser.name = name.trim();
      if (typeof email === "string" && email.trim() !== "") updateUser.email = email.trim();
      if (req.file) updateUser.profileImage = imagePath;

      if (Object.keys(updateUser).length > 0) {
        await User.findByIdAndUpdate(employee.userId, updateUser, { new: true });
      }

      const updateEmployee = {};
      if (typeof nic === "string" && nic.trim() !== "") updateEmployee.nic = nic.trim();
      if (typeof email === "string" && email.trim() !== "") updateEmployee.email = email.trim();
      if (dob !== undefined) {
        const parsedDob = new Date(dob);
        if (Number.isNaN(parsedDob.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid DOB" });
        }
        updateEmployee.dob = parsedDob;
      }
      if (typeof gender === "string" && gender.trim() !== "") updateEmployee.gender = gender.trim();
      if (typeof marital_status === "string" && marital_status.trim() !== "") updateEmployee.marital_status = marital_status.trim();

      const hasAnyBankField =
        bank_name !== undefined || bank_branch !== undefined || bank_account_number !== undefined;
      if (hasAnyBankField) {
        updateEmployee.bank_details = {
          bank_name: bank_name ?? employee.bank_details?.bank_name,
          bank_branch: bank_branch ?? employee.bank_details?.bank_branch,
          bank_account_number: bank_account_number ?? employee.bank_details?.bank_account_number,
        };
      }

      if (req.file) updateEmployee.image = imagePath;

      await Employee.findByIdAndUpdate(id, updateEmployee, { new: true });

      return res.status(200).json({
        success: true,
        message: "Employee profile updated successfully",
      });
    }

    // Admin/HR/etc: keep existing behavior
    /* ================= UPDATE USER ================= */
    const userPayload = { name, email, role };
    if (req.file) {
      userPayload.profileImage = imagePath;
    }
    await User.findByIdAndUpdate(employee.userId, userPayload, { new: true });

    /* ================= UPDATE EMPLOYEE ================= */
    await Employee.findByIdAndUpdate(
      id,
      {
        nic,
        employee_id,
        dob,
        gender,
        marital_status,
        joined_date,
        resigned_date: resigned_date || null,
        designation,
        department,
        basic_salary,
        bank_details: {
          bank_name,
          bank_branch,
          bank_account_number: bank_account_number,
        },
        image: imagePath,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.error("Update Employee Error:", error);
    return res.status(500).json({
      success: false,
      message: "Edit employee server error",
    });
  }
};

const getMyEmployeeProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const employee = await Employee.findOne({ userId })
      .populate("userId", "name email role profileImage nic")
      .populate("department", "dep_name");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



/* ================= UPDATE MY EMPLOYEE PROFILE ================= */
const updateMyEmployeeProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const {
      name,
      email,
      nic,
      dob,
      gender,
      marital_status,
      bank_name,
      bank_branch,
      bank_account_number,
    } = req.body;

    const updateUser = {};
    if (typeof name === "string") {
      const v = name.trim();
      if (!v) return res.status(400).json({ success: false, message: "Name is required" });
      updateUser.name = v;
    }
    if (typeof email === "string") {
      const v = email.trim();
      if (!v) return res.status(400).json({ success: false, message: "Email is required" });
      updateUser.email = v;
    }
    if (req.file) {
      updateUser.profileImage = req.file.filename;
    }

    const updateEmployee = {};
    if (typeof nic === "string") {
      const v = nic.trim();
      if (!v) return res.status(400).json({ success: false, message: "NIC is required" });
      updateEmployee.nic = v;
    }

    if (typeof email === "string") {
      const v = email.trim();
      if (!v) return res.status(400).json({ success: false, message: "Email is required" });
      updateEmployee.email = v;
    }

    if (dob !== undefined) {
      const parsedDob = new Date(dob);
      if (Number.isNaN(parsedDob.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid DOB" });
      }
      updateEmployee.dob = parsedDob;
    }

    if (typeof gender === "string") {
      const v = gender.trim();
      if (!v) return res.status(400).json({ success: false, message: "Gender is required" });
      updateEmployee.gender = v;
    }

    if (typeof marital_status === "string") {
      const v = marital_status.trim();
      if (!v) return res.status(400).json({ success: false, message: "Marital status is required" });
      updateEmployee.marital_status = v;
    }

    const hasAnyBankField =
      bank_name !== undefined || bank_branch !== undefined || bank_account_number !== undefined;
    if (hasAnyBankField) {
      if (typeof bank_name === "string" && !bank_name.trim()) {
        return res.status(400).json({ success: false, message: "Bank name is required" });
      }
      if (typeof bank_branch === "string" && !bank_branch.trim()) {
        return res.status(400).json({ success: false, message: "Bank branch is required" });
      }
      if (typeof bank_account_number === "string" && !bank_account_number.trim()) {
        return res.status(400).json({ success: false, message: "Account number is required" });
      }

      updateEmployee.bank_details = {
        bank_name: bank_name ?? employee.bank_details?.bank_name,
        bank_branch: bank_branch ?? employee.bank_details?.bank_branch,
        bank_account_number: bank_account_number ?? employee.bank_details?.bank_account_number,
      };
    }

    if (req.file) {
      updateEmployee.image = req.file.filename;
    }

    if (Object.keys(updateUser).length > 0) {
      await User.findByIdAndUpdate(userId, updateUser, { new: true });
    }
    if (Object.keys(updateEmployee).length > 0) {
      await Employee.findByIdAndUpdate(employee._id, updateEmployee, { new: true });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update my employee profile error:", error);
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or NIC already exists",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Edit profile server error",
    });
  }
};


/* ================= EXPORTS ================= */
export {
  addEmployee,
  getEmployee,
  viewEmployee,
  removeEmployee,
  updateEmployee,
  getLastEmployeeId,
  getMyEmployeeProfile,
  updateMyEmployeeProfile,
  upload,
};
