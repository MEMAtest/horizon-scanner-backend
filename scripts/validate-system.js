// scripts/validate-system.js
// Comprehensive system validation and statistics for Regulatory Intelligence Platform

require('dotenv').config();
const path = require('path');

class SystemValidator {
    constructor() {
        this.results = {
            environment: {},
            database: {},
            sources: {},
            ai: {},
            overall: 'unknown'
        };
    }

    async validate() {
        console.log('🎯 Regulatory Intelligence Platform - System Validation');
        console.log('=====================================================\n');

        try {
            await this.validateEnvironment();
            await this.validateDatabase();
            await this.validateSources();
            await this.validateAI();
            this.calculateOverallHealth();
            this.displayResults();
            this.showRecommendations();
        } catch (error) {
            console.error('💥 Validation failed:', error.message);
            process.exit(1);
        }
    }

    async validateEnvironment() {
        console.log('🔍 Validating Environment Configuration...');

        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        this.results.environment.nodeVersion = {
            current: nodeVersion,
            supported: majorVersion >= 16,
            status: majorVersion >= 16 ? 'pass' : 'fail'
        };

        // Check required environment variables
        this.results.environment.variables = {
            GROQ_API_KEY: {
                present: !!process.env.GROQ_API_KEY,
                format: process.env.GROQ_API_KEY?.startsWith('gsk_') || false,
                status: !!process.env.GROQ_API_KEY ? 'pass' : 'fail'
            },
            DATABASE_URL: {
                present: !!process.env.DATABASE_URL,
                status: !!process.env.DATABASE_URL ? 'pass' : 'warn'
            },
            PORT: {
                value: process.env.PORT || '3000',
                valid: !isNaN(parseInt(process.env.PORT || '3000')),
                status: 'pass'
            }
        };

        // Check file system permissions
        try {
            const fs = require('fs').promises;
            const testFile = path.join(process.cwd(), 'data', '.test');
            await fs.mkdir(path.dirname(testFile), { recursive: true });
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);
            this.results.environment.fileSystem = { status: 'pass' };
        } catch (error) {
            this.results.environment.fileSystem = { 
                status: 'fail', 
                error: error.message 
            };
        }

