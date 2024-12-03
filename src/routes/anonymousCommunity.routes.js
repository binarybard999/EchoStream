import { Router } from "express";
import {
    createOrJoinCommunity,
    sendMessage,
} from "../controllers/anonymousCommunity.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect routes with JWT middleware
router.use(verifyJWT);

// Route for joining or creating an anonymous community
router.route("/join").post(createOrJoinCommunity);

// Route for sending a message in an anonymous community
router.route("/message").post(sendMessage);

export default router;
