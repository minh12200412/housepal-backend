// src/controllers/auth.controller.js
import userRepo from '../repositories/user.repository.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'housepal_super_secret_key_2026';

class AuthController {

    // --- ĐĂNG KÝ ---
    // Lưu ý: Dùng cú pháp arrow function để tránh lỗi mất 'this'
    register = async (req, res) => {
        try {
            const { username, password, email, fullName } = req.body;

            // Kiểm tra user tồn tại
            const existingUser = await userRepo.findByUsername(username);
            if (existingUser) {
                return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });
            }

            // Mã hóa mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Lưu vào DB
            const newUser = await userRepo.createUser({
                username,
                password: hashedPassword,
                email,
                fullName
            });

            return res.status(201).json({ 
                message: "Đăng ký thành công!", 
                user: newUser 
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server khi đăng ký" });
        }
    }

    // --- ĐĂNG NHẬP ---
    login = async (req, res) => {
        try {
            const { username, password } = req.body;

            // Tìm user
            const user = await userRepo.findByUsername(username);
            if (!user) {
                return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
            }

            // So sánh mật khẩu
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });
            }

            // Tạo Token
            const token = jwt.sign(
                { id: user.id, username: user.username }, 
                JWT_SECRET, 
                { expiresIn: '7d' }
            );

            return res.json({
                message: "Đăng nhập thành công",
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    avatar_url: user.avatar_url
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Lỗi server khi đăng nhập" });
        }
    }
}

// QUAN TRỌNG: Phải có dòng này
export default new AuthController();