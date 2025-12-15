import { getHealthStatus } from "../services/health.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const healthCheck = async (req, res, next) => {
  try {
    const data = await getHealthStatus();
    return sendSuccess(res, data, "API is healthy");
  } catch (err) {
    next(err);
  }
};
