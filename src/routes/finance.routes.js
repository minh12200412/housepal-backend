// src/routes/finance.routes.js
import { Router } from "express";
import * as financeController from "../controllers/finance.controller.js";
// import { authMiddleware } from '../middlewares/auth.middleware.js';

export const router = Router();

// Nếu sau này có auth thì mở dòng này:
// router.use(authMiddleware);

// GET /api/finance/houses/:houseId/funds/current
router.get("/houses/:houseId/funds/current", financeController.getCurrentFund);

// GET /api/finance/houses/:houseId/extra-expenses
router.get(
  "/houses/:houseId/extra-expenses",
  financeController.getExtraExpensesSample
);

// GET /api/finance/houses/:houseId/debts/summary
router.get(
  "/houses/:houseId/debts/summary",
  financeController.getDebtSummarySample
);
