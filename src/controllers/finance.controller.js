// src/controllers/finance.controller.js
import * as financeService from "../services/finance.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getFundSummary = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const { month, year } = req.query;
    const data = await financeService.getFundSummary(
      +houseId,
      Number(month) || undefined,
      Number(year) || undefined
    );
    return sendSuccess(res, data, "Lấy quỹ sinh hoạt hiện tại thành công");
  } catch (err) {
    next(err);
  }
};

export const updateFundSettings = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const { contributionAmount, contributionFrequency } = req.body;
    const data = await financeService.updateFundSettings(
      +houseId,
      contributionAmount,
      contributionFrequency
    );
    return sendSuccess(res, data, "Cập nhật mức đóng quỹ thành công");
  } catch (err) {
    next(err);
  }
};

export const createContribution = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await financeService.addContribution(+houseId, req.body);
    return sendSuccess(res, data, "Ghi nhận đóng góp thành công");
  } catch (err) {
    next(err);
  }
};

export const listContributions = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const { month, year } = req.query;
    const data = await financeService.listContributions(
      +houseId,
      Number(month) || undefined,
      Number(year) || undefined
    );
    return sendSuccess(res, data, "Danh sách đóng góp quỹ");
  } catch (err) {
    next(err);
  }
};

export const createCommonExpense = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await financeService.addCommonExpense(+houseId, req.body);
    return sendSuccess(res, data, "Thêm chi tiêu quỹ thành công");
  } catch (err) {
    next(err);
  }
};

export const listCommonExpenses = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const { month, year } = req.query;
    const data = await financeService.listCommonExpenses(
      +houseId,
      Number(month) || undefined,
      Number(year) || undefined
    );
    return sendSuccess(res, data, "Danh sách chi tiêu quỹ");
  } catch (err) {
    next(err);
  }
};

export const deleteCommonExpense = async (req, res, next) => {
  try {
    const { houseId, expenseId } = req.params;
    const data = await financeService.removeCommonExpense(+houseId, +expenseId);
    return sendSuccess(res, data, "Xóa chi tiêu thành công");
  } catch (err) {
    next(err);
  }
};

export const createAdHocExpense = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await financeService.addAdHocExpense(+houseId, req.body);
    return sendSuccess(res, data, "Thêm chi tiêu phát sinh thành công");
  } catch (err) {
    next(err);
  }
};

export const listAdHocExpenses = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const { month, year } = req.query;
    const data = await financeService.listAdHocExpenses(
      +houseId,
      Number(month) || undefined,
      Number(year) || undefined
    );
    return sendSuccess(res, data, "Danh sách chi tiêu phát sinh");
  } catch (err) {
    next(err);
  }
};

export const updateAdHocExpense = async (req, res, next) => {
  try {
    const { houseId, expenseId } = req.params;
    const data = await financeService.updateAdHocExpense(
      +houseId,
      +expenseId,
      req.body
    );
    return sendSuccess(res, data, "Cập nhật chi tiêu phát sinh thành công");
  } catch (err) {
    next(err);
  }
};

export const deleteAdHocExpense = async (req, res, next) => {
  try {
    const { houseId, expenseId } = req.params;
    const data = await financeService.deleteAdHocExpense(+houseId, +expenseId);
    return sendSuccess(res, data, "Xóa chi tiêu phát sinh thành công");
  } catch (err) {
    next(err);
  }
};

export const listDebts = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const { memberId, status } = req.query;
    const data = await financeService.listDebts(
      +houseId,
      Number(memberId) || undefined,
      status || undefined
    );
    return sendSuccess(res, data, "Danh sách nợ");
  } catch (err) {
    next(err);
  }
};

export const getDebtSummary = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await financeService.getDebtSummary(+houseId);
    return sendSuccess(res, data, "Tóm tắt Ai nợ Ai");
  } catch (err) {
    next(err);
  }
};

export const payDebt = async (req, res, next) => {
  try {
    const { houseId, debtId } = req.params;
    const data = await financeService.payDebt(+houseId, +debtId, req.body);
    return sendSuccess(res, data, "Ghi nhận thanh toán thành công");
  } catch (err) {
    next(err);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const data = await financeService.confirmDebtPayment(
      +paymentId,
      req.body,
      req.user?.id || null
    );
    return sendSuccess(res, data, "Xác nhận thanh toán thành công");
  } catch (err) {
    next(err);
  }
};

export const listDebtPayments = async (req, res, next) => {
  try {
    const { houseId, debtId } = req.params;
    const data = await financeService.listDebtPayments(+houseId, +debtId);
    return sendSuccess(res, data, "Lịch sử thanh toán nợ");
  } catch (err) {
    next(err);
  }
};

export const listFundHistory = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const { month, year, type } = req.query;
    const data = await financeService.getFundHistory(
      +houseId,
      Number(month) || undefined,
      Number(year) || undefined,
      type || undefined
    );
    return sendSuccess(res, data, "Lịch sử quỹ");
  } catch (err) {
    next(err);
  }
};

export const getExpenseStatistics = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const { month, year } = req.query;
    const data = await financeService.getExpenseStatistics(
      +houseId,
      Number(month) || undefined,
      Number(year) || undefined
    );
    return sendSuccess(res, data, "Thống kê chi tiêu");
  } catch (err) {
    next(err);
  }
};

export const getQuarterlySummary = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await financeService.getQuarterlySummary(+houseId);
    return sendSuccess(res, data, "Tóm tắt quỹ 3 tháng");
  } catch (err) {
    next(err);
  }
};
