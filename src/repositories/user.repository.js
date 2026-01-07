// src/repositories/user.repository.js
import db from '../config/db.js';

class UserRepository {
    // 1. Tìm user (Dùng cho Login)
    // Cho phép đăng nhập bằng cả Username HOẶC Email
    async findByUsername(identifier) {
        console.log("🔍 Đang tìm user:", identifier);
        
        const query = `
            SELECT * FROM users 
            WHERE username = $1 OR email = $1
        `;
        
        try {
            const { rows } = await db.query(query, [identifier]);
            return rows[0];
        } catch (error) {
            console.error("Lỗi tìm user:", error);
            throw error;
        }
    }

    // 2. Tạo user mới (Dùng cho Register)
    async createUser({ username, password, email, fullName }) {
        // Tạo avatar chữ cái đầu (Ví dụ: "Long" -> "L")
        const defaultAvatar = fullName ? fullName[0].toUpperCase() : "U";
        
        // CÂU LỆNH SQL:
        // Đã khớp cột 'password' và 'full_name' trong DB
        const query = `
            INSERT INTO users (username, password, email, full_name, avatar_url, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id, username, full_name, email, avatar_url;
        `;
        
        try {
            const { rows } = await db.query(query, [username, password, email, fullName, defaultAvatar]);
            return rows[0];
        } catch (error) {
            // Kiểm tra lỗi trùng lặp (Mã lỗi 23505 của PostgreSQL)
            if (error.code === '23505') {
                if (error.detail.includes('email')) {
                    throw new Error("Email này đã được sử dụng!");
                }
                if (error.detail.includes('username')) {
                    throw new Error("Tên đăng nhập đã tồn tại!");
                }
            }
            console.error("❌ Lỗi SQL Create User:", error);
            throw error;
        }
    }
}

export default new UserRepository();