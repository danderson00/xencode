var client = require('./client')

module.exports = function(options) {
  return client(options).then(function(encode) {
    var frames = []

    var api = {
      addFrame: function(source) {
        var imageData = source
        if(source instanceof HTMLCanvasElement)
          imageData = new Uint8Array(source.getContext('2d').getImageData(0, 0, options.width, options.height).data)
        else if (source instanceof CanvasRenderingContext2D)
          imageData = new Uint8Array(source.getImageData(0, 0, options.width, options.height).data)

        var promise = encode(imageData)
        frames.push(promise)
        return promise
      },
      frames: function () {
        return Promise.all(frames).then(function(encodedFrames) {
          return encodedFrames.map((frame, index) => Object.assign({}, frame, {
            duration: 1000 / options.frameRate,
            timecode: index * (1000 / options.frameRate)
          }))
        })
      },
      toWebMContainer: function () {
        return api.frames().then(function(frames) {
          return new WebMContainer(new WebMVideoTrack(options.width, options.height, options.frameRate, frames))
        })
      },
      toDataURL: function () {
        return api.toWebMContainer().then(function(container) {
          return container.toDataURL()
        })
      },
      toBlob: function () {
        return api.toWebMContainer().then(function(container) {
          return new Blob([new Uint8Array(container.toBuffer())])
        })
      },
      toBlobURL: function () {
        return api.toBlob().then(function(blob) {
          return URL.createObjectURL(blob)
        })
      }
    }
    return api
  })
}