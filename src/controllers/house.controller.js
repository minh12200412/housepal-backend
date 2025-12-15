import { sendSuccess } from "../utils/apiResponse.js";

export const getHousesDemo = async (req, res, next) => {
  try {
    const data = [
      { id: 1, name: "Nhà trọ 123 – Ngõ 45" },
      { id: 2, name: "Căn hộ chung cư ABC" },
    ];
    return sendSuccess(res, data, "Danh sách nhà (demo)");
  } catch (err) {
    next(err);
  }
};
