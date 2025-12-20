// src/routes/bulletin.routes.js
import { Router } from "express";
import * as bulletinController from "../controllers/bulletin.controller.js";
// import { authMiddleware } from '../middlewares/auth.middleware.js';

export const router = Router();

// router.use(authMiddleware);

// Notes
// GET /api/bulletin/houses/:houseId/notes
router.get("/houses/:houseId/notes", bulletinController.getNotes);
// POST /api/bulletin/houses/:houseId/notes
router.post("/houses/:houseId/notes", bulletinController.createNote);
// PUT /api/bulletin/notes/:id
router.put("/notes/:id", bulletinController.updateNote);
// DELETE /api/bulletin/notes/:id
router.delete("/notes/:id", bulletinController.deleteNote);

// Items
// GET /api/bulletin/houses/:houseId/items
router.get("/houses/:houseId/items", bulletinController.getItems);
// POST /api/bulletin/houses/:houseId/items
router.post("/houses/:houseId/items", bulletinController.createItem);
// PUT /api/bulletin/items/:id
router.put("/items/:id", bulletinController.updateItem);
// DELETE /api/bulletin/items/:id
router.delete("/items/:id", bulletinController.deleteItem);

// Comments
// GET /api/bulletin/houses/:houseId/comments/:targetType/:targetId
router.get("/houses/:houseId/comments/:targetType/:targetId", bulletinController.getComments);
// POST /api/bulletin/houses/:houseId/comments/:targetType/:targetId
router.post("/houses/:houseId/comments/:targetType/:targetId", bulletinController.createComment);
// DELETE /api/bulletin/comments/:id
router.delete("/comments/:id", bulletinController.deleteComment);
