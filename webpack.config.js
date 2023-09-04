const path = require('path');

module.exports = {
  entry: {
    popup: './src/popup.js',
    background: './src/background.js',
    contentScript: './src/contentScript.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'] // Remove '@babel/preset-react' if not using React
          }
        }
      }
    ]
  }
};
