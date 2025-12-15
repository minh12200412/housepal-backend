import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  db: {
    connectionString: process.env.DATABASE_URL,
  },
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
};
