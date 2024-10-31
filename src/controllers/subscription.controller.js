import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    // Check if the channel and user IDs are valid
    if (!isValidObjectId(channelId) || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid channel or user ID.");
    }

    // Check if subscription exists
    const subscription = await Subscription.findOne({
        channel: channelId,
        subscriber: userId,
    });

    if (subscription) {
        // Unsubscribe if subscription exists
        await subscription.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed successfully."));
    } else {
        // Subscribe if no subscription exists
        await Subscription.create({ channel: channelId, subscriber: userId });
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Subscribed successfully."));
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID.");
    }

    const result = await Subscription.aggregate([
        // Match the channel ID
        { $match: { channel: mongoose.Types.ObjectId(channelId) } },
        // Join with the User collection to get subscriber details
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
            },
        },
        // Unwind the subscriber array since lookup returns an array
        { $unwind: "$subscriber" },
        // Group all subscribers and calculate the count
        {
            $group: {
                _id: null,
                subscribers: { $push: "$subscriber" },
                totalSubscribers: { $sum: 1 },
            },
        },
        // Project to match the required output format
        {
            $project: {
                _id: 0,
                subscribers: {
                    username: "$subscribers.username",
                    fullName: "$subscribers.fullName",
                    avatar: "$subscribers.avatar",
                },
                totalSubscribers: 1,
            },
        },
    ]);

    // If no subscribers found, return empty data with count 0
    const data = result[0] || { subscribers: [], totalSubscribers: 0 };

    return res
        .status(200)
        .json(
            new ApiResponse(200, data, "Subscribers retrieved successfully.")
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID.");
    }

    const result = await Subscription.aggregate([
        // Match the subscriber ID
        { $match: { subscriber: mongoose.Types.ObjectId(subscriberId) } },
        // Join with the User collection to get channel details
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
            },
        },
        // Unwind the channel array since lookup returns an array
        { $unwind: "$channel" },
        // Group all channels and calculate the count
        {
            $group: {
                _id: null,
                subscribedChannels: { $push: "$channel" },
                totalSubscribedChannels: { $sum: 1 },
            },
        },
        // Project to match the required output format
        {
            $project: {
                _id: 0,
                subscribedChannels: {
                    username: "$subscribedChannels.username",
                    fullName: "$subscribedChannels.fullName",
                    avatar: "$subscribedChannels.avatar",
                },
                totalSubscribedChannels: 1,
            },
        },
    ]);

    // If no subscriptions found, return empty data with count 0
    const data = result[0] || {
        subscribedChannels: [],
        totalSubscribedChannels: 0,
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                data,
                "Subscribed channels retrieved successfully."
            )
        );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
