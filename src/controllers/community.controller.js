import mongoose from "mongoose";
import { Community, Chat } from "../models/community.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
    deleteFolderFromCloudinary
} from "../utils/fileUploadCloudinary.js";
import { getSocketInstance } from "../utils/socket.js"; // Import Socket.io instance

// Core Functions for Community Management
/**
 * 1. Create a new community
 * @route POST /api/communities
 */
const createCommunity = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const avatarLocalPath = req.files?.avatar?.[0]?.path || null;

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required.");
    }

    // Define folder name for community-specific uploads
    const communityFolder = `communities/${name}`;

    // Upload community avatar to Cloudinary if provided
    let avatar = { url: "" };
    if (avatarLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath, communityFolder);
        if (!avatar) {
            throw new ApiError(500, "Failed to upload avatar to Cloudinary.");
        }
    }

    // Create the community in the database
    const community = await Community.create({
        name,
        description,
        owner: req.user._id,
        avatar: avatar.url,
    });

    // Emit an event using Socket.io to update all clients
    const io = getSocketInstance();
    io.emit("newCommunity", community);

    return res
        .status(201)
        .json(
            new ApiResponse(200, community, "Community created successfully.")
        );
});

/**
 * 2. Edit an existing community
 * @route PATCH /api/communities/:communityId
 */
const editCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const { name, description } = req.body;
    const avatarLocalPath = req.files?.avatar?.[0]?.path || null;

    // Find the community by ID
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the user is the owner
    if (community.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to edit this community."
        );
    }

    // Update community details
    if (name) community.name = name;
    if (description) community.description = description;

    // Upload new avatar if provided
    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(
            avatarLocalPath,
            `communities/${community.name}`
        );
        if (!avatar) {
            throw new ApiError(
                500,
                "Failed to upload new avatar to Cloudinary."
            );
        }
        community.avatar = avatar.url;
    }

    await community.save();

    // Emit an event using Socket.io to notify about the community update
    const io = getSocketInstance();
    io.to(communityId).emit("communityUpdated", community);

    return res
        .status(200)
        .json(
            new ApiResponse(200, community, "Community updated successfully.")
        );
});

/**
 * 3. Delete a community
 * @route DELETE /api/communities/:communityId
 */
const deleteCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    // Find the community by ID
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the user is the owner
    if (community.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this community."
        );
    }

    // Delete the community from the database
    await community.deleteOne();

    // Emit an event using Socket.io to notify all clients about the deletion
    const io = getSocketInstance();
    io.emit("communityDeleted", communityId);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Community deleted successfully."));
});

/**
 * 4. Add or update the community avatar
 * @route PATCH /api/communities/:communityId/avatar
 */
const addCommunityAvatar = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required.");
    }

    // Find the community by ID
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the user is the owner
    if (community.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this community's avatar."
        );
    }

    // Upload the new avatar to Cloudinary
    const avatar = await uploadOnCloudinary(
        avatarLocalPath,
        `communities/${community.name}`
    );
    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary.");
    }

    // Update the avatar URL in the community document
    community.avatar = avatar.url;
    await community.save();

    // Emit an event using Socket.io to notify about the avatar update
    const io = getSocketInstance();
    io.to(communityId).emit("avatarUpdated", community);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                community,
                "Community avatar updated successfully."
            )
        );
});

// Member Management Functions
/**
 * 5. Join a community
 * @route POST /api/communities/:communityId/join
 */
const joinCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    // Find the community by ID
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the user is already a member
    if (
        community.members.some(
            (member) => member.user.toString() === req.user._id.toString()
        )
    ) {
        throw new ApiError(400, "You are already a member of this community.");
    }

    // Add the user to the community's members list
    community.members.push({ user: req.user._id });
    await community.save();

    // Notify all members that a new user has joined
    const io = getSocketInstance();
    io.to(communityId).emit("memberJoined", { userId: req.user._id });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                community,
                "Joined the community successfully."
            )
        );
});

/**
 * 6. Leave a community
 * @route POST /api/communities/:communityId/leave
 */
const leaveCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    // Find the community by ID
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the user is a member of the community
    if (
        !community.members.some(
            (member) => member.user.toString() === req.user._id.toString()
        )
    ) {
        throw new ApiError(400, "You are not a member of this community.");
    }

    // Remove the user from the community's members list
    community.members = community.members.filter(
        (member) => member.user.toString() !== req.user._id.toString()
    );
    await community.save();

    // Notify all members that a user has left
    const io = getSocketInstance();
    io.to(communityId).emit("memberLeft", { userId: req.user._id });

    return res
        .status(200)
        .json(
            new ApiResponse(200, community, "Left the community successfully.")
        );
});

/**
 * 7. Remove a user from the community
 * @route DELETE /api/communities/:communityId/remove/:userId
 */
const removeUserFromCommunity = asyncHandler(async (req, res) => {
    const { communityId, userId } = req.params;

    // Validate the IDs
    if (
        !mongoose.Types.ObjectId.isValid(communityId) ||
        !mongoose.Types.ObjectId.isValid(userId)
    ) {
        throw new ApiError(400, "Invalid community or user ID.");
    }

    // Find the community by ID
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the requester is the community owner
    if (community.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to remove members from this community."
        );
    }

    // Check if the user is a member
    if (
        !community.members.some((member) => member.user.toString() === userId)
    ) {
        throw new ApiError(
            400,
            "The specified user is not a member of this community."
        );
    }

    // Remove the user from the members list
    community.members = community.members.filter(
        (member) => member.user.toString() !== userId
    );
    await community.save();

    // Notify all members that a user has been removed
    const io = getSocketInstance();
    io.to(communityId).emit("memberRemoved", { userId });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                community,
                "User removed from the community successfully."
            )
        );
});

/**
 * 8. Make a user an admin in the community
 * @route PATCH /api/communities/:communityId/admin/make/:userId
 */
const makeAdmin = asyncHandler(async (req, res) => {
    const { communityId, userId } = req.params;

    // Validate the IDs
    if (
        !mongoose.Types.ObjectId.isValid(communityId) ||
        !mongoose.Types.ObjectId.isValid(userId)
    ) {
        throw new ApiError(400, "Invalid community or user ID.");
    }

    // Find the community by ID
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the requester is the community owner
    if (community.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to make users admin in this community."
        );
    }

    // Check if the user is already an admin
    if (community.admins.includes(userId)) {
        throw new ApiError(400, "The user is already an admin.");
    }

    // Add the user to the admins list
    community.admins.push(userId);
    await community.save();

    // Notify all members that a user has been made an admin
    const io = getSocketInstance();
    io.to(communityId).emit("adminAdded", { userId });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                community,
                "User has been made an admin successfully."
            )
        );
});

/**
 * 9. Revoke admin status from a user in the community
 * @route PATCH /api/communities/:communityId/admin/revoke/:userId
 */
const revokeAdmin = asyncHandler(async (req, res) => {
    const { communityId, userId } = req.params;

    // Validate the IDs
    if (
        !mongoose.Types.ObjectId.isValid(communityId) ||
        !mongoose.Types.ObjectId.isValid(userId)
    ) {
        throw new ApiError(400, "Invalid community or user ID.");
    }

    // Find the community by ID
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the requester is the community owner
    if (community.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to revoke admin status in this community."
        );
    }

    // Check if the user is an admin
    if (!community.admins.includes(userId)) {
        throw new ApiError(400, "The user is not an admin.");
    }

    // Remove the user from the admins list
    community.admins = community.admins.filter(
        (adminId) => adminId.toString() !== userId
    );
    await community.save();

    // Notify the community about the admin revocation
    const io = getSocketInstance();
    io.to(communityId).emit("adminRevoked", { userId });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                community,
                "Admin status has been revoked successfully."
            )
        );
});

// Chat Management Functions
/**
 * 10. Send a chat message in a community
 * @route POST /api/communities/:communityId/message
 */
