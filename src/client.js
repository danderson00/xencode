const parallel = require('parallel-module')

module.exports = function(options) {
  return parallel({ 
    parameter: options,
    prewarm: 'all',
    workerPath: options.workerPath || 'encoder.js'
   })
}