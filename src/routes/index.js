// src/routes/index.js
import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.js";
import { router as financeRouter } from "./finance.routes.js";
import { router as choresRouter } from "./chores.routes.js";
import { router as bulletinRouter } from "./bulletin.routes.js";
import { router as authRouter } from "./auth.routes.js";
import { router as houseRouter } from "./house.routes.js";

export const router = Router();

// Test health
router.get("/health", healthCheck);

// Auth (stub)
router.use("/auth", authRouter);

// House (stub)
router.use("/houses", houseRouter);

// Module 1 – Việc nhà
router.use("/chores", choresRouter);

// Module 2 – Finance / Quỹ chung
router.use("/finance", financeRouter);

// Module 3 – Bảng tin
router.use("/bulletin", bulletinRouter);
