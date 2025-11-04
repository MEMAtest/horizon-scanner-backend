function applyBaseMethods(ServiceClass) {
  ServiceClass.prototype.delay = async function(ms = this.requestDelay || 0) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

module.exports = applyBaseMethods
