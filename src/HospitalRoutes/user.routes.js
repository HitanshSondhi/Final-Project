import { Router } from "express";
import { loginUser, registerUser, updateUser } from "../HospitalController/user.controller.js";

const Userouter=Router()
Userouter.route("/register").post(registerUser);
Userouter.route("/:id").put(updateUser);
 Userouter.route("/login").post(loginUser)

export default Userouter
