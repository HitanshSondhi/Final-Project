import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "../../constants.js";

dotenv.config();

const connectDB=async ()=>{

     try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected ✅");
    console.log(`DB Name: ${connectionInstance.connection.name}`);
    console.log(`DB Host: ${connectionInstance.connection.host}`);
    
        
    }catch(error){
        console.log("Mongodb connection failed",error)

        process.exit(1);

    }
};

export default connectDB;
