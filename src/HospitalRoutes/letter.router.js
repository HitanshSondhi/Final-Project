import { Router } from "express";

import {
    generateAcceptanceLetter,
    generatePromotionLetter,
    generateTerminationLetter
} from "../HospitalController/Admin and Helping staff/letter.controller.js";

const router = Router();


router.route("/acceptance").post(generateAcceptanceLetter);


router.route("/promotion").post(generatePromotionLetter);

// Route to generate and send a termination letter
router.route("/termination").post(generateTerminationLetter);

export default router;