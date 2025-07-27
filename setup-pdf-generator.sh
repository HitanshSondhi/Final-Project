#!/bin/bash

echo "Setting up Fast PDF Generator..."

# Update package list
sudo apt-get update

# Install wkhtmltopdf
echo "Installing wkhtmltopdf..."
sudo apt-get install -y wkhtmltopdf

# Install additional dependencies for better PDF rendering
sudo apt-get install -y xvfb

# Create temp directory
mkdir -p temp

# Set permissions
chmod 755 temp

echo "Setup complete!"
echo ""
echo "To use the Fast PDF Generator:"
echo "1. Import FastPDFGenerator from './src/HospitalUtils/FastPDFGenerator.js'"
echo "2. Call FastPDFGenerator.generate() with your HTML content"
echo "3. Make sure Redis is running: redis-server"
echo ""
echo "Example usage:"
echo "import { FastPDFGenerator } from './src/HospitalUtils/FastPDFGenerator.js';"
echo ""
echo "const pdfUrl = await FastPDFGenerator.generate({"
echo "  html: '<html><body><h1>Hello World</h1></body></html>',"
echo "  filename: 'test.pdf',"
echo "  upload: true,"
echo "  folder: 'general_docs'"
echo "});"