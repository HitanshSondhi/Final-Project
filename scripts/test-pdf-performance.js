#!/usr/bin/env node

import { FastPrescriptionPDF } from '../src/HospitalUtils/fileuploadingUtils/fastPrescriptionPDF.js';
import { PDFGenerator } from '../src/HospitalUtils/fileuploadingUtils/generatePrescriptionPDF.js';
import fs from 'fs';
import path from 'path';

console.log('🧪 PDF Generation Performance Test Suite');
console.log('=========================================');

// Test data for prescription generation
const testPrescription = {
  doctorName: 'Dr. Sarah Johnson',
  doctorLicense: 'MD12345',
  hospitalName: 'Central Medical Hospital',
  hospitalAddress: '123 Health Street, Medical City, MC 12345',
  patientName: 'John Doe',
  patientAge: '35',
  patientGender: 'Male',
  diagnosis: 'Acute respiratory infection with secondary bacterial complications',
  medications: [
    {
      name: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Three times daily',
      duration: '7 days',
      instructions: 'Take with food to avoid stomach upset'
    },
    {
      name: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'Every 6 hours as needed',
      duration: '5 days',
      instructions: 'For pain and inflammation relief'
    },
    {
      name: 'Mucinex',
      dosage: '600mg',
      frequency: 'Twice daily',
      duration: '10 days',
      instructions: 'Helps with congestion and mucus'
    }
  ],
  notes: 'Patient should rest and stay hydrated. Return if symptoms worsen or fever persists beyond 3 days. Avoid alcohol while taking antibiotics.',
  filename: `test_prescription_${Date.now()}.pdf`,
  upload: false // Don't upload during testing
};

