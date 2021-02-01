const paths = require("react-scripts/config/paths"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  ManifestPlugin = require("webpack-manifest-plugin"),
  MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  path = require("path");

module.exports = {
  webpack: override
};

function override(config, env) {
  let newConfig = {
    ...config,
    entry: {
      popup: paths.appIndexJs,
      options: paths.appSrc + "/options",
      background: paths.appSrc + "/background",
      contentscript: paths.appSrc + "/contentscript",
      welcome: paths.appSrc + "/welcome",
      api: paths.appSrc + "/api"
    },
    output: {
      path: path.join(__dirname, "./build"),
      filename: "static/js/[name].js"
    },
    optimization: {
      splitChunks: {
        cacheGroups: { default: false }
      },
      runtimeChunk: false
    }
  };

  const minifyOpts = {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true
    },
    isEnvProduction = env === "production",
    indexHtmlPlugin = new HtmlWebpackPlugin({
      inject: true,
      chunks: ["popup"],
      template: paths.appHtml,
      filename: "popup.html",
      minify: isEnvProduction && minifyOpts
    });

  newConfig.plugins = replacePlugin(
    newConfig.plugins,
    (name) => /HtmlWebpackPlugin/i.test(name),
    indexHtmlPlugin
  );

  const optionsHtmlPlugin = new HtmlWebpackPlugin({
    inject: true,
    chunks: ["options"],
    template: paths.appPublic + "/options.html",
    filename: "options.html",
    minify: isEnvProduction && minifyOpts
  });

  newConfig.plugins.push(optionsHtmlPlugin);

  const welcomeHtmlPlugin = new HtmlWebpackPlugin({
    inject: true,
    chunks: ["welcome"],
    template: paths.appPublic + "/welcome.html",
    filename: "welcome.html",
    minify: isEnvProduction && minifyOpts
  });

  newConfig.plugins.push(welcomeHtmlPlugin);

  const manifestPlugin = new ManifestPlugin({
    fileName: "asset-manifest.json"
  });

  newConfig.plugins = replacePlugin(
    newConfig.plugins,
    (name) => /ManifestPlugin/i.test(name),
    manifestPlugin
  );

  const miniCssExtractPlugin = new MiniCssExtractPlugin({
    filename: "static/css/[name].css"
  });

  newConfig.plugins = replacePlugin(
    newConfig.plugins,
    (name) => /MiniCssExtractPlugin/i.test(name),
    miniCssExtractPlugin
  );
  newConfig.plugins = replacePlugin(newConfig.plugins, (name) =>
    /GenerateSW/i.test(name)
  );

  return newConfig;
}

function replacePlugin(plugins, nameMatcher, newPlugin) {
  const i = plugins.findIndex((plugin) => {
    return (
      plugin.constructor &&
      plugin.constructor.name &&
      nameMatcher(plugin.constructor.name)
    );
  });
  return i > -1
    ? plugins
        .slice(0, i)
        .concat(newPlugin || [])
        .concat(plugins.slice(i + 1))
    : plugins;
}
