import { sendSuccess } from "../utils/apiResponse.js";

export const loginDemo = async (req, res, next) => {
  try {
    // demo trả user mock
    const user = {
      id: 1,
      name: "User demo",
      token: "demo-token",
    };
    return sendSuccess(res, user, "Login demo (chưa có logic thật)");
  } catch (err) {
    next(err);
  }
};
