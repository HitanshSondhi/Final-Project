import Doctorouter from "./HospitalRoutes/doctor.router.js";
import Userouter from "./HospitalRoutes/user.routes.js";
import appointmentrouter from "./HospitalRoutes/appointment.router.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import letterRouter from "./HospitalRoutes/letter.router.js";
import medicalRecordRouter from "./HospitalRoutes/medicalRecords.router.js";
import paymentRouter from "./HospitalRoutes/payment.router.js";
import pharmacyRouter from "./HospitalRoutes/pharmacy.routes.js";
import inventoryRouter from "./HospitalRoutes/inventory.routes.js";
import adminRouter from "./HospitalRoutes/admin.routes.js";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    credentials: true
}))

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//Api Callings
app.use("/api/v1/users", Userouter);
app.use("/api/v1/medical-records", medicalRecordRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/letters", letterRouter);
app.use("/api/v1/doctor", Doctorouter)
app.use("/api/v1/appointment", appointmentrouter)
app.use("/api/v1/pharmacy", pharmacyRouter);
app.use("/api/v1/inventory", inventoryRouter);
app.use("/api/v1/admin", adminRouter);

export { app };