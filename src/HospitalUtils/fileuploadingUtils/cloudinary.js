import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "raw", // important for non-image files like PDFs
      folder: "eclinic/records",
    });

    console.log("File uploaded to Cloudinary:", response.secure_url);
    fs.unlinkSync(localFilePath); // delete local temp file
    return response; // contains secure_url, public_id, etc.
  } catch (error) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

export { uploadOnCloudinary };
