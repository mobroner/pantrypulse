module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.output.filename = 'static/js/main.js';
      webpackConfig.output.chunkFilename = 'static/js/[name].chunk.js';

      const miniCssExtractPlugin = webpackConfig.plugins.find(
        (plugin) => plugin.constructor.name === 'MiniCssExtractPlugin'
      );

      if (miniCssExtractPlugin) {
        miniCssExtractPlugin.options.filename = 'static/css/main.css';
        miniCssExtractPlugin.options.chunkFilename = 'static/css/[name].chunk.css';
      }

      return webpackConfig;
    },
  },
};
