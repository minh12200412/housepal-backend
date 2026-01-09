// src/services/chores.service.js
import choreRepo from '../repositories/chores.repository.js';

class ChoreService {

    async generateDailyChores() {
        try {
            const templates = await choreRepo.getAllTemplates();
            
            // --- SỬA 1: Xử lý Timezone Việt Nam ---
            // Sử dụng 'en-CA' để luôn trả về định dạng YYYY-MM-DD
            // Đảm bảo dù chạy lúc 1h sáng vẫn ra đúng ngày hiện tại ở VN
            const todayStr = new Date().toLocaleDateString('en-CA', { 
                timeZone: 'Asia/Ho_Chi_Minh' 
            });

            console.log(`--- Bắt đầu quét việc ngày: ${todayStr} ---`);
            
            const results = [];

            for (const templateOriginal of templates) {
                const template = { ...templateOriginal };

                // 1. Chuẩn hóa dữ liệu (Giữ nguyên logic tốt của bạn)
                const isRotating = ['t', 'true', '1', 1, true].includes(template.is_rotating);
                template.is_rotating = isRotating;

                if (typeof template.rotation_order === 'string') {
                    try {
                        template.rotation_order = JSON.parse(template.rotation_order);
                    } catch (err) {
                        template.rotation_order = template.rotation_order.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
                if (!Array.isArray(template.rotation_order)) template.rotation_order = [];
                
                // Ép kiểu current_index
                template.current_index = parseInt(template.current_index, 10) || 0;

                // 2. Chỉ xử lý việc DAILY
                if (template.frequency !== 'daily') continue;

                // 3. Kiểm tra trùng lặp
                const isExist = await choreRepo.checkAssignmentExists(template.id, todayStr);
                if (isExist) {
                    console.log(`[SKIP] ID ${template.id}: Đã có việc cho ngày ${todayStr}`);
                    continue; 
                }

                // 4. LOGIC TÍNH NGƯỜI LÀM (ASSIGNEE)
                let assigneeId = template.assignee_id;
                let nextIndex = null; // Biến lưu index tương lai

                if (template.is_rotating && template.rotation_order.length > 0) {
                    // Ép kiểu ID trong mảng rotation về số nguyên
                    const order = template.rotation_order.map(o => parseInt(o, 10));
                    
                    // Logic xoay vòng (Modulo)
                    const idx = template.current_index % order.length;
                    assigneeId = order[idx];

                    // Tính toán lượt tiếp theo (nhưng chưa update vội)
                    nextIndex = (idx + 1) % order.length;
                    
                    console.log(`[ROTATION] ID ${template.id}: Index ${idx} -> Người làm ${assigneeId}. Index ngày mai sẽ là ${nextIndex}`);
                }

                if (!assigneeId) {
                    console.warn(`[WARNING] ID ${template.id}: Không tìm thấy người làm hợp lệ.`);
                    continue;
                }

                // 5. TẠO VIỆC TRƯỚC (An toàn hơn)
                // Nếu bước này lỗi, code sẽ nhảy xuống catch và KHÔNG cập nhật index xoay vòng => Đảm bảo nhất quán
                await choreRepo.createAssignment({
                    template_id: template.id,
                    assignee_id: assigneeId,
                    due_date: todayStr
                });

                // 6. NẾU LÀ VIỆC XOAY VÒNG -> CẬP NHẬT INDEX CHO NGÀY MAI
                // --- SỬA 2: Di chuyển xuống sau khi tạo việc thành công ---
                if (template.is_rotating && nextIndex !== null) {
                    await choreRepo.updateTemplateIndex(template.id, nextIndex);
                    console.log(`[UPDATE] ID ${template.id}: Đã cập nhật current_index thành ${nextIndex}`);
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
                // Nếu đã có PENALTY cho assignment này thì bỏ qua
                const alreadyPenalized = await choreRepo.hasPenaltyLoggedForAssignment(job.id);
                if (alreadyPenalized) {
                    console.log(`Assignment ${job.id} đã có PENALTY, bỏ qua.`);
                    continue;
                }

                // Ghi lịch sử trừ điểm (Lưu ý: pointsChange là số âm)
                console.log(`Ghi PENALTY cho assignment ${job.id} (assignee ${job.assignee_id}), penalty_points=${job.penalty_points}, title=${job.title}`);
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