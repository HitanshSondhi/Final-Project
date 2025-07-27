import Redis from 'ioredis';
import { PDFGenerator } from './generatePrescriptionPDF.js';

class PDFOptimizationSetup {
  constructor() {
    this.redis = null;
    this.isSetupComplete = false;
    this.setupStartTime = null;
  }

  /**
   * Initialize all PDF optimization components
   */
  async initialize() {
    if (this.isSetupComplete) {
      console.log('PDF optimization already initialized');
      return;
    }

    this.setupStartTime = Date.now();
    console.log('🚀 Initializing PDF optimization system...');

    try {
      // Initialize Redis connection
      await this.setupRedis();
      
      // Pre-warm browser pool
      await this.setupBrowserPool();
      
      // Setup health monitoring
      this.setupHealthMonitoring();
      
      this.isSetupComplete = true;
      const setupTime = Date.now() - this.setupStartTime;
      console.log(`✅ PDF optimization system initialized in ${setupTime}ms`);
      console.log('📊 Performance targets:');
      console.log('   - Cached PDFs: < 100ms');
      console.log('   - Fast PDF generation: < 2 seconds');
      console.log('   - Browser-based fallback: < 5 seconds');

    } catch (error) {
      console.error('❌ PDF optimization setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup Redis connection with error handling
   */
  async setupRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        retryDelayOnFailedAttempt: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      // Test connection
      await this.redis.ping();
      console.log('✅ Redis connection established');

      // Setup Redis event handlers
      this.redis.on('error', (error) => {
        console.error('Redis error:', error);
      });

      this.redis.on('connect', () => {
        console.log('Redis connected');
      });

      this.redis.on('reconnecting', () => {
        console.log('Redis reconnecting...');
      });

    } catch (error) {
      console.warn('⚠️  Redis setup failed, caching will be disabled:', error.message);
      this.redis = null;
    }
  }

  /**
   * Pre-warm the browser pool for faster first PDF generation
   */
  async setupBrowserPool() {
    try {
      console.log('🌡️  Pre-warming browser pool...');
      await PDFGenerator.initialize();
      console.log('✅ Browser pool pre-warmed and ready');
    } catch (error) {
      console.warn('⚠️  Browser pool setup failed:', error.message);
    }
  }

  /**
   * Setup health monitoring and performance tracking
   */
  setupHealthMonitoring() {
    // Track PDF generation metrics
    this.metrics = {
      totalGenerations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageGenerationTime: 0,
      fastGenerations: 0,
      fallbackGenerations: 0
    };

    // Performance monitoring interval
    setInterval(async () => {
      await this.logPerformanceMetrics();
    }, 300000); // Every 5 minutes

    console.log('✅ Health monitoring initialized');
  }

  /**
   * Log performance metrics
   */
  async logPerformanceMetrics() {
    try {
      if (this.redis) {
        const cacheKeys = await this.redis.keys('pdf:*');
        const prescriptionKeys = await this.redis.keys('prescription:*');
        
        console.log('📊 PDF System Performance Metrics:');
        console.log(`   Cache entries: ${cacheKeys.length + prescriptionKeys.length}`);
        console.log(`   Total generations: ${this.metrics.totalGenerations}`);
        console.log(`   Cache hit rate: ${this.getCacheHitRate()}%`);
        console.log(`   Average generation time: ${this.metrics.averageGenerationTime}ms`);
        console.log(`   Fast generations: ${this.metrics.fastGenerations}`);
        console.log(`   Fallback generations: ${this.metrics.fallbackGenerations}`);
      }
    } catch (error) {
      console.error('Error logging metrics:', error);
    }
  }

  /**
   * Calculate cache hit rate
   */
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? Math.round((this.metrics.cacheHits / total) * 100) : 0;
  }

  /**
   * Record PDF generation metrics
   */
  recordGeneration(type, duration, cached = false) {
    this.metrics.totalGenerations++;
    
    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
      
      // Update average generation time
      const currentAvg = this.metrics.averageGenerationTime;
      const newCount = this.metrics.cacheMisses;
      this.metrics.averageGenerationTime = 
        Math.round((currentAvg * (newCount - 1) + duration) / newCount);

      if (type === 'fast') {
        this.metrics.fastGenerations++;
      } else if (type === 'fallback') {
        this.metrics.fallbackGenerations++;
      }
    }
  }

  /**
   * Test PDF generation performance
   */
  async testPerformance() {
    console.log('🧪 Running PDF generation performance test...');
    
    const testData = {
      doctorName: 'Test Doctor',
      hospitalName: 'Test Hospital',
      patientName: 'Test Patient',
      diagnosis: 'Test Diagnosis',
      medications: [
        { name: 'Test Medicine 1', dosage: '10mg', frequency: 'Twice daily', duration: '7 days' },
        { name: 'Test Medicine 2', dosage: '5mg', frequency: 'Once daily', duration: '14 days' }
      ],
      notes: 'Test notes for performance testing',
      filename: `performance_test_${Date.now()}.pdf`,
      upload: false // Don't upload during testing
    };

    try {
      // Test fast PDF generation
      const fastStart = Date.now();
      const { FastPrescriptionPDF } = await import('./fastPrescriptionPDF.js');
      const fastResult = await FastPrescriptionPDF.generatePrescription(testData);
      const fastTime = Date.now() - fastStart;
      
      console.log(`✅ Fast PDF generation: ${fastTime}ms`);
      
      // Clean up test file
      if (fastResult && require('fs').existsSync(fastResult)) {
        require('fs').unlinkSync(fastResult);
      }

      return {
        fastGeneration: fastTime,
        success: true
      };

    } catch (error) {
      console.error('❌ Performance test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up PDF optimization resources...');
    
    try {
      if (this.redis) {
        await this.redis.quit();
      }
      
      await PDFGenerator.cleanup();
      
      console.log('✅ PDF optimization cleanup complete');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      isSetupComplete: this.isSetupComplete,
      redisConnected: this.redis && this.redis.status === 'ready',
      metrics: this.metrics,
      cacheHitRate: this.getCacheHitRate()
    };
  }
}

// Create singleton instance
const pdfOptimization = new PDFOptimizationSetup();

// Auto-initialize when imported
pdfOptimization.initialize().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await pdfOptimization.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pdfOptimization.cleanup();
  process.exit(0);
});

export default pdfOptimization;