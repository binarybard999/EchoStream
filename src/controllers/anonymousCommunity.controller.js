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

    // Log for debugging
    console.log(
        `Community: ${sanitizedCommunityName}, Username: ${sanitizedUsername}`
    );

    // Response for joining/creating a community
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

    if (!communityName || !username || !content.trim()) {
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

    // Prepare the message
    const message = {
        communityName: sanitizedCommunityName,
        username: sanitizedUsername,
        content,
        timestamp: new Date().toISOString(),
    };

    // Broadcast message via socket
    const io = getSocketInstance();
    io.to(sanitizedCommunityName).emit("newAnonMessage", message);
    console.log(`Message sent to ${sanitizedCommunityName}:`, message);

    // Respond with the sent message
    return res
        .status(201)
        .json(new ApiResponse(201, message, "Message sent successfully."));
});
