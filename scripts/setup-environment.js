// scripts/setup-environment.js
// Enhanced environment setup script for Regulatory Intelligence Platform

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

class EnvironmentSetup {
    constructor() {
        this.envFile = path.join(process.cwd(), '.env');
        this.exampleEnvFile = path.join(process.cwd(), '.env.example');
        this.config = {};
    }

    async run() {
        console.log('🎯 Regulatory Intelligence Platform - Environment Setup');
        console.log('===============================================\n');

        try {
            await this.checkExistingEnv();
            await this.gatherConfiguration();
            await this.createEnvFile();
            await this.createDirectories();
            await this.validateSetup();
            await this.showNextSteps();
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        } finally {
            rl.close();
        }
    }

    async checkExistingEnv() {
        try {
            await fs.access(this.envFile);
            console.log('⚠️  .env file already exists');
            const overwrite = await question('Do you want to overwrite it? (y/N): ');
            if (overwrite.toLowerCase() !== 'y') {
                console.log('Setup cancelled. Existing .env file preserved.');
                process.exit(0);
            }
        } catch {
            console.log('✅ No existing .env file found, proceeding with setup...\n');
        }
    }

    async gatherConfiguration() {
        console.log('📋 Configuration Setup\n');

        // AI Service Configuration
        console.log('🤖 AI Analysis Service (Required)');
        console.log('The platform uses Groq AI for intelligent content analysis.');
        console.log('Get your free API key at: https://console.groq.com/\n');
        
        this.config.GROQ_API_KEY = await question('Enter your Groq API key: ');
        if (!this.config.GROQ_API_KEY.trim()) {
            throw new Error('Groq API key is required for AI analysis');
        }

        // Database Configuration
        console.log('\n💾 Database Configuration (Optional)');
        console.log('PostgreSQL provides better performance and features.');
        console.log('Leave empty to use JSON file storage as fallback.\n');
        
        const useDatabase = await question('Do you want to configure PostgreSQL? (y/N): ');
        if (useDatabase.toLowerCase() === 'y') {
            console.log('\nEnter your PostgreSQL connection details:');
            const dbHost = await question('Host (localhost): ') || 'localhost';
            const dbPort = await question('Port (5432): ') || '5432';
            const dbName = await question('Database name (regulatory_intelligence): ') || 'regulatory_intelligence';
            const dbUser = await question('Username (postgres): ') || 'postgres';
            const dbPassword = await question('Password: ');
            
            this.config.DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
        }

        // Server Configuration
        console.log('\n🌐 Server Configuration');
        this.config.PORT = await question('Server port (3000): ') || '3000';
        this.config.NODE_ENV = await question('Environment (development): ') || 'development';

        // Optional Features
        console.log('\n⚙️ Optional Features');
        const enableLogging = await question('Enable detailed logging? (y/N): ');
        if (enableLogging.toLowerCase() === 'y') {
            this.config.ENABLE_LOGGING = 'true';
        }

        const enableRateLimit = await question('Enable API rate limiting? (y/N): ');
        if (enableRateLimit.toLowerCase() === 'y') {
            this.config.ENABLE_RATE_LIMIT = 'true';
        }
    }

    async createEnvFile() {
        console.log('\n📄 Creating .env file...');

        const envContent = this.generateEnvContent();
        await fs.writeFile(this.envFile, envContent);

        console.log('✅ .env file created successfully');
    }

    generateEnvContent() {
        const header = `# Regulatory Intelligence Platform - Environment Configuration
# Generated on ${new Date().toISOString()}
# 
# This file contains your environment variables. Keep it secure and never commit to version control.

`;

        const sections = [
            {
                title: '# AI Analysis Service (Required)',
                vars: {
                    'GROQ_API_KEY': this.config.GROQ_API_KEY
                }
            },
            {
                title: '# Database Configuration (Optional - falls back to JSON if not provided)',
                vars: this.config.DATABASE_URL ? {
                    'DATABASE_URL': this.config.DATABASE_URL
                } : {
                    '# DATABASE_URL': 'postgresql://user:password@localhost:5432/regulatory_intelligence'
                }
            },
            {
                title: '# Server Configuration',
                vars: {
                    'PORT': this.config.PORT,
                    'NODE_ENV': this.config.NODE_ENV
                }
            },
            {
                title: '# Optional Features',
                vars: {
                    ...(this.config.ENABLE_LOGGING && { 'ENABLE_LOGGING': this.config.ENABLE_LOGGING }),
                    ...(this.config.ENABLE_RATE_LIMIT && { 'ENABLE_RATE_LIMIT': this.config.ENABLE_RATE_LIMIT })
                }
            }
        ];

        let content = header;

        sections.forEach(section => {
            content += `${section.title}\n`;
            Object.entries(section.vars).forEach(([key, value]) => {
                content += `${key}=${value}\n`;
            });
            content += '\n';
        });

        content += `# Additional Configuration
# Uncomment and configure as needed:
# LOG_LEVEL=info
# MAX_CONNECTIONS=20
# REQUEST_TIMEOUT=30000
# CLEANUP_DAYS=90
`;

        return content;
    }

