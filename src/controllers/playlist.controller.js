import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required.");
    }

    const newPlaylist = new Playlist({
        name,
        description,
        owner: req.user._id,
    });

    await newPlaylist.save();

    return res
        .status(201)
        .json(new ApiResponse(201, newPlaylist, "Playlist created successfully."));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID.");
    }

    const playlists = await Playlist.find({ owner: userId }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists retrieved successfully."));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID.");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos");

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist retrieved successfully."));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID.");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }

    // Check if the video is already in the playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist.");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added to playlist successfully."));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID.");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }

    // Remove the video from the playlist
    playlist.videos = playlist.videos.filter(
        (id) => id.toString() !== videoId.toString()
    );
    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed from playlist successfully."));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID.");
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Playlist deleted successfully."));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID.");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found.");
    }

    if (name) playlist.name = name;
    if (description) playlist.description = description;
    await playlist.save();

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully."));
});

const getAllPlaylists = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query } = req.query;

    // Initialize the filter object
    const filter = {};
    if (query) {
        filter.name = { $regex: query, $options: "i" }; // Case-insensitive search by name
    }

    // Use aggregate with pagination
    const playlists = await Playlist.aggregatePaginate(
        Playlist.aggregate([{ $match: filter }]).lookup({
            from: "videos", // Join with videos collection
            localField: "videos",
            foreignField: "_id",
            as: "videos",
        }),
        {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "Playlists retrieved successfully."));
});

const getCurrentUserPlaylists = asyncHandler(async (req, res) => {
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User not authenticated.");
    }

    const playlists = await Playlist.find({ owner: req.user._id }).populate("videos");

    if (!playlists || playlists.length === 0) {
        throw new ApiError(404, "No playlists found for the current user.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "Playlists retrieved successfully."));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getAllPlaylists,
    getCurrentUserPlaylists
};
