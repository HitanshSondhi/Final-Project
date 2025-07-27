import fs from "fs";
import path from "path";
import htmlPdf from "html-pdf-node";
import { uploadOnCloudinary } from "./fileuploadingUtils/cloudinary.js";
import Redis from "ioredis";

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export class FastPDFGenerator {
  /**
   * Generate a cache key for the HTML content
   */
  static generateCacheKey(html, filename) {
    const hash = require('crypto').createHash('md5').update(html).digest('hex');
    return `pdf:${hash}:${filename}`;
  }

  /**
   * Check if PDF exists in cache
   */
  static async getCachedPDF(cacheKey) {
    try {
      const cachedUrl = await redis.get(cacheKey);
      return cachedUrl;
    } catch (error) {
      console.warn('Redis cache error:', error);
      return null;
    }
  }

  /**
   * Cache the PDF URL
   */
  static async cachePDF(cacheKey, url) {
    try {
      await redis.setex(cacheKey, 3600, url); // Cache for 1 hour
    } catch (error) {
      console.warn('Redis cache error:', error);
    }
  }

  /**
   * Generates a PDF from HTML using html-pdf-node (much faster than Puppeteer).
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

    const startTime = Date.now();

    // Check cache first if enabled
    if (useCache) {
      const cacheKey = this.generateCacheKey(html, filename);
      const cachedUrl = await this.getCachedPDF(cacheKey);
      if (cachedUrl) {
        console.log(`PDF served from cache in ${Date.now() - startTime}ms`);
        return cachedUrl;
      }
    }

    // Ensure temp directory exists
    const tempDir = path.resolve("temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const localPath = path.join(tempDir, filename);

    try {
      // Configure PDF options for speed
      const options = {
        format: 'A4',
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-images',
          '--disable-javascript',
          '--disable-plugins',
          '--disable-extensions'
        ]
      };

      // Generate PDF using html-pdf-node
      const file = { content: html };
      const buffer = await htmlPdf.generatePdf(file, options);
      
      // Write buffer to file
      fs.writeFileSync(localPath, buffer);

      let result;
      if (upload) {
        const cloudRes = await uploadOnCloudinary(localPath, folder);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        if (!cloudRes?.secure_url) throw new Error("Cloudinary upload failed.");
        result = cloudRes.secure_url;
        
        // Cache the result if enabled
        if (useCache) {
          const cacheKey = this.generateCacheKey(html, filename);
          await this.cachePDF(cacheKey, result);
        }
      } else {
        result = localPath;
      }

      console.log(`PDF generated in ${Date.now() - startTime}ms`);
      return result;

    } catch (error) {
      // Clean up on error
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      throw error;
    }
  }

  /**
   * Clear PDF cache
   */
  static async clearCache() {
    try {
      const keys = await redis.keys('pdf:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  /**
   * Clean up Redis connection
   */
  static async cleanup() {
    await redis.quit();
  }
}