const VERSION_SUFFIX = globalThis.__WB_VERSION__ || ''
const withVersion = (path) => `${path}${VERSION_SUFFIX}`

class WeeklyBriefingApp {
  constructor() {
    console.log('[WeeklyBriefing] 🏗️ Constructor called')

    this.state = {
      current: window.__SMART_BRIEFING__ || null,
      recent: window.__SMART_BRIEFING_LIST__ || [],
      polling: null,
      previewRange: null,
      annotations: [],
      annotationFilter: 'all',
      annotationVisibility: ['team', 'all'],
      metrics: null
    }
    console.log('[WeeklyBriefing] ✓ State initialized:', {
      hasCurrent: Boolean(this.state.current),
      recentCount: this.state.recent.length
    })

    this.dom = {
      assembleBtn: document.getElementById('assembleBtn'),
      printBtn: document.getElementById('printBtn'),
      refreshBtn: document.getElementById('refreshBtn'),
      statusToast: document.getElementById('statusToast'),
      runStatusEl: document.getElementById('runStatus'),
      metaEl: document.getElementById('briefingMeta'),
      assembleModal: document.getElementById('assembleModal'),
      previewSummaryEl: document.getElementById('previewSummary'),
      previewStartInput: document.getElementById('previewStart'),
      previewEndInput: document.getElementById('previewEnd'),
      previewForceCheckbox: document.getElementById('previewForce'),
      refreshPreviewBtn: document.getElementById('refreshPreview'),
      previewQuickButtons: document.querySelectorAll('.preview-quick-btn'),
      confirmBtn: document.getElementById('confirmAssemble'),
      cancelBtn: document.getElementById('cancelAssemble'),
      annotationFilterEl: document.getElementById('annotationFilter'),
      annotationListEl: document.getElementById('annotationList'),
      addAnnotationBtn: document.getElementById('addAnnotationBtn'),
      annotationModal: document.getElementById('annotationModal'),
      annotationForm: document.getElementById('annotationForm'),
      cancelAnnotationBtn: document.getElementById('cancelAnnotation'),
      annotationUpdateOptions: document.getElementById('annotationUpdateOptions'),
      metricsRunsEl: document.getElementById('metricRuns'),
      metricsCacheEl: document.getElementById('metricCache'),
      metricsTokensEl: document.getElementById('metricTokens'),
      metricsDurationEl: document.getElementById('metricDuration'),
      quickNoteModal: document.getElementById('quickNoteModal'),
      quickNoteForm: document.getElementById('quickNoteForm'),
      quickNoteRecipientInput: document.getElementById('quickNoteRecipient'),
      quickNoteFirmInput: document.getElementById('quickNoteFirm'),
      quickNoteSenderInput: document.getElementById('quickNoteSender'),
      quickNoteContentInput: document.getElementById('quickNoteContent'),
      quickNoteCopyBtn: document.getElementById('copyQuickNote'),
      quickNoteCancelBtn: document.getElementById('cancelQuickNote'),
      quickNoteSaveBtn: document.getElementById('saveQuickNote')
    }

    this._fallbackAttempts = new Set()
    console.log('[WeeklyBriefing] ✓ DOM elements cached:', {
      hasAssembleBtn: Boolean(this.dom.assembleBtn),
      hasPrintBtn: Boolean(this.dom.printBtn),
      hasRefreshBtn: Boolean(this.dom.refreshBtn),
      hasModal: Boolean(this.dom.assembleModal)
    })

    const config = window.__SMART_BRIEFING_CONFIG__ || {}
    this.MAX_HIGHLIGHT_UPDATES = Number(config.maxHighlightUpdates) || 10
    this.MAX_UPDATES_PER_GROUP = Number(config.maxUpdatesPerGroup) || 4

    this.highlightThemes = {
      enforcement: { key: 'enforcement', label: 'Enforcements & Penalties', accent: '#dc2626', tint: '#fee2e2' },
      consultation: { key: 'consultation', label: 'Consultations & Calls for Input', accent: '#0284c7', tint: '#e0f2fe' },
      speech: { key: 'speech', label: 'Speeches & Remarks', accent: '#7c3aed', tint: '#ede9fe' },
      other: { key: 'other', label: 'Strategic Signals', accent: '#334155', tint: '#e2e8f0' }
    }
    this.highlightCategoryOrder = ['enforcement', 'consultation', 'speech', 'other']

    this.quickNoteElementsReady = Boolean(
      this.dom.quickNoteModal &&
      this.dom.quickNoteForm &&
      this.dom.quickNoteContentInput
    )
    this.QUICK_NOTE_STORAGE_KEY = 'weekly_quick_note_defaults_v1'

    this.quickNoteState = {
      activeUpdateId: null,
      activeUpdate: null,
      base: null,
      userEdited: false,
      defaults: {},
      lastGeneratedContent: ''
    }

    console.log('[WeeklyBriefing] ✓ Constructor complete, calling initialize()')
    this.initialize()
  }

