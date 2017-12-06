const vpx = require('./libvpx')
const worker = require('parallel-module/src/worker')

worker(function(options) {
  return function(frame) {
    const start = Date.now()
    const encoded = (new vpx.VPXEncoder({ 'g_w': options.width, 'g_h': options.height }, 1))
      .encodeFrames(options.frameRate, [vpx.VPXImage.RGBAtoYV12(frame, options.width, options.height)])[0]
    
    // converting an Array to a TypedArray has significant performance benefits when marshalling data to / from workers
    encoded.data = Int8Array.from(encoded.data)
    console.log('Encoded frame in ' + (Date.now() - start) + 'ms')
    return encoded
  }
})
