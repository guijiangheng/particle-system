const path = require('path');
const merge = require('webpack-merge');

module.exports = merge(require('./common'), {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        enforce: 'pre',
        loader: 'eslint-loader'
      }
    ]
  },
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    open: true,
    overlay: true,
    contentBase: path.join(__dirname, 'dist')
  }
});
