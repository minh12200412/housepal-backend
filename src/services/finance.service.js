// src/services/finance.service.js
import * as financeRepo from "../repositories/finance.repository.js";

export const getCurrentFund = async (houseId) => {
  // sau này sẽ lấy thật từ DB
  return financeRepo.findCurrentFundByHouse(houseId);
};

export const getExtraExpensesSample = async (houseId) => {
  // demo, trả mock data, sau này gọi repo
  return financeRepo.findExtraExpensesSample(houseId);
};

export const getDebtSummarySample = async (houseId) => {
  // demo, trả mock data, sau này tính thật
  return financeRepo.buildDebtSummarySample(houseId);
};
