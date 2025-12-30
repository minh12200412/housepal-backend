// src/routes/finance.routes.js
import { Router } from "express";
import * as financeController from "../controllers/finance.controller.js";
// import { authMiddleware } from '../middlewares/auth.middleware.js';

export const router = Router();

// Nếu sau này có auth thì mở dòng này:
// router.use(authMiddleware);

// Fund summary & settings
router.get("/houses/:houseId/fund/summary", financeController.getFundSummary);
router.put(
  "/houses/:houseId/fund/settings",
  financeController.updateFundSettings
);
router.post(
  "/houses/:houseId/fund/contributions",
  financeController.createContribution
);
router.get(
  "/houses/:houseId/fund/contributions",
  financeController.listContributions
);

// Common fund expenses
router.post(
  "/houses/:houseId/expenses/common",
  financeController.createCommonExpense
);
router.get(
  "/houses/:houseId/expenses/common",
  financeController.listCommonExpenses
);
router.delete(
  "/houses/:houseId/expenses/common/:expenseId",
  financeController.deleteCommonExpense
);

// Ad-hoc expenses
router.post(
  "/houses/:houseId/expenses/adhoc",
  financeController.createAdHocExpense
);
router.get(
  "/houses/:houseId/expenses/adhoc",
  financeController.listAdHocExpenses
);
router.put(
  "/houses/:houseId/expenses/adhoc/:expenseId",
  financeController.updateAdHocExpense
);
router.delete(
  "/houses/:houseId/expenses/adhoc/:expenseId",
  financeController.deleteAdHocExpense
);

// Debts
router.get("/houses/:houseId/debts", financeController.listDebts);
router.get("/houses/:houseId/debts/summary", financeController.getDebtSummary);
router.post("/houses/:houseId/debts/:debtId/pay", financeController.payDebt);
router.put(
  "/houses/:houseId/debts/payments/:paymentId/confirm",
  financeController.confirmPayment
);
router.get(
  "/houses/:houseId/debts/:debtId/payments",
  financeController.listDebtPayments
);

// History & statistics
router.get("/houses/:houseId/fund/history", financeController.listFundHistory);
router.get(
  "/houses/:houseId/expenses/statistics",
  financeController.getExpenseStatistics
);
router.get(
  "/houses/:houseId/fund/quarterly-summary",
  financeController.getQuarterlySummary
);