const testHTML = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .content { margin-top: 30px; }
    .medications { margin-top: 20px; }
    .medication { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Medical Prescription</h1>
    <p>Dr. ${testPrescription.doctorName}</p>
    <p>${testPrescription.hospitalName}</p>
  </div>
  <div class="content">
    <h3>Patient: ${testPrescription.patientName}</h3>
    <p><strong>Diagnosis:</strong> ${testPrescription.diagnosis}</p>
    <div class="medications">
      <h4>Prescribed Medications:</h4>
      ${testPrescription.medications.map((med, i) => `
        <div class="medication">
          <strong>${i + 1}. ${med.name}</strong><br>
          Dosage: ${med.dosage}<br>
          Frequency: ${med.frequency}<br>
          Duration: ${med.duration}<br>
          Instructions: ${med.instructions}
        </div>
      `).join('')}
    </div>
    <p><strong>Notes:</strong> ${testPrescription.notes}</p>
  </div>
</body>
</html>
`;

async function runPerformanceTest() {
  const results = {
    fastPDF: [],
    browserPDF: [],
    cachedPDF: []
  };

  console.log('\n1️⃣ Testing Fast PDF Generation (PDFKit)...');
  console.log('Target: < 2 seconds');
  
  // Test Fast PDF Generation (5 runs)
  for (let i = 0; i < 5; i++) {
    const startTime = Date.now();
    try {
      const testData = {
        ...testPrescription,
        filename: `fast_test_${i}_${Date.now()}.pdf`
      };
      
      const result = await FastPrescriptionPDF.generatePrescription(testData);
      const duration = Date.now() - startTime;
      results.fastPDF.push(duration);
      
      console.log(`   Run ${i + 1}: ${duration}ms`);
      
      // Clean up test file
      if (result && fs.existsSync(result)) {
        fs.unlinkSync(result);
      }
    } catch (error) {
      console.log(`   Run ${i + 1}: FAILED - ${error.message}`);
      results.fastPDF.push(null);
    }
  }

  console.log('\n2️⃣ Testing Browser-based PDF Generation (Puppeteer)...');
  console.log('Target: < 5 seconds');
  
  // Test Browser PDF Generation (3 runs - slower so fewer tests)
  for (let i = 0; i < 3; i++) {
    const startTime = Date.now();
    try {
      const filename = `browser_test_${i}_${Date.now()}.pdf`;
      
      const result = await PDFGenerator.generate({
        html: testHTML,
        filename,
        upload: false
      });
      
      const duration = Date.now() - startTime;
      results.browserPDF.push(duration);
      
      console.log(`   Run ${i + 1}: ${duration}ms`);
      
      // Clean up test file
      const tempPath = path.join(process.cwd(), 'temp', filename);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (error) {
      console.log(`   Run ${i + 1}: FAILED - ${error.message}`);
      results.browserPDF.push(null);
    }
  }

  console.log('\n3️⃣ Testing Cached PDF Performance...');
  console.log('Target: < 100ms');
  
  // Test cached performance by generating same PDF twice
  try {
    const testData = {
      ...testPrescription,
      filename: `cached_test_${Date.now()}.pdf`,
      upload: false // Generate without upload first to test caching
    };
    
    // First generation (should be cached)
    const firstStart = Date.now();
    await FastPrescriptionPDF.generatePrescription(testData);
    const firstDuration = Date.now() - firstStart;
    
    // Second generation (should be from cache if caching works)
    const secondStart = Date.now();
    await FastPrescriptionPDF.generatePrescription(testData);
    const secondDuration = Date.now() - secondStart;
    
    results.cachedPDF = [firstDuration, secondDuration];
    console.log(`   First generation: ${firstDuration}ms`);
    console.log(`   Second generation: ${secondDuration}ms`);
    
    if (secondDuration < firstDuration * 0.5) {
      console.log('   ✅ Caching appears to be working!');
    } else {
      console.log('   ⚠️  Caching may not be working as expected');
    }
    
  } catch (error) {
    console.log(`   FAILED - ${error.message}`);
  }

  return results;
}

function analyzeResults(results) {
  console.log('\n📊 Performance Analysis');
  console.log('======================');
  
  // Fast PDF Analysis
  const validFastTimes = results.fastPDF.filter(t => t !== null);
  if (validFastTimes.length > 0) {
    const avgFast = Math.round(validFastTimes.reduce((a, b) => a + b, 0) / validFastTimes.length);
    const minFast = Math.min(...validFastTimes);
    const maxFast = Math.max(...validFastTimes);
    
    console.log(`\n🚀 Fast PDF Generation (PDFKit):`);
    console.log(`   Average: ${avgFast}ms`);
    console.log(`   Fastest: ${minFast}ms`);
    console.log(`   Slowest: ${maxFast}ms`);
    console.log(`   Success rate: ${validFastTimes.length}/5`);
    console.log(`   Target met (<2000ms): ${avgFast < 2000 ? '✅ YES' : '❌ NO'}`);
  }
  
  // Browser PDF Analysis
  const validBrowserTimes = results.browserPDF.filter(t => t !== null);
  if (validBrowserTimes.length > 0) {
    const avgBrowser = Math.round(validBrowserTimes.reduce((a, b) => a + b, 0) / validBrowserTimes.length);
    const minBrowser = Math.min(...validBrowserTimes);
    const maxBrowser = Math.max(...validBrowserTimes);
    
    console.log(`\n🌐 Browser PDF Generation (Puppeteer):`);
    console.log(`   Average: ${avgBrowser}ms`);
    console.log(`   Fastest: ${minBrowser}ms`);
    console.log(`   Slowest: ${maxBrowser}ms`);
    console.log(`   Success rate: ${validBrowserTimes.length}/3`);
    console.log(`   Target met (<5000ms): ${avgBrowser < 5000 ? '✅ YES' : '❌ NO'}`);
  }
  
  // Performance Improvement
  if (validFastTimes.length > 0 && validBrowserTimes.length > 0) {
    const fastAvg = validFastTimes.reduce((a, b) => a + b, 0) / validFastTimes.length;
    const browserAvg = validBrowserTimes.reduce((a, b) => a + b, 0) / validBrowserTimes.length;
    const improvement = Math.round(((browserAvg - fastAvg) / browserAvg) * 100);
    
    console.log(`\n⚡ Performance Improvement:`);
    console.log(`   Fast PDF is ${improvement}% faster than Browser PDF`);
    console.log(`   Speed increase: ${Math.round(browserAvg / fastAvg)}x faster`);
  }
  
  // Cache Analysis
  if (results.cachedPDF.length === 2) {
    console.log(`\n💾 Cache Performance:`);
    console.log(`   Cache effectiveness: ${results.cachedPDF[1] < results.cachedPDF[0] ? '✅ Working' : '⚠️ Not detected'}`);
  }
  
  console.log('\n🎯 Recommendations:');
  if (validFastTimes.length > 0) {
    const avgFast = validFastTimes.reduce((a, b) => a + b, 0) / validFastTimes.length;
    if (avgFast < 2000) {
      console.log('   ✅ Fast PDF generation meets performance targets');
      console.log('   💡 Use FastPrescriptionPDF for standard prescriptions');
    } else {
      console.log('   ⚠️  Fast PDF generation needs optimization');
    }
  }
  
  if (validBrowserTimes.length > 0) {
    const avgBrowser = validBrowserTimes.reduce((a, b) => a + b, 0) / validBrowserTimes.length;
    if (avgBrowser < 5000) {
      console.log('   ✅ Browser PDF generation is acceptable for complex layouts');
    } else {
      console.log('   ⚠️  Browser PDF generation may be too slow for production');
    }
  }
}

async function main() {
  try {
    console.log('Starting performance tests...\n');
    
    // Ensure temp directory exists
    const tempDir = path.resolve('temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const results = await runPerformanceTest();
    analyzeResults(results);
    
    console.log('\n✅ Performance testing completed!');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}