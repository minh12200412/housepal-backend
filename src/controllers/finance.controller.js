// src/controllers/finance.controller.js
import * as financeService from "../services/finance.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getCurrentFund = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await financeService.getCurrentFund(+houseId);
    return sendSuccess(res, data, "Lấy quỹ sinh hoạt hiện tại thành công");
  } catch (err) {
    next(err);
  }
};

export const getExtraExpensesSample = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await financeService.getExtraExpensesSample(+houseId);
    return sendSuccess(res, data, "Danh sách chi tiêu phát sinh (demo)");
  } catch (err) {
    next(err);
  }
};

export const getDebtSummarySample = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await financeService.getDebtSummarySample(+houseId);
    return sendSuccess(res, data, "Tóm tắt Ai nợ Ai (demo)");
  } catch (err) {
    next(err);
  }
};
