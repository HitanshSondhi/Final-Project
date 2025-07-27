#!/bin/bash

echo "🚀 Setting up Fast PDF Generator..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Redis caching will not work without Docker."
    echo "   You can still use the PDF generators without caching."
else
    echo "✅ Docker is installed"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create temp directory
echo "📁 Creating temp directory..."
mkdir -p temp

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# PDF Generator Configuration
REDIS_URL=redis://localhost:6379
CHROME_BIN=/usr/bin/google-chrome-stable

# Cloudinary Configuration (if not already set)
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Start Redis if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Starting Redis with Docker..."
    docker-compose up -d redis
    
    # Wait a moment for Redis to start
    sleep 3
    
    # Test Redis connection
    if docker exec pdf-cache-redis redis-cli ping &> /dev/null; then
        echo "✅ Redis is running and accessible"
    else
        echo "⚠️  Redis might not be ready yet. You can test it later with:"
        echo "   docker exec pdf-cache-redis redis-cli ping"
    fi
else
    echo "⚠️  Docker not available. Redis caching will be disabled."
    echo "   To enable caching, install Docker and run:"
    echo "   docker-compose up -d redis"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test the PDF generator: node test-pdf-performance.js"
echo "2. Run the example: node example-usage.js"
echo "3. Check the README: cat PDF_GENERATOR_README.md"
echo ""
echo "💡 Tips:"
echo "- Use FastPDFGenerator for best performance"
echo "- Enable Redis caching for repeated PDFs"
echo "- Monitor generation times in production"
echo ""
echo "🔧 Troubleshooting:"
echo "- If Redis fails, check: docker-compose logs redis"
echo "- If Chrome fails, install: sudo apt-get install google-chrome-stable"
echo "- For memory issues, use FastPDFGenerator instead of PDFGenerator"