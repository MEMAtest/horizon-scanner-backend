// Enhanced Server Entry Point - Phase 1
// File: src/index.js

const express = require('express')
const cors = require('cors')
const path = require('path')
const net = require('net')
require('dotenv').config()

// Import enhanced services
const dbService = require('./services/dbService')
const rssFetcher = require('./services/rssFetcher')
const aiAnalyzer = require('./services/aiAnalyzer')
const FCAEnforcementService = require('./services/fcaEnforcementService')

// Import routes
const pageRoutes = require('./routes/pageRoutes')
const apiRoutes = require('./routes/apiRoutes')

// Helper function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(port, () => {
      server.once('close', () => resolve(true))
      server.close()
    })
    server.on('error', () => resolve(false))
  })
}

// Helper function to find an available port starting from a preferred port
async function findAvailablePort(preferredPort = 3000) {
  let port = preferredPort
  while (port < preferredPort + 100) { // Try up to 100 ports
    if (await isPortAvailable(port)) {
      return port
    }
    port++
  }
  throw new Error('No available ports found')
}

class AIRegulatoryIntelligenceServer {
  constructor() {
    this.app = express()
    this.port = null // Will be set dynamically in start()
    this.server = null
    this.enforcementService = null // FCA Enforcement Service instance
    this.initializeMiddleware()
    this.initializeRoutes()
    this.initializeErrorHandling()
  }

  // Add this getter method
  getApp() {
    return this.app
  }

