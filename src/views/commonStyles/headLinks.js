function getHeadLinks() {
  // Cache-busting timestamp to prevent browser caching issues
  const version = Date.now()

  return `
    <!-- Executive Inter Font Import -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- Professional Navy/Charcoal Theme Override -->
    <link rel="stylesheet" href="/css/professional-theme.css?v=${version}">
  `
}

module.exports = { getHeadLinks }
