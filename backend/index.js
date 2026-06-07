import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import departmentRouter from './routes/department.js';
import designationRouter from './routes/designation.js';
import employeeRouter from './routes/employee.js';
import attendanceRouter from './routes/attendance.js';
import connectToDatabase from './db/db.js';
import leaveRouter from './routes/leave.js';
import passwordRouter from './routes/password.js';
import salaryRouter from './routes/salary.js';
import dashboardRouter from './routes/dashboard.js';
import advanceRouter from './routes/advance.js';
import roleRouter from './routes/role.js';
import path from 'path';
import { fileURLToPath } from 'url';


connectToDatabase();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use('/api/auth', authRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/designations', designationRouter);
app.use('/api/roles', roleRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves', leaveRouter);
app.use("/api/password-change", passwordRouter);
app.use("/api/salary", salaryRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/advance", advanceRouter);

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(cors({
  origin: "http://localhost:5173", // frontend URL
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});