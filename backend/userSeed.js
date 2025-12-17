import User from "./models/User.js"
import bcrypt from "bcrypt"
import connectToDatabase from "./db/db.js";

const userRegister = async () => {
    await connectToDatabase();
    try{
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const newUser = new User({
            name: "Admin",
            email: "admin@gmail.com",
            password: hashedPassword,
            role: "admin",

        })
        await newUser.save();
        console.log("User seeded successfully");
        process.exit(0);
    }
    catch(error){
        console.log(error)
        process.exit(1);
    }
}

userRegister();