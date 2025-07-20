// src/sources/enhancedSources.js
// Enhanced Source Definitions for Comprehensive Regulatory Data Collection
// Phase 2: Advanced Web Scraping & International Coverage

/**
 * Enhanced Source Configuration
 * Defines comprehensive scraping strategies for regulatory authorities
 * Supports RSS feeds + deep website scraping + international sources
 */

// UK REGULATORY AUTHORITIES - ENHANCED CONFIGURATIONS
const UK_ENHANCED_SOURCES = {
    FCA: {
        name: 'Financial Conduct Authority',
        authority: 'FCA',
        country: 'UK',
        baseUrl: 'https://www.fca.org.uk',
        priority: 'HIGH',
        
        // Enhanced RSS feeds
        rssFeeds: [
            {
                url: 'https://www.fca.org.uk/news/rss.xml',
                type: 'news',
                description: 'FCA News & Updates'
            },
            {
                url: 'https://www.fca.org.uk/publication/rss.xml',
                type: 'publications',
                description: 'FCA Publications'
            }
        ],
        
        // Deep website scraping targets
        deepScraping: {
            consultations: {
                url: 'https://www.fca.org.uk/publications?category%5B%5D=consultation&category%5B%5D=guidance-consultation',
                selectors: {
                    items: '.search-results .search-result',
                    title: '.search-result__title a',
                    url: '.search-result__title a',
                    date: '.search-result__date',
                    summary: '.search-result__summary',
                    deadline: '.consultation-deadline',
                    status: '.consultation-status'
                },
                pagination: {
                    nextPage: '.pagination .pagination__next',
                    maxPages: 10
                }
            },
            
            policyStatements: {
                url: 'https://www.fca.org.uk/publications?category%5B%5D=policy-statement',
                selectors: {
                    items: '.search-results .search-result',
                    title: '.search-result__title a',
                    url: '.search-result__title a',
                    date: '.search-result__date',
                    summary: '.search-result__summary'
                }
            },
            
            guidance: {
                url: 'https://www.fca.org.uk/publications?category%5B%5D=guidance',
                selectors: {
                    items: '.search-results .search-result',
                    title: '.search-result__title a',
                    url: '.search-result__title a',
                    date: '.search-result__date',
                    summary: '.search-result__summary'
                }
            },
            
            speeches: {
                url: 'https://www.fca.org.uk/news/speeches',
                selectors: {
                    items: '.search-results .search-result',
                    title: '.search-result__title a',
                    url: '.search-result__title a',
                    date: '.search-result__date',
                    speaker: '.search-result__speaker',
                    summary: '.search-result__summary'
                }
            }
        },
        
        // Content enrichment rules
        enrichment: {
            deadlineExtraction: {
                patterns: [
                    /deadline[:\s]+(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{2,4})/i,
                    /responses?\s+by[:\s]+(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{2,4})/i,
                    /consultation\s+ends?[:\s]+(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{2,4})/i
                ]
            },
            documentTypes: {
                patterns: {
                    'Consultation Paper': /CP\d+\/\d+|consultation\s+paper/i,
                    'Policy Statement': /PS\d+\/\d+|policy\s+statement/i,
                    'Guidance': /FG\d+\/\d+|guidance/i,
                    'Technical Standard': /technical\s+standard/i,
                    'Discussion Paper': /DP\d+\/\d+|discussion\s+paper/i,
                    'Market Study': /market\s+study/i,
                    'Enforcement Notice': /enforcement|penalty|fine/i
                }
            },
            sectorMapping: {
                'Banking': ['bank', 'credit institution', 'deposit', 'lending'],
                'Investment Management': ['investment', 'fund management', 'asset management'],
                'Insurance': ['insurance', 'insurer', 'underwriting', 'actuarial'],
                'Consumer Credit': ['consumer credit', 'payday', 'mortgage'],
                'Payments': ['payment', 'e-money', 'payment institution'],
                'Capital Markets': ['market', 'trading', 'securities', 'listing'],
                'Pensions': ['pension', 'retirement', 'annuity'],
                'Fintech': ['fintech', 'cryptocurrency', 'digital asset']
            }
        },
        
        scrapingConfig: {
            rateLimit: 2000, // 2 seconds between requests
            timeout: 30000,
            retries: 3,
            userAgent: 'Mozilla/5.0 (compatible; RegulatoryScanner/2.0)',
            respectRobots: true
        }
    },

    BOE: {
        name: 'Bank of England',
        authority: 'BoE',
        country: 'UK',
        baseUrl: 'https://www.bankofengland.co.uk',
        priority: 'HIGH',
        
        rssFeeds: [
            {
                url: 'https://www.bankofengland.co.uk/news/rss',
                type: 'news',
                description: 'BoE News'
            },
            {
                url: 'https://www.bankofengland.co.uk/publications/rss',
                type: 'publications',
                description: 'BoE Publications'
            }
        ],
        
        deepScraping: {
            consultations: {
                url: 'https://www.bankofengland.co.uk/prudential-regulation/publication',
                selectors: {
                    items: '.publication-item',
                    title: '.publication-title a',
                    url: '.publication-title a',
                    date: '.publication-date',
                    summary: '.publication-summary'
                }
            },
            
            speeches: {
                url: 'https://www.bankofengland.co.uk/news/speeches',
                selectors: {
                    items: '.speech-item',
                    title: '.speech-title a',
                    url: '.speech-title a',
                    date: '.speech-date',
                    speaker: '.speech-speaker'
                }
            },
            
            policyStatements: {
                url: 'https://www.bankofengland.co.uk/prudential-regulation/publication?PublicationType=Policy+statement',
                selectors: {
                    items: '.publication-item',
                    title: '.publication-title a',
                    url: '.publication-title a',
                    date: '.publication-date'
                }
            }
        },
        
        enrichment: {
            deadlineExtraction: {
                patterns: [
                    /deadline[:\s]+(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{2,4})/i,
                    /responses?\s+by[:\s]+(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{2,4})/i
                ]
            },
            documentTypes: {
                patterns: {
                    'Consultation Paper': /CP\d+\/\d+|consultation/i,
                    'Policy Statement': /PS\d+\/\d+|policy\s+statement/i,
                    'Supervisory Statement': /SS\d+\/\d+|supervisory\s+statement/i,
                    'Speech': /speech/i,
                    'Working Paper': /working\s+paper/i
                }
            }
        },
        
        scrapingConfig: {
            rateLimit: 2000,
            timeout: 30000,
            retries: 3
        }
    },

    PRA: {
        name: 'Prudential Regulation Authority',
        authority: 'PRA',
        country: 'UK',
        baseUrl: 'https://www.bankofengland.co.uk/prudential-regulation',
        priority: 'HIGH',
        
        rssFeeds: [
            {
                url: 'https://www.bankofengland.co.uk/prudential-regulation/rss',
                type: 'publications',
                description: 'PRA Publications'
            }
        ],
        
        deepScraping: {
            consultations: {
                url: 'https://www.bankofengland.co.uk/prudential-regulation/publication?PublicationType=Consultation+paper',
                selectors: {
                    items: '.publication-item',
                    title: '.publication-title a',
                    url: '.publication-title a',
                    date: '.publication-date',
                    summary: '.publication-summary'
                }
            },
            
            policyStatements: {
                url: 'https://www.bankofengland.co.uk/prudential-regulation/publication?PublicationType=Policy+statement',
                selectors: {
                    items: '.publication-item',
                    title: '.publication-title a',
                    url: '.publication-title a',
                    date: '.publication-date'
                }
            },
            
            supervisoryStatements: {
                url: 'https://www.bankofengland.co.uk/prudential-regulation/publication?PublicationType=Supervisory+statement',
                selectors: {
                    items: '.publication-item',
                    title: '.publication-title a',
                    url: '.publication-title a',
                    date: '.publication-date'
                }
            }
        },
        
        enrichment: {
            documentTypes: {
                patterns: {
                    'Consultation Paper': /CP\d+\/\d+|consultation/i,
                    'Policy Statement': /PS\d+\/\d+|policy/i,
                    'Supervisory Statement': /SS\d+\/\d+|supervisory/i
                }
            },
            sectorMapping: {
                'Banking': ['bank', 'credit institution', 'prudential'],
                'Insurance': ['insurance', 'solvency', 'underwriting']
            }
        },
        
        scrapingConfig: {
            rateLimit: 2000,
            timeout: 30000,
            retries: 3
        }
    }
};

