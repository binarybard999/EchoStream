import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getSocketInstance } from "../utils/socket.js";

export const createOrJoinCommunity = asyncHandler(async (req, res) => {
    const { communityName, username } = req.body;

    if (!communityName || !username) {
        throw new ApiError(400, "Community name and username are required.");
    }

    // Sanitize inputs
    const sanitizedCommunityName = communityName
        .replace(/\s+/g, "_")
        .toLowerCase();
    const sanitizedUsername = username.replace(/\s+/g, "_").toLowerCase();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                communityName: sanitizedCommunityName,
                username: sanitizedUsername,
            },
            "Successfully joined or created the anonymous community."
        )
    );
});

export const sendMessage = asyncHandler(async (req, res) => {
    const { communityName, username, content } = req.body;

    if (!communityName || !username || !content) {
        throw new ApiError(
            400,
            "Community name, username, and message content are required."
        );
    }

    // Sanitize inputs
    const sanitizedCommunityName = communityName
        .replace(/\s+/g, "_")
        .toLowerCase();
    const sanitizedUsername = username.replace(/\s+/g, "_").toLowerCase();

    const message = {
        communityName: sanitizedCommunityName,
        username: sanitizedUsername,
        content,
        timestamp: new Date(),
    };

    const io = getSocketInstance();
    io.to(sanitizedCommunityName).emit("anonymousMessage", message);

    return res
        .status(201)
        .json(new ApiResponse(201, message, "Message sent successfully."));
});
