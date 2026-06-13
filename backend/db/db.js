import mongoose from 'mongoose';
import { migrateLegacyRoles } from '../utils/roleMigration.js';

const connectToDatabase = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        await migrateLegacyRoles();
        console.log("Database connected successfully");
    }
    catch(error){
        console.log("Database connection error: "+error)
    }
}

export default connectToDatabase;