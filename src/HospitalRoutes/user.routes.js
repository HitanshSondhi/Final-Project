import { Router } from "express";
import { registerUser, updateUser } from "../HospitalController/user.controller.js";

const router=Router()
router.route("/register").post(registerUser);
router.route("/:id").put(updateUser);

export default router
