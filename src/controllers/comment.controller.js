import asyncHandler from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
    // get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if the video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    // Fetch comments for the video, populate with user data, and paginate
    const comments = await Comment.aggregatePaginate(
        Comment.aggregate([
            { $match: { video: mongoose.Types.ObjectId.createFromHexString(videoId) } }, // Convert videoId to ObjectId
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                },
            },
            { $unwind: "$owner" },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    "owner.username": 1,
                    "owner.avatar": 1,
                },
            },
        ]),
        {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comments retrieved successfully")
        );
});

const addComment = asyncHandler(async (req, res) => {
    // add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    // Check if the video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Create a new comment associated with the video and the user
    const newComment = new Comment({
        content,
        video: videoId,
        owner: req.user._id, // `verifyJWT` middleware sets req.user
    });

    // Save the new comment to the database
    await newComment.save();

    // Populate the owner (user) details
    await newComment.populate("owner", "username avatar");

    return res
        .status(201)
        .json(new ApiResponse(201, newComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    // update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    // Find the comment by ID and check if it exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user updating the comment is the owner
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to update this comment"
        );
    }

    // Update the content of the comment
    comment.content = content;
    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    // delete a comment
    const { commentId } = req.params;

    // Find the comment by ID and check if it exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user deleting the comment is the owner
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(
            403,
            "You are not authorized to delete this comment"
        );
    }

    // Delete the comment
    await comment.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
