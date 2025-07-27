import fs from "fs";
import path from "path";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import Redis from "ioredis";
import { uploadOnCloudinary } from "./cloudinary.js";

// Redis client for template caching
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailedAttempt: 100,
  maxRetriesPerRequest: 3,
});

export class FastPrescriptionPDF {
  /**
   * Ultra-fast prescription PDF generator using PDFKit templates
   * Optimized specifically for medical prescriptions
   * Target: Under 2 seconds including upload
   */
  static async generatePrescription({
    doctorName,
    doctorLicense,
    hospitalName,
    hospitalAddress,
    patientName,
    patientAge,
    patientGender,
    date,
    diagnosis,
    medications = [],
    notes = "",
    filename,
    upload = true,
    folder = "prescriptions"
  }) {
    const startTime = Date.now();
    
    try {
      // Create cache key based on content
      const contentString = JSON.stringify({
        doctorName, patientName, diagnosis, medications, notes
      });
      const contentHash = crypto.createHash('md5').update(contentString).digest('hex');
      const cacheKey = `prescription:${contentHash}`;

      // Check cache first
      if (upload) {
        const cachedUrl = await redis.get(cacheKey);
        if (cachedUrl) {
          console.log(`Prescription PDF served from cache in ${Date.now() - startTime}ms`);
          return cachedUrl;
        }
      }

      // Ensure temp directory exists
      const tempDir = path.resolve("temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const localPath = path.join(tempDir, filename);

      // Generate PDF using optimized template
      await this.createPrescriptionPDF({
        localPath,
        doctorName,
        doctorLicense,
        hospitalName,
        hospitalAddress,
        patientName,
        patientAge,
        patientGender,
        date: date || new Date().toLocaleDateString(),
        diagnosis,
        medications,
        notes
      });

      if (upload) {
        // Upload to Cloudinary
        const cloudRes = await uploadOnCloudinary(localPath, folder);
        
        // Clean up local file
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
        
        if (!cloudRes?.secure_url) {
          throw new Error("Cloudinary upload failed.");
        }

        // Cache the result for 2 hours
        await redis.setex(cacheKey, 7200, cloudRes.secure_url);
        
        console.log(`Prescription PDF generated and uploaded in ${Date.now() - startTime}ms`);
        return cloudRes.secure_url;
      }

      console.log(`Prescription PDF generated locally in ${Date.now() - startTime}ms`);
      return localPath;

    } catch (error) {
      console.error(`Prescription PDF generation failed after ${Date.now() - startTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Create prescription PDF using PDFKit with optimized template
   */
  static async createPrescriptionPDF(data) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 40,
          size: 'A4',
          info: {
            Title: 'Medical Prescription',
            Author: data.doctorName,
            Subject: 'Prescription',
            Keywords: 'prescription, medical, healthcare'
          }
        });

        const stream = fs.createWriteStream(data.localPath);
        doc.pipe(stream);

        // Header section
        this.addHeader(doc, data);
        
        // Patient information
        this.addPatientInfo(doc, data);
        
        // Diagnosis
        this.addDiagnosis(doc, data);
        
        // Medications
        this.addMedications(doc, data);
        
        // Notes
        if (data.notes) {
          this.addNotes(doc, data);
        }
        
        // Footer
        this.addFooter(doc, data);

        doc.end();

        stream.on('finish', () => {
          resolve(data.localPath);
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  static addHeader(doc, data) {
    // Hospital/Clinic Header
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(data.hospitalName || 'Medical Clinic', { align: 'center' });
    
    if (data.hospitalAddress) {
      doc.fontSize(10)
         .font('Helvetica')
         .text(data.hospitalAddress, { align: 'center' });
    }

    doc.moveDown(0.5);
    
    // Doctor information
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(`Dr. ${data.doctorName}`, { align: 'center' });
    
    if (data.doctorLicense) {
      doc.fontSize(10)
         .font('Helvetica')
         .text(`License: ${data.doctorLicense}`, { align: 'center' });
    }

    // Date
    doc.fontSize(10)
       .text(`Date: ${data.date}`, { align: 'right' });

    doc.moveDown(1);
    
    // Prescription title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('PRESCRIPTION', { align: 'center' });
    
    doc.moveDown(1);
  }

  static addPatientInfo(doc, data) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Patient Information:');
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(`Name: ${data.patientName}`);
    
    if (data.patientAge) {
      doc.text(`Age: ${data.patientAge}`);
    }
    
    if (data.patientGender) {
      doc.text(`Gender: ${data.patientGender}`);
    }

    doc.moveDown(0.5);
  }

  static addDiagnosis(doc, data) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Diagnosis:');
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(data.diagnosis, { width: 500 });

    doc.moveDown(0.5);
  }

  static addMedications(doc, data) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Medications:');

    doc.moveDown(0.3);

    data.medications.forEach((med, index) => {
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${med.name || med.medication || med}`, { continued: false });
      
      if (typeof med === 'object') {
        if (med.dosage) {
          doc.font('Helvetica').text(`   Dosage: ${med.dosage}`);
        }
        if (med.frequency) {
          doc.text(`   Frequency: ${med.frequency}`);
        }
        if (med.duration) {
          doc.text(`   Duration: ${med.duration}`);
        }
        if (med.instructions) {
          doc.text(`   Instructions: ${med.instructions}`);
        }
      }
      
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  }

  static addNotes(doc, data) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Additional Notes:');
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(data.notes, { width: 500 });

    doc.moveDown(0.5);
  }

  static addFooter(doc, data) {
    const currentY = doc.y;
    const pageHeight = doc.page.height;
    
    // Move to bottom of page
    doc.y = pageHeight - 100;
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('This prescription is valid for 30 days from the date of issue.', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Doctor signature line
    doc.text('_'.repeat(40), { align: 'right' });
    doc.text('Doctor Signature', { align: 'right' });
  }

  /**
   * Batch generate multiple prescriptions
   */
  static async generateBatch(prescriptions) {
    const results = await Promise.all(
      prescriptions.map(prescription => 
        this.generatePrescription(prescription).catch(error => ({ error, prescription }))
      )
    );
    
    return results;
  }

  /**
   * Clear prescription cache
   */
  static async clearCache() {
    try {
      const keys = await redis.keys('prescription:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clear failed:', error);
      return false;
    }
  }
}

// Export both classes for flexibility
export { FastPrescriptionPDF as default };