import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { router as apiRouter } from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";

export const createApp = () => {
  const app = express();

  // ✅ ESM __dirname
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(cors());
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json());

  // ✅ Cho phép truy cập ảnh đã upload: http://localhost:4000/uploads/<file>
  // createApp nằm trong src/, nên uploads nằm ngoài src => ../uploads
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  // prefix tất cả API
  app.use("/api", apiRouter);

  // middleware xử lý lỗi chung
  app.use(errorHandler);

  return app;
};
