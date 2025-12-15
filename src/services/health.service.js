import { checkDb } from "../repositories/health.repository.js";

export const getHealthStatus = async () => {
  const dbTime = await checkDb();
  return {
    status: "OK",
    dbTime,
  };
};
