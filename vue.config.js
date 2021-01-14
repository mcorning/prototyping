// const webpack = require('webpack');

module.exports = {
  transpileDependencies: ['vuetify'],
  configureWebpack: {
    devtool: 'source-map',
  },
  pwa: {
    themeColor: '#4A148C',
    msTileColor: '#4A148C',
    appleMobileWebAppCache: 'yes',
    manifestOptions: {
      background_color: '#4A148C',
    },
  },
};
