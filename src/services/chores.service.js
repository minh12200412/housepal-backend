// src/services/chores.service.js
import * as choresRepo from "../repositories/chores.repository.js";

export const getTodayChores = async (houseId) => {
  return choresRepo.findTodayChoresSample(houseId);
};

export const getChoreLeaderboard = async (houseId) => {
  return choresRepo.findChoreLeaderboardSample(houseId);
};
