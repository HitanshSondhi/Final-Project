import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
    path: './.env' // Correct path to your .env file
});

connectDB()
 .then(()=>{
    app.on("error",()=>{
        console.log("Error :",error);
        throw error
       })
    app.listen(process.env.PORT||3000,()=>{
        console.log(`Server is running at port: ${process.env.PORT}`);
    })
 })   
 .catch((err)=>{
    console.log("Mongodb connection failed",err);
 })

