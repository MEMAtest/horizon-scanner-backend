function getLayoutStyles() {
  return `      .app-container {
        min-height: 100vh;
        background: #f8fafc;
        padding-left: 260px;
      }

      .main-content {
        padding: 36px 64px 80px;
        background: linear-gradient(180deg, #f8fafc 0%, #eef2f9 100%);
        max-width: 1540px;
        width: calc(100% - 80px);
        margin: 0 auto;
      }

`
}

module.exports = { getLayoutStyles }
