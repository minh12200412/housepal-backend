// src/services/chores.service.js
import choreRepo from '../repositories/chores.repository.js';

class ChoreService {

    async generateDailyChores() {
        try {
            const templates = await choreRepo.getAllTemplates();
            
            // SỬA 1: Lấy ngày hiện tại theo giờ Việt Nam (tránh lỗi lệch ngày do server UTC)
            const todayStr = new Date().toLocaleDateString('en-CA', { 
                timeZone: 'Asia/Ho_Chi_Minh' 
            }); 
            console.log(`--- [CRON] Bắt đầu quét việc ngày: ${todayStr} ---`);
            
            const results = [];

            for (const templateOriginal of templates) {
                // Normalize template fields
                const template = { ...templateOriginal };

                // Chuẩn hóa is_rotating
                const isRotating = (template.is_rotating === true) || (template.is_rotating === 't') || (template.is_rotating === 'true') || (template.is_rotating === 1) || (template.is_rotating === '1');
                template.is_rotating = isRotating;

                // Chuẩn hóa rotation_order
                if (typeof template.rotation_order === 'string') {
                    try {
                        template.rotation_order = JSON.parse(template.rotation_order);
                    } catch (err) {
                        template.rotation_order = template.rotation_order.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
                if (!Array.isArray(template.rotation_order)) template.rotation_order = [];

                // Chuẩn hóa current_index
                template.current_index = (template.current_index === null || template.current_index === undefined) ? 0 : parseInt(template.current_index, 10) || 0;

                // 1. CHỈ XỬ LÝ VIỆC HÀNG NGÀY
                if (template.frequency !== 'daily') continue;

                // 2. KIỂM TRA ĐÃ TẠO CHƯA
                const isExist = await choreRepo.checkAssignmentExists(template.id, todayStr);
                if (isExist) {
                    console.log(`[SKIP] Việc "${template.title}" đã được tạo cho ngày ${todayStr}`);
                    continue;
                }

                // 3. LOGIC TÍNH NGƯỜI LÀM (ASSIGNEE)
                let assigneeId = template.assignee_id;
                let nextIndex = null; // Biến lưu index tương lai để cập nhật sau

                if (template.is_rotating === true) {
                    if (template.rotation_order && template.rotation_order.length > 0) {
                        // Ép kiểu ID sang số nguyên
                        const order = template.rotation_order.map(o => (typeof o === 'string' && o.match(/^\d+$/)) ? parseInt(o, 10) : o);
                        
                        // Logic modulo xoay vòng
                        const idx = template.current_index % order.length;
                        assigneeId = order[idx];

                        // Tính index cho ngày mai
                        nextIndex = (idx + 1) % order.length;
                    } 
                }

                if (!assigneeId) continue;

                // 4. TẠO VIỆC (Quan trọng: Tạo trước khi update index)
                await choreRepo.createAssignment({
                    template_id: template.id,
                    assignee_id: assigneeId,
                    due_date: todayStr // Truyền chuỗi ngày chuẩn YYYY-MM-DD
                });

                // 5. CẬP NHẬT INDEX XOAY VÒNG (Chỉ chạy khi tạo việc thành công)
                if (template.is_rotating === true && nextIndex !== null) {
                    await choreRepo.updateTemplateIndex(template.id, nextIndex);
                    console.log(`[ROTATION] Updated template ${template.id} index to ${nextIndex}`);
                }
                
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
        const assignment = await choreRepo.findAssignmentById(assignmentId);
        if (!assignment) throw new Error('Không tìm thấy công việc');
        if (assignment.status === 'COMPLETED') throw new Error('Việc này đã hoàn thành rồi');

        const template = await choreRepo.findTemplateById(assignment.template_id);

        let points = template.base_points;
        let isHelp = false;
        let type = 'COMPLETION';
        let reason = `Hoàn thành: ${template.title}`;

        if (parseInt(userId) !== assignment.assignee_id) {
            isHelp = true;
            points += template.bonus_points;
            type = 'HELP_BONUS';
            reason = `Làm hộ: ${template.title}`;
        }

        const updatedAssignment = await choreRepo.updateAssignmentStatus(assignmentId, 'COMPLETED', userId);

        await choreRepo.logScore({
            userId: userId,
            assignmentId: assignmentId,
            pointsChange: points,
            reason: reason,
            type: type
        });

        return { updatedAssignment, points, isHelp };
    }

    // 3. CÁC HÀM CRUD TEMPLATE
    async getAllTemplates() {
        return await choreRepo.getAllTemplates();
    }

    async createTemplate(data) {
        const newTemplate = await choreRepo.createTemplate(data);
        try {
            const today = new Date();
            let shouldCreateNow = false;

            if (newTemplate.frequency === 'daily') shouldCreateNow = true;
            if (newTemplate.frequency === 'none' && data.dueDate) {
                const dueDate = new Date(data.dueDate);
                if (dueDate.toDateString() === today.toDateString()) shouldCreateNow = true;
            }
            if (newTemplate.frequency === 'weekly') shouldCreateNow = true;

            if (shouldCreateNow) {
                await choreRepo.createAssignment({
                    template_id: newTemplate.id,
                    assignee_id: newTemplate.assignee_id,
                    due_date: data.dueDate ? new Date(data.dueDate) : today
                });
            }
        } catch (error) {
            console.error("Lỗi auto-generate việc mới:", error);
        }
        return newTemplate;
    }

    async updateTemplate(id, data) {
        const updatedTemplate = await choreRepo.updateTemplate(id, data);
        try {
            await choreRepo.syncPendingAssignment(id, {
                assignee_id: updatedTemplate.assignee_id,
            });
        } catch (error) {
            console.error("Lỗi đồng bộ việc đang treo:", error);
        }
        return updatedTemplate;
    }

    async deleteTemplate(id) {
        await choreRepo.deletePendingAssignmentsByTemplate(id);
        return await choreRepo.deleteTemplate(id);
    }

    // 4. THỐNG KÊ & XỬ LÝ QUÁ HẠN
    async getMonthlySummary(month, year) {
        const startOfMonth = new Date(year, month - 1, 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(year, month, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const leaderboard = await choreRepo.getMonthlyScores(startOfMonth, endOfMonth);
        if (!leaderboard || leaderboard.length === 0) return { message: "Chưa có dữ liệu", leaderboard: [] };

        return {
            month: `${month}/${year}`,
            winner: leaderboard[0], 
            loser: leaderboard[leaderboard.length - 1],    
            leaderboard: leaderboard 
        };
    }

    async processOverdueChores() {
        try {
            const overdueList = await choreRepo.findOverdueAssignments();
            if (overdueList.length === 0) return 0;

            const failedIds = [];
            for (const job of overdueList) {
                failedIds.push(job.id);
                const alreadyPenalized = await choreRepo.hasPenaltyLoggedForAssignment(job.id);
                if (alreadyPenalized) continue;

                await choreRepo.logScore({
                    userId: job.assignee_id,
                    assignmentId: job.id,
                    pointsChange: -job.penalty_points,
                    reason: `Quá hạn: ${job.title}`,
                    type: 'PENALTY'
                });
            }
            await choreRepo.markAsFailed(failedIds);
            return failedIds.length;
        } catch (error) {
            console.error("Lỗi xử lý overdue:", error);
            return 0;
        }
    }
}

export default new ChoreService();