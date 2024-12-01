import { Router } from "express";
import {
    createOrJoinCommunity,
    sendMessage,
} from "../controllers/anonymousCommunity.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/join").post(createOrJoinCommunity);
router.route("/message").post(sendMessage);

export default router;
