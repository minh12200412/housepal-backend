// src/repositories/bulletin.repository.js
// import { query } from '../config/db.js';

// Demo data cho Module 3
export const findNotesSample = async (houseId) => {
  return [
    {
      id: 1,
      houseId,
      title: "Mật khẩu wifi",
      content: "HousePal-123 / 12345678",
      pinned: true,
    },
    {
      id: 2,
      houseId,
      title: "Lịch thu tiền phòng",
      content: "Chủ nhà đến ngày 25 hàng tháng.",
      pinned: true,
    },
  ];
};

export const findShoppingItemsSample = async (houseId) => {
  return [
    {
      id: 1,
      houseId,
      name: "Giấy vệ sinh",
      quantity: 2,
      status: "TODO",
    },
    {
      id: 2,
      houseId,
      name: "Nước rửa bát",
      quantity: 1,
      status: "DONE",
    },
  ];
};
