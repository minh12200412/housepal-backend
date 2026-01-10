// src/routes/bulletin.routes.js
import { Router } from "express";
import * as bulletinController from "../controllers/bulletin.controller.js";
// import { authMiddleware } from "../middlewares/auth.middleware.js";

// ✅ Upload
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

export const router = Router();

// router.use(authMiddleware);

// ====== ESM __dirname ======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== Multer config (save to /uploads) ======
// bulletin.routes.js nằm trong: src/routes
// uploads nằm ở root: /uploads
// => ../../uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../../uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

// (Optional) Chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  const ok = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.mimetype);
  if (!ok) return cb(new Error("Only image files are allowed (jpg, jpeg, png, webp)"), false);
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ===================== UPLOAD =====================
// POST /api/bulletin/upload/image
// Flutter gửi multipart/form-data với key: "file"
router.post("/upload/image", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  return res.status(201).json({
    success: true,
    message: "Upload image success",
    url,
  });
});

// ===================== NOTES =====================
// GET /api/bulletin/houses/:houseId/notes
router.get("/houses/:houseId/notes", bulletinController.getNotes);

// POST /api/bulletin/houses/:houseId/notes
router.post("/houses/:houseId/notes", bulletinController.createNote);

// PUT /api/bulletin/notes/:id
router.put("/notes/:id", bulletinController.updateNote);

// DELETE /api/bulletin/notes/:id
router.delete("/notes/:id", bulletinController.deleteNote);

// ===================== ITEMS =====================
// GET /api/bulletin/houses/:houseId/items
router.get("/houses/:houseId/items", bulletinController.getItems);

// POST /api/bulletin/houses/:houseId/items
router.post("/houses/:houseId/items", bulletinController.createItem);

// PUT /api/bulletin/items/:id
router.put("/items/:id", bulletinController.updateItem);

// DELETE /api/bulletin/items/:id
router.delete("/items/:id", bulletinController.deleteItem);

// ===================== COMMENTS =====================
// GET /api/bulletin/houses/:houseId/comments/:targetType/:targetId
router.get(
  "/houses/:houseId/comments/:targetType/:targetId",
  bulletinController.getComments
);

// POST /api/bulletin/houses/:houseId/comments/:targetType/:targetId
router.post(
  "/houses/:houseId/comments/:targetType/:targetId",
  bulletinController.createComment
);

// DELETE /api/bulletin/comments/:id
router.delete("/comments/:id", bulletinController.deleteComment);
