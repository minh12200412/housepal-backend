// src/routes/auth.routes.js
import { Router } from 'express';
// Chú ý đường dẫn import phải chính xác
import authController from '../controllers/auth.controller.js';

export const router = Router();

// Thêm log này để debug: Nếu nó in ra undefined nghĩa là file controller có vấn đề
console.log("Auth Controller Check:", authController); 

// Đảm bảo authController.register không bị null/undefined
router.post('/register', authController.register);
router.post('/login', authController.login);