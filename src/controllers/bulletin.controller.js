// src/controllers/bulletin.controller.js
import * as bulletinService from "../services/bulletin.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getNotes = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await bulletinService.getNotes(+houseId);
    return sendSuccess(res, data, "Danh sách ghi chú chung (demo)");
  } catch (err) {
    next(err);
  }
};

export const getShoppingItems = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await bulletinService.getShoppingItems(+houseId);
    return sendSuccess(res, data, "Danh sách mua sắm chung (demo)");
  } catch (err) {
    next(err);
  }
};