const sendMessage = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Check if the community exists
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the user is a member of the community
    if (
        !community.members.some(
            (member) => member.user.toString() === userId.toString()
        )
    ) {
        throw new ApiError(403, "You are not a member of this community.");
    }

    // Handle optional file uploads
    let imageUrl = null;
    let videoUrl = null;
    if (req.files?.image) {
        const imageUpload = await uploadOnCloudinary(
            req.files.image[0].path,
            `communities/${communityId}/images`
        );
        imageUrl = imageUpload.url;
    }
    if (req.files?.video) {
        const videoUpload = await uploadOnCloudinary(
            req.files.video[0].path,
            `communities/${communityId}/videos`
        );
        videoUrl = videoUpload.url;
    }

    // Create the chat message
    const chatMessage = await Chat.create({
        community: communityId,
        sender: userId,
        content,
        image: imageUrl,
        video: videoUrl,
    });

    // Notify all members in real-time
    const io = getSocketInstance();
    io.to(communityId).emit("newMessage", chatMessage);

    return res
        .status(201)
        .json(new ApiResponse(201, chatMessage, "Message sent successfully."));
});

/**
 * 11. Delete a chat message in a community
 * @route DELETE /api/communities/:communityId/message/:messageId
 */
const deleteMessage = asyncHandler(async (req, res) => {
    const { communityId, messageId } = req.params;
    const userId = req.user._id;

    // Check if the community exists
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Find the chat message
    const chatMessage = await Chat.findById(messageId);
    if (!chatMessage) {
        throw new ApiError(404, "Message not found.");
    }

    // Check if the requester is the message owner, community owner, or an admin
    const isAuthorized =
        chatMessage.sender.toString() === userId.toString() ||
        community.owner.toString() === userId.toString() ||
        community.admins.includes(userId);
    if (!isAuthorized) {
        throw new ApiError(
            403,
            "You are not authorized to delete this message."
        );
    }

    // Delete the message
    await chatMessage.deleteOne();

    // Notify all members in real-time
    const io = getSocketInstance();
    io.to(communityId).emit("messageDeleted", { messageId });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Message deleted successfully."));
});

/**
 * 12. Get chat messages in a community
 * @route GET /api/communities/:communityId/messages
 */
const getCommunityChats = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if the community exists
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Retrieve paginated chat messages
    const chats = await Chat.find({ community: communityId })
        .populate("sender", "username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10));

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                chats,
                "Community chats retrieved successfully."
            )
        );
});

/**
 * 13. Edit a chat message in a community
 * @route PATCH /api/communities/:communityId/message/:messageId
 */
const editMessage = asyncHandler(async (req, res) => {
    const { communityId, messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Check if the community exists
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Find the chat message
    const chatMessage = await Chat.findById(messageId);
    if (!chatMessage) {
        throw new ApiError(404, "Message not found.");
    }

    // Check if the requester is the message owner
    if (chatMessage.sender.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to edit this message.");
    }

    // Update the message content
    chatMessage.content = content;
    await chatMessage.save();

    // Notify all members in real-time
    const io = getSocketInstance();
    io.to(communityId).emit("messageEdited", { messageId, content });

    return res
        .status(200)
        .json(
            new ApiResponse(200, chatMessage, "Message edited successfully.")
        );
});

// Community Information and Search Functions
/**
 * 14. Get Community Details
 * @route GET /api/communities/:communityId
 * @desc Retrieves details of a specific community
 */
const getCommunityDetails = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    // Check if the community ID is valid
    if (!mongoose.Types.ObjectId.isValid(communityId)) {
        throw new ApiError(400, "Invalid community ID.");
    }

    // Find the community and populate owner and members
    const community = await Community.findById(communityId)
        .populate("owner", "username avatar")
        .populate("members.user", "username avatar");

    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                community,
                "Community details retrieved successfully."
            )
        );
});

/**
 * 15. Search Communities
 * @route GET /api/communities/search
 * @desc Searches for communities based on a query string
 */
const searchCommunities = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim() === "") {
        throw new ApiError(400, "Query string is required.");
    }

    // Search for communities where the name or description matches the query
    const communities = await Community.find({
        $or: [
            { name: { $regex: query, $options: "i" } }, // Case-insensitive search
            { description: { $regex: query, $options: "i" } },
        ],
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                communities,
                "Communities retrieved successfully."
            )
        );
});

