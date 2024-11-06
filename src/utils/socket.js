import { Server } from "socket.io";
import { Chat } from "../models/community.model.js";
import mongoose from "mongoose";

let io;

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
        socket.on("joinCommunity", (communityId) => {
            socket.join(communityId);
            console.log(`User joined community: ${communityId}`);
        });

        // Handle user sending a message
        socket.on("sendMessage", async (data) => {
            const { communityId, content, senderId, image, video } = data;

            try {
                // Create and save the chat message in MongoDB
                const newChat = new Chat({
                    content,
                    image,
                    video,
                    sender: mongoose.Types.ObjectId(senderId),
                    community: mongoose.Types.ObjectId(communityId),
                });

                await newChat.save();

                // Broadcast the new message to all members of the community
                io.to(communityId).emit("newMessage", {
                    content,
                    image,
                    video,
                    senderId,
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

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
};

export const getSocketInstance = () => io;