// INTERNATIONAL REGULATORY SOURCES
const INTERNATIONAL_SOURCES = {
    FATF: {
        name: 'Financial Action Task Force',
        authority: 'FATF',
        country: 'International',
        baseUrl: 'https://www.fatf-gafi.org',
        priority: 'MEDIUM',
        
        deepScraping: {
            publications: {
                url: 'https://www.fatf-gafi.org/en/publications.html',
                selectors: {
                    items: '.publication-item',
                    title: '.publication-title a',
                    url: '.publication-title a',
                    date: '.publication-date',
                    type: '.publication-type'
                }
            },
            
            news: {
                url: 'https://www.fatf-gafi.org/en/topics/fatf-news.html',
                selectors: {
                    items: '.news-item',
                    title: '.news-title a',
                    url: '.news-title a',
                    date: '.news-date'
                }
            }
        },
        
        enrichment: {
            documentTypes: {
                patterns: {
                    'Guidance': /guidance|recommendation/i,
                    'Report': /report|assessment/i,
                    'Standard': /standard|requirement/i,
                    'Typology': /typology|case\s+study/i
                }
            },
            sectorMapping: {
                'AML/CFT': ['money laundering', 'terrorist financing', 'aml', 'cft'],
                'Banking': ['bank', 'financial institution'],
                'Virtual Assets': ['virtual asset', 'cryptocurrency', 'digital currency']
            }
        },
        
        scrapingConfig: {
            rateLimit: 3000, // Slower for international
            timeout: 45000,
            retries: 2
        }
    },

    ECB: {
        name: 'European Central Bank',
        authority: 'ECB',
        country: 'EU',
        baseUrl: 'https://www.ecb.europa.eu',
        priority: 'MEDIUM',
        
        rssFeeds: [
            {
                url: 'https://www.ecb.europa.eu/rss/news.xml',
                type: 'news',
                description: 'ECB News'
            }
        ],
        
        deepScraping: {
            publications: {
                url: 'https://www.ecb.europa.eu/pub/html/index.en.html',
                selectors: {
                    items: '.publication-item',
                    title: '.publication-title a',
                    url: '.publication-title a',
                    date: '.publication-date'
                }
            }
        },
        
        enrichment: {
            documentTypes: {
                patterns: {
                    'Regulation': /regulation|directive/i,
                    'Opinion': /opinion|recommendation/i,
                    'Report': /report|review/i
                }
            }
        },
        
        scrapingConfig: {
            rateLimit: 3000,
            timeout: 45000,
            retries: 2
        }
    },

    EBA: {
        name: 'European Banking Authority',
        authority: 'EBA',
        country: 'EU',
        baseUrl: 'https://www.eba.europa.eu',
        priority: 'MEDIUM',
        
        rssFeeds: [
            {
                url: 'https://www.eba.europa.eu/rss/news.xml',
                type: 'news',
                description: 'EBA News'
            }
        ],
        
        deepScraping: {
            consultations: {
                url: 'https://www.eba.europa.eu/regulation-and-policy/consultation-papers',
                selectors: {
                    items: '.consultation-item',
                    title: '.consultation-title a',
                    url: '.consultation-title a',
                    date: '.consultation-date',
                    deadline: '.consultation-deadline'
                }
            },
            
            guidelines: {
                url: 'https://www.eba.europa.eu/regulation-and-policy/guidelines',
                selectors: {
                    items: '.guideline-item',
                    title: '.guideline-title a',
                    url: '.guideline-title a',
                    date: '.guideline-date'
                }
            }
        },
        
        enrichment: {
            documentTypes: {
                patterns: {
                    'Consultation Paper': /consultation/i,
                    'Guideline': /guideline|guidance/i,
                    'Technical Standard': /technical\s+standard|rts|its/i,
                    'Opinion': /opinion/i
                }
            }
        },
        
        scrapingConfig: {
            rateLimit: 3000,
            timeout: 45000,
            retries: 2
        }
    },

    ESMA: {
        name: 'European Securities and Markets Authority',
        authority: 'ESMA',
        country: 'EU',
        baseUrl: 'https://www.esma.europa.eu',
        priority: 'LOW',
        
        rssFeeds: [
            {
                url: 'https://www.esma.europa.eu/rss/news.xml',
                type: 'news',
                description: 'ESMA News'
            }
        ],
        
        deepScraping: {
            consultations: {
                url: 'https://www.esma.europa.eu/policy-activities/consultations',
                selectors: {
                    items: '.consultation-item',
                    title: '.consultation-title a',
                    url: '.consultation-title a',
                    date: '.consultation-date'
                }
            }
        },
        
        scrapingConfig: {
            rateLimit: 3000,
            timeout: 45000,
            retries: 2
        }
    },

    BCBS: {
        name: 'Basel Committee on Banking Supervision',
        authority: 'BCBS',
        country: 'International',
        baseUrl: 'https://www.bis.org/bcbs',
        priority: 'MEDIUM',
        
        deepScraping: {
            publications: {
                url: 'https://www.bis.org/bcbs/publ/',
                selectors: {
                    items: '.publication-item',
                    title: '.publication-title a',
                    url: '.publication-title a',
                    date: '.publication-date'
                }
            }
        },
        
        enrichment: {
            documentTypes: {
                patterns: {
                    'Consultation': /consultation/i,
                    'Standard': /standard|basel/i,
                    'Report': /report|survey/i,
                    'Guidance': /guidance|sound\s+practices/i
                }
            }
        },
        
        scrapingConfig: {
            rateLimit: 4000,
            timeout: 45000,
            retries: 2
        }
    }
};

