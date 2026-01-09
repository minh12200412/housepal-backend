import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

// --- PHẦN QUAN TRỌNG ĐỂ SỬA LỖI ---

// 1. Export dạng Named (Cho file health.repository.js dùng { query })
export const query = (text, params) => pool.query(text, params);

// 2. Export dạng Default (Cho file chores.repository.js dùng db.query)
export default {
    query: (text, params) => pool.query(text, params),
    pool,
};