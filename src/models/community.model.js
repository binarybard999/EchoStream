import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Define the Chat Schema
const chatSchema = new Schema(
    {
        content: {
            type: String,
            required: false, // Text content of the chat (optional, if only image or video is uploaded)
        },
        image: {
            type: String, // URL to the uploaded image (optional)
        },
        video: {
            type: String, // URL to the uploaded video (optional)
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User", // The user who sent the message
            required: true,
        },
        community: {
            type: Schema.Types.ObjectId,
            ref: "Community", // Reference to the community
            required: true,
        },
    },
    {
        timestamps: true, // Automatically add `createdAt` and `updatedAt` fields
    }
);

// Define the Community Schema
const communitySchema = new Schema(
    {
        name: {
            type: String,
            required: true, // The name of the community
        },
        description: {
            type: String,
            required: true, // Description of the community
        },
        avatar: {
            type: String, // URL to the community avatar image
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User", // User who created the community
            required: true,
        },
        members: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: "User", // Reference to the user who joined the community
                },
                joinedAt: {
                    type: Date,
                    default: Date.now, // Timestamp of when the user joined
                },
            },
        ],
        admins: [
            {
                type: Schema.Types.ObjectId,
                ref: "User", // List of admin users who can moderate the community
            },
        ],
        chats: [
            {
                type: Schema.Types.ObjectId,
                ref: "Chat", // List of chat messages in the community
            },
        ],
    },
    {
        timestamps: true, // Automatically add `createdAt` and `updatedAt` fields
    }
);

// Add pagination to the Community schema
communitySchema.plugin(mongooseAggregatePaginate);

// Define the Community and Chat models
export const Community = mongoose.model("Community", communitySchema);
export const Chat = mongoose.model("Chat", chatSchema);

/*
Core Functions for Community Management

1. createCommunity-
Description: Allows a user to create a new community with a name, description, and optional avatar.
Input: Name, description, avatar (optional)
Output: Community details

2. editCommunity-
Description: Allows the owner or an admin to update the community's name, description, or avatar.
Input: Community ID, new name, new description, new avatar (optional)
Output: Updated community details

3. deleteCommunity-
Description: Allows the owner or an admin to delete the entire community. This should also delete all related chats and media from Cloudinary.
Input: Community ID
Output: Success message

4. addCommunityAvatar-
Description: Allows the owner or an admin to upload or update the avatar for the community.
Input: Community ID, avatar file
Output: URL of the uploaded avatar


Member Management Functions-

5. joinCommunity-
Description: Allows a user to join a community.
Input: Community ID, user ID
Output: Updated list of members

6. leaveCommunity-
Description: Allows a user to leave a community.
Input: Community ID, user ID
Output: Updated list of members

7. removeUserFromCommunity-
Description: Allows the owner or an admin to remove a specific user from the community.
Input: Community ID, user ID
Output: Success message

8. makeAdmin-
Description: Allows the owner to promote a user to an admin role.
Input: Community ID, user ID
Output: Updated list of admins

9. revokeAdmin-
Description: Allows the owner to revoke a user's admin role.
Input: Community ID, user ID
Output: Updated list of admins


Chat Management Functions-

10. sendMessage-
Description: Allows a user to send a chat message. The message can contain text, an image, or a small video.
Input: Community ID, user ID, message content, image (optional), video (optional)
Output: Created chat message details

11. deleteMessage-
Description: Allows the owner or an admin to delete a specific chat message if it's offensive or inappropriate.
Input: Community ID, message ID
Output: Success message

12. getCommunityChats-
Description: Retrieves a paginated list of chat messages in a community.
Input: Community ID, page, limit
Output: List of chat messages

13. editMessage-
Description: Allows a user to edit their own chat message.
Input: Community ID, message ID, new content
Output: Updated chat message


Community Information and Search Functions-

14. getCommunityDetails-
Description: Retrieves details of a specific community, including name, description, avatar, owner, and members.
Input: Community ID
Output: Community details

15. searchCommunities-
Description: Searches for communities based on a query string (e.g., community name or description).
Input: Query string
Output: List of matching communities

16. listUserCommunities-
Description: Retrieves a list of all communities that a user has joined.
Input: User ID
Output: List of communities

17. listAllCommunities-
Description: Retrieves a paginated list of all communities for exploration or browsing.
Input: Page, limit
Output: List of communities


Media Management Functions-

18. uploadImageToChat-
Description: Handles the upload of images in a chat message. Images are saved to Cloudinary.
Input: Community ID, user ID, image file
Output: URL of the uploaded image

19. uploadVideoToChat-
Description: Handles the upload of small videos in a chat message. Videos are saved to Cloudinary.
Input: Community ID, user ID, video file
Output: URL of the uploaded video

20. deleteCommunityMedia-
Description: Deletes all media files related to a community from Cloudinary. This is used when a community is deleted.
Input: Community ID
Output: Success message


Moderation Functions-

21. reportMessage-
Description: Allows a user to report a chat message for inappropriate content.
Input: Community ID, message ID, reason for reporting
Output: Success message

22. reviewReports-
Description: Allows the owner or admins to review reported messages and take appropriate actions (e.g., delete the message, ban the user).
Input: Community ID
Output: List of reported messages

23. banUser-
Description: Allows the owner or an admin to ban a user from the community for violating rules.
Input: Community ID, user ID
Output: Success message

24. unbanUser-
Description: Allows the owner or an admin to unban a previously banned user.
Input: Community ID, user ID
Output: Success message
*/