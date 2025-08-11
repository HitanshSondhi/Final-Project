import { Router } from "express";
import { loginUser, logoutUser, registerUser, updateUser, verifyUser } from "../HospitalController/User Registration/patient.controller.js";

const Userouter=Router()
Userouter.route("/register").post(registerUser);
Userouter.route("/:id").put(updateUser);
Userouter.route("/login").post(loginUser);

Userouter.route("/verifyUser").post(verifyUser);
export default Userouter
