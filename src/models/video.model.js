import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary service url
            required: true,
        },
        thumbnail: {
            type: String, //cloudinary service url
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
            type: Number, //sent with video data from cloudinary
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
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        categories: [
            {
                type: String, // Categories like "coding", "sports", "gaming", etc.
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
