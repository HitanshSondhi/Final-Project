import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { uploadOnCloudinary } from "../fileuploadingUtils/cloudinary.js";

export class PDFGenerator {
  /**
   * Generates a PDF from HTML and optionally uploads it to Cloudinary.
   * @param {Object} options
   * @param {string} options.html - The HTML content to convert to PDF
   * @param {string} options.filename - The PDF file name
   * @param {boolean} [options.upload=true] - Whether to upload to Cloudinary
   * @param {string} [options.folder="general_docs"] - Cloudinary folder path
   * @returns {Promise<string>} - Cloudinary URL or local file path
   */
  static async generate({ html, filename, upload = true, folder = "general_docs" }) {
    if (!html || !filename) {
      throw new Error("HTML content and filename are required.");
    }

    // Ensure temp directory exists
    const tempDir = path.resolve("temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const localPath = path.join(tempDir, filename);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({ path: localPath, format: "A4", printBackground: true });
    await browser.close();

    if (upload) {
      const cloudRes = await uploadOnCloudinary(localPath, folder);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      if (!cloudRes?.secure_url) throw new Error("Cloudinary upload failed.");
      return cloudRes.secure_url;
    }

    return localPath;
  }
}
