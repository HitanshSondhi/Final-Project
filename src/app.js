import Userouter from "./HospitalRoutes/user.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import medicalRecordRouter from "./HospitalRoutes/medicalRecords.router.js";
import paymentRouter from "./HospitalRoutes/payment.router.js";

const app=express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//Api Callings
app.use("/api/v1/users",Userouter);
app.use("/api/v1/medical-records", medicalRecordRouter); 
app.use("/api/v1/payment", paymentRouter); 

export { app };