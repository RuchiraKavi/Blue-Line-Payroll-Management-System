import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Expand accepted role values to match frontend usages (hr, accountant, manager, etc.)
    role: { type: String, enum: [
        "admin",
        "hr",
        "accountant",
        "employee",
        "intern",
    ], required: true },
    profileImage: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

export default User;