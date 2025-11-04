const { getHeadLinks } = require('../../views/commonStyles/headLinks')
const { getBaseStyles } = require('../../views/commonStyles/base')
const { getSidebarStyles } = require('../../views/commonStyles/sidebar')
const { getTypographyStyles } = require('../../views/commonStyles/typography')
const { getComponentStyles } = require('../../views/commonStyles/components')
const { getResponsiveStyles } = require('../../views/commonStyles/responsive')
const { getEnhancementStyles } = require('../../views/commonStyles/enhancements')
const { getUtilityStyles } = require('../../views/commonStyles/utilities')
const { getViewStyles } = require('../../views/commonStyles/views')

function getCommonStyles() {
  return `
${getHeadLinks()}
    <style>
${getBaseStyles()}
${getSidebarStyles()}
${getTypographyStyles()}
${getComponentStyles()}
${getResponsiveStyles()}
${getEnhancementStyles()}
${getUtilityStyles()}
${getViewStyles()}
    </style>
  `
}

module.exports = {
  getCommonStyles
}
