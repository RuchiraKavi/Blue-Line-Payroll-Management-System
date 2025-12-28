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
      "hr_manager",
      "accountant",
      "account_manager",
      "manager",
      "employee",
      "intern",
    ];

    const hrAllowed = ["hr", "hr_manager", "manager", "employee", "intern"];

    if (!assignerRole || (assignerRole !== "admin" && assignerRole !== "hr")) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you are not allowed to add employees",
      });
    }

    const assignedRole = normalizeRole(role) || "employee";
    const allowedForAssigner = assignerRole === "admin" ? adminAllowed : hrAllowed;

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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const existingEmployeeId = await Employee.findOne({ employee_id: finalEmployeeId });
    if (existingEmployeeId) {
      return res.status(400).json({ success: false, message: "Employee ID already exists" });
    }

    const existingNIC = await Employee.findOne({ nic });
    if (existingNIC) {
      return res.status(400).json({ success: false, message: "NIC already exists" });
    }

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
      bank_details: {
        bank_name,
        bank_branch,
        bank_account_number,
      },
      image: req.file ? req.file.filename : null,
    });

    await newEmployee.save();

    /* ---------------- RESPONSE ---------------- */
    res.status(201).json({
      success: true,
      message: "Employee and User created successfully",
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
      message: "Employee and user deleted successfully",
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

    /* ================= UPDATE USER ================= */
    await User.findByIdAndUpdate(
      employee.userId,
      {
        name,
        email,
        role,
      },
      { new: true }
    );

    /* ================= IMAGE HANDLING ================= */
    let imagePath = employee.image;
    if (req.file) {
      imagePath = req.file.filename;
    }

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


/* ================= EXPORTS ================= */
export {
  addEmployee,
  getEmployee,
  viewEmployee,
  removeEmployee,
  updateEmployee,
  getLastEmployeeId,
  upload,
};
