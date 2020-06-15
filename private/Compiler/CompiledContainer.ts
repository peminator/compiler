// TODO
import * as t from 'io-ts';
import CompilerOutputFile from './CompilerOutputFile';
import Container from '@redredsk/pages/private/Container';
import eval_ from 'eval';
import { Compilation, Compiler, } from 'webpack';
import { CompilerInputFilePackage, CompilerInputFilePackageFileToCompile, } from '@redredsk/types/private/CompilerInputFile';
import { CompilerOutputFilePackage, CompilerOutputFilePackageCompiledFile, CompilerOutputFilePackageCompiledFileAsset, } from '@redredsk/types/private/CompilerOutputFile';
import { ConcatSource, RawSource, } from 'webpack-sources';

class CompiledContainer {
  compilerInputFilePackage: t.TypeOf<typeof CompilerInputFilePackage>;

  compilerInputFilePackageFileToCompile: t.TypeOf<typeof CompilerInputFilePackageFileToCompile>;

  compilerOutputFile: CompilerOutputFile;

  constructor (
    compilerInputFilePackage: t.TypeOf<typeof CompilerInputFilePackage>,
    compilerInputFilePackageFileToCompile: t.TypeOf<typeof CompilerInputFilePackageFileToCompile>,
    compilerOutputFile: CompilerOutputFile
  ) {
    this.compilerInputFilePackage = compilerInputFilePackage;
    this.compilerInputFilePackageFileToCompile = compilerInputFilePackageFileToCompile;
    this.compilerOutputFile = compilerOutputFile;
  }

  $ (compilation: Compilation, compilerOutputFilePackage: t.TypeOf<typeof CompilerOutputFilePackage>): void {
    const right: { toJson: () => t.TypeOf<typeof CompilerOutputFilePackageCompiledFile>, } = compilation.getStats();

    let $ = false;

    for (let i = 0; i < compilerOutputFilePackage.compiledFiles.length; i += 1) {
      let compilerOutputFilePackageCompiledFile = compilerOutputFilePackage.compiledFiles[i];

      if (compilerOutputFilePackageCompiledFile.path === this.compilerInputFilePackageFileToCompile.path) {
        compilerOutputFilePackage.compiledFiles[i] = {
          ...right.toJson(),
          path: this.compilerInputFilePackageFileToCompile.path,
        };

        $ = true;
      }
    }

    if (!$) {
      compilerOutputFilePackage.compiledFiles = [
        ...compilerOutputFilePackage.compiledFiles,
        {
          ...right.toJson(),
          path: this.compilerInputFilePackageFileToCompile.path,
        },
      ];
    }
  }

  firstJSAsset (compilation: Compilation): t.TypeOf<typeof CompilerOutputFilePackageCompiledFileAsset>['name'] | undefined {
    for (const assetName in compilation.assets) {
      if (/\.js/.test(assetName)) {
        return assetName;
      }
    }
  }

  apply (compiler: Compiler) {
    compiler.hooks.emit.tapAsync(
      'CompiledContainer',
      async (compilation, $): Promise<void> => {
        const compilerOutputFilePackage  = this.compilerOutputFile.packageByPath(this.compilerInputFilePackage.path);

        if (compilerOutputFilePackage) {
          // 1.

          this.$(compilation, compilerOutputFilePackage);

          // 2.

          try {
            const firstJSAsset = this.firstJSAsset(compilation);

            if (firstJSAsset) {
              const source = compilation.assets[firstJSAsset].source();

              const compiledContainer: Container = eval_(source, firstJSAsset).default;

              for (let i = 0; i < compiledContainer.pages.length; i += 1) {
                const compiledContainerPage = compiledContainer.pages[i];

                compiledContainerPage.context = {
                  ...compiledContainerPage.context,
                  compiledContainer,
                  inputFilePackage: this.compilerInputFilePackage,
                  outputFilePackage: compilerOutputFilePackage,
                };

                const html = compiledContainerPage.toHTML();

                if (html) {
                  compilation.assets[`${compiledContainerPage.name}.html`] = new RawSource(html);
                }
              }

              compilerOutputFilePackage.compiledContainer = compiledContainer.toJSON();
            }
          } catch (error) {
            console.log(error);
          }

          // 3.

          this.$(compilation, compilerOutputFilePackage);

          // 4.

          this.compilerOutputFile.writeFile();
        }

        for (const assetName in compilation.assets) {
          if (/\.css|\.js/.test(assetName)) {
            compilation.assets[assetName] = new ConcatSource('/*! Copyright 2020 Marek Kobida */\n', compilation.assets[assetName]);
          }

          if (/\.html/.test(assetName)) {
            compilation.assets[assetName] = new ConcatSource('<!-- Copyright 2020 Marek Kobida -->\n', compilation.assets[assetName]);
          }
        }

        $();
      }
    );
  }
}

export default CompiledContainer;
//
