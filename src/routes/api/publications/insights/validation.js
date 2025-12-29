function parseLimit(limitValue, fallback) {
  const value = limitValue === undefined ? fallback : limitValue;
  return parseInt(value);
}

function parseLimitOrDefault(limitValue, fallback) {
  const parsed = parseInt(limitValue);
  return parsed || fallback;
}

function parseYearParam(value) {
  const year = parseInt(value);
  if (Number.isNaN(year) || year < 1900 || year > 2100) {
    return { error: 'Invalid year' };
  }
  return { year };
}

function validateReferencesArray(references) {
  if (!references || !Array.isArray(references)) {
    return { error: 'references array required' };
  }
  return { references };
}

module.exports = {
  parseLimit,
  parseLimitOrDefault,
  parseYearParam,
  validateReferencesArray
};
