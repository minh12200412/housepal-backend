// src/services/chores.service.js
import choreRepo from '../repositories/chores.repository.js';

class ChoreService {

    async generateDailyChores() {
        try {
            const templates = await choreRepo.getAllTemplates();
            
            // SỬA 1: Format ngày chuẩn YYYY-MM-DD để so sánh chính xác trong DB
            // new Date() gốc có cả giờ phút giây, so sánh rất khó
            const todayStr = new Date().toISOString().split('T')[0]; 
            
            const results = [];

            for (const template of templates) {
                // 1. CHỈ XỬ LÝ VIỆC HÀNG NGÀY
                if (template.frequency !== 'daily') continue;

                // --- [QUAN TRỌNG] BƯỚC 1.5: KIỂM TRA XEM ĐÃ TẠO VIỆC HÔM NAY CHƯA ---
                // Bạn cần thêm hàm này vào choreRepo (xem code bên dưới)
                const isExist = await choreRepo.checkAssignmentExists(template.id, todayStr);
                
                if (isExist) {
                    console.log(`[SKIP] Việc "${template.title}" đã được tạo cho ngày ${todayStr}`);
                    continue; // Bỏ qua ngay, KHÔNG xoay vòng, KHÔNG tạo mới
                }

                // 2. XỬ LÝ LOGIC NGƯỜI LÀM
                let assigneeId = template.assignee_id; 

                if (template.is_rotating === true) {
                    if (template.rotation_order && template.rotation_order.length > 0) {
                        // Lấy người hiện tại
                        assigneeId = template.rotation_order[template.current_index];

                        // Tính lượt cho ngày mai
                        const nextIndex = (template.current_index + 1) % template.rotation_order.length;
                        
                        // Cập nhật DB
                        await choreRepo.updateTemplateIndex(template.id, nextIndex);
                    }
                } 
                
                if (!assigneeId) continue;

                // 4. TẠO VIỆC
                await choreRepo.createAssignment({
                    template_id: template.id,
                    assignee_id: assigneeId,
                    due_date: todayStr // Truyền chuỗi ngày chuẩn
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
        // 1. Tạo Mẫu việc (Lưu vào chore_templates)
        const newTemplate = await choreRepo.createTemplate(data);

        // 2. [LOGIC MỚI] Kiểm tra và sinh việc NGAY LẬP TỨC cho hôm nay
        try {
            const today = new Date();
            let shouldCreateNow = false;

            // Trường hợp 1: Việc Hàng ngày (Daily) -> Luôn tạo ngay để làm
            if (newTemplate.frequency === 'daily') {
                shouldCreateNow = true;
            }
            
            // Trường hợp 2: Việc Đột xuất (Adhoc) -> Chỉ tạo nếu ngày chọn trùng với Hôm nay
            if (newTemplate.frequency === 'none' && data.dueDate) {
                const dueDate = new Date(data.dueDate);
                if (
                    dueDate.getDate() === today.getDate() &&
                    dueDate.getMonth() === today.getMonth() &&
                    dueDate.getFullYear() === today.getFullYear()
                ) {
                    shouldCreateNow = true;
                }
            }

            // Trường hợp 3: Việc Hàng tuần (Weekly) -> Tạm thời tạo luôn cho nóng (hoặc check thứ)
            if (newTemplate.frequency === 'weekly') {
                shouldCreateNow = true;
            }

            // --- THỰC HIỆN TẠO ASSIGNMENT ---
            if (shouldCreateNow) {
                console.log("Đang tạo assignment ngay lập tức cho việc mới...");
                
                await choreRepo.createAssignment({
                    template_id: newTemplate.id,
                    assignee_id: newTemplate.assignee_id, // Lấy người được gán trong template
                    due_date: data.dueDate ? new Date(data.dueDate) : today // Nếu adhoc lấy ngày chọn, còn lại lấy today
                });
            }

        } catch (error) {
            console.error("Lỗi khi auto-generate việc mới thêm:", error);
            // Không throw error ở đây để tránh báo lỗi cho Frontend, 
            // vì việc chính là Tạo Template đã thành công rồi.
        }

        return newTemplate;
    }

    async updateTemplate(id, data) {
        // 1. Cập nhật bản ghi trong bảng Template
        const updatedTemplate = await choreRepo.updateTemplate(id, data);

        // 2. [LOGIC MỚI] Đồng bộ thay đổi sang việc của hôm nay (Nếu chưa làm)
        // Nếu vừa sửa tên, điểm, hoặc người làm -> Cập nhật luôn cho việc đang treo
        try {
            await choreRepo.syncPendingAssignment(id, {
                assignee_id: updatedTemplate.assignee_id, // Cập nhật người làm mới
                // (Các trường khác như title, points... thường lấy join từ template nên không cần update bên assignment, 
                // nhưng assignee_id thì nằm cứng ở bảng assignment nên phải sửa)
            });
        } catch (error) {
            console.error("Lỗi đồng bộ việc đang treo:", error);
        }

        return updatedTemplate;
    }

    // Đổi tên từ deactivateTemplate -> deleteTemplate cho khớp Controller
    async deleteTemplate(id) {
        // 1. [LOGIC MỚI] Dọn dẹp các việc chưa làm của template này
        // (Để tránh việc Template mất rồi mà Assignment vẫn hiện)
        await choreRepo.deletePendingAssignmentsByTemplate(id);

        // 2. Xóa Template gốc
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

    async processOverdueChores() {
        try {
            // 1. Tìm các việc quá hạn
            const overdueList = await choreRepo.findOverdueAssignments();
            
            if (overdueList.length === 0) return 0; // Không có việc gì quá hạn

            const failedIds = [];

            // 2. Lặp qua từng việc để trừ điểm
            for (const job of overdueList) {
                failedIds.push(job.id);
                
                // Ghi lịch sử trừ điểm (Lưu ý: pointsChange là số âm)
                await choreRepo.logScore({
                    userId: job.assignee_id,
                    assignmentId: job.id,
                    pointsChange: -job.penalty_points, // Dấu trừ
                    reason: `Quá hạn: ${job.title}`,
                    type: 'PENALTY'
                });
            }

            // 3. Cập nhật trạng thái trong DB thành FAILED
            await choreRepo.markAsFailed(failedIds);
            
            console.log(`Đã xử lý phạt ${failedIds.length} công việc quá hạn.`);
            return failedIds.length;
        } catch (error) {
            console.error("Lỗi xử lý overdue:", error);
            return 0; // Tránh crash app nếu lỗi
        }
    }
}

export default new ChoreService();