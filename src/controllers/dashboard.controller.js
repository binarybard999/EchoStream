import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assume `req.user` is set by `verifyJWT` middleware

    // Get the total number of videos uploaded by the user
    const totalVideos = await Video.countDocuments({ owner: userId });

    // Get the total number of views for all videos uploaded by the user
    const totalViews = await Video.aggregate([
        { $match: { owner: mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);

    // Get the total number of subscribers for the channel
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    // Get the total number of likes on videos uploaded by the user
    const totalLikes = await Like.countDocuments({ video: { $in: await Video.find({ owner: userId }).select("_id") } });

    // Format the total views result
    const viewsCount = totalViews.length > 0 ? totalViews[0].totalViews : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            totalVideos,
            totalViews: viewsCount,
            totalSubscribers,
            totalLikes,
        }, "Channel stats retrieved successfully.")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assume `req.user` is set by `verifyJWT` middleware

    // Fetch all videos uploaded by the user
    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos retrieved successfully.")
    );
});

export { getChannelStats, getChannelVideos };
