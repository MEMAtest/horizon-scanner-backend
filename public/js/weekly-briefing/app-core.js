import { applyUtilsMixin } from './modules/utils.js'
import { applyHighlightsMixin } from './modules/highlights.js'
import { applyQuickNoteMixin } from './modules/quickNote.js'
import { applyRenderMixin } from './modules/renderers.js'
import { applyAnnotationsMixin } from './modules/annotations.js'
import { applyMetricsMixin } from './modules/metrics.js'
import { applyDataMixin } from './modules/data.js'
import { applyModalsMixin } from './modules/modals.js'
import { applyEventsMixin } from './modules/events.js'

class WeeklyBriefingApp {
  constructor() {
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

    this.initialize()
  }

  async initialize() {
    this.quickNoteState.defaults = this.loadQuickNoteDefaults()
    this.attachEventListeners()

    if (this.state.current) {
      this.renderBriefing(this.state.current)
      this.refreshAnnotationsFromServer().catch(error => {
        console.warn('Annotation refresh failed:', error.message)
      })
    } else {
      this.loadLatestBriefing().catch(error => {
        console.warn('Initial briefing load failed:', error.message)
      })
    }

    this.renderRecentBriefings()
    this.loadMetrics()
  }
}

applyUtilsMixin(WeeklyBriefingApp)
applyHighlightsMixin(WeeklyBriefingApp)
applyQuickNoteMixin(WeeklyBriefingApp)
applyRenderMixin(WeeklyBriefingApp)
applyAnnotationsMixin(WeeklyBriefingApp)
applyMetricsMixin(WeeklyBriefingApp)
applyDataMixin(WeeklyBriefingApp)
applyModalsMixin(WeeklyBriefingApp)
applyEventsMixin(WeeklyBriefingApp)

export { WeeklyBriefingApp }
