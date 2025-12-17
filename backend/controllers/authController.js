import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcrypt";

// LOGIN CONTROLLER
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, msg: "Invalid email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, msg: "Invalid password" });
        }

        const token = jwt.sign(
            { _id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// VERIFY CONTROLLER
export const verifyUser = async (req, res) => {
    return res.status(200).json({ success: true, user: req.user });
};
