var webpack = require('webpack')

module.exports = {
  entry: {
    "encoder": require.resolve('./src/worker.js'),
    "sample": require.resolve('./sample/index.js')
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /encoder\.js$/,
      minimize: true
    })
  ]
}