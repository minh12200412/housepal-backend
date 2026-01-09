// 1. Import chuẩn
import choresService from '../services/chores.service.js';
import choreRepo from '../repositories/chores.repository.js';

class ChoresController {

    // API sinh việc thủ công (Test)
    async triggerDailyJob(req, res) {
        try {
            // SỬA: Gọi đúng tên hàm trong Service là generateDailyChores
            const jobs = await choresService.generateDailyChores();
            res.json({ success: true, message: "Đã sinh việc hôm nay", data: jobs });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getToday(req, res) {
        try {
            // 1. Thử lấy danh sách việc hôm nay
            let chores = await choreRepo.getTodayAssignments();

            // 2. LOGIC TỰ ĐỘNG: Nếu chưa có việc nào, gọi hàm sinh việc ngay lập tức
            if (chores.length === 0) {
                console.log("Hôm nay chưa có việc, đang tự động sinh...");

                await choresService.processOverdueChores();
                
                // SỬA LỖI: Dùng biến 'choresService' (khớp với import ở dòng 2)
                await choresService.generateDailyChores(); 
                
                // Lấy lại danh sách sau khi đã sinh xong
                chores = await choreRepo.getTodayAssignments();
            }

            res.json({
                success: true,
                data: chores
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Lỗi lấy danh sách việc hôm nay"
            });
        }
    }

    async complete(req, res) {
        try {
            const { id } = req.params;
            // Prefer authenticated user id (if auth middleware sets req.user),
            // fallback to body.userId for older clients.
            const performerId = (req.user && req.user.id) ? req.user.id : (req.body.userId || null);
            if (!performerId) return res.status(400).json({ success: false, message: 'Missing userId' });

            const result = await choresService.completeChore(id, performerId);
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
            // Sửa lỗi chính tả: Thhêm -> Thêm
            res.status(201).json({ success: true, message: "Thêm công việc thành công", data: result });
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
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getIcons(req, res) {
        const icons = [
            { code: 'broom', name: 'Quét dọn', url: 'assets/images/icons/broom.png' },
            { code: 'cooking', name: 'Nấu ăn', url: 'assets/images/icons/cooking.png' },
            { code: 'trash', name: 'Đổ rác', url: 'assets/images/icons/trash.png' },
            { code: 'water', name: 'Tưới cây', url: 'assets/images/icons/water.png' },
            { code: 'laundry', name: 'Giặt ủi', url: 'assets/images/icons/laundry.png' },
            { code: 'card', name: 'Đi chợ', url: 'assets/images/icons/card.png' },
            { code: 'repair', name: 'Sửa chữa', url: 'assets/images/icons/repair.png' },
            { code: 'wc', name: 'Dọn wc', url: 'assets/images/icons/wc.png' }, // Bổ sung icon WC
        ];
        res.json({ success: true, data: icons });
    }

    async getTodayStats(req, res) {
        try {
            const stats = await choreRepo.getTodayStats();
            return res.status(200).json(stats);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi Server khi lấy thống kê" });
        }
    };

    async getTopLeaderboard(req, res){
        try {
            const data = await choreRepo.getTopLeaderboard();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: "Lỗi server khi lấy BXH" });
        }
    };

    async getMonthlyLeaderboard(req, res) {
        try {
            // Lấy month, year từ query params (vd: ?month=12&year=2025)
            const { month, year } = req.query;
            
            if (!month || !year) {
                return res.status(400).json({ message: "Thiếu thông tin tháng/năm" });
            }
            const data = await choreRepo.getMonthlyLeaderboard(month, year);
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ message: "Lỗi server" });
        }
    };

    async getScoreHistory(req, res) {
        try {
            // Hỗ trợ cả userId (frontend hiện gửi userId) và username (legacy)
            const { username, userId, month, year } = req.query;

            if ((!username && !userId) || !month || !year) {
                return res.status(400).json({ message: "Thiếu thông tin userId/username hoặc tháng/năm" });
            }

            let data;
            if (userId) {
                // Nếu frontend gửi userId (thường là số)
                data = await choreRepo.getScoreHistoryByUserId(userId, month, year);
            } else {
                // Fallback: tìm theo username
                data = await choreRepo.getScoreHistoryByUser(username, month, year);
            }

            return res.status(200).json(data);
        } catch (error) {
            console.error('Error in getScoreHistory:', error);
            return res.status(500).json({ message: "Lỗi server" });
        }
    };

    async getMyScoreStats(req, res) {
        try {
            // Hỗ trợ lấy userId từ query param nếu frontend gửi lên, fallback về 1
            const userId = req.query.userId ? parseInt(req.query.userId, 10) : 1;

            const stats = await choreRepo.getMyScoreStats(userId);
            return res.status(200).json(stats);
        } catch (error) {
            return res.status(500).json({ message: "Lỗi server khi lấy điểm cá nhân" });
        }
    };
}

export default new ChoresController();