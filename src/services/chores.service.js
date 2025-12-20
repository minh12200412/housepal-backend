// 1. Import chuẩn ES Module
import choreRepo from '../repositories/chores.repository.js'; // Có đuôi .js

class ChoresService {
    async generateDailyAssignments() {
        const templates = await choreRepo.getActiveTemplates();
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const results = [];

        for (const temp of templates) {
            const assigneeId = temp.rotation_order[temp.current_index];
            const newJob = await choreRepo.createAssignment(temp.id, assigneeId, today);
            results.push(newJob);

            let nextIndex = temp.current_index + 1;
            if (nextIndex >= temp.rotation_order.length) {
                nextIndex = 0;
            }
            await choreRepo.updateTemplateCurrentIndex(temp.id, nextIndex);
        }
        return results;
    }

    async getTodayChores() {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        return await choreRepo.getAssignmentsByDate(startOfDay, endOfDay);
    }

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
            reason = `Làm hộ đồng đội: ${template.title}`;
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

    async getAllTemplates() {
        return await choreRepo.getAllTemplates();
    }

    async createTemplate(data) {
        return await choreRepo.createTemplate(data);
    }

    async updateTemplate(id, data) {
        return await choreRepo.updateTemplate(id, data);
    }

    async deactivateTemplate(id) {
        return await choreRepo.deactivateTemplate(id);
    }

    async getMonthlySummary(year, month) {
        const startOfMonth = new Date(year, month - 1, 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(year, month, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        const leaderboard = await choreRepo.getMonthlyScores(startOfMonth, endOfMonth);

        if (leaderboard.length === 0) {
            return { message: "Chưa có dữ liệu trong tháng này", leaderboard: [] };
        }

        const winner = leaderboard[0];
        const loser = leaderboard[leaderboard.length - 1];

        return {
            month: `${year}/${month}`,
            winner: winner,
            loser: loser,
            leaderboard: leaderboard
        };
    }
}

// 2. Export chuẩn ES Module
export default new ChoresService();