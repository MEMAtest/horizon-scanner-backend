require('dotenv').config()

const { ingestFcaHandbook } = require('../src/services/handbookIngestionService')

function parseArgs(argv) {
  const options = {
    sourcebooks: []
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg.startsWith('--sourcebooks=')) {
      options.sourcebooks = arg.split('=')[1].split(',').map(item => item.trim()).filter(Boolean)
    } else if (arg === '--sourcebooks' || arg === '--sourcebook') {
      const value = argv[i + 1]
      if (value) {
        options.sourcebooks = value.split(',').map(item => item.trim()).filter(Boolean)
        i += 1
      }
    } else if (arg.startsWith('--max-sourcebooks=')) {
      options.maxSourcebooks = Number(arg.split('=')[1])
    } else if (arg === '--max-sourcebooks') {
      options.maxSourcebooks = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--max-chapters=')) {
      options.maxChapters = Number(arg.split('=')[1])
    } else if (arg === '--max-chapters') {
      options.maxChapters = Number(argv[i + 1])
      i += 1
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    }
  }

  return options
}

async function run() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log('Usage: node scripts/ingest-fca-handbook.js [options]')
    console.log('')
    console.log('Options:')
    console.log('  --sourcebooks=PRIN,SYSC    Limit to sourcebooks (comma-separated)')
    console.log('  --max-sourcebooks=3        Limit number of sourcebooks')
    console.log('  --max-chapters=10          Limit chapters per sourcebook')
    console.log('')
    process.exit(0)
  }

  console.log('Starting FCA handbook ingestion...')

  try {
    const stats = await ingestFcaHandbook(options)
    console.log('FCA handbook ingestion complete.')
    console.log(`Sourcebooks: ${stats.sourcebooks}`)
    console.log(`Chapters: ${stats.chapters}`)
    console.log(`Sections: ${stats.sections}`)
    console.log(`Provisions: ${stats.provisions}`)
    process.exit(0)
  } catch (error) {
    console.error('FCA handbook ingestion failed:', error.message)
    process.exit(1)
  }
}

run()
