function applyStatsMethods(ServiceClass) {
  ServiceClass.prototype.resetStats = function() {
    this.processingStats = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: 0,
      startTime: Date.now(),
      bySource: {},
      byType: {
        rss: 0,
        deepScraping: 0,
        international: 0,
        fatf: 0,
        fca: 0,
        simple: 0
      }
    }
  }

  ServiceClass.prototype.logComprehensiveStats = function() {
    const elapsed = Date.now() - this.processingStats.startTime
    const minutes = Math.round(elapsed / 60000)
    const seconds = Math.round((elapsed % 60000) / 1000)

    console.log('\n' + '='.repeat(60))
    console.log('📊 COMPREHENSIVE DATA COLLECTION STATISTICS')
    console.log('='.repeat(60))
    console.log(`✅ Processed: ${this.processingStats.processed}`)
    console.log(`⏭️ Skipped: ${this.processingStats.skipped}`)
    console.log(`❌ Errors: ${this.processingStats.errors}`)
    console.log(`⏱️ Duration: ${minutes}m ${seconds}s`)
    console.log('')
    console.log('📊 By Type:')
    console.log(`   🏛️ FCA Advanced: ${this.processingStats.byType.fca}`)
    console.log(`   🌍 FATF: ${this.processingStats.byType.fatf}`)
    console.log(`   🌐 International: ${this.processingStats.byType.international}`)
    console.log(`   📋 Simple (TPR/SFO): ${this.processingStats.byType.simple}`)
    console.log(`   📡 RSS Feeds: ${this.processingStats.byType.rss}`)
    console.log(`   🕷️ Deep Scraping: ${this.processingStats.byType.deepScraping}`)
    console.log('')
    console.log('📊 By Source:')
    Object.entries(this.processingStats.bySource).forEach(([source, stats]) => {
      console.log(`   ${source}: ${stats.processed} items, ${stats.errors} errors`)
    })
    console.log('='.repeat(60))
  }
}

module.exports = applyStatsMethods
