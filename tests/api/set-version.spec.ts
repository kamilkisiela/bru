import { resolve } from 'path';

import setup from '../../src/internal/setup';
import { scan } from '../../src/internal/scanner';
import { createRegistry } from '../../src/internal/registry';
import { setVersionOf, bumpVersionOf } from '../../src/api/set-version';
import { fs } from '../../src/internal/file';

describe('Set version', () => {
  afterEach(() => {
    setup.fs = fs;
  });

  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setup.cwd = resolve(__dirname, `../../example/${manager}`);

      const locations = await scan();
      const registry = await createRegistry(locations);
      const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

      setup.fs = {
        writeFile,
        readFile: fs.readFile,
      };

      // make changes
      await setVersionOf({
        name: 'graphql',
        version: '14.0.3',
        registry,
      });

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
  });
});

describe('Bump version', () => {
  afterEach(() => {
    setup.fs = fs;
  });

  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setup.cwd = resolve(__dirname, `../../example/${manager}`);

      const locations = await scan();
      const registry = await createRegistry(locations);
      const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

      setup.fs = {
        writeFile,
        readFile: fs.readFile,
      };

      // bump
      await bumpVersionOf({
        name: 'graphql',
        type: 'minor',
        registry,
      });

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
  });
});
