import { PDFGenerator } from './src/HospitalUtils/PDFGenerator.js';
import { FastPDFGenerator } from './src/HospitalUtils/FastPDFGenerator.js';

const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Test PDF</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 10px; margin-bottom: 20px; }
        .content { line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Patient Medical Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="content">
        <h2>Patient Information</h2>
        <table>
            <tr><th>Name</th><td>John Doe</td></tr>
            <tr><th>Age</th><td>35</td></tr>
            <tr><th>Date of Birth</th><td>1988-05-15</td></tr>
            <tr><th>Contact</th><td>+1-555-0123</td></tr>
        </table>
        
        <h2>Medical Summary</h2>
        <p>This is a comprehensive medical report containing patient information, 
        diagnosis, and treatment recommendations. The report includes detailed 
        analysis of various health parameters and provides actionable insights 
        for healthcare providers.</p>
        
        <h2>Test Results</h2>
        <table>
            <tr><th>Test</th><th>Result</th><th>Normal Range</th></tr>
            <tr><td>Blood Pressure</td><td>120/80</td><td>90-140/60-90</td></tr>
            <tr><td>Heart Rate</td><td>72 bpm</td><td>60-100</td></tr>
            <tr><td>Temperature</td><td>98.6°F</td><td>97-99°F</td></tr>
        </table>
    </div>
</body>
</html>
`;

async function testPerformance() {
    console.log('🚀 Testing PDF Generation Performance...\n');
    
    // Test 1: Original PDFGenerator (with optimizations)
    console.log('📊 Testing Optimized PDFGenerator...');
    const start1 = Date.now();
    try {
        const result1 = await PDFGenerator.generate({
            html: testHTML,
            filename: 'test-optimized.pdf',
            upload: false, // Don't upload for testing
            useCache: false // Disable cache for fair comparison
        });
        const time1 = Date.now() - start1;
        console.log(`✅ Optimized PDFGenerator: ${time1}ms`);
        console.log(`📁 File saved to: ${result1}\n`);
    } catch (error) {
        console.log(`❌ Optimized PDFGenerator failed: ${error.message}\n`);
    }
    
    // Test 2: FastPDFGenerator (html-pdf-node)
    console.log('⚡ Testing FastPDFGenerator...');
    const start2 = Date.now();
    try {
        const result2 = await FastPDFGenerator.generate({
            html: testHTML,
            filename: 'test-fast.pdf',
            upload: false, // Don't upload for testing
            useCache: false // Disable cache for fair comparison
        });
        const time2 = Date.now() - start2;
        console.log(`✅ FastPDFGenerator: ${time2}ms`);
        console.log(`📁 File saved to: ${result2}\n`);
    } catch (error) {
        console.log(`❌ FastPDFGenerator failed: ${error.message}\n`);
    }
    
    // Test 3: Cached performance (second run)
    console.log('🔄 Testing cached performance...');
    const start3 = Date.now();
    try {
        const result3 = await FastPDFGenerator.generate({
            html: testHTML,
            filename: 'test-cached.pdf',
            upload: false,
            useCache: true // Enable cache
        });
        const time3 = Date.now() - start3;
        console.log(`✅ Cached PDF: ${time3}ms`);
        console.log(`📁 File saved to: ${result3}\n`);
    } catch (error) {
        console.log(`❌ Cached test failed: ${error.message}\n`);
    }
    
    console.log('🎯 Performance Summary:');
    console.log('- Optimized PDFGenerator: Uses persistent browser instance');
    console.log('- FastPDFGenerator: Uses lightweight html-pdf-node');
    console.log('- Caching: Redis-based caching for repeated requests');
    console.log('\n💡 Recommendations:');
    console.log('1. Use FastPDFGenerator for best performance');
    console.log('2. Enable Redis caching for repeated PDFs');
    console.log('3. Start Redis with: docker-compose up -d redis');
}

// Cleanup function
async function cleanup() {
    try {
        await PDFGenerator.cleanup();
        await FastPDFGenerator.cleanup();
        console.log('🧹 Cleanup completed');
    } catch (error) {
        console.log('⚠️ Cleanup error:', error.message);
    }
}

// Run the test
testPerformance()
    .then(() => {
        console.log('\n✅ Performance test completed');
        return cleanup();
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
        return cleanup();
    });