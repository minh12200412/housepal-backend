// 1. Import chuẩn
import choresService from '../services/chores.service.js';

class ChoresController {
    async triggerDailyJob(req, res) {
        try {
            const jobs = await choresService.generateDailyAssignments();
            res.json({ success: true, message: "Đã sinh việc hôm nay", data: jobs });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getToday(req, res) {
        try {
            const chores = await choresService.getTodayChores();
            res.json({ success: true, data: chores });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async complete(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            const result = await choresService.completeChore(id, userId);
            res.json({ success: true, message: "Hoàn thành!", data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async getTemplates(req, res) {
        try {
            const templates = await choresService.getAllTemplates();
            res.json({ success: true, data: templates });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async createTemplate(req, res) {
        try {
            const result = await choresService.createTemplate(req.body);
            res.status(201).json({ success: true, message: "Thhêm công việc thành công", data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async updateTemplate(req, res) {
        try {
            const result = await choresService.updateTemplate(req.params.id, req.body);
            res.json({ success: true, message: "Cập nhật công việc thành công", data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async deleteTemplate(req, res) {
        try {
            await choresService.deleteTemplate(req.params.id);
            res.json({ success: true, message: "Xoá công việc thành công" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getMonthlySummary(req, res) {
        try {
            const now = new Date();
            const month = req.query.month ? parseInt(req.query.month) : now.getMonth() + 1;
            const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();

            const result = await choresService.getMonthlySummary(month, year);

            res.json({
                success: true,
                message: `Thống kê tháng ${month}/${year}`,
                data: result
            })
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

// 2. QUAN TRỌNG: Phải là export default để file routes import được
export default new ChoresController();