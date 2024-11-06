import { Router } from "express";
import {
    createCommunity,
    editCommunity,
    deleteCommunity,
    addCommunityAvatar,
    joinCommunity,
    leaveCommunity,
    removeUserFromCommunity,
    makeAdmin,
    revokeAdmin,
    sendMessage,
    deleteMessage,
    getCommunityChats,
    editMessage,
    getCommunityDetails,
    searchCommunities,
    listUserCommunities,
    listAllCommunities,
    uploadImageToChat,
    uploadVideoToChat,
    deleteCommunityMedia,
} from "../controllers/community.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"; // Middleware for file uploads

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// Community management routes
router.route("/").post(createCommunity).get(listAllCommunities);
router.route("/:communityId").patch(editCommunity).delete(deleteCommunity);
router
    .route("/:communityId/avatar")
    .patch(upload.single("avatar"), addCommunityAvatar);

// Member management routes
router.route("/:communityId/join").post(joinCommunity);
router.route("/:communityId/leave").post(leaveCommunity);
router.route("/:communityId/remove/:userId").delete(removeUserFromCommunity);
router.route("/:communityId/admin/make/:userId").patch(makeAdmin);
router.route("/:communityId/admin/revoke/:userId").patch(revokeAdmin);

// Chat management routes
router.route("/:communityId/message").post(sendMessage);
router
    .route("/:communityId/message/:messageId")
    .delete(deleteMessage)
    .patch(editMessage);
router.route("/:communityId/messages").get(getCommunityChats);

// Media management routes
router
    .route("/:communityId/chat/upload-image")
    .post(upload.single("image"), uploadImageToChat);
router
    .route("/:communityId/chat/upload-video")
    .post(upload.single("video"), uploadVideoToChat);
router.route("/:communityId/media").delete(deleteCommunityMedia);

// Community information and search routes
router.route("/:communityId").get(getCommunityDetails);
router.route("/search").get(searchCommunities);
router.route("/user/:userId/communities").get(listUserCommunities);

export default router;
