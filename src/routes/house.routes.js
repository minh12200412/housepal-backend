import { Router } from "express";
import * as houseController from "../controllers/house.controller.js";

export const router = Router();

// GET /api/houses (demo)
router.get("/", houseController.getHousesDemo);