// CONTENT VALIDATION RULES
const CONTENT_VALIDATION_RULES = {
    minimumLength: {
        title: 10,
        content: 50
    },
    
    requiredKeywords: [
        'regulation', 'regulatory', 'compliance', 'guidance', 'policy',
        'financial', 'banking', 'insurance', 'investment', 'supervision'
    ],
    
    spamIndicators: [
        'click here', 'buy now', 'limited time', 'act now',
        'congratulations', 'winner', 'prize', 'lottery'
    ],
    
    excludePatterns: [
        /test\s+page/i,
        /coming\s+soon/i,
        /under\s+construction/i,
        /404\s+error/i,
        /page\s+not\s+found/i
    ]
};

// DATA QUALITY RULES
const DATA_QUALITY_RULES = {
    deduplication: {
        titleSimilarityThreshold: 0.85,
        contentSimilarityThreshold: 0.90,
        urlExactMatch: true
    },
    
    contentEnrichment: {
        extractDeadlines: true,
        identifyDocumentTypes: true,
        mapToSectors: true,
        extractMetadata: true
    },
    
    validation: {
        requireTitle: true,
        requireDate: true,
        requireUrl: true,
        validateDateFormat: true,
        checkContentLength: true
    }
};

// EXPORT CONFIGURATION
module.exports = {
    // Source definitions
    UK_ENHANCED_SOURCES,
    INTERNATIONAL_SOURCES,
    
    // Get all sources combined
    getAllSources: () => ({
        ...UK_ENHANCED_SOURCES,
        ...INTERNATIONAL_SOURCES
    }),
    
    // Get sources by priority
    getSourcesByPriority: (priority) => {
        const allSources = { ...UK_ENHANCED_SOURCES, ...INTERNATIONAL_SOURCES };
        return Object.entries(allSources)
            .filter(([, config]) => config.priority === priority)
            .reduce((acc, [key, config]) => ({ ...acc, [key]: config }), {});
    },
    
    // Get sources by country
    getSourcesByCountry: (country) => {
        const allSources = { ...UK_ENHANCED_SOURCES, ...INTERNATIONAL_SOURCES };
        return Object.entries(allSources)
            .filter(([, config]) => config.country === country)
            .reduce((acc, [key, config]) => ({ ...acc, [key]: config }), {});
    },
    
    // Quality and validation rules
    CONTENT_VALIDATION_RULES,
    DATA_QUALITY_RULES,
    
    // Helper functions
    getSourceConfig: (authorityCode) => {
        const allSources = { ...UK_ENHANCED_SOURCES, ...INTERNATIONAL_SOURCES };
        return allSources[authorityCode] || null;
    },
    
    // Get scraping priorities
    getScrapingPriorities: () => ({
        HIGH: Object.keys({ ...UK_ENHANCED_SOURCES }).filter(key => 
            ({ ...UK_ENHANCED_SOURCES })[key].priority === 'HIGH'
        ),
        MEDIUM: Object.keys({ ...UK_ENHANCED_SOURCES, ...INTERNATIONAL_SOURCES }).filter(key => 
            ({ ...UK_ENHANCED_SOURCES, ...INTERNATIONAL_SOURCES })[key].priority === 'MEDIUM'
        ),
        LOW: Object.keys({ ...UK_ENHANCED_SOURCES, ...INTERNATIONAL_SOURCES }).filter(key => 
            ({ ...UK_ENHANCED_SOURCES, ...INTERNATIONAL_SOURCES })[key].priority === 'LOW'
        )
    })
};