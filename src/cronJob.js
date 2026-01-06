// File: src/cronJob.js
import cron from 'node-cron';
import choreService from './services/chores.service.js';

export const initCronJob = () => {
    console.log("✅ Hệ thống Cron Job đã được khởi động!");

    // Cấu hình: Chạy vào 00:01 mỗi ngày
    // Ký hiệu: 'phút giờ ngày tháng thứ'
    cron.schedule('1 0 * * *', async () => {
        console.log("⏰ [CRON] Bắt đầu xử lý công việc ngày mới...");

        try {
            // 1. Phạt người quên làm việc hôm qua trước
            const penalties = await choreService.processOverdueChores();
            console.log(`   -> Đã phạt ${penalties} công việc quá hạn.`);

            // 2. Sau đó mới sinh việc cho ngày hôm nay
            const newChores = await choreService.generateDailyChores();
            console.log(`   -> Đã sinh ${newChores.length} công việc mới.`);
            
        } catch (error) {
            console.error("❌ [CRON ERROR] Lỗi khi chạy tác vụ hàng ngày:", error);
        }
    });
};