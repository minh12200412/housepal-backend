// src/services/finance.service.js
import * as financeRepo from "../repositories/finance.repository.js";

const now = new Date();
const defaultMonth = now.getMonth() + 1;
const defaultYear = now.getFullYear();

const ensurePositive = (value, message) => {
  if (Number(value) <= 0) {
    const err = new Error(message || "Giá trị phải lớn hơn 0");
    err.status = 400;
    throw err;
  }
};

export const getFundSummary = async (houseId, month, year) => {
  return financeRepo.getFundSummary(
    houseId,
    month || defaultMonth,
    year || defaultYear
  );
};

export const updateFundSettings = async (
  houseId,
  contributionAmount,
  contributionFrequency
) => {
  ensurePositive(contributionAmount, "Mức đóng phải lớn hơn 0");
  return financeRepo.upsertFundSettings(
    houseId,
    contributionAmount,
    contributionFrequency || "monthly"
  );
};

export const addContribution = async (houseId, payload) => {
  ensurePositive(payload.amount, "Số tiền đóng quỹ phải lớn hơn 0");
  const month = payload.month || defaultMonth;
  const year = payload.year || defaultYear;
  return financeRepo.createContribution(
    houseId,
    payload.memberId,
    payload.amount,
    month,
    year,
    payload.contributionDate || new Date(),
    payload.receiptImage || null,
    payload.note || null
  );
};

export const listContributions = async (houseId, month, year) => {
  return financeRepo.listContributions(
    houseId,
    month || defaultMonth,
    year || defaultYear
  );
};

export const addCommonExpense = async (houseId, payload) => {
  ensurePositive(payload.amount, "Số tiền chi phải lớn hơn 0");
  return financeRepo.createCommonExpense(
    houseId,
    payload.paidBy,
    payload.title,
    payload.description || null,
    payload.amount,
    payload.expenseDate || new Date(),
    payload.category || null,
    payload.receiptImage || null
  );
};

export const listCommonExpenses = async (houseId, month, year) => {
  return financeRepo.listCommonExpenses(houseId, month || null, year || null);
};

export const removeCommonExpense = async (houseId, expenseId) => {
  return financeRepo.deleteCommonExpense(houseId, expenseId);
};

export const addAdHocExpense = async (houseId, payload) => {
  ensurePositive(payload.totalAmount, "Tổng chi phải lớn hơn 0");
  if (!payload.splits || payload.splits.length === 0) {
    const err = new Error("Cần cung cấp danh sách splits");
    err.status = 400;
    throw err;
  }
  return financeRepo.createAdHocExpense(
    houseId,
    payload.paidBy,
    payload.title,
    payload.description || null,
    payload.totalAmount,
    payload.expenseDate || new Date(),
    payload.category || null,
    payload.splitMethod || "equal",
    payload.receiptImage || null,
    payload.splits
  );
};

export const listAdHocExpenses = async (houseId, month, year) => {
  return financeRepo.listAdHocExpenses(houseId, month || null, year || null);
};

export const updateAdHocExpense = async (houseId, expenseId, payload) => {
  ensurePositive(payload.totalAmount ?? 1, "Tổng chi phải lớn hơn 0");
  return financeRepo.updateAdHocExpense(houseId, expenseId, payload);
};

export const deleteAdHocExpense = async (houseId, expenseId) => {
  return financeRepo.deleteAdHocExpense(houseId, expenseId);
};

export const listDebts = async (houseId, memberId, status) => {
  return financeRepo.listDebtsByMember(
    houseId,
    memberId || null,
    status || null
  );
};

export const getDebtSummary = async (houseId) => {
  return financeRepo.getDebtSummary(houseId);
};

export const payDebt = async (houseId, debtId, payload) => {
  ensurePositive(payload.amountPaid, "Số tiền thanh toán phải lớn hơn 0");
  return financeRepo.createDebtPayment(
    houseId,
    debtId,
    payload.amountPaid,
    payload.paymentDate || new Date(),
    payload.paymentMethod || null,
    payload.note || null,
    payload.proofImage || null
  );
};

export const confirmDebtPayment = async (paymentId, payload, confirmerId) => {
  return financeRepo.confirmDebtPayment(
    paymentId,
    payload.confirmed,
    payload.note || null,
    confirmerId || null
  );
};

export const listDebtPayments = async (houseId, debtId) => {
  return financeRepo.listDebtPayments(houseId, debtId);
};

export const getFundHistory = async (houseId, month, year, type) => {
  return financeRepo.getFundHistory(
    houseId,
    month || null,
    year || null,
    type || null
  );
};

export const getExpenseStatistics = async (houseId, month, year) => {
  return financeRepo.getExpenseStatistics(houseId, month || null, year || null);
};

export const getQuarterlySummary = async (houseId) => {
  return financeRepo.getQuarterlySummary(houseId);
};
