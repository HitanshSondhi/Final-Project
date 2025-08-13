import { Router } from "express";
import { loginDoctor, logoutDoctor, registerDoctor, resendOTP, verifyDoctor } from "../HospitalController/User Registration/doctor.controller.js";

const Doctorouter=Router();

Doctorouter.route("/registerDoctor").post(registerDoctor);
Doctorouter.route("/verifyDoctor").post(verifyDoctor);
Doctorouter.route("/loginDoctor").post(loginDoctor);
Doctorouter.route("/logoutDoctor").post(logoutDoctor);
Doctorouter.route("/resendOTP").post(resendOTP);


export default Doctorouter;

