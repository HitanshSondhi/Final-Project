import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "../../constants.js";

dotenv.config();

const connectDB=async ()=>{

     try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`, {
           
        });
        console.log(`\n MongoDb connected !! Db Host ${connectionInstance.connection.host}`);
        console.log(`Connection Status: ${connectionInstance.readyState}`);
    
        
    }catch(error){
        console.log("Mongodb connection failed",error)

        process.exit(1);

    }
};

export default connectDB;
