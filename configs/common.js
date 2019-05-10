const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: path.resolve(__dirname, '../src/index'),
    chain: path.resolve(__dirname, '../examples/chain'),
    particles: path.resolve(__dirname, '../examples/particles'),
    jellyfish: path.resolve(__dirname, '../examples/jellyfish/index')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(glsl|vert|frag)$/,
        use: ['raw-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'chain.html',
      title: 'chain',
      chunks: ['chain']
    }),
    new HtmlWebpackPlugin({
      filename: 'particles.html',
      title: 'particles',
      chunks: ['particles']
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      title: 'jellyfish',
      chunks: ['jellyfish']
    })
  ]
};
