# 🎯 Regulatory Horizon Scanner
## Enterprise Regulatory Intelligence Platform v2.0

> **Comprehensive monitoring of UK and international regulatory authorities with AI-powered analysis**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-blue)](https://console.groq.com/)
[![Sources](https://img.shields.io/badge/Sources-19-green)](https://github.com/your-org/regulatory-horizon-scanner)

---

## 🚀 Overview

The Regulatory Horizon Scanner is an enterprise-grade intelligence platform that monitors **19 comprehensive regulatory sources** across UK and international authorities. It provides real-time regulatory updates with AI-powered analysis, impact assessment, and intelligent categorization.

### ✨ Key Features

- **🎯 Comprehensive Source Coverage**: 19 regulatory authorities including FCA, PRA, BoE, PSR, TPR, ESMA, EBA, FATF, FSB
- **🤖 AI-Powered Analysis**: Intelligent content analysis with sector relevance scoring
- **📊 Enterprise Dashboard**: Professional intelligence streams with impact categorization
- **🔍 Advanced Search**: Full-text search with relevance scoring and filtering
- **💾 Flexible Storage**: PostgreSQL with JSON file fallback
- **⚡ Real-time Processing**: RSS feeds + website scraping with rate limiting
- **📈 Analytics & Insights**: Comprehensive statistics and trend analysis

---

## 📡 Monitored Sources

### 🎯 Primary UK Regulators
| Authority | Description | Coverage | Feed Type |
|-----------|-------------|----------|-----------|
| **FCA** | Financial Conduct Authority | All financial services, fintech, consumer protection | RSS + Web |
| **PRA** | Prudential Regulation Authority | Banking, insurance, investment firms | RSS |
| **BoE** | Bank of England | Monetary policy, financial stability, payments | RSS |
| **PSR** | Payment Systems Regulator | Payments, open banking, fraud prevention | Web |
| **TPR** | The Pensions Regulator | Pension schemes, retirement savings | Web |

### 🌍 International Bodies
| Authority | Description | Coverage | Feed Type |
|-----------|-------------|----------|-----------|
| **ESMA** | European Securities Markets Authority | Capital markets, investments, crypto | RSS |
| **EBA** | European Banking Authority | Banking, payments, AML | RSS |
| **FATF** | Financial Action Task Force | AML/CFT global standards | Web |
| **FSB** | Financial Stability Board | Financial stability, systemic risk | RSS |

### 🏛️ Government & Policy
| Authority | Description | Coverage | Feed Type |
|-----------|-------------|----------|-----------|
| **HM Treasury** | UK Treasury Department | Financial policy, legislation | Web |
| **Treasury Committee** | Parliamentary Committee | Policy oversight, inquiries | RSS |
| **OFSI** | Financial Sanctions Implementation | Sanctions, financial crime | Web |

### 🔍 Specialist Sources
| Authority | Description | Coverage | Feed Type |
|-----------|-------------|----------|-----------|
| **JMLSG** | Joint Money Laundering Steering Group | AML guidance, financial crime | Web |
| **Pay.UK** | UK Payment System Operator | CHAPS, Bacs, Faster Payments | Web |

---

## 🛠️ Quick Start

### Prerequisites

- **Node.js** ≥ 16.0.0
- **npm** ≥ 8.0.0
- **PostgreSQL** (optional - falls back to JSON)
- **Groq AI API Key** (for analysis)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/regulatory-horizon-scanner.git
cd regulatory-horizon-scanner

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### 2. Environment Configuration

Create a `.env` file:

```env
# Required: AI Analysis
GROQ_API_KEY=your_groq_api_key_here

# Optional: Database (falls back to JSON if not provided)
DATABASE_URL=postgresql://user:password@localhost:5432/regulatory_intelligence

# Optional: Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### 4. Access the Platform

- **Main Interface**: http://localhost:3000
- **Intelligence Dashboard**: http://localhost:3000/dashboard  
- **System Diagnostics**: http://localhost:3000/test
- **API Status**: http://localhost:3000/api/system-status

---

## 🎯 Core Usage

### Refreshing Intelligence

1. Visit the main interface at `http://localhost:3000`
2. Click **"Refresh Intelligence"** to fetch latest updates
3. Wait for processing to complete (typically 2-3 minutes)
4. View categorized intelligence streams

### Intelligence Streams

Updates are automatically categorized into:

- **🔴 Critical Impact**: High urgency, significant business implications
- **🟡 Active Monitoring**: Medium impact, compliance requirements
- **🟢 Background Intelligence**: Informational, trend monitoring

### Search & Filtering

- **Full-text search** across all content
- **Filter by authority** (FCA, PRA, BoE, etc.)
- **Filter by sector** (Banking, Fintech, Payments, etc.)
- **Filter by impact level** (Significant, Moderate, Informational)

---

## 🔧 API Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/system-status` | GET | Comprehensive system health |
| `/api/refresh` | POST | Trigger intelligence refresh |
| `/api/updates` | GET | Get all updates with filtering |
| `/api/search` | GET | Search updates with relevance |
| `/api/stats` | GET | Comprehensive analytics |
| `/api/sources` | GET | Source information |

### Example API Usage

```bash
# Get system status
curl http://localhost:3000/api/system-status

# Trigger refresh
curl -X POST http://localhost:3000/api/refresh

# Search for fintech updates
curl "http://localhost:3000/api/search?q=fintech&authority=FCA"

# Get FCA updates only
curl "http://localhost:3000/api/updates?authority=FCA&limit=10"
```

---

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Sources   │────│  Enhanced RSS    │────│   AI Analysis   │
│  (12 websites)  │    │   Fetcher (7)    │    │  (Groq/Llama)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                       ┌────────▼────────┐      ┌────────▼────────┐
                       │  Content        │      │  Intelligence   │
                       │  Processing     │      │  Enhancement    │
                       └────────┬────────┘      └────────┬────────┘
                                │                        │
                       ┌────────▼─────────────────────────▼────────┐
                       │         Enhanced Database Service         │
                       │     (PostgreSQL + JSON Fallback)         │
                       └────────┬─────────────────────────┬────────┘
                                │                        │
                       ┌────────▼────────┐      ┌────────▼────────┐
                       │   API Routes    │      │   Web Interface │
                       │   (REST API)    │      │  (Dashboard)    │
                       └─────────────────┘      └─────────────────┘
```

### Data Flow

1. **Source Monitoring**: RSS feeds + website scraping
2. **Content Extraction**: Clean text extraction with multiple fallbacks
3. **AI Analysis**: Context-aware analysis with source information
4. **Intelligence Enhancement**: Sector relevance, compliance actions
5. **Storage**: Enhanced database with comprehensive metadata
6. **Presentation**: Professional interface with intelligent categorization

---

## 📊 Database Schema

### Enhanced PostgreSQL Schema

```sql
CREATE TABLE regulatory_updates (
    id SERIAL PRIMARY KEY,
    headline TEXT NOT NULL,
    impact TEXT,
    area TEXT,
    authority TEXT,
    impact_level TEXT,
    urgency TEXT,
    sector TEXT,
    key_dates TEXT,
    url TEXT UNIQUE,
    fetched_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Enhanced Intelligence Fields
    primary_sectors JSONB,
    sector_relevance JSONB,
    compliance_actions TEXT,
    business_implications TEXT,
    source_category TEXT,
    source_description TEXT,
    authority_context JSONB,
    analysis_version TEXT DEFAULT '2.0',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB
);
```

### Sector Relevance Scoring

Each update includes relevance scores (0-100) for key sectors:

```json
{
  "sectorRelevance": {
    "Banking": 85,
    "Investment Management": 20,
    "Insurance": 10,
    "Consumer Credit": 90,
    "Payments": 15,
    "Pensions": 5,
    "Capital Markets": 30,
    "Fintech": 70
  }
}
```

---

## 🔄 Development

### Project Structure

```
regulatory-horizon-scanner/
├── src/
│   ├── index.js                 # Enhanced main server
│   ├── routes/
│   │   ├── pageRoutes.js        # Web interface routes
│   │   └── apiRoutes.js         # API endpoints
│   └── services/
│       ├── rssFetcher.js        # Enhanced RSS + web scraping
│       ├── aiAnalyzer.js        # AI-powered analysis
│       ├── dbService.js         # Enhanced database service
│       └── webScraper.js        # Comprehensive web scraping
├── scripts/
│   ├── setup-environment.js     # Environment setup
│   ├── manual-refresh.js        # Manual data refresh
│   └── cleanup-database.js      # Database maintenance
├── data/                        # JSON fallback storage
├── docs/                        # Documentation
└── tests/                       # Test suite
```

### Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Code quality
npm run lint
npm run lint:fix

# Manual operations
npm run refresh        # Manual intelligence refresh
npm run cleanup        # Clean database
npm run stats          # Show statistics
npm run validate       # System validation
```

### Adding New Sources

1. **RSS Feed**: Add to `getRSSFeeds()` in `rssFetcher.js`
2. **Website**: Add to `getScrapingSources()` in `rssFetcher.js`
3. **Authority Context**: Add to `AUTHORITY_CONTEXT` in `aiAnalyzer.js`

Example RSS source:

```javascript
{
    name: 'NEW_AUTHORITY',
    authority: 'NEW_AUTHORITY',
    category: 'Primary Regulator',
    url: 'https://authority.gov.uk/rss.xml',
    description: 'Authority Description',
    sectors: ['Banking', 'Fintech']
}
```

---

## 🚀 Deployment

### Supported Platforms

- **Vercel** (Recommended for serverless)
- **Heroku** (Traditional hosting)
- **Railway** (Modern deployment)
- **AWS**, **GCP**, **Azure** (Enterprise)
- **Self-hosted** (Docker + PM2)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | AI analysis capabilities |
| `DATABASE_URL` | ⚠️ | PostgreSQL connection (optional) |
| `PORT` | ❌ | Server port (default: 3000) |
| `NODE_ENV` | ❌ | Environment mode |

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add GROQ_API_KEY
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📈 Monitoring & Analytics

### System Health

- **Health Check**: `/health` endpoint
- **System Status**: `/api/system-status` 
- **Diagnostics**: `/test` interface

### Performance Metrics

- **Source Coverage**: 19 total sources
- **Processing Time**: ~2-3 minutes for full refresh
- **Analysis Quality**: Sector relevance scoring
- **Update Frequency**: Manual refresh (on-demand)

### Analytics Dashboard

Access comprehensive analytics at `/dashboard`:

- **Total Intelligence**: All processed updates
- **Critical Impact**: High-priority regulatory changes
- **Active Monitoring**: Medium-impact developments
- **Background Intelligence**: Informational updates
- **Authority Distribution**: Updates by regulator
- **Sector Analysis**: Relevance by industry
- **Temporal Analysis**: Recent activity trends

---

## 🔒 Security & Compliance

### Data Security

- **Input Validation**: All user inputs validated
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Sensitive data protection

### Compliance Features

- **Data Retention**: Configurable cleanup policies
- **Audit Trail**: Comprehensive logging
- **Source Attribution**: Full transparency
- **Access Controls**: Environment-based security

---

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### Code Standards

- **ESLint**: Standard JavaScript style
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Husky**: Pre-commit hooks

### Adding Sources

When adding new regulatory sources:

1. Update source configuration
2. Add authority context for AI analysis
3. Test scraping selectors
4. Update documentation
5. Add tests

---

## 📋 Roadmap

### Phase 1.3 - Intelligence & Workspace (Next)
- [ ] Firm profile system for relevance scoring
- [ ] Pinned items workspace
- [ ] Saved searches
- [ ] Custom alerts
- [ ] Industry-specific filtering

### Phase 2.0 - Advanced Features
- [ ] Real-time WebSocket updates
- [ ] Machine learning models
- [ ] Predictive analytics
- [ ] Email notifications
- [ ] Mobile app

### Phase 3.0 - Enterprise Scale
- [ ] Multi-tenant architecture
- [ ] Advanced user management
- [ ] White-label capabilities
- [ ] API rate limiting tiers
- [ ] Enterprise SSO

---

## ❓ FAQ

### Q: How often should I refresh the intelligence?
**A**: Manually refresh 1-2 times daily, or as needed for specific monitoring requirements.

### Q: What happens if the AI service is unavailable?
**A**: The system continues to collect updates but without AI analysis. Content is stored for later processing.

### Q: Can I add custom regulatory sources?
**A**: Yes! Follow the "Adding New Sources" guide in the Development section.

### Q: Is there a limit to the number of updates stored?
**A**: No hard limit, but automatic cleanup removes old entries (configurable, default 90 days).

### Q: How accurate is the sector relevance scoring?
**A**: Scoring is based on AI analysis of content with authority context. Accuracy improves with more specific content.

---

## 📞 Support

### Getting Help

- **Documentation**: This README + `/docs` folder
- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for questions
- **Health Check**: Visit `/test` for system diagnostics

### Common Issues

1. **"AI analysis unavailable"**: Check `GROQ_API_KEY` environment variable
2. **"Database connection failed"**: Check `DATABASE_URL` or use JSON fallback
3. **"No updates found"**: Check internet connectivity and source availability
4. **"Scraping failed"**: Some websites may have anti-bot protection

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Groq** for **AI** analysis capabilities
- **UK Regulatory Authorities** for public data availability
- **Open Source Community** for excellent libraries and tools
- **Financial Services Industry** for regulatory transparency

---

<div align="center">

**⭐ Star this repository if it helps your regulatory compliance efforts!**

[🚀 Deploy Now](https://vercel.com/new) | [📖 Documentation](./docs/) | [🐛 Report Bug](../../issues) | [💡 Request Feature](../../issues)

</div>
