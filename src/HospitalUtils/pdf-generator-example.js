import { PDFGenerator } from './PDFGenerator.js';
import { FastPDFGenerator } from './FastPDFGenerator.js';

// Example HTML content
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
            <tr><th>Name:</th><td>John Doe</td></tr>
            <tr><th>Age:</th><td>35</td></tr>
            <tr><th>Patient ID:</th><td>P12345</td></tr>
            <tr><th>Date of Visit:</th><td>${new Date().toLocaleDateString()}</td></tr>
        </table>
    </div>
    
    <div class="report-content">
        <h2>Diagnosis</h2>
        <p>The patient presents with mild symptoms consistent with seasonal allergies.</p>
        
        <h2>Treatment Plan</h2>
        <ul>
            <li>Prescribed antihistamine medication</li>
            <li>Recommended rest and hydration</li>
            <li>Follow-up appointment in 2 weeks</li>
        </ul>
        
        <h2>Medications</h2>
        <table>
            <tr><th>Medication</th><th>Dosage</th><th>Duration</th></tr>
            <tr><td>Loratadine</td><td>10mg daily</td><td>7 days</td></tr>
            <tr><td>Nasal spray</td><td>2 sprays each nostril</td><td>As needed</td></tr>
        </table>
    </div>
</body>
</html>
`;

// Performance test function
async function performanceTest() {
    console.log('🚀 Starting PDF Generation Performance Test...\n');
    
    const filename = `patient-report-${Date.now()}.pdf`;
    
    // Test FastPDFGenerator (wkhtmltopdf)
    console.log('📊 Testing FastPDFGenerator (wkhtmltopdf)...');
    const fastStart = Date.now();
    try {
        const fastResult = await FastPDFGenerator.generate({
            html: sampleHTML,
            filename: `fast-${filename}`,
            upload: false, // Don't upload for performance test
            useCache: false
        });
        const fastTime = Date.now() - fastStart;
        console.log(`✅ FastPDFGenerator completed in ${fastTime}ms`);
        console.log(`📁 File saved to: ${fastResult}\n`);
    } catch (error) {
        console.log(`❌ FastPDFGenerator failed: ${error.message}\n`);
    }
    
    // Test PDFGenerator (Puppeteer)
    console.log('📊 Testing PDFGenerator (Puppeteer)...');
    const puppeteerStart = Date.now();
    try {
        const puppeteerResult = await PDFGenerator.generate({
            html: sampleHTML,
            filename: `puppeteer-${filename}`,
            upload: false, // Don't upload for performance test
            useCache: false
        });
        const puppeteerTime = Date.now() - puppeteerStart;
        console.log(`✅ PDFGenerator completed in ${puppeteerTime}ms`);
        console.log(`📁 File saved to: ${puppeteerResult}\n`);
    } catch (error) {
        console.log(`❌ PDFGenerator failed: ${error.message}\n`);
    }
}

// Example usage function
async function generatePatientReport(patientData) {
    try {
        console.log('📋 Generating patient report...');
        
        // Use FastPDFGenerator for better performance
        const pdfUrl = await FastPDFGenerator.generate({
            html: sampleHTML,
            filename: `patient-report-${patientData.id}.pdf`,
            upload: true,
            folder: 'patient_reports',
            useCache: true
        });
        
        console.log('✅ PDF generated successfully!');
        console.log(`🔗 PDF URL: ${pdfUrl}`);
        
        return pdfUrl;
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        throw error;
    }
}

// Cleanup function
async function cleanup() {
    try {
        await PDFGenerator.cleanup();
        await FastPDFGenerator.cleanup();
        console.log('🧹 Cleanup completed');
    } catch (error) {
        console.error('❌ Cleanup error:', error);
    }
}

// Export functions
export { performanceTest, generatePatientReport, cleanup };

// Run performance test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    performanceTest().then(() => {
        console.log('🏁 Performance test completed');
        cleanup();
    }).catch(console.error);
}