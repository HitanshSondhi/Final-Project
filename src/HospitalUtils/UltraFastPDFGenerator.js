import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { uploadOnCloudinary } from "./fileuploadingUtils/cloudinary.js";
import Redis from "ioredis";
import crypto from "crypto";

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export class UltraFastPDFGenerator {
  /**
   * Generate cache key for content
   */
  static generateCacheKey(content, filename) {
    return `ultrapdf:${crypto.createHash('md5').update(content + filename).digest('hex')}`;
  }

  /**
   * Convert simple HTML-like content to PDF using PDFKit
   * This is the fastest method for simple documents
   * @param {Object} options
   * @param {string} options.html - Simple HTML-like content or plain text
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

    const pdfPath = path.join(tempDir, filename);

    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: filename,
          Author: 'Hospital System',
          Subject: 'Patient Report',
          Keywords: 'medical, report, patient',
          CreationDate: new Date()
        }
      });

      // Pipe to file
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Parse simple HTML-like content and convert to PDF
      const content = this.parseSimpleHTML(html);
      
      // Add content to PDF
      this.addContentToPDF(doc, content);

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      let result;
      if (upload) {
        const cloudRes = await uploadOnCloudinary(pdfPath, folder);
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
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
      throw error;
    }
  }

  /**
   * Parse simple HTML-like content
   */
  static parseSimpleHTML(html) {
    // Remove HTML tags and extract text content
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Extract basic structure
    const lines = html.split('\n').map(line => line.trim()).filter(line => line);
    
    const content = {
      title: '',
      sections: [],
      tables: []
    };

    let currentSection = null;
    
    for (const line of lines) {
      // Extract title
      if (line.includes('<h1>') || line.includes('<title>')) {
        content.title = line.replace(/<[^>]*>/g, '').trim();
      }
      // Extract headings
      else if (line.includes('<h2>') || line.includes('<h3>')) {
        if (currentSection) {
          content.sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/<[^>]*>/g, '').trim(),
          content: []
        };
      }
      // Extract paragraphs
      else if (line.includes('<p>') || line.includes('<li>')) {
        if (currentSection) {
          currentSection.content.push(line.replace(/<[^>]*>/g, '').trim());
        }
      }
      // Extract table data
      else if (line.includes('<tr>') || line.includes('<td>')) {
        const cells = line.match(/<td[^>]*>([^<]*)<\/td>/g);
        if (cells) {
          const row = cells.map(cell => cell.replace(/<[^>]*>/g, '').trim());
          if (row.length > 0) {
            if (!content.tables.length) content.tables.push([]);
            content.tables[content.tables.length - 1].push(row);
          }
        }
      }
    }

    if (currentSection) {
      content.sections.push(currentSection);
    }

    return content;
  }

  /**
   * Add content to PDF document
   */
  static addContentToPDF(doc, content) {
    // Set font
    doc.font('Helvetica');

    // Add title
    if (content.title) {
      doc.fontSize(18).font('Helvetica-Bold');
      doc.text(content.title, { align: 'center' });
      doc.moveDown();
    }

    // Add sections
    for (const section of content.sections) {
      // Section title
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(section.title);
      doc.moveDown(0.5);

      // Section content
      doc.fontSize(12).font('Helvetica');
      for (const paragraph of section.content) {
        doc.text(paragraph);
        doc.moveDown(0.5);
      }
      doc.moveDown();
    }

    // Add tables
    for (const table of content.tables) {
      if (table.length > 0) {
        const tableTop = doc.y;
        const colWidth = (doc.page.width - 100) / table[0].length;
        
        // Draw table
        for (let i = 0; i < table.length; i++) {
          const row = table[i];
          let x = 50;
          
          for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            
            // Header row styling
            if (i === 0) {
              doc.font('Helvetica-Bold');
              doc.fillColor('#f0f0f0');
              doc.rect(x, doc.y, colWidth, 20).fill();
              doc.fillColor('black');
            }
            
            // Cell border
            doc.rect(x, doc.y, colWidth, 20).stroke();
            
            // Cell text
            doc.fontSize(10);
            doc.text(cell, x + 5, doc.y + 5, {
              width: colWidth - 10,
              align: 'left'
            });
            
            x += colWidth;
          }
          
          doc.y += 20;
          doc.font('Helvetica');
        }
        
        doc.moveDown();
      }
    }
  }

  /**
   * Generate a simple patient report
   */
  static async generatePatientReport(patientData) {
    const html = `
      <h1>Patient Medical Report</h1>
      <h2>Patient Information</h2>
      <p>Name: ${patientData.name}</p>
      <p>Age: ${patientData.age}</p>
      <p>Patient ID: ${patientData.id}</p>
      <p>Date of Visit: ${patientData.visitDate}</p>
      
      <h2>Diagnosis</h2>
      <p>${patientData.diagnosis}</p>
      
      <h2>Treatment Plan</h2>
      <ul>
        ${patientData.treatments.map(treatment => `<li>${treatment}</li>`).join('')}
      </ul>
      
      <h2>Medications</h2>
      <table>
        <tr><td>Medication</td><td>Dosage</td><td>Duration</td></tr>
        ${patientData.medications.map(med => 
          `<tr><td>${med.name}</td><td>${med.dosage}</td><td>${med.duration}</td></tr>`
        ).join('')}
      </table>
    `;

    return this.generate({
      html,
      filename: `patient-report-${patientData.id}.pdf`,
      upload: true,
      folder: 'patient_reports',
      useCache: true
    });
  }

  /**
   * Clear PDF cache
   */
  static async clearCache() {
    const keys = await redis.keys('ultrapdf:*');
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