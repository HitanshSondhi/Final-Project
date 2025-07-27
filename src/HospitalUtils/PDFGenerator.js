import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import { uploadOnCloudinary } from "./fileuploadingUtils/cloudinary.js";
import Redis from "ioredis";
import crypto from "crypto";

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Global browser instance to reuse
let browserInstance = null;

export class PDFGenerator {
  /**
   * Initialize the browser instance once
   */
  static async initializeBrowser() {
    if (!browserInstance) {
      browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--safebrowsing-disable-auto-update',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome-stable'
      });
    }
    return browserInstance;
  }

  /**
   * Generate cache key for HTML content
   */
  static generateCacheKey(html, filename) {
    return `pdf:${crypto.createHash('md5').update(html + filename).digest('hex')}`;
  }

  /**
   * Generates a PDF from HTML with caching and optimized performance.
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

    // Ensure temp directory exists
    const tempDir = path.resolve("temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const localPath = path.join(tempDir, filename);

    try {
      // Get or create browser instance
      const browser = await this.initializeBrowser();
      
      // Create new page with optimized settings
      const page = await browser.newPage();
      
      // Set optimized viewport and user agent
      await page.setViewport({ width: 1200, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
      
      // Disable unnecessary features for faster rendering
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Set content with minimal wait
      await page.setContent(html, { 
        waitUntil: 'domcontentloaded', // Faster than networkidle0
        timeout: 5000 
      });

      // Generate PDF with optimized settings
      await page.pdf({
        path: localPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });

      // Close page but keep browser instance
      await page.close();

      let result;
      if (upload) {
        const cloudRes = await uploadOnCloudinary(localPath, folder);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        if (!cloudRes?.secure_url) throw new Error("Cloudinary upload failed.");
        result = cloudRes.secure_url;
      } else {
        result = localPath;
      }

      // Cache the result
      if (useCache) {
        const cacheKey = this.generateCacheKey(html, filename);
        await redis.setex(cacheKey, 3600, result); // Cache for 1 hour
      }

      return result;

    } catch (error) {
      // Clean up on error
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      throw error;
    }
  }

  /**
   * Clean up browser instance (call this when shutting down the app)
   */
  static async cleanup() {
    if (browserInstance) {
      await browserInstance.close();
      browserInstance = null;
    }
    await redis.quit();
  }

  /**
   * Clear PDF cache
   */
  static async clearCache() {
    const keys = await redis.keys('pdf:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}