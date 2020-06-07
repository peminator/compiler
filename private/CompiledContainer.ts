import * as t from 'io-ts';
import Container from '@redredsk/pages/private/Container';
import writeFile from '@redredsk/helpers/private/writeFile';
import { InputFilePackage, } from '@redredsk/compiler/private/types/InputFile';
import { OutputFilePackage, OutputFilePackageCompiledFile, OutputFilePackageCompiledFileAsset, } from '@redredsk/compiler/private/types/OutputFile';

class CompiledContainer {
  constructor (inputFilePackage: t.TypeOf<typeof InputFilePackage>, outputFilePackage: t.TypeOf<typeof OutputFilePackage>) {
    try {
      for (let i = 0; i < outputFilePackage.compiledFiles.length; i += 1) {
        const outputFilePackageCompiledFile = outputFilePackage.compiledFiles[i];

        const $ = this.$(outputFilePackageCompiledFile);

        if ($) {
          delete __non_webpack_require__.cache[__non_webpack_require__.resolve(`${outputFilePackageCompiledFile.outputPath}/${$}`)];

          const compiledContainer: Container = __non_webpack_require__(`${outputFilePackageCompiledFile.outputPath}/${$}`).default;

          for (let ii = 0; ii < compiledContainer.pages.length; ii += 1) {
            const compiledContainerPage = compiledContainer.pages[ii];

            compiledContainerPage.context = {
              ...compiledContainerPage.context,
              compiledContainer,
              inputFilePackage,
              outputFilePackage,
            };

            writeFile(`${outputFilePackageCompiledFile.outputPath}/${compiledContainerPage.name}.html`, compiledContainerPage.toHTML());
          }

          outputFilePackage.compiledContainer = compiledContainer.toJSON();
        }
      }
    } catch (error) {}
  }

  $ (outputFilePackageCompiledFile: t.TypeOf<typeof OutputFilePackageCompiledFile>): t.TypeOf<typeof OutputFilePackageCompiledFileAsset>['name'] | undefined {
    for (let i = 0; i < outputFilePackageCompiledFile.assets.length; i += 1) {
      const outputFilePackageCompiledFileAsset = outputFilePackageCompiledFile.assets[i];

      if (/\.js/.test(outputFilePackageCompiledFileAsset.name)) {
        return outputFilePackageCompiledFileAsset.name;
      }
    }
  }
}

export default CompiledContainer;
