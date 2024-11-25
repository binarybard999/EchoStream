import { Router } from "express";
import { generateAiContent } from "../controllers/ai.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply JWT verification middleware
router.use(verifyJWT);

// Route to handle AI content generation
router.post("/generate", generateAiContent);

export default router;
