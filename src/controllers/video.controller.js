import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUploadCloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    // get all videos based on query, sort, pagination
});

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // get video by id
    // populate comments
    // populate user
    // populate likes
    // populate dislikes
    // populate shares
    // populate views
    // populate tags
    // populate categories
    // populate related videos
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // delete video from db and cloudinary
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // toggle publish status of video
});

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};



/*
// backend/controllers/video.controller.js
import { Video } from "../models/video.model.js";
import cloudinary from "../utils/cloudinaryConfig.js";
import { convertVideo } from "../utils/videoConverter.js";
import fs from "fs";
import path from "path";

// Upload Video Controller
export const uploadVideo = async (req, res) => {
    try {
        // Video file path after being uploaded by multer
        const videoFilePath = req.file.path;

        // Convert video to 480p, 720p, and 1080p
        const [video480p, video720p, video1080p] = await Promise.all([
            convertVideo(
                videoFilePath,
                "640x480",
                `output_480p_${req.file.filename}`
            ),
            convertVideo(
                videoFilePath,
                "1280x720",
                `output_720p_${req.file.filename}`
            ),
            convertVideo(
                videoFilePath,
                "1920x1080",
                `output_1080p_${req.file.filename}`
            ),
        ]);

        // Upload videos to Cloudinary
        const [cloud480p, cloud720p, cloud1080p] = await Promise.all([
            cloudinary.uploader.upload(video480p, {
                resource_type: "video",
                folder: "videos",
            }),
            cloudinary.uploader.upload(video720p, {
                resource_type: "video",
                folder: "videos",
            }),
            cloudinary.uploader.upload(video1080p, {
                resource_type: "video",
                folder: "videos",
            }),
        ]);

        // Upload thumbnail to Cloudinary (for simplicity, assuming the thumbnail comes with the request)
        const thumbnailUpload = await cloudinary.uploader.upload(
            req.body.thumbnail,
            { folder: "thumbnails" }
        );

        // Save video data to MongoDB
        const newVideo = new Video({
            videoFile: cloud720p.secure_url, // Using the 720p version as the default
            thumbnail: thumbnailUpload.secure_url,
            title: req.body.title,
            description: req.body.description,
            duration: cloud720p.duration, // Duration is returned from Cloudinary video upload response
            owner: req.user._id, // Assuming authentication middleware adds `req.user`
        });

        const savedVideo = await newVideo.save();

        // Delete temporary files
        fs.unlinkSync(videoFilePath);
        fs.unlinkSync(video480p);
        fs.unlinkSync(video720p);
        fs.unlinkSync(video1080p);

        res.status(201).json({
            message: "Video uploaded successfully",
            video: savedVideo,
            videos: {
                lowRes: cloud480p.secure_url,
                medRes: cloud720p.secure_url,
                highRes: cloud1080p.secure_url,
            },
        });
    } catch (error) {
        console.error("Error uploading video:", error);
        res.status(500).json({ message: "Video upload failed" });
    }
};

// Get All Videos (with Pagination)
export const getAllVideos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const aggregate = Video.aggregate([
            { $match: { isPublished: true } },
            { $sort: { createdAt: -1 } },
        ]);

        const options = { page, limit };
        const videos = await Video.aggregatePaginate(aggregate, options);

        res.json(videos);
    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json({ message: "Failed to fetch videos" });
    }
};

// Get Video by ID
export const getVideoById = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id).populate(
            "owner",
            "name"
        );

        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        res.json(video);
    } catch (error) {
        console.error("Error fetching video by ID:", error);
        res.status(500).json({ message: "Failed to fetch video" });
    }
};
*/
