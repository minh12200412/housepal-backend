import dotenv from "dotenv";
dotenv.config();

const connectionString = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;

export const config = {
  port: process.env.PORT || 4000,
  db: {
    connectionString,
  },
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
};
