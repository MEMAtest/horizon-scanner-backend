// ==========================================
// 🛠️ UI Utilities - Phase 4
// src/utils/uiUtils.js
// ==========================================

/**
 * UI Utilities for Regulatory Intelligence Platform
 * Provides common functions for DOM manipulation, animations, and UI state management
 */

class UIUtils {
  constructor() {
    this.breakpoints = {
      mobile: 480,
      tablet: 768,
      desktop: 1024,
      large: 1200
    }

    this.animationClasses = {
      fadeIn: 'animate-fade-in',
      fadeOut: 'animate-fade-out',
      slideIn: 'animate-slide-in',
      slideOut: 'animate-slide-out',
      pulse: 'animate-pulse',
      bounce: 'animate-bounce'
    }

    this.init()
  }

  init() {
    this.setupGlobalEventListeners()
    this.setupIntersectionObserver()
    this.setupResizeObserver()
  }

  // ==========================================
  // DOM UTILITIES
  // ==========================================

  /**
     * Safe DOM element selection with error handling
     */
  select(selector, context = document) {
    try {
      return context.querySelector(selector)
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error)
      return null
    }
  }

  selectAll(selector, context = document) {
    try {
      return Array.from(context.querySelectorAll(selector))
    } catch (error) {
      console.warn(`Invalid selector: ${selector}`, error)
      return []
    }
  }

  /**
     * Create element with attributes and content
     */
  createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag)

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue
        })
      } else if (key.startsWith('aria-') || key.startsWith('data-')) {
        element.setAttribute(key, value)
      } else {
        element[key] = value
      }
    })

    if (content) {
      if (typeof content === 'string') {
        element.innerHTML = content
      } else if (content instanceof Node) {
        element.appendChild(content)
      }
    }

    return element
  }

  /**
     * Safe element removal with animation
     */
  removeElement(element, animated = true) {
    if (!element || !element.parentNode) return

    if (animated) {
      this.fadeOut(element, () => {
        element.remove()
      })
    } else {
      element.remove()
    }
  }

  /**
     * Toggle element visibility with accessibility
     */
  toggleVisibility(element, visible = null) {
    if (!element) return

    const isVisible = visible !== null ? visible : element.style.display === 'none'

    if (isVisible) {
      element.style.display = ''
      element.setAttribute('aria-hidden', 'false')
      this.fadeIn(element)
    } else {
      element.setAttribute('aria-hidden', 'true')
      this.fadeOut(element, () => {
        element.style.display = 'none'
      })
    }

    return isVisible
  }

  // ==========================================
  // ANIMATION UTILITIES
  // ==========================================

  /**
     * Fade in animation
     */
  fadeIn(element, callback = null, duration = 300) {
    if (!element) return

    element.style.opacity = '0'
    element.style.display = ''
    element.style.transition = `opacity ${duration}ms ease`

    requestAnimationFrame(() => {
      element.style.opacity = '1'
    })

    if (callback) {
      setTimeout(callback, duration)
    }
  }

  /**
     * Fade out animation
     */
  fadeOut(element, callback = null, duration = 300) {
    if (!element) return

    element.style.transition = `opacity ${duration}ms ease`
    element.style.opacity = '0'

    setTimeout(() => {
      if (callback) callback()
    }, duration)
  }

  /**
     * Slide animation
     */
  slideToggle(element, direction = 'down', duration = 300) {
    if (!element) return

    const isVisible = element.style.maxHeight && element.style.maxHeight !== '0px'

    if (isVisible) {
      // Slide up
      element.style.transition = `max-height ${duration}ms ease`
      element.style.maxHeight = '0px'
      element.style.overflow = 'hidden'

      setTimeout(() => {
        element.style.display = 'none'
      }, duration)
    } else {
      // Slide down
      element.style.display = ''
      const height = element.scrollHeight
      element.style.maxHeight = '0px'
      element.style.overflow = 'hidden'
      element.style.transition = `max-height ${duration}ms ease`

      requestAnimationFrame(() => {
        element.style.maxHeight = height + 'px'
      })

      setTimeout(() => {
        element.style.maxHeight = ''
        element.style.overflow = ''
      }, duration)
    }

    return !isVisible
  }

  /**
     * Pulse animation for attention
     */
  pulse(element, count = 3, duration = 600) {
    if (!element) return

    element.classList.add(this.animationClasses.pulse)

    setTimeout(() => {
      element.classList.remove(this.animationClasses.pulse)
    }, duration * count)
  }

  /**
     * Number animation (count up)
     */
  animateNumber(element, startValue, endValue, duration = 1000, formatter = null) {
    if (!element) return

    const startTime = performance.now()
    const difference = endValue - startValue

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (difference * easeOutCubic)

      const displayValue = formatter ? formatter(currentValue) : Math.round(currentValue)
      element.textContent = displayValue

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  // ==========================================
  // RESPONSIVE UTILITIES
  // ==========================================

  /**
     * Get current breakpoint
     */
  getCurrentBreakpoint() {
    const width = window.innerWidth

    if (width >= this.breakpoints.large) return 'large'
    if (width >= this.breakpoints.desktop) return 'desktop'
    if (width >= this.breakpoints.tablet) return 'tablet'
    return 'mobile'
  }

  /**
     * Check if viewport matches breakpoint
     */
  matchesBreakpoint(breakpoint) {
    const width = window.innerWidth
    return width >= this.breakpoints[breakpoint]
  }

  /**
     * Setup responsive event listener
     */
  onBreakpointChange(callback) {
    let currentBreakpoint = this.getCurrentBreakpoint()

    const checkBreakpoint = () => {
      const newBreakpoint = this.getCurrentBreakpoint()
      if (newBreakpoint !== currentBreakpoint) {
        currentBreakpoint = newBreakpoint
        callback(newBreakpoint)
      }
    }

    window.addEventListener('resize', this.debounce(checkBreakpoint, 100))
    return currentBreakpoint
  }

  // ==========================================
  // EVENT UTILITIES
  // ==========================================

  /**
     * Debounce function
     */
  debounce(func, wait, immediate = false) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        timeout = null
        if (!immediate) func(...args)
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func(...args)
    }
  }

  /**
     * Throttle function
     */
  throttle(func, limit) {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => {
          inThrottle = false
        }, limit)
      }
    }
  }

  /**
     * Safe event listener attachment
     */
  addEventListener(element, event, handler, options = {}) {
    if (!element || typeof handler !== 'function') return

    const wrappedHandler = (e) => {
      try {
        handler(e)
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error)
      }
    }

    element.addEventListener(event, wrappedHandler, options)

    // Return cleanup function
    return () => element.removeEventListener(event, wrappedHandler, options)
  }

  /**
     * Delegate event handling
     */
  delegate(container, selector, event, handler) {
    return this.addEventListener(container, event, (e) => {
      const target = e.target.closest(selector)
      if (target && container.contains(target)) {
        handler.call(target, e)
      }
    })
  }

  // ==========================================
  // ACCESSIBILITY UTILITIES
  // ==========================================

  /**
     * Manage focus trap for modals/dropdowns
     */
  createFocusTrap(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    // Return cleanup function
    return () => container.removeEventListener('keydown', handleTabKey)
  }

  /**
     * Set up proper ARIA attributes
     */
  setupAccessibility(element, config = {}) {
    const {
      role,
      label,
      describedBy,
      expanded,
      controls,
      live
    } = config

    if (role) element.setAttribute('role', role)
    if (label) element.setAttribute('aria-label', label)
    if (describedBy) element.setAttribute('aria-describedby', describedBy)
    if (expanded !== undefined) element.setAttribute('aria-expanded', expanded)
    if (controls) element.setAttribute('aria-controls', controls)
    if (live) element.setAttribute('aria-live', live)
  }

  /**
     * Announce to screen readers
     */
  announce(message, priority = 'polite') {
    const announcer = document.getElementById('ui-announcer') || this.createAnnouncer()
    announcer.setAttribute('aria-live', priority)
    announcer.textContent = message

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = ''
    }, 1000)
  }

  createAnnouncer() {
    const announcer = this.createElement('div', {
      id: 'ui-announcer',
      className: 'sr-only',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    })
    document.body.appendChild(announcer)
    return announcer
  }

  // ==========================================
  // FORM UTILITIES
  // ==========================================

  /**
     * Form validation with accessibility
     */
  validateForm(form, rules = {}) {
    const errors = {}
    const inputs = form.querySelectorAll('input, select, textarea')

    inputs.forEach(input => {
      const name = input.name
      const value = input.value.trim()
      const rule = rules[name]

      if (!rule) return

      // Clear previous errors
      this.clearFieldError(input)

      // Required validation
      if (rule.required && !value) {
        errors[name] = rule.requiredMessage || `${name} is required`
        this.showFieldError(input, errors[name])
        return
      }

      // Pattern validation
      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors[name] = rule.patternMessage || `${name} format is invalid`
        this.showFieldError(input, errors[name])
        return
      }

      // Custom validation
      if (rule.validate && value) {
        const customError = rule.validate(value)
        if (customError) {
          errors[name] = customError
          this.showFieldError(input, customError)
        }
      }
    })

    return Object.keys(errors).length === 0 ? null : errors
  }

  showFieldError(input, message) {
    input.classList.add('field-error')
    input.setAttribute('aria-invalid', 'true')

    let errorElement = input.parentNode.querySelector('.field-error-message')
    if (!errorElement) {
      errorElement = this.createElement('div', {
        className: 'field-error-message',
        role: 'alert'
      })
      input.parentNode.appendChild(errorElement)
    }

    errorElement.textContent = message
    input.setAttribute('aria-describedby', errorElement.id || 'field-error')
  }

  clearFieldError(input) {
    input.classList.remove('field-error')
    input.removeAttribute('aria-invalid')

    const errorElement = input.parentNode.querySelector('.field-error-message')
    if (errorElement) {
      errorElement.remove()
    }
  }

  // ==========================================
  // STORAGE UTILITIES
  // ==========================================

  /**
     * Safe localStorage operations
     */
  setStorage(key, value, useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage
      const serialized = JSON.stringify(value)
      storage.setItem(key, serialized)
      return true
    } catch (error) {
      console.warn('Storage operation failed:', error)
      return false
    }
  }

  getStorage(key, defaultValue = null, useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage
      const item = storage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn('Storage retrieval failed:', error)
      return defaultValue
    }
  }

  removeStorage(key, useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage
      storage.removeItem(key)
      return true
    } catch (error) {
      console.warn('Storage removal failed:', error)
      return false
    }
  }

  // ==========================================
  // LOADING STATES
  // ==========================================

  /**
     * Show loading spinner
     */
  showLoading(container, message = 'Loading...') {
    const loader = this.createElement('div', {
      className: 'ui-loader',
      'aria-label': message
    }, `
            <div class="ui-loader-spinner"></div>
            <div class="ui-loader-message">${message}</div>
        `)

    container.appendChild(loader)
    return loader
  }

  hideLoading(container) {
    const loader = container.querySelector('.ui-loader')
    if (loader) {
      this.fadeOut(loader, () => loader.remove())
    }
  }

  /**
     * Button loading state
     */
  setButtonLoading(button, loading = true, loadingText = 'Loading...') {
    if (!button) return

    if (loading) {
      button.dataset.originalText = button.textContent
      button.textContent = loadingText
      button.disabled = true
      button.classList.add('button-loading')
    } else {
      button.textContent = button.dataset.originalText || button.textContent
      button.disabled = false
      button.classList.remove('button-loading')
      delete button.dataset.originalText
    }
  }

  // ==========================================
  // GLOBAL EVENT LISTENERS
  // ==========================================

  setupGlobalEventListeners() {
    // Handle escape key globally
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscapeKey()
      }
    })

    // Handle outside clicks for dropdowns
    document.addEventListener('click', (e) => {
      this.handleOutsideClick(e)
    })

    // Handle resize events
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize()
    }, 100))
  }

  handleEscapeKey() {
    // Close any open dropdowns, modals, etc.
    const openDropdowns = this.selectAll('[aria-expanded="true"]')
    openDropdowns.forEach(element => {
      element.setAttribute('aria-expanded', 'false')
      const dropdown = document.getElementById(element.getAttribute('aria-controls'))
      if (dropdown) {
        dropdown.style.display = 'none'
      }
    })

    // Trigger custom escape event
    document.dispatchEvent(new CustomEvent('ui:escape'))
  }

  handleOutsideClick(e) {
    // Find any dropdowns that should close
    const dropdowns = this.selectAll('.dropdown, .menu, .popover')
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        const trigger = this.select(`[aria-controls="${dropdown.id}"]`)
        if (trigger && trigger.getAttribute('aria-expanded') === 'true') {
          trigger.setAttribute('aria-expanded', 'false')
          dropdown.style.display = 'none'
        }
      }
    })
  }

  handleResize() {
    // Trigger custom resize event with breakpoint info
    document.dispatchEvent(new CustomEvent('ui:resize', {
      detail: {
        breakpoint: this.getCurrentBreakpoint(),
        width: window.innerWidth,
        height: window.innerHeight
      }
    }))
  }

  // ==========================================
  // INTERSECTION OBSERVER
  // ==========================================

  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-viewport')
          } else {
            entry.target.classList.remove('in-viewport')
          }
        })
      }, {
        threshold: 0.1
      })
    }
  }

  observeElement(element) {
    if (this.intersectionObserver && element) {
      this.intersectionObserver.observe(element)
    }
  }

  unobserveElement(element) {
    if (this.intersectionObserver && element) {
      this.intersectionObserver.unobserve(element)
    }
  }

  // ==========================================
  // RESIZE OBSERVER
  // ==========================================

  setupResizeObserver() {
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        entries.forEach(entry => {
          const element = entry.target
          const { width, height } = entry.contentRect

          element.dispatchEvent(new CustomEvent('ui:element-resize', {
            detail: { width, height }
          }))
        })
      })
    }
  }

  observeElementResize(element) {
    if (this.resizeObserver && element) {
      this.resizeObserver.observe(element)
    }
  }

  unobserveElementResize(element) {
    if (this.resizeObserver && element) {
      this.resizeObserver.unobserve(element)
    }
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  }
}

// Create global instance
const uiUtils = new UIUtils()

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIUtils
} else {
  window.UIUtils = UIUtils
  window.uiUtils = uiUtils
}
