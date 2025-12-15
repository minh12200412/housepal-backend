import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { router as apiRouter } from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json());

  // prefix tất cả API
  app.use("/api", apiRouter);

  // middleware xử lý lỗi chung
  app.use(errorHandler);

  return app;
};
