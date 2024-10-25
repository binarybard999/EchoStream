import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload a file on Cloudinary and remove the local file afterwards
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // file has been uploaded successfully
        console.log("File uploaded successfully on cloudinary ", response.url);
        fs.unlinkSync(localFilePath); // remove the locally saved temporary file

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
};

// Delete a file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;

        // Delete the file from Cloudinary using its public ID
        const response = await cloudinary.uploader.destroy(publicId);

        // Check if the deletion was successful
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

export { uploadOnCloudinary, deleteFromCloudinary };
