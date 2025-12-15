export const sendSuccess = (res, data, message = "Thành công") => {
  return res.json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, status, message = "Lỗi") => {
  return res.status(status).json({
    success: false,
    message,
  });
};
