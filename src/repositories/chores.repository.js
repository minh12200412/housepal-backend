import db from '../config/db.js';

class ChoreRepository {
    
    // 1. Lấy danh sách việc hôm nay
    async getTodayAssignments() {
        const query = `
            SELECT 
                ca.*, 
                ct.title, 
                ct.description,
                ct.is_rotating,
                ct.base_points, 
                ct.icon_type, 
                u.username as assignee_name
            FROM chore_assignments ca
            JOIN chore_templates ct ON ca.template_id = ct.id
            LEFT JOIN users u ON ca.assignee_id = u.id
            WHERE ca.due_date::date = CURRENT_DATE
        `;
        const { rows } = await db.query(query);
        return rows;
    }

    // 2. Lấy tất cả mẫu (cho việc sinh tự động)
    async getAllTemplates() {
        const query = `SELECT * FROM chore_templates`;
        const { rows } = await db.query(query);
        return rows;
    }

    // 3. Tạo việc (QUAN TRỌNG: Đã thêm dấu { } để sửa lỗi invalid syntax)
    async createAssignment({ template_id, assignee_id, due_date }) {
        const query = `
            INSERT INTO chore_assignments (template_id, assignee_id, due_date, status)
            VALUES ($1, $2, $3, 'PENDING')
            RETURNING *
        `;
        // Lúc này template_id, assignee_id đã là số nguyên (int), không phải object nữa
        await db.query(query, [template_id, assignee_id, due_date]);
    }

    // 4. Cập nhật index xoay vòng
    async updateTemplateIndex(id, newIndex) {
        const query = 'UPDATE chore_templates SET current_index = $1 WHERE id = $2';
        await db.query(query, [newIndex, id]);
    }

    // 5. Các hàm hỗ trợ khác
    async findAssignmentById(id) {
        const res = await db.query('SELECT * FROM chore_assignments WHERE id = $1', [id]);
        return res.rows[0];
    }

    async findTemplateById(id) {
        const res = await db.query('SELECT * FROM chore_templates WHERE id = $1', [id]);
        return res.rows[0];
    }

    async updateAssignmentStatus(id, status, completedBy) {
        const res = await db.query(
            'UPDATE chore_assignments SET status = $1, completed_by_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [status, completedBy, id]
        );
        return res.rows[0];
    }

    async logScore({ userId, assignmentId, pointsChange, reason, type }) {
        await db.query(
            'INSERT INTO score_history (user_id, assignment_id, points_change, reason, type) VALUES ($1, $2, $3, $4, $5)',
            [userId, assignmentId, pointsChange, reason, type]
        );
    }
    
    // 6. Thống kê
    async getMonthlyScores(startDate, endDate) {
         const query = `
            SELECT u.id, u.username, u.avatar_url, COALESCE(SUM(sh.points_change), 0)::int as total_points
            FROM users u
            LEFT JOIN score_history sh ON u.id = sh.user_id AND sh.created_at >= $1 AND sh.created_at <= $2
            GROUP BY u.id, u.username, u.avatar_url
            ORDER BY total_points DESC
        `;
        const { rows } = await db.query(query, [startDate, endDate]);
        return rows;
    }