/**
 * 16. List User Communities
 * @route GET /api/users/:userId/communities
 * @desc Retrieves a list of all communities that a user has joined
 */
const listUserCommunities = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Check if the user ID is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID.");
    }

    // Find communities where the user is a member
    const communities = await Community.find({ "members.user": userId });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                communities,
                "User communities retrieved successfully."
            )
        );
});

/**
 * 17. List All Communities
 * @route GET /api/communities
 * @desc Retrieves a paginated list of all communities for exploration or browsing
 */
const listAllCommunities = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // Pagination options
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }, // Sort by creation date, newest first
    };

    // Use Mongoose's `paginate` method
    const communities = await Community.paginate({}, options);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                communities,
                "All communities retrieved successfully."
            )
        );
});

// Media Management Functions
/**
 * 18. Upload Image to Chat
 * @route POST /api/communities/:communityId/chat/upload-image
 * @desc Handles the upload of images in a chat message
 */
const uploadImageToChat = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.user._id;
    const imageFilePath = req.files?.image?.[0]?.path;

    if (!imageFilePath) {
        throw new ApiError(400, "Image file is required.");
    }

    // Check if the community exists
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the user is a member of the community
    if (
        !community.members.some(
            (member) => member.user.toString() === userId.toString()
        )
    ) {
        throw new ApiError(403, "You are not a member of this community.");
    }

    // Upload the image to Cloudinary
    const imageUpload = await uploadOnCloudinary(
        imageFilePath,
        `communities/${communityId}/images`
    );
    if (!imageUpload) {
        throw new ApiError(500, "Failed to upload image to Cloudinary.");
    }

    // Create a new chat message in the database
    const chatMessage = await Chat.create({
        community: communityId,
        sender: userId,
        image: imageUpload.url,
    });

    // Emit the new message to all members of the community via socket.io
    const io = getSocketInstance();
    io.to(communityId).emit("newMessage", {
        message: chatMessage,
        type: "image",
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { imageUrl: imageUpload.url },
                "Image uploaded successfully."
            )
        );
});

/**
 * 19. Upload Video to Chat
 * @route POST /api/communities/:communityId/chat/upload-video
 * @desc Handles the upload of small videos in a chat message
 */
const uploadVideoToChat = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.user._id;
    const videoFilePath = req.files?.video?.[0]?.path;

    if (!videoFilePath) {
        throw new ApiError(400, "Video file is required.");
    }

    // Check if the community exists
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the user is a member of the community
    if (
        !community.members.some(
            (member) => member.user.toString() === userId.toString()
        )
    ) {
        throw new ApiError(403, "You are not a member of this community.");
    }

    // Upload the video to Cloudinary
    const videoUpload = await uploadOnCloudinary(
        videoFilePath,
        `communities/${communityId}/videos`
    );
    if (!videoUpload) {
        throw new ApiError(500, "Failed to upload video to Cloudinary.");
    }

    // Create a new chat message in the database
    const chatMessage = await Chat.create({
        community: communityId,
        sender: userId,
        video: videoUpload.url,
    });

    // Emit the new message to all members of the community via socket.io
    const io = getSocketInstance();
    io.to(communityId).emit("newMessage", {
        message: chatMessage,
        type: "video",
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { videoUrl: videoUpload.url },
                "Video uploaded successfully."
            )
        );
});

/**
 * 20. Delete Community Media
 * @route DELETE /api/communities/:communityId/media
 * @desc Deletes all media files related to a community from Cloudinary
 */
const deleteCommunityMedia = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    // Check if the community exists
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    // Check if the requester is the community owner
    if (community.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete media from this community."
        );
    }

    // Delete the entire folder from Cloudinary
    const deleteSuccess = await deleteFolderFromCloudinary(
        `communities/${communityId}`
    );
    if (!deleteSuccess) {
        throw new ApiError(500, "Failed to delete media from Cloudinary.");
    }

    // Notify members that all media has been deleted
    const io = getSocketInstance();
    io.to(communityId).emit("mediaDeleted", {
        message: "All community media has been deleted.",
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "All community media deleted successfully."
            )
        );
});

export {
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
};
