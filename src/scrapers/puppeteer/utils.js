function applyUtilityMethods(ServiceClass) {
  ServiceClass.prototype.wait = async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  ServiceClass.prototype.autoScroll = async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0
        const distance = 100
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance

          if (totalHeight >= scrollHeight || totalHeight >= 3000) {
            clearInterval(timer)
            resolve()
          }
        }, 100)
      })
    })
  }
}

module.exports = applyUtilityMethods
