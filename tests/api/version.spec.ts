import {resolve} from 'path';

import setup from '../../src/internal/setup';
import {managers} from '../common';
import api from '../../src/api';
import {fs} from '../../src/internal/fs';

describe('Version', () => {
  afterEach(() => {
    setup.fs = fs;
  });

  managers.forEach(manager => {
    describe(manager, () => {
      beforeEach(async () => {
        setup.cwd = resolve(__dirname, `../../example/${manager}`);
      });

      test('get version', async () => {
        const result = await api.get('graphql');
        expect(result.payload.version).toEqual('14.0.2');
      });

      test('set a version of an external dependency', async () => {
        const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

        setup.fs = {
          writeFile,
          readFile: fs.readFile,
        };

        // make changes
        await api.set('graphql', '14.0.3');

        expect(writeFile).toHaveBeenCalledTimes(4);
        writeFile.mock.calls.forEach(call => {
          const pkg = JSON.parse(call[1]);

          const deps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
          };

          expect(deps.graphql).toEqual('14.0.3');
        });
      });

      test('set version of a local package', async () => {
        const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

        setup.fs = {
          writeFile,
          readFile: fs.readFile,
        };

        // make changes
        await api.set('@example/core', '2.0.0');

        expect(writeFile).toHaveBeenCalledTimes(3);
        writeFile.mock.calls.forEach(call => {
          const pkg = JSON.parse(call[1]);

          if (pkg.name === '@example/core') {
            expect(pkg.version).toEqual('2.0.0');
          } else {
            const deps = {
              ...pkg.dependencies,
              ...pkg.devDependencies,
            };

            expect(deps['@example/core']).toEqual('2.0.0');
          }
        });
      });

      test('bump a version of an external dependency', async () => {
        const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

        setup.fs = {
          writeFile,
          readFile: fs.readFile,
        };

        // bump
        await api.bump('graphql', 'minor');

        expect(writeFile).toHaveBeenCalledTimes(4);
        writeFile.mock.calls.forEach(call => {
          const pkg = JSON.parse(call[1]);

          const deps = {
            ...pkg.dependencies,
            ...pkg.devDependencies,
          };

          expect(deps.graphql).toEqual('14.1.0');
        });
      });

      test('bump a version of a local package', async () => {
        const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

        setup.fs = {
          writeFile,
          readFile: fs.readFile,
        };

        // make changes
        await api.bump('@example/core', 'major');

        expect(writeFile).toHaveBeenCalledTimes(3);
        writeFile.mock.calls.forEach(call => {
          const pkg = JSON.parse(call[1]);

          if (pkg.name === '@example/core') {
            expect(pkg.version).toEqual('2.0.0');
          } else {
            const deps = {
              ...pkg.dependencies,
              ...pkg.devDependencies,
            };

            expect(deps['@example/core']).toEqual('2.0.0');
          }
        });
      });
    });
  });
});
