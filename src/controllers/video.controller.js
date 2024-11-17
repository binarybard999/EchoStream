import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/fileUploadCloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId,
    } = req.query;

    // Initialize the filter object
    const filter = {};

    // Apply search query filter if provided
    if (query) {
        filter.title = { $regex: query, $options: "i" }; // Case-insensitive search for titles
    }

    // Apply userId filter if provided and valid
    if (userId && isValidObjectId(userId)) {
        filter.owner = mongoose.Types.ObjectId(userId); // Convert to ObjectId for matching
    }

    // Define sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

    // Use aggregation with pagination
    const videos = await Video.aggregatePaginate(
        Video.aggregate([
            { $match: filter }, // Apply filters
            {
                $lookup: {
                    from: "users", // Name of the user collection
                    localField: "owner", // Field in the videos collection
                    foreignField: "_id", // Field in the users collection
                    as: "ownerDetails", // Alias for the joined data
                },
            },
            {
                $unwind: {
                    path: "$ownerDetails",
                    preserveNullAndEmptyArrays: true, // Allow videos without owners to be included
                },
            },
            {
                $project: {
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    categories: 1,
                    tags: 1,
                    "ownerDetails.username": 1, // Include only necessary owner fields
                    "ownerDetails.avatar": 1,
                },
            },
        ]).sort(sortOptions),
        {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        }
    );

    return res
        .status(200)
        .json(new ApiResponse(videos, {}, "Videos retrieved successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
    // Get video, upload to Cloudinary, create video
    const { title, description } = req.body;
    const userId = req.user._id; // Assuming you are using JWT authentication and have user info in req.user

    if (!title || !description || !req.files) {
        throw new ApiError(
            400,
            "Title, description, and video file are required"
        );
    }

    const { videoFile, thumbnail } = req.files;

    // Define folder name for user-specific uploads
    const userFolder = `users/${req.user.username}/videos`;

    // Upload video file to Cloudinary
    const videoUploadResponse = await uploadOnCloudinary(
        videoFile[0].path,
        userFolder
    );
    if (!videoUploadResponse) {
        throw new ApiError(500, "Failed to upload video file to Cloudinary");
    }

    // Upload thumbnail to Cloudinary
    const thumbnailUploadResponse = await uploadOnCloudinary(
        thumbnail[0].path,
        userFolder
    );
    if (!thumbnailUploadResponse) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }

    const videoData = {
        title,
        description,
        videoFile: videoUploadResponse.url,
        thumbnail: thumbnailUploadResponse.url,
        duration: videoUploadResponse.duration || 0, // Optional: depends on Cloudinary response
        owner: userId,
    };

    const newVideo = await Video.create(videoData);

    return res
        .status(201)
        .json(new ApiResponse(newVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId)
        .populate({
            path: "owner",
            select: "username fullName avatar", // Populate owner details
        })
        .populate({
            path: "comments",
            populate: {
                path: "owner",
                select: "username avatar", // Populate owner of each comment
            },
        });

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(
            {
                video,
                relatedVideos: await getRelatedVideos(video),
            },
            "Video retrieved successfully"
        )
    );
});

// Helper function to fetch related videos based on tags or categories
const getRelatedVideos = async (video) => {
    const relatedVideos = await Video.find({
        _id: { $ne: video._id }, // Exclude the current video
        $or: [
            { tags: { $in: video.tags } },
            { categories: { $in: video.categories } },
        ],
        isPublished: true,
    })
        .limit(5)
        .select("title thumbnail views");
    return relatedVideos;
};

const updateVideo = asyncHandler(async (req, res) => {
    // Update video details like title, description, thumbnail
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const { title, description } = req.body;

    // Define folder name for user-specific uploads
    const userFolder = `users/${req.user.username}/videos`;

    // Check if a new thumbnail is uploaded
    const thumbnail = req.files?.thumbnail ? req.files.thumbnail[0].path : null;
    let thumbnailUrl = null;

    if (thumbnail) {
        const thumbnailUploadResponse = await uploadOnCloudinary(
            thumbnail,
            userFolder
        );
        if (!thumbnailUploadResponse) {
            throw new ApiError(
                500,
                "Failed to upload new thumbnail to Cloudinary"
            );
        }
        thumbnailUrl = thumbnailUploadResponse.url;
    }

    const updateData = {
        ...(title && { title }),
        ...(description && { description }),
        ...(thumbnailUrl && { thumbnail: thumbnailUrl }),
    };

    const updatedVideo = await Video.findByIdAndUpdate(videoId, updateData, {
        new: true,
    });

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    // Delete video from DB and Cloudinary
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Remove the video file and thumbnail from Cloudinary
    if (video.videoFile) {
        await deleteFromCloudinary(video.videoFile);
    }

    if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail);
    }

    // Delete the video from the database
    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    // toggle publish status of video
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Toggle the isPublished status
    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                video,
                `Video ${video.isPublished ? "published" : "unpublished"} successfully`
            )
        );
});

// Add a new video category
const addCategory = asyncHandler(async (req, res) => {
    const { videoId, category } = req.body;

    if (!videoId || !category) {
        throw new ApiError(400, "Video ID and category are required.");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID.");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    if (!video.categories.includes(category)) {
        video.categories.push(category);
    }
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Category added successfully"));
});

// Add a new tag to the video
const addTag = asyncHandler(async (req, res) => {
    const { videoId, tag } = req.body;

    if (!videoId || !tag) {
        throw new ApiError(400, "Video ID and tag are required.");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID.");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found.");
    }

    if (!video.tags.includes(tag)) {
        video.tags.push(tag);
    }
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Tag added successfully"));
});

// Get videos by category
const getVideosByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;

    const videos = await Video.find({ categories: category }).sort({
        createdAt: -1,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "Videos by category retrieved successfully"
            )
        );
});

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    addCategory,
    addTag,
    getVideosByCategory,
};
