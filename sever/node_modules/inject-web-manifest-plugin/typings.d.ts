import { Compiler } from 'webpack';

declare class InjectWebManifestPlugin {
  constructor(options?: Partial<InjectWebManifestPlugin.Options>);

  apply(compiler: Compiler): void;
}

declare namespace InjectWebManifestPlugin {

  interface Options {
    /**
     * Target compilation path of manifest file.
     * Default: `manifest.[hash:8].webmanifest`
     */
    name: string,
    /**
     * Path of manifest source file.
     * Default: `manifest.webmanifest`
     */
    template: string,
    /**
     * Optional. Overwrite properties in source file for specific pages.
     */
    assign: {
      [page: string]: object
    }
  }

}
