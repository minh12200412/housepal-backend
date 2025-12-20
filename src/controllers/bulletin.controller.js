// src/controllers/bulletin.controller.js
import * as bulletinService from "../services/bulletin.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getNotes = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await bulletinService.getNotes(+houseId);
    return sendSuccess(res, data, "Danh sách ghi chú");
  } catch (err) {
    next(err);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const { title, content, category, imageUrl, hasReminder, isPinned } = req.body;
    const createdBy = req.user ? req.user.id : null; // Assuming user is set by auth middleware
    const noteData = { houseId: +houseId, createdBy, title, content, category, imageUrl, hasReminder, isPinned };
    const data = await bulletinService.createNote(noteData);
    return sendSuccess(res, data, "Tạo ghi chú thành công");
  } catch (err) {
    next(err);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category, imageUrl, hasReminder, isPinned } = req.body;
    const noteData = { title, content, category, imageUrl, hasReminder, isPinned };
    const data = await bulletinService.updateNote(+id, noteData);
    return sendSuccess(res, data, "Cập nhật ghi chú thành công");
  } catch (err) {
    next(err);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    await bulletinService.deleteNote(+id);
    return sendSuccess(res, null, "Xóa ghi chú thành công");
  } catch (err) {
    next(err);
  }
};

export const getItems = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const data = await bulletinService.getItems(+houseId);
    return sendSuccess(res, data, "Danh sách mặt hàng");
  } catch (err) {
    next(err);
  }
};

export const createItem = async (req, res, next) => {
  try {
    const { houseId } = req.params;
    const { itemName, itemNote, quantity, imageUrl, isChecked } = req.body;
    const createdBy = req.user ? req.user.id : null;
    const itemData = { houseId: +houseId, itemName, itemNote, quantity, imageUrl, isChecked, createdBy };
    const data = await bulletinService.createItem(itemData);
    return sendSuccess(res, data, "Tạo mặt hàng thành công");
  } catch (err) {
    next(err);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemName, itemNote, quantity, imageUrl, isChecked } = req.body;
    const itemData = { itemName, itemNote, quantity, imageUrl, isChecked };
    const data = await bulletinService.updateItem(+id, itemData);
    return sendSuccess(res, data, "Cập nhật mặt hàng thành công");
  } catch (err) {
    next(err);
  }
};

export const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await bulletinService.deleteItem(+id);
    return sendSuccess(res, null, "Xóa mặt hàng thành công");
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { houseId, targetType, targetId } = req.params;
    const data = await bulletinService.getComments(+houseId, targetType, +targetId);
    return sendSuccess(res, data, "Danh sách bình luận");
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { houseId, targetType, targetId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.id; // Assuming user is required for comments
    const commentData = { houseId: +houseId, userId, targetType, targetId: +targetId, content, parentId };
    const data = await bulletinService.createComment(commentData);
    return sendSuccess(res, data, "Tạo bình luận thành công");
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await bulletinService.deleteComment(+id);
    return sendSuccess(res, null, "Xóa bình luận thành công");
  } catch (err) {
    next(err);
  }
};
