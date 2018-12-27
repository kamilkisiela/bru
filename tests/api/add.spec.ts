import { resolve } from 'path';
import setup from '../../src/internal/setup';
import { managers } from '../common';
import api from '../../src/api';
import { fs } from '../../src/internal/fs';

describe('Add dependency', () => {
  afterEach(() => {
    setup.fs = fs;
  });

  managers.forEach(manager => {
    describe(manager, () => {
      const cwd = resolve(__dirname, `../../example/${manager}`);

      beforeEach(async () => {
        setup.cwd = cwd;
      });

      test('external dependency', async () => {
        const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

        setup.fs = {
          writeFile,
          readFile: fs.readFile,
        };

        await api.add({
          name: 'prettier',
          version: '1.15.0',
          parent: `${manager}-example`,
          type: 'dev',
        });

        expect(writeFile).toHaveBeenCalledTimes(1);

        expect(JSON.parse(writeFile.mock.calls[0][1])).toMatchObject({
          name: `${manager}-example`,
          devDependencies: {
            prettier: '1.15.0',
          },
        });
      });

      test('local package', async () => {
        const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

        setup.fs = {
          writeFile,
          readFile: fs.readFile,
        };

        await api.add({
          name: '@example/angular',
          parent: `${manager}-example`,
          type: 'dev',
        });

        expect(writeFile).toHaveBeenCalledTimes(1);
        expect(JSON.parse(writeFile.mock.calls[0][1])).toMatchObject({
          name: `${manager}-example`,
          devDependencies: {
            '@example/angular': '1.0.0',
          },
        });
      });
    });
  });
});
