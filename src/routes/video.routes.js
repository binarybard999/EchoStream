import { Router } from "express";
import {
    getAllVideos,
    getUserVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    addCategory,
    addTag,
    getVideosByCategory,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

// General video routes
router
    .route("/")
    .get(getAllVideos) // Get all videos
    .post(
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 },
        ]),
        publishVideo // Publish a new video
    );

// User-specific video routes
router.route("/user").get(getUserVideos); // Get videos for the authenticated user

// Category-related routes
router.route("/category/:category").get(getVideosByCategory); // Get videos by category

// Specific video operations (by video ID)
router
    .route("/:videoId")
    .get(getVideoById) // Get a video by its ID
    .delete(deleteVideo) // Delete a video
    .patch(upload.single("thumbnail"), updateVideo); // Update video details

// Toggle publish status for a video
router.route("/:videoId/toggle-publish").patch(togglePublishStatus);

// Metadata-related routes
router.route("/metadata/category").post(addCategory); // Add a new category
router.route("/metadata/tag").post(addTag); // Add a new tag

export default router;










// import { Router } from "express";
// import {
//     getAllVideos,
//     getUserVideos,
//     publishVideo,
//     getVideoById,
//     updateVideo,
//     deleteVideo,
//     togglePublishStatus,
//     addCategory,
//     addTag,
//     getVideosByCategory,
// } from "../controllers/video.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";
// import { upload } from "../middlewares/multer.middleware.js";

// const router = Router();
// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router
//     .route("/")
//     .get(getAllVideos)
//     .post(
//         upload.fields([
//             {
//                 name: "videoFile",
//                 maxCount: 1,
//             },
//             {
//                 name: "thumbnail",
//                 maxCount: 1,
//             },
//         ]),
//         publishVideo
//     );

// router
//     .route("/:videoId")
//     .get(getVideoById)
//     .delete(deleteVideo)
//     .patch(upload.single("thumbnail"), updateVideo);

// router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

// router.route("/add-category").post(addCategory);
// router.route("/add-tag").post(addTag);
// router.route("/category/:category").get(getVideosByCategory);
// router.route("/user").get(getUserVideos);

// export default router;
