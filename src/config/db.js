import pkg from "pg";
import { config } from "./env.js";

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: config.db.connectionString,
});

export const query = (text, params) => pool.query(text, params);
