import { query } from "../config/db.js";

// thử query nhẹ tới DB để chắc kết nối OK
export const checkDb = async () => {
  const { rows } = await query("SELECT NOW() as now");
  return rows[0].now;
};
