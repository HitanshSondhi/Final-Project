import { Router } from "express";

// import { verifyJWT } from "../middleware/authentication.js";

import {
    generateAcceptanceLetter,
    generatePromotionLetter,
    generateTerminationLetter
} from "../HospitalController/Admin and Helping staff/letter.controller.js";

const router = Router();

// Secure all letter generation routes, assuming only admins can access
// router.use(verifyJWT);

// Route to generate and send an acceptance letter
router.route("/acceptance").post(generateAcceptanceLetter);

// Route to generate and send a promotion letter
router.route("/promotion").post(generatePromotionLetter);

// Route to generate and send a termination letter
router.route("/termination").post(generateTerminationLetter);

export default router;