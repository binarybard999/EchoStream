// src/utils/socket.js
import { Server } from "socket.io";
import { Chat, Community } from "../models/community.model.js";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "./fileUploadCloudinary.js";

let io;

/**
 * Initialize the Socket.IO server and set up event listeners for real-time chat functionality.
 * @param {Object} httpServer - The HTTP server instance.
 */
export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        // Handle user joining a community
        socket.on("joinCommunity", async (communityId) => {
            try {
                // Check if the community exists
                const community = await Community.findById(communityId);
                if (!community) {
                    console.error(`Community with ID ${communityId} not found`);
                    return;
                }

                socket.join(communityId);
                console.log(`User joined community: ${communityId}`);
            } catch (error) {
                console.error("Error joining community:", error);
            }
        });

        // Handle user sending a chat message
        socket.on("sendMessage", async (data) => {
            const { communityId, content, senderId, imageFile, videoFile } = data;

            try {
                // Check if the community exists
                const community = await Community.findById(communityId);
                if (!community) {
                    console.error(`Community with ID ${communityId} not found`);
                    return;
                }

                let imageUrl = null;
                let videoUrl = null;

                // Upload image to Cloudinary if provided
                if (imageFile) {
                    const imageUpload = await uploadOnCloudinary(
                        imageFile,
                        `communities/${communityId}/images`
                    );
                    imageUrl = imageUpload.url;
                }

                // Upload video to Cloudinary if provided
                if (videoFile) {
                    const videoUpload = await uploadOnCloudinary(
                        videoFile,
                        `communities/${communityId}/videos`
                    );
                    videoUrl = videoUpload.url;
                }

                // Create and save the chat message in MongoDB
                const newChat = new Chat({
                    content,
                    image: imageUrl,
                    video: videoUrl,
                    sender: mongoose.Types.ObjectId(senderId),
                    community: mongoose.Types.ObjectId(communityId),
                });

                await newChat.save();

                // Broadcast the new message to all members of the community
                io.to(communityId).emit("newMessage", {
                    _id: newChat._id,
                    content,
                    image: imageUrl,
                    video: videoUrl,
                    sender: senderId,
                    createdAt: newChat.createdAt,
                });

                console.log("Message sent and saved:", newChat);
            } catch (error) {
                console.error("Error saving chat message:", error);
            }
        });

        // Handle user leaving a community
        socket.on("leaveCommunity", (communityId) => {
            socket.leave(communityId);
            console.log(`User left community: ${communityId}`);
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
};

/**
 * Get the Socket.IO instance.
 * @returns {Object} - The Socket.IO instance.
 */
export const getSocketInstance = () => io;
