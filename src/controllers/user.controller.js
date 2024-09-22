import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUploadCloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;
    console.log("fullName: " + fullName);
    console.log("email: " + email);
    console.log("username: " + username);
    console.log("password: " + password);

    if (
        [fullName, email, username, password].some(
            (field) => field?.trim === ""
        )
    ) {
        throw new ApiError(400, "All fields are required.");
    }

    const existedUser = User.findOne({
        $or: [{ email }, { username }],
    });

    if (existedUser) {
        throw new ApiError(409, "Email or username already exists.");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required.");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(500, "Failed to upload avatar to Cloudinary.");
    }

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken"); // to fetch user and do not select the password and refresh token by putting '-' sign

    if (!createdUser){
        throw new ApiError(500, "Failed to create user.");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully.")
    )
});

export { registerUser };
