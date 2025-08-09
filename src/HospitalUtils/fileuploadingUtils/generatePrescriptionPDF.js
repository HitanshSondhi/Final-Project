import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { uploadOnCloudinary } from "../fileuploadingUtils/cloudinary.js";

export class PDFGenerator {
  
  static #browserPromise = null;

  
  static async #getBrowser() {
    if (!PDFGenerator.#browserPromise) {
      PDFGenerator.#browserPromise = puppeteer.launch({
        
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
        headless: true,
      });
    }
    return PDFGenerator.#browserPromise;
  }

  
  static async closeBrowser() {
    if (PDFGenerator.#browserPromise) {
      const browser = await PDFGenerator.#browserPromise;
      await browser.close();
      PDFGenerator.#browserPromise = null;
    }
  }

  
  static async generate({ html, filename, upload = true, folder = "general_docs" }) {
    if (!html || !filename) {
      throw new Error("HTML content and filename are required.");
    }

   
    const tempDir = path.resolve("temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const localPath = path.join(tempDir, filename);

    const browser = await PDFGenerator.#getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({ path: localPath, format: "A4", printBackground: true });
    await page.close(); // keep browser alive for reuse

    if (upload) {
      const cloudRes = await uploadOnCloudinary(localPath, folder);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      if (!cloudRes?.secure_url) throw new Error("Cloudinary upload failed.");
      return cloudRes.secure_url;
    }

    return localPath;
  }
}