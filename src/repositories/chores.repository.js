// 1. Thay require bằng import
import db from '../config/db.js'; // Nhớ phải có .js

class ChoresRepository {
    async getActiveTemplates() {
        const query = 'SELECT * FROM chore_templates WHERE is_rotating = TRUE';
        const { rows } = await db.query(query);
        return rows;
    }

    async updateTemplateCurrentIndex(templateId, newIndex) {
        const query = 'UPDATE chore_templates SET current_index = $1 WHERE id = $2';
        await db.query(query, [newIndex, templateId]);
    }

    async createAssignment(templateId, assigneeId, dueDate) {
        const query = `
      INSERT INTO chore_assignments (template_id, assignee_id, due_date, status)
      VALUES ($1, $2, $3, 'PENDING')
      RETURNING *;
    `;
        const { rows } = await db.query(query, [templateId, assigneeId, dueDate]);
        return rows[0];
    }

    async getAssignmentsByDate(dateStart, dateEnd) {
        const query = `
      SELECT 
        a.id, a.status, a.due_date,
        t.title, t.description, t.base_points, t.bonus_points, t.icon_type,
        u.username as assignee_name, u.avatar_url,
        a.assignee_id
      FROM chore_assignments a
      JOIN chore_templates t ON a.template_id = t.id
      JOIN users u ON a.assignee_id = u.id
      WHERE a.due_date >= $1 AND a.due_date <= $2
      ORDER BY a.created_at ASC
    `;
        const { rows } = await db.query(query, [dateStart, dateEnd]);
        return rows;
    }

    async findAssignmentById(id) {
        const query = 'SELECT * FROM chore_assignments WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    async findTemplateById(id) {
        const query = 'SELECT * FROM chore_templates WHERE id = $1';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    async updateAssignmentStatus(id, status, completedById) {
        const query = `
      UPDATE chore_assignments 
      SET status = $1, completed_by_id = $2, updated_at = NOW() 
      WHERE id = $3 
      RETURNING *
    `;
        const { rows } = await db.query(query, [status, completedById, id]);
        return rows[0];
    }

    async logScore({ userId, assignmentId, pointsChange, reason, type }) {
        const query = `
      INSERT INTO score_history (user_id, assignment_id, points_change, reason, type)
      VALUES ($1, $2, $3, $4, $5)
    `;
        await db.query(query, [userId, assignmentId, pointsChange, reason, type]);
    }

    async getAllTemplates() {
        const query = 'SELECT * FROM chore_templates ORDER BY id ASC';
        const { rows } = await db.query(query);
        return rows;
    }

    async createTemplate({ title, description, base_points, bonus_points, icon_type, rotation_order }) {
        const query = `
            INSERT INTO chore_templates (title, description, base_points, bonus_points, icon_type, rotation_order, is_rotating, current_index)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE, 0)
            RETURNING *;
        `;
        const value = [title, description, base_points, bonus_points, icon_type, rotation_order];
        const { rows } = await db.query(query, value);
        return rows[0];
    }

    async updateTemplate(id, data) {
        const { title, description, base_points, bonus_points, icon_type, rotation_order, isRotating } = data;
        const query = 'UPDATE chore_templates SET title = $1, description = $2, base_points = $3, bonus_points = $4, icon_type = $5, rotation_order = $6, is_rotating = $7 WHERE id = $8 RETURNING *; ';        
        const values = [title, description, base_points, bonus_points, icon_type, rotation_order, isRotating, id];
        const { rows } = await db.query(query, values);
        return rows[0];
    }

    async deleteTemplate(id) {
        const query = 'DELETE FROM chore_templates WHERE id = $1';
        await db.query(query, [id]);
    }

    async getMonthlyScores(startDate, endDate) {
        const query = `SELECT u.id, u.username, u.avatar_url, COALESCE(SUM(sh.points_change), 0)::int AS total_points from users u
        LEFT JOIN score_history sh ON u.id = sh.user_id AND sh.created_at >= $1 AND sh.created_at <= $2
        GROUP BY u.id
        ORDER BY total_points DESC;`;

        const { rows } = await db.query(query, [startDate, endDate]);
        return rows;
    }

}

// 2. Thay module.exports bằng export default
export default new ChoresRepository();