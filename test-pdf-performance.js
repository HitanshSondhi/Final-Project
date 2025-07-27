import { PDFGenerator } from './src/HospitalUtils/PDFGenerator.js';
import { FastPDFGenerator } from './src/HospitalUtils/FastPDFGenerator.js';
import { UltraFastPDFGenerator } from './src/HospitalUtils/UltraFastPDFGenerator.js';

// Sample patient data
const patientData = {
  id: 'P12345',
  name: 'John Doe',
  age: 35,
  visitDate: new Date().toLocaleDateString(),
  diagnosis: 'The patient presents with mild symptoms consistent with seasonal allergies.',
  treatments: [
    'Prescribed antihistamine medication',
    'Recommended rest and hydration',
    'Follow-up appointment in 2 weeks'
  ],
  medications: [
    { name: 'Loratadine', dosage: '10mg daily', duration: '7 days' },
    { name: 'Nasal spray', dosage: '2 sprays each nostril', duration: 'As needed' }
  ]
};

// Sample HTML content
const sampleHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Patient Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .patient-info { margin: 20px 0; }
        .report-content { line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Patient Medical Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="patient-info">
        <h2>Patient Information</h2>
        <table>
            <tr><th>Name:</th><td>${patientData.name}</td></tr>
            <tr><th>Age:</th><td>${patientData.age}</td></tr>
            <tr><th>Patient ID:</th><td>${patientData.id}</td></tr>
            <tr><th>Date of Visit:</th><td>${patientData.visitDate}</td></tr>
        </table>
    </div>
    
    <div class="report-content">
        <h2>Diagnosis</h2>
        <p>${patientData.diagnosis}</p>
        
        <h2>Treatment Plan</h2>
        <ul>
            ${patientData.treatments.map(treatment => `<li>${treatment}</li>`).join('')}
        </ul>
        
        <h2>Medications</h2>
        <table>
            <tr><th>Medication</th><th>Dosage</th><th>Duration</th></tr>
            ${patientData.medications.map(med => 
                `<tr><td>${med.name}</td><td>${med.dosage}</td><td>${med.duration}</td></tr>`
            ).join('')}
        </table>
    </div>
</body>
</html>
`;

// Performance test function
async function performanceTest() {
    console.log('🚀 Starting PDF Generation Performance Test...\n');
    
    const timestamp = Date.now();
    const results = [];
    
    // Test 1: UltraFastPDFGenerator (PDFKit)
    console.log('📊 Testing UltraFastPDFGenerator (PDFKit)...');
    const ultraStart = Date.now();
    try {
        const ultraResult = await UltraFastPDFGenerator.generate({
            html: sampleHTML,
            filename: `ultra-${timestamp}.pdf`,
            upload: false,
            useCache: false
        });
        const ultraTime = Date.now() - ultraStart;
        results.push({ name: 'UltraFastPDFGenerator (PDFKit)', time: ultraTime, success: true });
        console.log(`✅ UltraFastPDFGenerator completed in ${ultraTime}ms`);
        console.log(`📁 File saved to: ${ultraResult}\n`);
    } catch (error) {
        results.push({ name: 'UltraFastPDFGenerator (PDFKit)', time: 0, success: false, error: error.message });
        console.log(`❌ UltraFastPDFGenerator failed: ${error.message}\n`);
    }
    
    // Test 2: FastPDFGenerator (wkhtmltopdf)
    console.log('📊 Testing FastPDFGenerator (wkhtmltopdf)...');
    const fastStart = Date.now();
    try {
        const fastResult = await FastPDFGenerator.generate({
            html: sampleHTML,
            filename: `fast-${timestamp}.pdf`,
            upload: false,
            useCache: false
        });
        const fastTime = Date.now() - fastStart;
        results.push({ name: 'FastPDFGenerator (wkhtmltopdf)', time: fastTime, success: true });
        console.log(`✅ FastPDFGenerator completed in ${fastTime}ms`);
        console.log(`📁 File saved to: ${fastResult}\n`);
    } catch (error) {
        results.push({ name: 'FastPDFGenerator (wkhtmltopdf)', time: 0, success: false, error: error.message });
        console.log(`❌ FastPDFGenerator failed: ${error.message}\n`);
    }
    
    // Test 3: PDFGenerator (Optimized Puppeteer)
    console.log('📊 Testing PDFGenerator (Optimized Puppeteer)...');
    const puppeteerStart = Date.now();
    try {
        const puppeteerResult = await PDFGenerator.generate({
            html: sampleHTML,
            filename: `puppeteer-${timestamp}.pdf`,
            upload: false,
            useCache: false
        });
        const puppeteerTime = Date.now() - puppeteerStart;
        results.push({ name: 'PDFGenerator (Optimized Puppeteer)', time: puppeteerTime, success: true });
        console.log(`✅ PDFGenerator completed in ${puppeteerTime}ms`);
        console.log(`📁 File saved to: ${puppeteerResult}\n`);
    } catch (error) {
        results.push({ name: 'PDFGenerator (Optimized Puppeteer)', time: 0, success: false, error: error.message });
        console.log(`❌ PDFGenerator failed: ${error.message}\n`);
    }
    
    // Display results
    console.log('📈 Performance Results:');
    console.log('='.repeat(60));
    
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
        // Sort by time (fastest first)
        successfulResults.sort((a, b) => a.time - b.time);
        
        successfulResults.forEach((result, index) => {
            const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            console.log(`${emoji} ${result.name}: ${result.time}ms`);
        });
        
        const fastest = successfulResults[0];
        const slowest = successfulResults[successfulResults.length - 1];
        const improvement = ((slowest.time - fastest.time) / slowest.time * 100).toFixed(1);
        
        console.log('\n🏆 Summary:');
        console.log(`Fastest: ${fastest.name} (${fastest.time}ms)`);
        console.log(`Slowest: ${slowest.name} (${slowest.time}ms)`);
        console.log(`Improvement: ${improvement}% faster than slowest method`);
        
        if (fastest.time < 5000) {
            console.log('✅ Target achieved: PDF generation under 5 seconds!');
        } else {
            console.log('⚠️  Target not met: PDF generation still over 5 seconds');
        }
    }
    
    // Show failed results
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
        console.log('\n❌ Failed Tests:');
        failedResults.forEach(result => {
            console.log(`- ${result.name}: ${result.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
}

// Test patient report generation
async function testPatientReport() {
    console.log('🏥 Testing Patient Report Generation...\n');
    
    try {
        const startTime = Date.now();
        const pdfUrl = await UltraFastPDFGenerator.generatePatientReport(patientData);
        const totalTime = Date.now() - startTime;
        
        console.log(`✅ Patient report generated in ${totalTime}ms`);
        console.log(`🔗 PDF URL: ${pdfUrl}`);
        
        if (totalTime < 5000) {
            console.log('🎉 Success! Patient report generated under 5 seconds!');
        } else {
            console.log('⚠️  Patient report generation took longer than 5 seconds');
        }
        
    } catch (error) {
        console.error('❌ Error generating patient report:', error);
    }
}

// Cleanup function
async function cleanup() {
    try {
        await PDFGenerator.cleanup();
        await FastPDFGenerator.cleanup();
        await UltraFastPDFGenerator.cleanup();
        console.log('🧹 Cleanup completed');
    } catch (error) {
        console.error('❌ Cleanup error:', error);
    }
}

// Run tests
async function runTests() {
    try {
        await performanceTest();
        console.log('\n');
        await testPatientReport();
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await cleanup();
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export { performanceTest, testPatientReport, cleanup };