  initializeMiddleware() {
    console.log('🔧 Initializing middleware...')

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }))

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // Static files
    this.app.use('/static', express.static(path.join(__dirname, '../public')))
    this.app.use('/css', express.static(path.join(__dirname, '../public/css')))
    this.app.use('/js', express.static(path.join(__dirname, '../public/js')))
    this.app.use('/images', express.static(path.join(__dirname, '../public/images')))

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
      next()
    })

    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('X-XSS-Protection', '1; mode=block')
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
      next()
    })

    console.log('✅ Middleware initialized')
  }

  initializeRoutes() {
    console.log('🛣️ Initializing routes...')

    // Health check endpoint (should be first)
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await dbService.healthCheck()
        const aiHealth = await aiAnalyzer.healthCheck()

        const overallStatus = dbHealth.status === 'healthy' && aiHealth.status === 'healthy'
          ? 'healthy'
          : 'degraded'

        res.status(overallStatus === 'healthy' ? 200 : 503).json({
          status: overallStatus,
          timestamp: new Date().toISOString(),
          services: {
            database: dbHealth,
            aiAnalyzer: aiHealth,
            rssFetcher: { status: 'healthy', activeFeeds: rssFetcher.getActiveFeedCount() }
          },
          version: '2.0.0-phase1',
          environment: process.env.NODE_ENV || 'development',
          platform: process.env.VERCEL ? 'vercel' : 'traditional',
          uptime: Math.floor(process.uptime()),
          memory: process.memoryUsage()
        })
      } catch (error) {
        console.error('❌ Health check failed:', error)
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    })

    // Cron endpoint for Vercel scheduled functions
    this.app.post('/api/cron/refresh', async (req, res) => {
      try {
        // Basic security check for Vercel cron
        const authHeader = req.headers.authorization
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
          return res.status(401).json({ error: 'Unauthorized' })
        }

        console.log('🔄 Cron refresh triggered')
        const result = await rssFetcher.fetchAllFeeds()

        res.json({
          success: true,
          message: 'Refresh completed',
          stats: {
            newUpdates: result.newUpdates || 0,
            total: result.total || 0,
            timestamp: new Date().toISOString()
          }
        })
      } catch (error) {
        console.error('Cron refresh error:', error)
        res.status(500).json({
          success: false,
          error: error.message
        })
      }
    })

    // Manual refresh endpoint (works on all platforms)
    this.app.post('/api/refresh', async (req, res) => {
      try {
        console.log('🔄 Manual refresh triggered')
        const result = await rssFetcher.fetchAllFeeds()

        res.json({
          success: true,
          newArticles: result.newUpdates || 0,
          total: result.total || 0,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Manual refresh error:', error)
        res.status(500).json({
          success: false,
          error: error.message
        })
      }
    })

    // API routes
    this.app.use('/api', apiRoutes)

    // AI routes (duplicate mounting for compatibility)
    this.app.use('/ai', apiRoutes)

    // Page routes
    this.app.use('/', pageRoutes)

    // Catch-all for undefined routes
    this.app.get('*', (req, res) => {
      console.warn(`⚠️ 404 - Route not found: ${req.path}`)
      res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - Page Not Found</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                            background: #f8fafc; 
                            color: #1f2937; 
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                        }
                        .error-container { 
                            text-align: center; 
                            padding: 40px;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                            max-width: 500px;
                        }
                        .error-icon { 
                            font-size: 4rem; 
                            margin-bottom: 20px; 
                        }
                        .error-title { 
                            font-size: 2rem; 
                            font-weight: 700; 
                            margin-bottom: 10px;
                            color: #1f2937;
                        }
                        .error-message { 
                            color: #6b7280; 
                            margin-bottom: 30px;
                            line-height: 1.6;
                        }
                        .error-links { 
                            display: flex; 
                            gap: 15px; 
                            justify-content: center;
                            flex-wrap: wrap;
                        }
                        .error-link { 
                            color: #4f46e5; 
                            text-decoration: none; 
                            font-weight: 500;
                            padding: 10px 20px;
                            border: 1px solid #4f46e5;
                            border-radius: 6px;
                            transition: all 0.2s ease;
                        }
                        .error-link:hover { 
                            background: #4f46e5; 
                            color: white; 
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <div class="error-icon">🔍</div>
                        <h1 class="error-title">Page Not Found</h1>
                        <p class="error-message">
                            The page you're looking for doesn't exist. This might be because 
                            the URL is incorrect or the page has been moved.
                        </p>
                        <div class="error-links">
                            <a href="/" class="error-link">🏠 Home</a>
                            <a href="/dashboard" class="error-link">📊 Dashboard</a>
                            <a href="/analytics" class="error-link">📈 Analytics</a>
                            <a href="/api/health" class="error-link">🔍 Health Check</a>
                        </div>
                    </div>
                </body>
                </html>
            `)
    })

    console.log('✅ Routes initialized')
  }

  initializeErrorHandling() {
    console.log('🛡️ Initializing error handling...')

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('❌ Unhandled error:', error)

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV !== 'production'

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: error.stack })
      })
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error)
      process.exit(1)
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...')
      this.shutdown()
    })

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...')
      this.shutdown()
    })

    console.log('✅ Error handling initialized')
  }

  async initializeServices() {
    console.log('🚀 Initializing enhanced services...')

    try {
      // Initialize database service (already auto-initializes)
      console.log('📊 Database service initialized')

      // Initialize RSS fetcher
      await rssFetcher.initialize()
      console.log('📡 RSS fetcher service initialized')

      // Initialize AI analyzer (already initialized)
      console.log('🤖 AI analyzer service initialized')

      // Initialize FCA Enforcement Service
      if (process.env.DATABASE_URL) {
        console.log('⚖️ Initializing FCA Enforcement Service...')
        try {
          const dbConfig = {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
          }

          this.enforcementService = new FCAEnforcementService(dbConfig, aiAnalyzer)
          await this.enforcementService.initialize()

          // Make enforcement service available to routes
          this.app.locals.enforcementService = this.enforcementService

          console.log('✅ FCA Enforcement Service initialized successfully')
        } catch (enforcementError) {
          console.error('⚠️ FCA Enforcement Service initialization failed:', enforcementError)
          // Continue without enforcement service - it's not critical for core functionality
        }
      } else {
        console.log('⚠️ No database URL found - FCA Enforcement Service disabled')
      }

      // Start background tasks if not on Vercel
      if (!process.env.VERCEL) {
        await this.startBackgroundTasks()
      } else {
        console.log('📝 Vercel environment - background tasks handled via cron')
      }

      console.log('✅ All services initialized successfully')
    } catch (error) {
      console.error('❌ Service initialization failed:', error)
      throw error
    }
  }

  async startBackgroundTasks() {
    console.log('⚙️ Starting background tasks...')

    try {
      // Start RSS fetching (every 30 minutes)
      setInterval(async () => {
        try {
          console.log('📡 Running scheduled RSS fetch...')
          await rssFetcher.fetchAllFeeds()
        } catch (error) {
          console.error('❌ Scheduled RSS fetch failed:', error)
        }
      }, 30 * 60 * 1000)

      // Initial RSS fetch
      setTimeout(async () => {
        try {
          console.log('📡 Running initial RSS fetch...')
          await rssFetcher.fetchAllFeeds()
        } catch (error) {
          console.error('❌ Initial RSS fetch failed:', error)
        }
      }, 5000) // Wait 5 seconds after startup

      // Weekly roundup generation (daily at 9 AM)
      setInterval(async () => {
        try {
          const now = new Date()
          if (now.getHours() === 9 && now.getMinutes() === 0) {
            console.log('📋 Generating scheduled weekly roundup...')
            const updates = await dbService.getEnhancedUpdates({ range: 'week', limit: 100 })
            await aiAnalyzer.generateWeeklyRoundup(updates)
          }
        } catch (error) {
          console.error('❌ Scheduled weekly roundup failed:', error)
        }
      }, 60 * 1000) // Check every minute

      // FCA Enforcement data updates (daily at 2 AM)
      if (this.enforcementService) {
        setInterval(async () => {
          try {
            const now = new Date()
            if (now.getHours() === 2 && now.getMinutes() === 0) {
              console.log('⚖️ Running scheduled FCA enforcement update...')
              await this.enforcementService.runScheduledUpdate()
            }
          } catch (error) {
            console.error('❌ Scheduled enforcement update failed:', error)
          }
        }, 60 * 1000) // Check every minute
      }

      console.log('✅ Background tasks started')
    } catch (error) {
      console.error('❌ Failed to start background tasks:', error)
    }
  }

  async start() {
    try {
      console.log('🚀 Starting AI Regulatory Intelligence Platform...')
      console.log('================================================\n')

      // Find an available port (prefer environment variable, then 3000, then any available)
      const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : 3000
      this.port = await findAvailablePort(preferredPort)

      if (this.port !== preferredPort) {
        console.log(`⚠️  Port ${preferredPort} was in use, using port ${this.port} instead\n`)
      }

      // Initialize services first
      await this.initializeServices()

      // Start the server
      this.server = this.app.listen(this.port, () => {
        console.log('\n================================================')
        console.log('🎉 AI REGULATORY INTELLIGENCE PLATFORM READY')
        console.log('================================================')
        console.log(`🌐 Server running on: http://localhost:${this.port}`)
        console.log(`📊 Dashboard: http://localhost:${this.port}/dashboard`)
        console.log(`📈 Analytics: http://localhost:${this.port}/analytics`)
        console.log(`🔍 Health Check: http://localhost:${this.port}/health`)
        console.log(`🤖 AI Roundup: http://localhost:${this.port}/api/ai/weekly-roundup`)
        console.log(`⚡ API Status: http://localhost:${this.port}/api/status`)
        console.log(`🧪 Test Endpoint: http://localhost:${this.port}/test`)
        console.log('================================================')
        console.log('🎯 Phase 1 Features Available:')
        console.log(' ✅ Enhanced AI Analysis & Impact Scoring')
        console.log(' ✅ Real-time Dashboard with Live Counters')
        console.log(' ✅ Advanced Filtering & Search')
        console.log(' ✅ AI-powered Weekly Roundups')
        console.log(' ✅ Authority & Sector Analysis')
        console.log(' ✅ Proactive Intelligence System')
        console.log(' ✅ Enhanced Database Schema')
        console.log(' ✅ Responsive UI & Mobile Support')
        console.log(' ⚖️  FCA Enforcement Data & Analytics')
        console.log('================================================')
        console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
        console.log(`💾 Database: ${dbService.fallbackMode ? 'JSON Mode' : 'PostgreSQL'}`)
        console.log(`🤖 AI Service: ${process.env.GROQ_API_KEY ? 'Active' : 'Fallback Mode'}`)
        console.log('================================================\n')
      })
    } catch (error) {
      console.error('❌ Failed to start server:', error)
      throw error
    }
  }

  async shutdown() {
    console.log('🛑 Shutting down server...')

    try {
      if (this.server) {
        this.server.close(() => {
          console.log('✅ HTTP server closed')
        })
      }

      // Close enforcement service
      if (this.enforcementService) {
        await this.enforcementService.close()
        console.log('✅ Enforcement service closed')
      }

      // Close database connections
      if (dbService.pool) {
        await dbService.pool.end()
        console.log('✅ Database connections closed')
      }

      console.log('✅ Graceful shutdown completed')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  }
}

