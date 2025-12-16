/**
 * JSONB Field Parsing Utilities
 *
 * PostgreSQL returns JSONB fields as JSON strings or objects.
 * These utilities ensure consistent array parsing across the application.
 */

/**
 * Safely parse a value that should be an array
 * Handles: null, undefined, already-parsed arrays, JSON strings, malformed data
 *
 * @param {*} value - The value to parse
 * @param {Array} defaultValue - Default value if parsing fails
 * @returns {Array} Parsed array or default value
 */
function parseJsonbArray(value, defaultValue = []) {
  // Already an array - return as-is
  if (Array.isArray(value)) {
    return value;
  }

  // Null or undefined - return default
  if (value === null || value === undefined) {
    return defaultValue;
  }

  // String that needs parsing
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (e) {
      console.warn('[jsonbHelpers] Failed to parse JSONB string:', value, e.message);
      return defaultValue;
    }
  }

  // Object or other type (shouldn't happen, but defensive)
  if (typeof value === 'object') {
    console.warn('[jsonbHelpers] Received object instead of array for JSONB field:', value);
    return defaultValue;
  }

  return defaultValue;
}

/**
 * Parse JSONB fields in a single fine record
 *
 * @param {Object} fine - Fine record from database
 * @returns {Object} Fine record with parsed JSONB fields
 */
function parseFineJsonbFields(fine) {
  if (!fine) return fine;

  return {
    ...fine,
    breach_categories: parseJsonbArray(fine.breach_categories, []),
    affected_sectors: parseJsonbArray(fine.affected_sectors, []),
    keywords: parseJsonbArray(fine.keywords, [])
  };
}

/**
 * Parse JSONB fields in multiple fine records
 *
 * @param {Array} fines - Array of fine records from database
 * @returns {Array} Array of fine records with parsed JSONB fields
 */
function parseFinesJsonbFields(fines) {
  if (!Array.isArray(fines)) {
    console.warn('[jsonbHelpers] Expected array of fines, received:', typeof fines);
    return [];
  }

  return fines.map(fine => parseFineJsonbFields(fine));
}

module.exports = {
  parseJsonbArray,
  parseFineJsonbFields,
  parseFinesJsonbFields
};
