import { Router } from "express";
import { loginUser, logoutUser, registerUser, updateUser, verifyEmail } from "../HospitalController/New User and Old/user.controller.js";

const Userouter=Router()
Userouter.route("/register").post(registerUser);
Userouter.route("/:id").put(updateUser);
Userouter.route("/login").post(loginUser);
Userouter.route("/verify-email").get(verifyEmail);
export default Userouter
