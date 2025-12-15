// src/repositories/finance.repository.js
import { query } from "../config/db.js";

// Lấy quỹ sinh hoạt mới nhất của 1 nhà (demo: nếu chưa có, trả mock)
export const findCurrentFundByHouse = async (houseId) => {
  const sql = `
    SELECT *
    FROM monthly_funds
    WHERE house_id = $1
    ORDER BY year DESC, month DESC
    LIMIT 1
  `;
  const { rows } = await query(sql, [houseId]);

  if (rows.length === 0) {
    // mock nếu chưa có dữ liệu
    return {
      id: null,
      house_id: houseId,
      year: 2025,
      month: 12,
      contribution_per_member: 500000,
      status: "OPEN",
      current_balance: 0,
    };
  }

  // TODO: tính current_balance từ contributions + expenses
  return rows[0];
};

// Demo chi tiêu phát sinh (chưa nối DB)
export const findExtraExpensesSample = async (houseId) => {
  return [
    {
      id: 1,
      house_id: houseId,
      title: "Đi ăn lẩu cuối tuần",
      amount: 600000,
      paid_by_member_id: 1,
      spent_at: new Date(),
      split_type: "EQUAL",
      status: "OPEN",
    },
    {
      id: 2,
      house_id: houseId,
      title: "Bánh sinh nhật",
      amount: 300000,
      paid_by_member_id: 2,
      spent_at: new Date(),
      split_type: "CUSTOM",
      status: "OPEN",
    },
  ];
};

// Demo summary Ai nợ Ai (chưa nối DB)
export const buildDebtSummarySample = async (houseId) => {
  return {
    houseId,
    overview: [
      { memberName: "Minh", balance: 125000 }, // dương: được nhận
      { memberName: "Lan", balance: -25000 }, // âm: đang nợ
      { memberName: "Tuấn", balance: -100000 },
    ],
    pairs: [
      { from: "Lan", to: "Minh", amount: 25000 },
      { from: "Tuấn", to: "Minh", amount: 100000 },
    ],
  };
};
