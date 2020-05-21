import * as helpers from '@redredsk/helpers/server';
import * as types from '@redredsk/compiler/private/types';

class OutputFile {
  fileName: string;

  constructor (fileName: string = 'compiled.json') {
    this.fileName = fileName;
  }

  async packageByPath (path: types.typescript.CompilerOutputFilePackage['path']): Promise<types.typescript.CompilerOutputFilePackage> {
    const outputFile = await this.readFile();

    const outputFilePackages = outputFile.packages;

    for (let i = 0; i < outputFilePackages.length; i += 1) {
      const outputFilePackage = outputFilePackages[i];

      if (outputFilePackage.path === path) {
        return outputFilePackage;
      }
    }

    throw new Error(`The package "${path}" does not exist in the output file.`);
  }

  async readFile (): Promise<types.typescript.CompilerOutputFile> {
    const data = await helpers.readFile(this.fileName);

    let json;

    try {
      json = JSON.parse(data);
    } catch (error) {
      this.writeFile({ packages: [], });

      return await this.readFile();
    }

    return helpers.validateInput(types.CompilerOutputFile, json);
  }

  writeFile (data: types.typescript.CompilerOutputFile): void {
    const validatedData = helpers.validateInput(types.CompilerOutputFile, data);

    helpers.writeFile(this.fileName, `${JSON.stringify(validatedData)}\n`);
  }
}

export default OutputFile;
