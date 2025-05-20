import { Router } from "express";
import { loginUser, registerUser, updateUser } from "../HospitalController/user.controller.js";

const router=Router()
router.route("/register").post(registerUser);
router.route("/:id").put(updateUser);
 router.route("/login").post(loginUser)

export default router
