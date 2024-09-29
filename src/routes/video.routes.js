import express from "express";
import {
    uploadVideo,
    getAllVideos,
    getVideoById,
} from "../controllers/video.controller.js";
import upload from "../middleware/multer.js"; // Multer config for file upload
import { authMiddleware } from "../middleware/authMiddleware.js"; // Protect routes if necessary

const router = express.Router();

// Route for uploading video with file upload and Cloudinary processing
router.post("/upload", authMiddleware, upload.single("video"), uploadVideo);

// Get all videos (paginated)
router.get("/", getAllVideos);

// Get video by ID
router.get("/:id", getVideoById);

export default router;
