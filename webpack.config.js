const path = require('path');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');

module.exports = {
  mode: "production",
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader",
        exclude: /node_modules/
      }
    ]
  },
  devServer: {
    contentBase: ".",
    compress: true
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'Script'),
    libraryTarget: "amd"
  },
  plugins: [
    new HardSourceWebpackPlugin(),
    new CheckerPlugin()
  ],
  externals: /^((esri)|(dojo))/
};
