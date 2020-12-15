// const webpack = require('webpack');

module.exports = {
  transpileDependencies: ['vuetify'],
  configureWebpack: {
    devtool: 'source-map',
  },
  pwa: {
    manifestOptions: { start_url: '/' },
  },
};
