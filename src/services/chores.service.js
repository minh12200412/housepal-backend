// src/services/chores.service.js
import choreRepo from '../repositories/chores.repository.js';

class ChoreService {

    // 1. SINH VIỆC TỰ ĐỘNG (Đã sửa tên hàm và logic chuẩn)
    async generateDailyChores() {
        try {
            const templates = await choreRepo.getAllTemplates();
            const today = new Date();
            const results = [];

            for (const template of templates) {
                // 1. CHỈ XỬ LÝ VIỆC HÀNG NGÀY
                // (Nếu muốn làm Weekly, bạn cần check thêm: hôm nay có phải thứ 2 không?)
                if (template.frequency !== 'daily') continue;

                let assigneeId = template.assignee_id; // Mặc định lấy người được gán cứng (cho trường hợp cố định)

                // 2. XỬ LÝ LOGIC NGƯỜI LÀM
                if (template.is_rotating === true) {
                    // --- TRƯỜNG HỢP XOAY VÒNG ---
                    // Kiểm tra kỹ mảng rotation để tránh lỗi
                    if (template.rotation_order && template.rotation_order.length > 0) {
                        // Lấy người theo lượt
                        assigneeId = template.rotation_order[template.current_index];

                        // Tính lượt cho ngày mai
                        const nextIndex = (template.current_index + 1) % template.rotation_order.length;
                        
                        // Cập nhật DB để mai người khác làm
                        await choreRepo.updateTemplateIndex(template.id, nextIndex);
                    }
                } 
                // --- TRƯỜNG HỢP CỐ ĐỊNH (is_rotating = false) ---
                // Thì assigneeId vẫn giữ nguyên là template.assignee_id như dòng khai báo đầu tiên
                // Và KHÔNG cần updateTemplateIndex

                // 3. NẾU KHÔNG TÌM ĐƯỢC NGƯỜI LÀM THÌ BỎ QUA
                if (!assigneeId) continue;

                // 4. TẠO VIỆC
                await choreRepo.createAssignment({
                    template_id: template.id,
                    assignee_id: assigneeId, // ID người làm (đã tính toán ở trên)
                    due_date: today
                });
                
                results.push({ 
                    title: template.title, 
                    assignee: assigneeId, 
                    type: template.is_rotating ? "Xoay vòng" : "Cố định" 
                });
            }
            return results;
        } catch (error) {
            console.error("Lỗi sinh việc daily:", error);
            throw error;
        }
    }

    // 2. HOÀN THÀNH CÔNG VIỆC
    async completeChore(assignmentId, userId) {
        // Lưu ý: Repository cần có các hàm findAssignmentById, findTemplateById, updateAssignmentStatus, logScore
        // Nếu chưa có, bạn cần bổ sung vào repository.
        
        const assignment = await choreRepo.findAssignmentById(assignmentId);
        if (!assignment) throw new Error('Không tìm thấy công việc');
        if (assignment.status === 'COMPLETED') throw new Error('Việc này đã hoàn thành rồi');

        // Lấy thông tin mẫu việc để tính điểm
        const template = await choreRepo.findTemplateById(assignment.template_id);

        let points = template.base_points;
        let isHelp = false;
        let type = 'COMPLETION';
        let reason = `Hoàn thành: ${template.title}`;

        // Kiểm tra làm hộ (userId gửi lên khác assignee_id trong db)
        if (parseInt(userId) !== assignment.assignee_id) {
            isHelp = true;
            points += template.bonus_points;
            type = 'HELP_BONUS';
            reason = `Làm hộ: ${template.title}`;
        }

        // Cập nhật trạng thái
        const updatedAssignment = await choreRepo.updateAssignmentStatus(assignmentId, 'COMPLETED', userId);

        // Ghi lịch sử điểm
        await choreRepo.logScore({
            userId: userId,
            assignmentId: assignmentId,
            pointsChange: points,
            reason: reason,
            type: type
        });

        return { updatedAssignment, points, isHelp };
    }

    // 3. CÁC HÀM CRUD TEMPLATE (Wrapper)
    async getAllTemplates() {
        return await choreRepo.getAllTemplates();
    }

    async createTemplate(data) {
        // Gọi repo tạo template (Đảm bảo repo có hàm createTemplate)
        return await choreRepo.createTemplate(data);
    }

    async updateTemplate(id, data) {
        // Đảm bảo repo có hàm updateTemplate
        return await choreRepo.updateTemplate(id, data);
    }

    // Đổi tên từ deactivateTemplate -> deleteTemplate cho khớp Controller
    async deleteTemplate(id) {
        // Đảm bảo repo có hàm deleteTemplate
        return await choreRepo.deleteTemplate(id);
    }

    // 4. THỐNG KÊ THÁNG
    async getMonthlySummary(month, year) {
        // Tính ngày đầu và cuối tháng
        const startOfMonth = new Date(year, month - 1, 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(year, month, 0); // Ngày 0 của tháng sau = Ngày cuối tháng này
        endOfMonth.setHours(23, 59, 59, 999);

        // Gọi repo lấy bảng xếp hạng
        const leaderboard = await choreRepo.getMonthlyScores(startOfMonth, endOfMonth);

        if (!leaderboard || leaderboard.length === 0) {
            return { message: "Chưa có dữ liệu người dùng", leaderboard: [] };
        }

        const winner = leaderboard[0]; 
        const loser = leaderboard[leaderboard.length - 1]; 

        return {
            month: `${month}/${year}`,
            winner: winner, 
            loser: loser,    
            leaderboard: leaderboard 
        };
    }
}

export default new ChoreService();