import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary under a specific folder and remove the local file afterwards.
 * @param {String} localFilePath - The path to the local file.
 * @param {String} folder - The name of the folder for specific uploads.
 * @returns {Object|null} - The response from Cloudinary or null if an error occurs.
 */
const uploadOnCloudinary = async (localFilePath, folder) => {
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            folder, // Specify the folder for uploads
            resource_type: "auto", // Automatically determine the file type
        });

        console.log("File uploaded successfully on Cloudinary:", response.url);

        // Remove the locally saved temporary file
        try {
            fs.unlinkSync(localFilePath);
        } catch (unlinkError) {
            console.error(
                "Error removing temporary file:",
                unlinkError.message
            );
        }

        return response;
    } catch (error) {
        // Cleanup and log the error
        try {
            fs.unlinkSync(localFilePath);
        } catch (unlinkError) {
            console.error(
                "Error removing temporary file during error handling:",
                unlinkError.message
            );
        }

        console.error("Error uploading to Cloudinary:", error.message);
        return null;
    }
};

/**
 * Delete a specific file from Cloudinary using its public ID.
 * @param {String} publicId - The public ID of the file to delete.
 * @returns {Boolean} - True if the deletion was successful, false otherwise.
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return false;

        // Delete the file from Cloudinary using its public ID
        const response = await cloudinary.uploader.destroy(publicId);

        if (response.result === "ok") {
            console.log("File deleted successfully from Cloudinary");
            return true;
        } else {
            console.error(
                "Failed to delete file from Cloudinary:",
                response.result
            );
            return false;
        }
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error.message);
        return false;
    }
};

/**
 * Delete all resources in a folder and then delete the folder from Cloudinary.
 * @param {String} folderPath - The path of the folder to delete (e.g., "users/username").
 * @returns {Boolean} - True if the deletion was successful, false otherwise.
 */
const deleteFolderFromCloudinary = async (folderPath) => {
    try {
        if (!folderPath) return false;

        // Delete all resources in the specified folder
        await cloudinary.api.delete_resources_by_prefix(folderPath);

        // Delete the folder itself from Cloudinary
        await cloudinary.api.delete_folder(folderPath);

        console.log(`Successfully deleted Cloudinary folder: ${folderPath}`);
        return true;
    } catch (error) {
        console.error("Error deleting Cloudinary folder:", error.message);
        return false;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary, deleteFolderFromCloudinary };

// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";

// // Configuration
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Upload a file on Cloudinary and remove the local file afterwards
// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if (!localFilePath) return null;

//         // upload the file on cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto",
//         });

//         // file has been uploaded successfully
//         console.log("File uploaded successfully on cloudinary ", response.url);
//         fs.unlinkSync(localFilePath); // remove the locally saved temporary file

//         return response;
//     } catch (error) {
//         fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload operation got failed
//         return null;
//     }
// };

// // Delete a file from Cloudinary
// const deleteFromCloudinary = async (publicId) => {
//     try {
//         if (!publicId) return null;

//         // Delete the file from Cloudinary using its public ID
//         const response = await cloudinary.uploader.destroy(publicId);

//         // Check if the deletion was successful
//         if (response.result === "ok") {
//             console.log("File deleted successfully from Cloudinary");
//             return true;
//         } else {
//             console.error(
//                 "Failed to delete file from Cloudinary:",
//                 response.result
//             );
//             return false;
//         }
//     } catch (error) {
//         console.error("Error deleting from Cloudinary:", error.message);
//         return false;
//     }
// };

// export { uploadOnCloudinary, deleteFromCloudinary };
