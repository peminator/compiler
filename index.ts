import * as helpers from '@redred/helpers/server';
import * as types from '../types';
import InputFile from './compiler/InputFile';
import OutputFile from './compiler/OutputFile';
import addMessage, { messages } from './compiler/addMessage';
import compile from './compiler/compile';
import http from 'http';
import path from 'path';

const inputFile = new InputFile();
const outputFile = new OutputFile();

outputFile.write();

compile('./packages/compiler', 'development'); // ?!

const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    response.statusCode = 200;

    const requestedURL = new URL(`file://${request.url}`);

    const areCompilerMessagesRequested =
      requestedURL.pathname === '/compiler/messages';
    const isCompilerCompileFunctionRequested =
      requestedURL.pathname === '/compiler/compile';
    const isInputFileRequested = requestedURL.pathname === `/${inputFile.name}`;
    const isOutputFileRequested =
      requestedURL.pathname === `/${outputFile.name}`;

    if (areCompilerMessagesRequested) {
      const compilerMessages = await helpers.validateInput(
        types.CompilerMessages,
        messages
      );

      response.end(JSON.stringify(compilerMessages));

      return;
    }

    if (isCompilerCompileFunctionRequested) {
      const requestedURLParameters = requestedURL.searchParams;

      const pathFromRequestedURLParameters = requestedURLParameters.get('path');

      const versionFromRequestedURLParameters = requestedURLParameters.get(
        'version'
      );

      if (pathFromRequestedURLParameters && versionFromRequestedURLParameters) {
        await compile(
          pathFromRequestedURLParameters,
          versionFromRequestedURLParameters
        );

        response.end();

        return;
      }
    }

    if (isInputFileRequested) {
      response.end(JSON.stringify(await inputFile.read()));

      return;
    }

    if (isOutputFileRequested) {
      response.end(JSON.stringify(await outputFile.read()));

      return;
    }

    const mime = helpers.mime(path.extname(requestedURL.pathname));

    response.setHeader(
      'Content-Type',
      mime.charset ? `${mime.typeName}; charset=${mime.charset}` : mime.typeName
    );

    response.end(
      await helpers.readFile(`.${requestedURL.pathname}`, 'base64'),
      'base64'
    );
  } catch (error) {
    response.statusCode = 500;

    response.end(JSON.stringify({ errors: [[error.message, error.stack]] }));

    addMessage([error.message, error.stack]);
  }
});

server.listen(1337);
