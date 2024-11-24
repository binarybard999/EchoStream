import axios from "axios";
import asyncHandler from "../utils/asyncHandler";

// Fetch environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_BASE_URL = process.env.GEMINI_API_BASE_URL;

// Controller to handle AI data generation
export const getAiGeneratedContent = asyncHandler(async (req, res) => {
    const { title, description, tags, category } = req.body;

    // Input validation
    if (!title || !description || !category) {
        res.status(400).json({ message: "Title, description, and category are required." });
        return;
    }

    try {
        // Request to Gemini AI API
        const response = await axios.post(
            GEMINI_API_BASE_URL,
            { title, description, tags, category },
            {
                headers: {
                    Authorization: `Bearer ${GEMINI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.status(200).json(response.data); // Respond with the data from Gemini AI
    } catch (error) {
        console.error("Error interacting with Gemini API:", error.message);
        res.status(500).json({ message: "Failed to fetch AI-generated content." });
    }
});