    // 7. CRUD Template
    async createTemplate(data) {
        // Xử lý assignee_id nếu null
        const assigneeId = data.assignee_id ? data.assignee_id : null;
        
        const query = `
            INSERT INTO chore_templates 
            (title, description, base_points, bonus_points, penalty_points, icon_type, is_rotating, rotation_order, frequency, assignee_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const { rows } = await db.query(query, [
            data.title, 
            data.description, 
            data.base_points, 
            data.bonus_points, 
            data.penalty_points, 
            data.icon_type, 
            data.is_rotating, 
            data.rotation_order, 
            data.frequency, 
            assigneeId
        ]);
        return rows[0];
    }

    async updateTemplate(id, data) {
         // Xây dựng query update động
         // (Để đơn giản ở đây update cứng một số trường, thực tế nên viết hàm dynamic)
         const query = `
            UPDATE chore_templates 
            SET title=$1, description=$2, assignee_id=$3, base_points=$4 
            WHERE id=$5 RETURNING *
         `;
         const { rows } = await db.query(query, [data.title, data.description, data.assignee_id, data.base_points, id]);
         return rows[0];
    }

    async deletePendingAssignmentsByTemplate(templateId) {
        try {
            const sqlDeleteScores = `
                DELETE FROM score_history 
                WHERE assignment_id IN (
                    SELECT id FROM chore_assignments WHERE template_id = $1
                )
            `;
            await db.query(sqlDeleteScores, [templateId]);

            const sqlDeleteAssignments = 'DELETE FROM chore_assignments WHERE template_id = $1';
            await db.query(sqlDeleteAssignments, [templateId]);

            return true;
        } catch (error) {
            console.error("Lỗi khi dọn dẹp dữ liệu liên quan:", error);
            throw error;
        }
    }

    // 2. Hàm xóa Template gốc
    async deleteTemplate(id) {
        try {
            const sql = 'DELETE FROM chore_templates WHERE id = $1';

            const result = await db.query(sql, [id]);
            
            // Kiểm tra số dòng bị xóa bằng .rowCount
            if (result.rowCount === 0) {
                return false; 
            }
            return true; 
        } catch (error) {
            console.error("Lỗi khi xóa template:", error);
            throw error;
        }
    }

    async findOverdueAssignments() {
        const query = `
            SELECT ca.id, ca.assignee_id, ct.title, ct.penalty_points
            FROM chore_assignments ca
            JOIN chore_templates ct ON ca.template_id = ct.id
            WHERE ca.status = 'PENDING' 
            AND ca.due_date::date < CURRENT_DATE
        `;
        const { rows } = await db.query(query);
        return rows;
    }

    // Đánh dấu thất bại
    async markAsFailed(ids) {
        if (ids.length === 0) return;
        // Chuyển mảng ID thành chuỗi (VD: 1,2,3) để query
        const query = `
            UPDATE chore_assignments 
            SET status = 'FAILED', updated_at = NOW() 
            WHERE id = ANY($1::int[])
        `;
        await db.query(query, [ids]);
    }

    async getTodayStats() {
        try {
            const query = `
                SELECT 
                    u.username as assignee_name,
                    u.avatar_url, -- Lấy thêm avatar nếu có (tùy chọn)
                    COUNT(*)::int as total_chores,
                    SUM(CASE WHEN ca.status = 'COMPLETED' THEN 1 ELSE 0 END)::int as completed_chores
                FROM chore_assignments ca
                LEFT JOIN users u ON ca.assignee_id = u.id
                WHERE ca.due_date::date = CURRENT_DATE
                GROUP BY u.id, u.username, u.avatar_url
            `;
            const { rows } = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Lỗi lấy thống kê hôm nay:", error);
            throw error;
        }
    }

    async getTopLeaderboard() {
        try {
            const query = `
                SELECT 
                    u.username,
                    u.avatar_url,
                    COALESCE(SUM(sh.points_change), 0)::int as total_score,
                    (
                        SELECT COUNT(*)::int 
                        FROM chore_assignments ca 
                        WHERE ca.assignee_id = u.id 
                        AND ca.status = 'COMPLETED' -- Giả sử trạng thái là 'COMPLETED'
                        AND ca.due_date >= DATE_TRUNC('month', CURRENT_DATE)
                    ) as tasks_done
                FROM users u
                LEFT JOIN score_history sh ON u.id = sh.user_id 
                    AND sh.created_at >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY u.id, u.username, u.avatar_url
                ORDER BY total_score DESC
                LIMIT 3
            `;
            const { rows } = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Lỗi lấy bảng xếp hạng:", error);
            throw error;
        }
    }

    async getMonthlyLeaderboard(month, year) {
        try {
            const query = `
                SELECT 
                    u.username,
                    u.avatar_url,
                    COALESCE(SUM(sh.points_change), 0)::int as total_score,
                    (
                        SELECT COUNT(*)::int 
                        FROM chore_assignments ca 
                        WHERE ca.assignee_id = u.id 
                        AND ca.status = 'COMPLETED'
                        AND EXTRACT(MONTH FROM ca.due_date) = $1
                        AND EXTRACT(YEAR FROM ca.due_date) = $2
                    ) as tasks_done
                FROM users u
                LEFT JOIN score_history sh ON u.id = sh.user_id 
                    AND EXTRACT(MONTH FROM sh.created_at) = $1
                    AND EXTRACT(YEAR FROM sh.created_at) = $2
                GROUP BY u.id, u.username, u.avatar_url
                ORDER BY total_score DESC
            `;
            const { rows } = await db.query(query, [month, year]);
            return rows;
        } catch (error) {
            console.error("Lỗi lấy BXH tháng:", error);
            throw error;
        }
    }

    async getScoreHistoryByUser(username, month, year) {
        try {
            const query = `
                SELECT 
                    sh.points_change,
                    sh.created_at,
                    sh.reason,
                    sh.type, -- 'BONUS' hoặc 'PENALTY'
                    ct.title as chore_title,
                    ct.icon_type
                FROM score_history sh
                JOIN users u ON sh.user_id = u.id
                LEFT JOIN chore_assignments ca ON sh.assignment_id = ca.id
                LEFT JOIN chore_templates ct ON ca.template_id = ct.id 
                WHERE u.username = $1
                AND EXTRACT(MONTH FROM sh.created_at) = $2
                AND EXTRACT(YEAR FROM sh.created_at) = $3
                ORDER BY sh.created_at DESC
            `;
            const { rows } = await db.query(query, [username, month, year]);
            return rows;
        } catch (error) {
            console.error("Lỗi lấy lịch sử điểm:", error);
            throw error;
        }
    }
}

export default new ChoreRepository();