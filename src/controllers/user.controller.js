import db from '../config/db.js';

class UserController {
  async getAllUsers(req, res) {
    try {
      // Chỉ lấy id, username và avatar để hiển thị dropdown
      const query = 'SELECT id, username, avatar_url FROM users ORDER BY username ASC';
      const { rows } = await db.query(query);
      res.json({ success: true, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
export default new UserController();