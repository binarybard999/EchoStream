import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // Cloudinary service URL
            required: true,
        },
        thumbnail: {
            type: String, // Cloudinary service URL
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number, // Sent with video data from Cloudinary
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment", // Refers to Comment model
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User", // Refers to User model
        },
        categories: [
            {
                type: String, // Categories
                enum: [
                    "coding",
                    "sports",
                    "gaming",
                    "music",
                    "news",
                    "travel",
                    "food",
                    "education",
                    "lifestyle",
                    "technology",
                    "fitness",
                    "health",
                ],
            },
        ],
        tags: [
            {
                type: String, // Tags for search and filtering
            },
        ],
    },
    { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
