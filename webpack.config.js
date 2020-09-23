const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const InlineSourcePlugin = require('html-webpack-inline-source-plugin')
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const devMode = process.env.NODE_ENV !== 'production'

module.exports = {
  devtool: devMode ? 'cheap-module-eval-source-map' : 'source-map',
  entry: {
    // app: ['@babel/polyfill', 'src/index.js'].concat(devMode ? ['webpack-hot-middleware/client'] : [])
    app: ['src/index.js'].concat(devMode ? ['webpack-hot-middleware/client'] : [])
    // app: ['src/test.js'].concat(devMode ? ['webpack-hot-middleware/client'] : [])
  },
  mode: devMode ? 'development' : 'production',
  module: {
    rules: [
      {
        test: /\.(le|c)ss$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2
            }
          }
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  node: {
    __dirname: true,
    __filename: true
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    },
    runtimeChunk: true
  },
  output: {
    filename: devMode ? '[name].js' : '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
  },
  plugins: [
    new webpack.DefinePlugin({
      ...process.env.stringified,
      'process.env.FLUENTFFMPEG_COV': false
    }),
    new HtmlWebpackPlugin({
      title: require('./package.json').description + ' v' + require('./package.json').version,
      inlineSource: 'runtime~.+\\.js'
    }),
    new CspHtmlWebpackPlugin(
      {
        'base-uri': "'self'",
        'object-src': "'none'",
        'script-src': ["'unsafe-inline'", "'self'", "'unsafe-eval'"],
        'style-src': ["'unsafe-inline'", "'self'", "'unsafe-eval'"]
      },
      {
        hashingMethod: 'sha256',
        enabled: true
      }
    ),
    new InlineSourcePlugin(),
    new webpack.HashedModuleIdsPlugin({
      hashFunction: 'sha256',
      hashDigest: 'hex',
      hashDigestLength: 8
    })
  ].concat(
    devMode
      ? [new webpack.HotModuleReplacementPlugin()]
      : [
          new MiniCssExtractPlugin({
            filename: devMode ? '[name].css' : '[contenthash].css',
            chunkFilename: devMode ? '[id].css' : '[id].[hash].css'
          })
        ]
  ),
  resolve: {
    alias: {
      mobx: __dirname + '/node_modules/mobx/lib/mobx.es6.js',
      src: path.resolve(__dirname, 'src')
    },
    extensions: ['.js', '.jsx', '.json']
  },
  target: 'electron-renderer'
}
