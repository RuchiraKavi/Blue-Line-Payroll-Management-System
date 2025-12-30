import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import departmentRouter from './routes/department.js';
import employeeRouter from './routes/employee.js';
import connectToDatabase from './db/db.js';
import leaveRouter from './routes/leave.js';
import passwordRouter from './routes/password.js';
import path from 'path';
import { fileURLToPath } from 'url';


connectToDatabase();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/leaves', leaveRouter);
app.use("/api/password-change", passwordRouter);

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(cors({
  origin: "http://localhost:5173", // frontend URL
  methods: ["GET","POST","PUT","DELETE"],
  credentials: true
}));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});