  async initialize() {
    console.log('[WeeklyBriefing] 🔄 Initialize method called')
    this.quickNoteState.defaults = this.loadQuickNoteDefaults()
    console.log('[WeeklyBriefing] ✓ Quick note defaults loaded')

    this.attachEventListeners()
    console.log('[WeeklyBriefing] ✓ Event listeners attached')

    if (this.state.current) {
      console.log('[WeeklyBriefing] ℹ️ Current briefing exists, rendering...')
      this.renderBriefing(this.state.current)
      this.refreshAnnotationsFromServer().catch(error => {
        console.warn('[WeeklyBriefing] ⚠️ Annotation refresh failed:', error.message)
      })
    } else {
      console.log('[WeeklyBriefing] ℹ️ No current briefing, attempting to load latest...')
      this.loadLatestBriefing().catch(error => {
        console.warn('[WeeklyBriefing] ⚠️ Initial briefing load failed:', error.message)
      })
    }

    this.renderRecentBriefings()
    console.log('[WeeklyBriefing] ✓ Recent briefings rendered')

    this.loadMetrics()
    console.log('[WeeklyBriefing] ✓ Metrics loading initiated')

    console.log('[WeeklyBriefing] ✅ Initialize complete')
  }
}

async function applyMixins(target) {
  console.log('[WeeklyBriefing] 🔌 Starting mixin loading...')

  const resolveMixin = async (path, exportName) => {
    console.log(`[WeeklyBriefing] 📥 Loading mixin: ${exportName} from ${path}`)
    try {
      const mod = await import(withVersion(path))
      if (exportName && typeof mod[exportName] === 'function') {
        console.log(`[WeeklyBriefing] ✓ Mixin loaded: ${exportName}`)
        return mod[exportName]
      }
      if (mod?.default) {
        const candidate = mod.default
        if (typeof candidate === 'function') {
          console.log(`[WeeklyBriefing] ✓ Mixin loaded: ${exportName} (via default)`)
          return candidate
        }
        if (exportName && typeof candidate[exportName] === 'function') {
          console.log(`[WeeklyBriefing] ✓ Mixin loaded: ${exportName} (via default.${exportName})`)
          return candidate[exportName]
        }
      }
      throw new Error(`Mixin ${exportName || 'default'} missing in ${path}`)
    } catch (error) {
      console.error(`[WeeklyBriefing] ❌ Failed to load mixin ${exportName}:`, error)
      throw error
    }
  }

  console.log('[WeeklyBriefing] 📦 Loading all mixins in parallel...')
  const [
    applyUtilsMixin,
    applyHighlightsMixin,
    applyQuickNoteMixin,
    applyRenderMixin,
    applyAnnotationsMixin,
    applyMetricsMixin,
    applyDataMixin,
    applyModalsMixin,
    applyEventsMixin
  ] = await Promise.all([
    resolveMixin('./modules/utils.js', 'applyUtilsMixin'),
    resolveMixin('./modules/highlights.js', 'applyHighlightsMixin'),
    resolveMixin('./modules/quickNote.js', 'applyQuickNoteMixin'),
    resolveMixin('./modules/renderers.js', 'applyRenderMixin'),
    resolveMixin('./modules/annotations.js', 'applyAnnotationsMixin'),
    resolveMixin('./modules/metrics.js', 'applyMetricsMixin'),
    resolveMixin('./modules/data.js', 'applyDataMixin'),
    resolveMixin('./modules/modals.js', 'applyModalsMixin'),
    resolveMixin('./modules/events.js', 'applyEventsMixin')
  ])
  console.log('[WeeklyBriefing] ✓ All mixins loaded successfully')

  console.log('[WeeklyBriefing] 🔧 Applying mixins to class...')
  applyUtilsMixin(target)
  console.log('[WeeklyBriefing] ✓ Applied utils mixin')
  applyHighlightsMixin(target)
  console.log('[WeeklyBriefing] ✓ Applied highlights mixin')
  applyQuickNoteMixin(target)
  console.log('[WeeklyBriefing] ✓ Applied quick note mixin')
  applyRenderMixin(target)
  console.log('[WeeklyBriefing] ✓ Applied render mixin')
  applyAnnotationsMixin(target)
  console.log('[WeeklyBriefing] ✓ Applied annotations mixin')
  applyMetricsMixin(target)
  console.log('[WeeklyBriefing] ✓ Applied metrics mixin')
  applyDataMixin(target)
  console.log('[WeeklyBriefing] ✓ Applied data mixin')
  applyModalsMixin(target)
  console.log('[WeeklyBriefing] ✓ Applied modals mixin')
  applyEventsMixin(target)
  console.log('[WeeklyBriefing] ✓ Applied events mixin')
  console.log('[WeeklyBriefing] ✅ All mixins applied successfully')
}

export async function loadWeeklyBriefingApp() {
  console.log('[WeeklyBriefing] 🚀 loadWeeklyBriefingApp() called')
  try {
    await applyMixins(WeeklyBriefingApp)
    console.log('[WeeklyBriefing] ✓ Mixins applied, returning class')
    return WeeklyBriefingApp
  } catch (error) {
    console.error('[WeeklyBriefing] ❌ Failed to load app:', error)
    throw error
  }
}
