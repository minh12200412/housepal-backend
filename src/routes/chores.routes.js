// src/routes/chores.routes.js
import { Router } from "express";
import * as choresController from "../controllers/chores.controller.js";
// import { authMiddleware } from '../middlewares/auth.middleware.js';

export const router = Router();

// router.use(authMiddleware);

// GET /api/chores/houses/:houseId/today
router.get("/houses/:houseId/today", choresController.getTodayChores);

// GET /api/chores/houses/:houseId/leaderboard
router.get(
  "/houses/:houseId/leaderboard",
  choresController.getChoreLeaderboard
);
