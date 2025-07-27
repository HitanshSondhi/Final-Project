#!/bin/bash

echo "🚀 Setting up Redis for PDF optimization..."

# Check if Redis is already running
if pgrep redis-server > /dev/null; then
    echo "✅ Redis is already running"
    redis-cli ping
    exit 0
fi

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "📦 Installing Redis..."
    
    # Detect OS and install Redis
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            # Ubuntu/Debian
            sudo apt-get update
            sudo apt-get install -y redis-server
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            sudo yum install -y redis
        elif command -v dnf &> /dev/null; then
            # Fedora
            sudo dnf install -y redis
        else
            echo "❌ Unable to install Redis automatically. Please install Redis manually."
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install redis
        else
            echo "❌ Homebrew not found. Please install Redis manually."
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Please install Redis manually."
        exit 1
    fi
fi

# Start Redis
echo "🔄 Starting Redis server..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - use systemd if available
    if command -v systemctl &> /dev/null; then
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
    else
        redis-server --daemonize yes
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew services start redis
else
    # Generic start
    redis-server --daemonize yes
fi

# Wait a moment for Redis to start
sleep 2

# Test Redis connection
echo "🧪 Testing Redis connection..."
if redis-cli ping | grep -q PONG; then
    echo "✅ Redis is running and responding"
    echo "📊 Redis info:"
    redis-cli info server | grep redis_version
    echo ""
    echo "🎯 Redis is ready for PDF optimization!"
else
    echo "❌ Redis is not responding. Please check the installation."
    exit 1
fi