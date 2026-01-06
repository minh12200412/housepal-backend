import express from 'express';
import choresController from '../controllers/chores.controller.js';
import userController from '../controllers/user.controller.js';

export const router = express.Router();

router.get('/leaderboard/top', choresController.getTopLeaderboard); // Lấy top 3 bảng xếp hạng

router.post('/generate-daily', choresController.triggerDailyJob); // Tạo công việc hàng ngày
router.get('/today', choresController.getToday); // Lấy công việc trong ngày
router.patch('/:id/complete', choresController.complete); // Đánh dấu công việc là hoàn thành
router.get('/templates', choresController.getTemplates); // Lấy danh sách mẫu công việc
router.post('/templates', choresController.createTemplate); // Tạo mẫu công việc mới
router.put('/templates/:id', choresController.updateTemplate); // Cập nhật mẫu công việc
router.delete('/templates/:id', choresController.deleteTemplate); // Xóa mẫu công việc
router.get('/monthly-summary', choresController.getMonthlySummary); // Lấy báo cáo công việc hàng tháng
// Route lấy danh sách user
router.get('/users', userController.getAllUsers);
router.get('/static/icons', choresController.getIcons);
router.get('/stats/today', choresController.getTodayStats); // Lấy thống kê việc hôm nay
router.get('/leaderboard/monthly', choresController.getMonthlyLeaderboard); // Lấy bảng xếp hạng hàng tháng
router.get('/scores/history', choresController.getScoreHistory); // Lấy lịch sử điểm của user