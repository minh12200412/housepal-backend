// src/controllers/chores.controller.js
import * as choresService from "../services/chores.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getTodayChores = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await choresService.getTodayChores(+houseId);
    return sendSuccess(res, data, "Danh sách việc nhà hôm nay (demo)");
  } catch (err) {
    next(err);
  }
};

export const getChoreLeaderboard = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await choresService.getChoreLeaderboard(+houseId);
    return sendSuccess(res, data, "Bảng xếp hạng việc nhà (demo)");
  } catch (err) {
    next(err);
  }
};
