// src/routes/bulletin.routes.js
import { Router } from "express";
import * as bulletinController from "../controllers/bulletin.controller.js";
// import { authMiddleware } from '../middlewares/auth.middleware.js';

export const router = Router();

// router.use(authMiddleware);

// GET /api/bulletin/houses/:houseId/notes
router.get("/houses/:houseId/notes", bulletinController.getNotes);

// GET /api/bulletin/houses/:houseId/shopping-items
router.get(
  "/houses/:houseId/shopping-items",
  bulletinController.getShoppingItems
);