        console.log('✅ Environment validation completed\n');
    }

    async validateDatabase() {
        console.log('🗄️  Validating Database Service...');

        try {
            const dbService = require('../src/services/dbService');
            
            // Test initialization
            await dbService.initialize();
            this.results.database.initialization = { status: 'pass' };

            // Test basic operations
            const updateCount = await dbService.getUpdateCount();
            this.results.database.operations = { 
                status: 'pass',
                updateCount 
            };

            // Determine database type
            this.results.database.type = process.env.DATABASE_URL ? 'postgresql' : 'json';
            
            // Test database health
            const healthCheck = await dbService.healthCheck();
            this.results.database.health = healthCheck;

            this.results.database.overall = 'pass';

        } catch (error) {
            this.results.database = {
                overall: 'fail',
                error: error.message
            };
        }

        console.log('✅ Database validation completed\n');
    }

    async validateSources() {
        console.log('📡 Validating Source Configuration...');

        try {
            const { getSourceStats } = require('../src/services/rssFetcher');
            const sourceStats = getSourceStats();

            this.results.sources = {
                total: sourceStats.total,
                rssFeeds: sourceStats.rssFeeds,
                websites: sourceStats.websites,
                byCategory: sourceStats.byCategory,
                byAuthority: sourceStats.byAuthority,
                status: sourceStats.total > 0 ? 'pass' : 'fail'
            };

            // Test a sample source
            const axios = require('axios');
            try {
                await axios.get('https://www.fca.org.uk/news/rss.xml', { timeout: 10000 });
                this.results.sources.connectivity = { status: 'pass' };
            } catch (error) {
                this.results.sources.connectivity = { 
                    status: 'warn', 
                    message: 'Sample source test failed - may indicate network issues' 
                };
            }

        } catch (error) {
            this.results.sources = {
                status: 'fail',
                error: error.message
            };
        }

        console.log('✅ Source validation completed\n');
    }

    async validateAI() {
        console.log('🤖 Validating AI Analysis Service...');

        try {
            if (!process.env.GROQ_API_KEY) {
                this.results.ai = {
                    status: 'fail',
                    error: 'GROQ_API_KEY not configured'
                };
                return;
            }

            // Test AI service connectivity
            const axios = require('axios');
            try {
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.1-8b-instant',
                        messages: [{ role: 'user', content: 'Test' }],
                        max_tokens: 10
                    },
                    {
                        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
                        timeout: 10000
                    }
                );

                this.results.ai = {
                    status: 'pass',
                    provider: 'Groq',
                    model: 'llama-3.1-8b-instant',
                    connectivity: 'confirmed'
                };

            } catch (error) {
                this.results.ai = {
                    status: 'fail',
                    error: 'API connection failed: ' + error.message,
                    suggestion: 'Check API key validity and network connectivity'
                };
            }

        } catch (error) {
            this.results.ai = {
                status: 'fail',
                error: error.message
            };
        }

        console.log('✅ AI validation completed\n');
    }

    calculateOverallHealth() {
        const scores = {
            pass: 3,
            warn: 1,
            fail: 0
        };

        let totalScore = 0;
        let maxScore = 0;

        // Environment scoring
        if (this.results.environment.nodeVersion) {
            totalScore += scores[this.results.environment.nodeVersion.status] || 0;
            maxScore += 3;
        }

        if (this.results.environment.variables?.GROQ_API_KEY) {
            totalScore += scores[this.results.environment.variables.GROQ_API_KEY.status] || 0;
            maxScore += 3;
        }

        // Database scoring
        if (this.results.database.overall) {
            totalScore += scores[this.results.database.overall] || 0;
            maxScore += 3;
        }

        // Sources scoring
        if (this.results.sources.status) {
            totalScore += scores[this.results.sources.status] || 0;
            maxScore += 3;
        }

        // AI scoring
        if (this.results.ai.status) {
            totalScore += scores[this.results.ai.status] || 0;
            maxScore += 3;
        }

        const healthPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        if (healthPercentage >= 80) {
            this.results.overall = 'healthy';
        } else if (healthPercentage >= 60) {
            this.results.overall = 'degraded';
        } else {
            this.results.overall = 'unhealthy';
        }

        this.results.healthScore = healthPercentage;
    }

    displayResults() {
        console.log('📊 SYSTEM VALIDATION RESULTS');
        console.log('============================\n');

        // Overall Health
        const healthEmoji = {
            healthy: '🟢',
            degraded: '🟡', 
            unhealthy: '🔴'
        };

        console.log(`Overall System Health: ${healthEmoji[this.results.overall]} ${this.results.overall.toUpperCase()} (${this.results.healthScore}%)\n`);

        // Environment Results
        console.log('🔧 Environment Configuration:');
        if (this.results.environment.nodeVersion) {
            console.log(`   Node.js: ${this.results.environment.nodeVersion.current} ${this.results.environment.nodeVersion.supported ? '✅' : '❌'}`);
        }
        if (this.results.environment.variables) {
            const vars = this.results.environment.variables;
            console.log(`   GROQ_API_KEY: ${vars.GROQ_API_KEY.present ? '✅ Present' : '❌ Missing'}`);
            console.log(`   DATABASE_URL: ${vars.DATABASE_URL.present ? '✅ Configured' : '⚠️ Using JSON fallback'}`);
            console.log(`   File System: ${this.results.environment.fileSystem.status === 'pass' ? '✅ Writable' : '❌ Permission issue'}`);
        }
        console.log();

        // Database Results
        console.log('🗄️ Database Service:');
        if (this.results.database.overall === 'pass') {
            console.log(`   Type: ${this.results.database.type === 'postgresql' ? 'PostgreSQL ✅' : 'JSON File ⚠️'}`);
            console.log(`   Updates: ${this.results.database.operations?.updateCount || 0} stored`);
            console.log(`   Status: ✅ Operational`);
        } else {
            console.log(`   Status: ❌ ${this.results.database.error}`);
        }
        console.log();

        // Sources Results
        console.log('📡 Source Configuration:');
        if (this.results.sources.status === 'pass') {
            console.log(`   Total Sources: ${this.results.sources.total} ✅`);
            console.log(`   RSS Feeds: ${this.results.sources.rssFeeds}`);
            console.log(`   Websites: ${this.results.sources.websites}`);
            console.log(`   Authorities: ${Object.keys(this.results.sources.byAuthority).length}`);
            console.log(`   Connectivity: ${this.results.sources.connectivity?.status === 'pass' ? '✅ Tested' : '⚠️ Warning'}`);
        } else {
            console.log(`   Status: ❌ ${this.results.sources.error}`);
        }
        console.log();

        // AI Results
        console.log('🤖 AI Analysis Service:');
        if (this.results.ai.status === 'pass') {
            console.log(`   Provider: ${this.results.ai.provider} ✅`);
            console.log(`   Model: ${this.results.ai.model}`);
            console.log(`   Status: ✅ ${this.results.ai.connectivity}`);
        } else {
            console.log(`   Status: ❌ ${this.results.ai.error}`);
        }
        console.log();
    }

    showRecommendations() {
        console.log('💡 RECOMMENDATIONS');
        console.log('==================\n');

        const recommendations = [];

        // Environment recommendations
        if (this.results.environment.nodeVersion?.status === 'fail') {
            recommendations.push('🔄 Upgrade Node.js to version 16 or higher');
        }

        if (this.results.environment.variables?.GROQ_API_KEY?.status === 'fail') {
            recommendations.push('🔑 Configure GROQ_API_KEY environment variable');
            recommendations.push('   Get your free API key at: https://console.groq.com/');
        }

        // Database recommendations
        if (this.results.database.type === 'json') {
            recommendations.push('🗄️ Consider upgrading to PostgreSQL for better performance');
            recommendations.push('   Add DATABASE_URL to your .env file');
        }

        if (this.results.database.overall === 'fail') {
            recommendations.push('🔧 Fix database configuration issues');
        }

        // AI recommendations
        if (this.results.ai.status === 'fail') {
            recommendations.push('🤖 Resolve AI service connectivity issues');
            recommendations.push('   Verify your Groq API key is valid and active');
        }

        // Sources recommendations
        if (this.results.sources.connectivity?.status === 'warn') {
            recommendations.push('🌐 Check network connectivity for source monitoring');
        }

        // General recommendations
        if (this.results.overall === 'healthy') {
            recommendations.push('🎉 System is ready for production use!');
            recommendations.push('🚀 Try running: npm start');
            recommendations.push(`🌐 Visit: http://localhost:${process.env.PORT || 3000}`);
        } else if (this.results.overall === 'degraded') {
            recommendations.push('⚠️ System will work but with limitations');
            recommendations.push('🔧 Address the warnings above for optimal performance');
        } else {
            recommendations.push('🔴 Critical issues must be resolved before use');
            recommendations.push('📞 Check the troubleshooting section in the README');
        }

        if (recommendations.length === 0) {
            console.log('✅ No recommendations - system is optimally configured!\n');
        } else {
            recommendations.forEach(rec => console.log(rec));
            console.log();
        }

        // Quick start reminder
        if (this.results.overall !== 'unhealthy') {
            console.log('🎯 QUICK START COMMANDS');
            console.log('======================');
            console.log('npm run dev          # Start development server');
            console.log('npm run refresh      # Manual intelligence refresh');
            console.log('npm run stats        # Show detailed statistics');
            console.log('npm test             # Run test suite\n');
        }

        console.log('📋 For detailed setup instructions, see: README.md');
        console.log('🐛 Report issues at: https://github.com/your-org/regulatory-horizon-scanner/issues');
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new SystemValidator();
    validator.validate().catch(error => {
        console.error('💥 Validation failed:', error.message);
        process.exit(1);
    });
}

module.exports = SystemValidator;