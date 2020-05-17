import * as helpers from '@redredsk/helpers/server';
import * as types from '@redredsk/compiler/private/types';

class OutputFile {
  name = 'compiled.json';

  async packageByPath (path: types.typescript.CompilerOutputFilePackage['path']) {
    const outputFile = await this.read();

    const outputFilePackages = outputFile.packages;

    for (let i = 0; i < outputFilePackages.length; i += 1) {
      const outputFilePackage = outputFilePackages[i];

      if (outputFilePackage.path === path) {
        return outputFilePackage;
      }
    }
  }

  async read () {
    return await helpers.validateInputFromFile(
      types.CompilerOutputFile,
      this.name
    );
  }

  write (data: types.typescript.CompilerOutputFile) {
    const validatedData = helpers.validateInput(types.CompilerOutputFile, data);

    helpers.writeFile(this.name, `${JSON.stringify(validatedData)}\n`);
  }
}

export default OutputFile;
