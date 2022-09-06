const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile)

function capitalize(str) {
  str = String(str);
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function hash(source, algo, length) {
  return crypto.createHash(algo).update(source).digest('hex').slice(0, length);
}

async function loadJSON(path) {
  try {
    const content = await readFile(path);
    return JSON.parse(content);
  } catch (err) {
    return undefined;
  }
}

function getHTMLHooks(compilation, name) {
  // html-webpack-plugin@4
  if (HtmlWebpackPlugin.getHooks) return HtmlWebpackPlugin.getHooks(compilation)[name];
  return compilation.hooks[`htmlWebpackPlugin${capitalize(name)}`];
}

function generateFilename(name, source, page) {
  return name.replace(/\[page\]/, page)
    .replace(/\[hash(?::(\d+))\]/, (placeholder, length) => {
      length = Number(length);
      if (isNaN(length) || length < 1 || length > 16) length = 8;
      return hash(source, 'sha1', length);
    });
}

const defaultOptions = {
  name: 'manifest.[hash:8].webmanifest',
  template: 'manifest.webmanifest',
  assign: {},
};

class InjectWebManifestPlugin {

  constructor(options) {
    this.options = {...options, defaultOptions};
    this.sources = [];
  }

  apply(compiler) {
    const pluginName = this.constructor.name;
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      getHTMLHooks(compilation, 'beforeHtmlProcessing').tapPromise(pluginName, async data => {
        const page = path.basename(data.outputName, '.html');
        const template = await loadJSON(this.options.template);
        const manifest = {
          ...template,
          ...this.options.assign[page],
        };
        const source = JSON.stringify(manifest);
        let output = generateFilename(this.options.name, source, page);
        this.sources.push({
          output,
          manifest,
          source,
          page,
        });
        return data;
      });
      getHTMLHooks(compilation, 'alterAssetTags').tap(pluginName, data => {
        const page = path.basename(data.outputName, '.html');
        const source = this.sources.find(source => source.page === page);
        if (!source) return data;
        let href = source.output;
        if (compilation.options.output.publicPath) {
          href = compilation.options.output.publicPath + href;
        }
        const tags = [
          ['link', {rel: 'manifest', href}],
        ];
        const themeColor = source.manifest.theme_color;
        if (themeColor) {
          tags.push(['meta', {
            name: 'theme-color',
            content: themeColor,
          }]);
        }
        const appName = source.manifest.short_name || source.manifest.name;
        if (appName) {
          tags.push(['meta', {
            name: 'apple-mobile-web-app-title',
            content: appName,
          }]);
        }
        const icons = source.manifest.icons;
        const appleIcon = icons && icons.find(icon => parseInt(icon.sizes, 10) >= 120);
        if (appleIcon) {
          tags.push(['link', {
            rel: 'apple-touch-icon',
            href: appleIcon.src,
          }]);
        }
        const maskableIcon = icons && icons.find(icon => icon.purpose === 'maskable');
        if (maskableIcon && themeColor) {
          tags.push(['link', {
            rel: 'mask-icon',
            href: maskableIcon.src,
            color: themeColor,
          }]);
        }
        if (source.manifest.display === 'standalone') {
          tags.push(['meta', {
            name: 'apple-mobile-web-app-capable',
            content: 'yes',
          }]);
          tags.push(['meta', {
            name: 'apple-mobile-web-app-status-bar-style',
            content: 'default',
          }]);
        }
        data.head.unshift(
          ...tags.map(([tagName, attributes]) => ({tagName, attributes})),
        );
        return data;
      });
    });
    compiler.hooks.emit.tap(pluginName, (compilation) => {
      this.sources.forEach(({output, source}) => {
        compilation.assets[output] = {
          source: () => source,
          size: () => source.length,
        };
      });
    });
  }
}

module.exports = InjectWebManifestPlugin;
