import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUploadCloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    // get all comments for a video
});

const addComment = asyncHandler(async (req, res) => {
    // add a comment to a video
});

const updateComment = asyncHandler(async (req, res) => {
    // update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
    // delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