    async createDirectories() {
        console.log('\n📁 Creating required directories...');

        const directories = [
            'data',
            'logs',
            'scripts',
            'docs',
            'tests'
        ];

        for (const dir of directories) {
            const dirPath = path.join(process.cwd(), dir);
            try {
                await fs.mkdir(dirPath, { recursive: true });
                console.log(`✅ Created directory: ${dir}/`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.warn(`⚠️  Could not create directory ${dir}/: ${error.message}`);
                }
            }
        }
    }

    async validateSetup() {
        console.log('\n🔍 Validating setup...');

        // Validate Groq API key format
        if (!this.config.GROQ_API_KEY.startsWith('gsk_')) {
            console.warn('⚠️  Warning: Groq API key format may be incorrect (should start with "gsk_")');
        }

        // Validate port
        const port = parseInt(this.config.PORT);
        if (isNaN(port) || port < 1000 || port > 65535) {
            throw new Error('Invalid port number. Must be between 1000 and 65535.');
        }

        // Test database connection if provided
        if (this.config.DATABASE_URL) {
            console.log('🔍 Testing database connection...');
            try {
                const { Pool } = require('pg');
                const pool = new Pool({ connectionString: this.config.DATABASE_URL });
                const client = await pool.connect();
                await client.query('SELECT 1');
                client.release();
                await pool.end();
                console.log('✅ Database connection successful');
            } catch (error) {
                console.warn(`⚠️  Database connection failed: ${error.message}`);
                console.warn('The system will fall back to JSON file storage.');
            }
        }

        console.log('✅ Setup validation completed');
    }

    async showNextSteps() {
        console.log('\n🎉 Setup Complete!');
        console.log('==================\n');

        console.log('Next steps:');
        console.log('1. Install dependencies: npm install');
        console.log('2. Start the server: npm run dev');
        console.log(`3. Visit: http://localhost:${this.config.PORT}`);
        console.log('4. Click "Refresh Intelligence" to fetch regulatory updates\n');

        console.log('Quick commands:');
        console.log('• npm run dev          - Start development server');
        console.log('• npm start            - Start production server');
        console.log('• npm run refresh      - Manual intelligence refresh');
        console.log('• npm run stats        - Show system statistics');
        console.log('• npm test             - Run test suite\n');

        console.log('Interfaces:');
        console.log(`• Main Interface:      http://localhost:${this.config.PORT}`);
        console.log(`• Intelligence Dashboard: http://localhost:${this.config.PORT}/dashboard`);
        console.log(`• System Diagnostics:  http://localhost:${this.config.PORT}/test`);
        console.log(`• API Status:         http://localhost:${this.config.PORT}/api/system-status\n`);

        console.log('📊 The platform monitors 19 regulatory sources:');
        console.log('• Primary UK: FCA, PRA, BoE, PSR, TPR');
        console.log('• International: ESMA, EBA, FATF, FSB');
        console.log('• Government: HM Treasury, Treasury Committee, OFSI');
        console.log('• Specialist: JMLSG, Pay.UK, and more\n');

        if (!this.config.DATABASE_URL) {
            console.log('💡 Tip: For better performance, consider setting up PostgreSQL');
            console.log('   and adding DATABASE_URL to your .env file later.\n');
        }

        console.log('🔗 Resources:');
        console.log('• Documentation: ./docs/');
        console.log('• GitHub Issues: Report bugs and request features');
        console.log('• Groq Console: https://console.groq.com/ (for API key management)');
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new EnvironmentSetup();
    setup.run().catch(error => {
        console.error('💥 Setup failed:', error.message);
        process.exit(1);
    });
}

module.exports = EnvironmentSetup;