// const client = require('../src/client')
const createEncoder = require('../src')

const options = {
  width: 320,
  height: 240,
  frameRate: 15,
  workerPath: '../build/encoder.js'
}

let capturing = true
const frames = []

window.addEventListener('load', () => {
  const source = document.getElementById('source')
  const target = document.getElementById('target')
  const button = document.getElementById('encode')

  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height
  const context = canvas.getContext('2d')

  createEncoder(options).then(encoder => {
    button.addEventListener('click', () => {
      capturing = false
      playEncodedFrames(target, encoder)
    })

    startVideo(source).then(() => 
      startCapture(source, context, options, encoder)
    )
  })
})

function startCapture(source, context, options, encoder) {
  let frameNumber = 0

  setTimeout(nextFrame, 1000)

  function nextFrame() {
    if(capturing && frameNumber < 50 * 60) {
      window.requestAnimationFrame(() => {
        frameNumber++
        if(frameNumber % (60 / options.frameRate) === 0) {
          context.drawImage(source, 0, 0, options.width, options.height)
          encoder.addFrame(context)
        }
        nextFrame()
      })
    }
  }
}

function startVideo(video) {
  return new Promise((resolve, reject) => {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
    navigator.getUserMedia({ video: { width: options.width, height: options.height } }, function (stream) {
      video.src = URL.createObjectURL(stream)
      video.play()
      resolve()
    }, function (error) {
      reject(error)
    })
  })
}

function playEncodedFrames(target, encoder) {
  encoder.toBlobURL().then(url => {
    target.src = url
    target.play()
  })
}
