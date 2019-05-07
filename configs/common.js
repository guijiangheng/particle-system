const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
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
      title: 'particle-system'
    })
  ]
};
