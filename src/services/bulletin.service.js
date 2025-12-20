// src/services/bulletin.service.js
import * as bulletinRepo from "../repositories/bulletin.repository.js";

export const getNotes = async (houseId) => {
  return bulletinRepo.findNotesByHouseId(houseId);
};

export const getNoteById = async (id) => {
  return bulletinRepo.findNoteById(id);
};

export const createNote = async (noteData) => {
  return bulletinRepo.createNote(noteData);
};

export const updateNote = async (id, noteData) => {
  return bulletinRepo.updateNote(id, noteData);
};

export const deleteNote = async (id) => {
  return bulletinRepo.deleteNote(id);
};

export const getItems = async (houseId) => {
  return bulletinRepo.findItemsByHouseId(houseId);
};

export const getItemById = async (id) => {
  return bulletinRepo.findItemById(id);
};

export const createItem = async (itemData) => {
  return bulletinRepo.createItem(itemData);
};

export const updateItem = async (id, itemData) => {
  return bulletinRepo.updateItem(id, itemData);
};

export const deleteItem = async (id) => {
  return bulletinRepo.deleteItem(id);
};

export const getComments = async (houseId, targetType, targetId) => {
  return bulletinRepo.findCommentsByTarget(houseId, targetType, targetId);
};

export const createComment = async (commentData) => {
  return bulletinRepo.createComment(commentData);
};

export const deleteComment = async (id) => {
  return bulletinRepo.deleteComment(id);
};
