import { Router } from "express";
import { verifyJWT } from "../middleware/authentication.js";

import {
  cancelAppointment,
  createAppointment,
  updateAppointment,
  
} from "../HospitalController/Appointement handeling/Appointment.controller.js";


const appointmentrouter = Router();





appointmentrouter.post("/",verifyJWT, createAppointment);


appointmentrouter.put("/:id",verifyJWT, updateAppointment);


appointmentrouter.delete("/:id",verifyJWT, cancelAppointment);

export default appointmentrouter;
