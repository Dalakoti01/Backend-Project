import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration
cloudinary.config({
    cloud_name: "dsxdsth6o",
    api_key: "421227918351459",
    api_secret: "YN-OOgvIoRgo7Iq0yudk0QtzaZ4",
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        console.log(`Uploading file from path: ${localFilePath}`);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("File uploaded to Cloudinary:", response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);

        // Remove the local file if Cloudinary upload failed
        try {
            fs.unlinkSync(localFilePath);
            console.log(`Deleted local file: ${localFilePath}`);
        } catch (unlinkError) {
            console.error("Error deleting local file:", unlinkError);
        }

        return null;
    }
};

export { uploadOnCloudinary };
