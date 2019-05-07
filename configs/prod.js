const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = merge(require('./common'), {
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js'
  },
  plugins: [new CleanWebpackPlugin()]
});
