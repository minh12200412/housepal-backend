import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

export const router = Router();

// POST /api/auth/login (demo)
router.post("/login", authController.loginDemo);
