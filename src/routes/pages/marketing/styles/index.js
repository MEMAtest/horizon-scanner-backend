// Marketing page styles - modular imports
const { getBaseStyles } = require('./base.js');
const { getCanaryStyles } = require('./canary.js');
const { getHeroStyles } = require('./hero.js');
const { getDashboardStyles } = require('./dashboard.js');
const { getSectionStyles } = require('./sections.js');
const { getFooterStyles } = require('./footer.js');
const { getModalStyles } = require('./modal.js');
const { getResponsiveStyles } = require('./responsive.js');

function getMarketingStyles() {
  return `
    <style>
      ${getBaseStyles()}
      ${getCanaryStyles()}
      ${getHeroStyles()}
      ${getDashboardStyles()}
      ${getSectionStyles()}
      ${getFooterStyles()}
      ${getModalStyles()}
      ${getResponsiveStyles()}
    </style>
  `;
}

module.exports = {
  getMarketingStyles,
  getBaseStyles,
  getCanaryStyles,
  getHeroStyles,
  getDashboardStyles,
  getSectionStyles,
  getFooterStyles,
  getModalStyles,
  getResponsiveStyles
};
