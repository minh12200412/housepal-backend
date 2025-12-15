// src/services/bulletin.service.js
import * as bulletinRepo from "../repositories/bulletin.repository.js";

export const getNotes = async (houseId) => {
  return bulletinRepo.findNotesSample(houseId);
};

export const getShoppingItems = async (houseId) => {
  return bulletinRepo.findShoppingItemsSample(houseId);
};
