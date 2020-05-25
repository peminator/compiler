import * as t from 'io-ts';
import readFile from '@redredsk/helpers/private/readFile';
import validateInput from '@redredsk/helpers/private/types/validateInput';
import writeFile from '@redredsk/helpers/private/writeFile';
import { CompilerOutputFile, CompilerOutputFilePackage, } from '@redredsk/compiler/private/types/CompilerOutputFile';

class OutputFile {
  fileName: string;

  constructor (fileName: string = 'compiled.json') {
    this.fileName = fileName;
  }

  async packageByPath (path: t.TypeOf<typeof CompilerOutputFilePackage>['path']): Promise<t.TypeOf<typeof CompilerOutputFilePackage>> {
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

  async readFile (): Promise<t.TypeOf<typeof CompilerOutputFile>> {
    const data = await readFile(this.fileName);

    let json;

    try {
      json = JSON.parse(data);
    } catch (error) {
      this.writeFile({ packages: [], });

      return await this.readFile();
    }

    return validateInput(CompilerOutputFile, json);
  }

  writeFile (data: t.TypeOf<typeof CompilerOutputFile>): void {
    const validatedData = validateInput(CompilerOutputFile, data);

    writeFile(this.fileName, `${JSON.stringify(validatedData)}\n`);
  }
}

export default OutputFile;
