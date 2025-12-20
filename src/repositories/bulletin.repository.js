// src/repositories/bulletin.repository.js
import { query } from '../config/db.js';

// ==============================
// Bulletin Notes
// ==============================
export const findNotesByHouseId = async (houseId) => {
  const sql = `SELECT * FROM bulletin_notes WHERE house_id = $1 ORDER BY is_pinned DESC, created_at DESC`;
  const result = await query(sql, [houseId]);
  return result.rows;
};

export const findNoteById = async (id) => {
  const sql = `SELECT * FROM bulletin_notes WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0];
};

export const createNote = async (noteData) => {
  const { houseId, createdBy, title, content, category, imageUrl, hasReminder, isPinned } = noteData;
  const sql = `INSERT INTO bulletin_notes (house_id, created_by, title, content, category, image_url, has_reminder, is_pinned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
  const result = await query(sql, [houseId, createdBy, title, content, category, imageUrl, hasReminder, isPinned]);
  return result.rows[0];
};

export const updateNote = async (id, noteData) => {
  const { title, content, category, imageUrl, hasReminder, isPinned } = noteData;
  const sql = `UPDATE bulletin_notes SET title = $1, content = $2, category = $3, image_url = $4, has_reminder = $5, is_pinned = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *`;
  const result = await query(sql, [title, content, category, imageUrl, hasReminder, isPinned, id]);
  return result.rows[0];
};

export const deleteNote = async (id) => {
  const sql = `DELETE FROM bulletin_notes WHERE id = $1`;
  await query(sql, [id]);
};

// ==============================
// Bulletin Items
// ==============================
export const findItemsByHouseId = async (houseId) => {
  const sql = `SELECT * FROM bulletin_items WHERE house_id = $1 ORDER BY is_checked ASC, created_at DESC`;
  const result = await query(sql, [houseId]);
  return result.rows;
};

export const findItemById = async (id) => {
  const sql = `SELECT * FROM bulletin_items WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0];
};

export const createItem = async (itemData) => {
  const { houseId, itemName, itemNote, quantity, imageUrl, isChecked, createdBy } = itemData;
  const sql = `INSERT INTO bulletin_items (house_id, item_name, item_note, quantity, image_url, is_checked, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
  const result = await query(sql, [houseId, itemName, itemNote, quantity, imageUrl, isChecked, createdBy]);
  return result.rows[0];
};

export const updateItem = async (id, itemData) => {
  const { itemName, itemNote, quantity, imageUrl, isChecked } = itemData;
  const sql = `UPDATE bulletin_items SET item_name = $1, item_note = $2, quantity = $3, image_url = $4, is_checked = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`;
  const result = await query(sql, [itemName, itemNote, quantity, imageUrl, isChecked, id]);
  return result.rows[0];
};

export const deleteItem = async (id) => {
  const sql = `DELETE FROM bulletin_items WHERE id = $1`;
  await query(sql, [id]);
};

// ==============================
// Bulletin Comments
// ==============================
export const findCommentsByTarget = async (houseId, targetType, targetId) => {
  const sql = `SELECT c.*, u.name as user_name FROM bulletin_comments c JOIN users u ON c.user_id = u.id WHERE c.house_id = $1 AND c.target_type = $2 AND c.target_id = $3 ORDER BY c.created_at ASC`;
  const result = await query(sql, [houseId, targetType, targetId]);
  return result.rows;
};

export const createComment = async (commentData) => {
  const { houseId, userId, targetType, targetId, content, parentId } = commentData;
  const sql = `INSERT INTO bulletin_comments (house_id, user_id, target_type, target_id, content, parent_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
  const result = await query(sql, [houseId, userId, targetType, targetId, content, parentId]);
  return result.rows[0];
};

export const deleteComment = async (id) => {
  const sql = `DELETE FROM bulletin_comments WHERE id = $1`;
  await query(sql, [id]);
};
