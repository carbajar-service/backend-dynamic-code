const cloudinary = require("cloudinary").v2;
const config = require("../config/index")

cloudinary.config({
    cloud_name: config.CLOUD_NAME,
    api_key: config.IMAGE_API_KEY,
    api_secret: config.IMAGE_API_SECRET,
});

const uploadOnCloudinary = async (base64String, folderName) => {
    try {
        if (!base64String) return null;

        // Check if the base64 string has the prefix, if not, add it
        const prefixedBase64String = base64String.startsWith("data:")
            ? base64String
            : `data:image/jpeg;base64,${base64String}`;

        // Upload the base64 string to Cloudinary
        const response = await cloudinary.uploader.upload(prefixedBase64String, {
            resource_type: "image",
            folder: folderName,
        });

        return response;
    } catch (error) {
        // Handle the error (e.g., log or throw)
        console.error("Error uploading image to Cloudinary:", error);
        return null;
    }
};

const uploadArrayImage = async (images, folderName) => {
    try {
        if (!images || !Array.isArray(images)) return null;

        const uploadPromises = images.map(async (imageObj) => {
            const base64String = imageObj.image;

            if (typeof base64String !== 'string') {
                console.error(`Invalid base64String for imageObj:`, imageObj);
                return {
                    ...imageObj,
                    error: 'Invalid base64String'
                };
            }

            // Check if the base64 string has the prefix, if not, add it
            const prefixedBase64String = base64String.startsWith("data:")
                ? base64String
                : `data:image/jpeg;base64,${base64String}`;

            // Upload the base64 string to Cloudinary
            try {
                const response = await cloudinary.uploader.upload(prefixedBase64String, {
                    resource_type: "image",
                    folder: folderName,
                });
                return {
                    ...imageObj,
                    cloudinaryResponse: response
                };
            } catch (error) {
                console.error("Error uploading image to Cloudinary:", error);
                return {
                    ...imageObj,
                    error: error.message
                };
            }
        });

        // Wait for all uploads to complete
        const uploadResults = await Promise.all(uploadPromises);

        return uploadResults;
    } catch (error) {
        // Handle the error (e.g., log or throw)
        console.error("Error in uploadOnCloudinary:", error);
        return null;
    }
};

module.exports = { uploadOnCloudinary, uploadArrayImage };


