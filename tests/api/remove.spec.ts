import {resolve} from 'path';
import setup from '../../src/internal/setup';
import {managers} from '../common';
import api from '../../src/api';
import {fs} from '../../src/internal/fs';

describe('Remove dependency', () => {
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

        await api.remove({
          name: 'graphql',
          parent: `${manager}-example`,
        });

        expect(writeFile).toHaveBeenCalledTimes(1);

        expect(JSON.parse(writeFile.mock.calls[0][1])).not.toMatchObject({
          devDependencies: {
            graphql: '14.0.2',
          },
        });
      });

      test('local package', async () => {
        const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

        setup.fs = {
          writeFile,
          readFile: fs.readFile,
        };

        await api.remove({
          name: '@example/core',
          parent: '@example/angular',
        });

        expect(writeFile).toHaveBeenCalledTimes(1);

        const pkg = JSON.parse(writeFile.mock.calls[0][1]);
        expect(pkg.dependencies).not.toHaveProperty('@example/core');
      });
    });
  });
});
