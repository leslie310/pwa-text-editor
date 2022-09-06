# inject-web-manifest-plugin

Inject manifest.webmanifest for multiple page website.

## Install

    # html-webpack-plugin is required
    npm install html-webpack-plugin

    npm install inject-web-manifest-plugin

## Usage

```js
const InjectWebManifestPlugin = require('inject-web-manifest-plugin');

// for example
new InjectWebManifestPlugin({
  name: 'dist/[page].[hash:8].webmanifest',
  template: 'src/manifest.webmanifest',
}),
```

## Options

| Name | Description |
| ---- | ---- |
| `name` | Target compilation path of manifest file. Default: `manifest.[hash:8].webmanifest`. |
| | Supported variables: |
| | - `[hash:{limit}]`: will be replaced with the manifest file hash. `limit` must be greater than `1` and be less than `16`.
| | - `[page]`: will be replaced with basename of file output by `HtmlWebpackPlugin`.
| `template` | Path of manifest source file. Default: `manifest.webmanifest`. |
| `assign` | **Optional**. Overwrite properties in source file for specific pages.
| | Should be an object with `[page]` as key and content of web manifest as value.

# License

MIT. See [LICENSE](./LICENSE).