// Create server instance
const server = new AIRegulatoryIntelligenceServer()

// Detect environment and handle appropriately
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV
const isProduction = process.env.NODE_ENV === 'production'
const startServerFlag = process.env.START_SERVER
const explicitlyEnabled = startServerFlag === 'true'
const explicitlyDisabled = startServerFlag === 'false'
const executedDirectly = require.main === module

if (isVercel) {
  // Vercel serverless environment
  console.log('🚀 Running on Vercel - initializing for serverless...');

  // Initialize services without starting the server
  (async () => {
    try {
      await server.initializeServices()
      console.log('✅ Services initialized for Vercel')
    } catch (error) {
      console.error('⚠️ Service initialization warning:', error)
      // Don't exit - let Vercel handle the app even if some services fail
    }
  })()

  // Export the Express app for Vercel
  module.exports = server.getApp()
} else {
  const shouldAutoStart = executedDirectly && !explicitlyDisabled
  const shouldStartFromImport = !executedDirectly && explicitlyEnabled

  if (shouldAutoStart || shouldStartFromImport) {
    if (!executedDirectly && explicitlyEnabled) {
      console.log('🚀 START_SERVER=true detected - starting server on import...')
    } else if (!isProduction) {
      console.log('🚀 Starting server in traditional mode...')
    } else {
      console.log('🚀 Starting server (production mode)...')
    }

    server.start().catch(error => {
      console.error('❌ Failed to start server:', error)
      process.exit(1)
    })
  } else if (executedDirectly && explicitlyDisabled) {
    console.log('⏸️  START_SERVER=false detected - skipping automatic start')
  } else {
    console.log('📦 Application loaded without starting server')
    console.log('ℹ️  Use START_SERVER=true to force the listener to start in this context')
  }

  module.exports = server.getApp()
}

// Also export the class for testing
module.exports.AIRegulatoryIntelligenceServer = AIRegulatoryIntelligenceServer
