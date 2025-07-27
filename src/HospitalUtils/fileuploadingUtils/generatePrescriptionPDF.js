import fs from "fs";
import path from "path";
import crypto from "crypto";
import puppeteer from "puppeteer";
import PDFDocument from "pdfkit";
import Redis from "ioredis";
import { uploadOnCloudinary } from "./cloudinary.js";

// Redis client for caching
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailedAttempt: 100,
  maxRetriesPerRequest: 3,
});

// Browser pool for Puppeteer optimization
class BrowserPool {
  constructor() {
    this.browsers = [];
    this.maxBrowsers = 3;
    this.currentIndex = 0;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log("Initializing browser pool...");
    for (let i = 0; i < this.maxBrowsers; i++) {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-images',
          '--disable-javascript',
          '--disable-plugins',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
      this.browsers.push(browser);
    }
    this.isInitialized = true;
    console.log(`Browser pool initialized with ${this.maxBrowsers} browsers`);
  }

  async getBrowser() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const browser = this.browsers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.maxBrowsers;
    return browser;
  }

  async cleanup() {
    for (const browser of this.browsers) {
      await browser.close();
    }
    this.browsers = [];
    this.isInitialized = false;
  }
}

const browserPool = new BrowserPool();

// Simple PDF generator using PDFKit for basic content
class SimplePDFGenerator {
  static async generateSimplePDF(content, localPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(localPath);
        
        doc.pipe(stream);
        
        // Add basic styling and content
        doc.fontSize(20).text('Medical Prescription', { align: 'center' });
        doc.moveDown(2);
        
        // Extract basic text content from HTML
        const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        doc.fontSize(12).text(textContent, { align: 'left' });
        
        doc.end();
        
        stream.on('finish', () => {
          resolve(localPath);
        });
        
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export class PDFGenerator {
  /**
   * Generates a PDF from HTML with multiple optimization strategies
   * @param {Object} options
   * @param {string} options.html - The HTML content to convert to PDF
   * @param {string} options.filename - The PDF file name
   * @param {boolean} [options.upload=true] - Whether to upload to Cloudinary
   * @param {string} [options.folder="general_docs"] - Cloudinary folder path
   * @param {boolean} [options.useSimple=false] - Use simple PDF generator for basic content
   * @param {number} [options.cacheExpiry=3600] - Cache expiry in seconds (1 hour default)
   * @returns {Promise<string>} - Cloudinary URL or local file path
   */
  static async generate({ 
    html, 
    filename, 
    upload = true, 
    folder = "general_docs",
    useSimple = false,
    cacheExpiry = 3600 
  }) {
    const startTime = Date.now();
    
    if (!html || !filename) {
      throw new Error("HTML content and filename are required.");
    }

    // Create content hash for caching
    const contentHash = crypto.createHash('md5').update(html + folder).digest('hex');
    const cacheKey = `pdf:${contentHash}`;

    try {
      // Check Redis cache first
      const cachedUrl = await redis.get(cacheKey);
      if (cachedUrl && upload) {
        console.log(`PDF served from cache in ${Date.now() - startTime}ms`);
        return cachedUrl;
      }

      // Ensure temp directory exists
      const tempDir = path.resolve("temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const localPath = path.join(tempDir, filename);
      let pdfPath;

      // Choose generation method based on content complexity and preference
      if (useSimple || this.isSimpleContent(html)) {
        console.log("Using simple PDF generation...");
        pdfPath = await SimplePDFGenerator.generateSimplePDF(html, localPath);
      } else {
        console.log("Using browser-based PDF generation...");
        pdfPath = await this.generateWithBrowser(html, localPath);
      }

      if (upload) {
        // Upload to Cloudinary
        const cloudRes = await uploadOnCloudinary(pdfPath, folder);
        
        // Clean up local file
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
        
        if (!cloudRes?.secure_url) {
          throw new Error("Cloudinary upload failed.");
        }

        // Cache the result
        await redis.setex(cacheKey, cacheExpiry, cloudRes.secure_url);
        
        console.log(`PDF generated and uploaded in ${Date.now() - startTime}ms`);
        return cloudRes.secure_url;
      }

      console.log(`PDF generated locally in ${Date.now() - startTime}ms`);
      return pdfPath;

    } catch (error) {
      console.error(`PDF generation failed after ${Date.now() - startTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Generate PDF using optimized browser pool
   */
  static async generateWithBrowser(html, localPath) {
    const browser = await browserPool.getBrowser();
    let page;

    try {
      page = await browser.newPage();
      
      // Optimize page settings
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: 1024, height: 768 });
      
      // Set content with minimal wait time
      await page.setContent(html, { 
        waitUntil: 'domcontentloaded',
        timeout: 3000 
      });
      
      // Generate PDF with optimized settings
      await page.pdf({ 
        path: localPath, 
        format: "A4", 
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '20mm',
          right: '20mm'
        }
      });

      return localPath;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Determine if content is simple enough for PDFKit
   */
  static isSimpleContent(html) {
    // Check for complex CSS, images, tables, etc.
    const complexElements = ['<img', '<table', '<canvas', '<svg', 'position:', 'float:', 'flex', 'grid'];
    return !complexElements.some(element => html.toLowerCase().includes(element));
  }

  /**
   * Pre-warm the browser pool
   */
  static async initialize() {
    await browserPool.initialize();
  }

  /**
   * Clean up resources
   */
  static async cleanup() {
    await browserPool.cleanup();
    await redis.quit();
  }

  /**
   * Clear cache for specific content or all cached PDFs
   */
  static async clearCache(contentHash = null) {
    try {
      if (contentHash) {
        await redis.del(`pdf:${contentHash}`);
      } else {
        const keys = await redis.keys('pdf:*');
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
      return true;
    } catch (error) {
      console.error('Cache clear failed:', error);
      return false;
    }
  }

  /**
   * Generate PDF with automatic retry and fallback
   */
  static async generateWithFallback(options) {
    try {
      // Try optimized generation first
      return await this.generate(options);
    } catch (error) {
      console.warn('Primary PDF generation failed, trying fallback:', error);
      
      // Fallback to simple generation
      return await this.generate({ ...options, useSimple: true });
    }
  }
}

// Initialize browser pool on module load
PDFGenerator.initialize().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Cleaning up PDF generator resources...');
  await PDFGenerator.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Cleaning up PDF generator resources...');
  await PDFGenerator.cleanup();
  process.exit(0);
});
