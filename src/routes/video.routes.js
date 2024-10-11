import { Router } from "express";
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;



// import express from "express";
// import {
//     uploadVideo,
//     getAllVideos,
//     getVideoById,
// } from "../controllers/video.controller.js";
// import upload from "../middleware/multer.js"; // Multer config for file upload
// import { authMiddleware } from "../middleware/authMiddleware.js"; // Protect routes if necessary

// const router = express.Router();

// // Route for uploading video with file upload and Cloudinary processing
// router.post("/upload", authMiddleware, upload.single("video"), uploadVideo);

// // Get all videos (paginated)
// router.get("/", getAllVideos);

// // Get video by ID
// router.get("/:id", getVideoById);

// export default router;
