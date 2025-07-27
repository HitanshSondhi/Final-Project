import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { uploadOnCloudinary } from "./fileuploadingUtils/cloudinary.js";
import Redis from "ioredis";
import crypto from "crypto";

const execAsync = promisify(exec);

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export class FastPDFGenerator {
  /**
   * Generate cache key for HTML content
   */
  static generateCacheKey(html, filename) {
    return `fastpdf:${crypto.createHash('md5').update(html + filename).digest('hex')}`;
  }

  /**
   * Check if wkhtmltopdf is installed
   */
  static async checkWkhtmltopdf() {
    try {
      await execAsync('wkhtmltopdf --version');
      return true;
    } catch (error) {
      console.warn('wkhtmltopdf not found. Please install it: sudo apt-get install wkhtmltopdf');
      return false;
    }
  }

  /**
   * Ultra-fast PDF generation using wkhtmltopdf
   * @param {Object} options
   * @param {string} options.html - The HTML content to convert to PDF
   * @param {string} options.filename - The PDF file name
   * @param {boolean} [options.upload=true] - Whether to upload to Cloudinary
   * @param {string} [options.folder="general_docs"] - Cloudinary folder path
   * @param {boolean} [options.useCache=true] - Whether to use Redis caching
   * @returns {Promise<string>} - Cloudinary URL or local file path
   */
  static async generate({ 
    html, 
    filename, 
    upload = true, 
    folder = "general_docs",
    useCache = true 
  }) {
    if (!html || !filename) {
      throw new Error("HTML content and filename are required.");
    }

    // Check cache first
    if (useCache) {
      const cacheKey = this.generateCacheKey(html, filename);
      const cachedUrl = await redis.get(cacheKey);
      if (cachedUrl) {
        console.log("PDF served from cache");
        return cachedUrl;
      }
    }

    // Check if wkhtmltopdf is available
    const wkhtmltopdfAvailable = await this.checkWkhtmltopdf();
    if (!wkhtmltopdfAvailable) {
      throw new Error("wkhtmltopdf is not installed. Please install it first.");
    }

    // Ensure temp directory exists
    const tempDir = path.resolve("temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const htmlPath = path.join(tempDir, `${filename}.html`);
    const pdfPath = path.join(tempDir, filename);

    try {
      // Write HTML to temporary file
      fs.writeFileSync(htmlPath, html);

      // Generate PDF using wkhtmltopdf with optimized settings
      const wkhtmltopdfArgs = [
        '--page-size A4',
        '--margin-top 0.5in',
        '--margin-right 0.5in',
        '--margin-bottom 0.5in',
        '--margin-left 0.5in',
        '--print-media-type',
        '--no-outline',
        '--quiet'
      ].join(' ');

      const command = `wkhtmltopdf ${wkhtmltopdfArgs} "${htmlPath}" "${pdfPath}"`;
      
      const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
      
      if (stderr && !stderr.includes('Warning')) {
        console.warn('wkhtmltopdf warnings:', stderr);
      }

      // Verify PDF was created
      if (!fs.existsSync(pdfPath)) {
        throw new Error("PDF generation failed");
      }

      let result;
      if (upload) {
        const cloudRes = await uploadOnCloudinary(pdfPath, folder);
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
        if (!cloudRes?.secure_url) throw new Error("Cloudinary upload failed.");
        result = cloudRes.secure_url;
      } else {
        result = pdfPath;
      }

      // Cache the result
      if (useCache) {
        const cacheKey = this.generateCacheKey(html, filename);
        await redis.setex(cacheKey, 3600, result); // Cache for 1 hour
      }

      return result;

    } catch (error) {
      // Clean up on error
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
      throw error;
    }
  }

  /**
   * Clear PDF cache
   */
  static async clearCache() {
    const keys = await redis.keys('fastpdf:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  /**
   * Clean up Redis connection
   */
  static async cleanup() {
    await redis.quit();
  }
}