import { resolve } from 'path';

import setup from '../../src/internal/setup';
import { findLocations } from '../../src/internal/manager';
import { createRegistry } from '../../src/internal/registry';
import { setVersionOf, bumpVersionOf } from '../../src/api/set-version';
import { fs } from '../../src/internal/fs';

describe('Set version', () => {
  afterEach(() => {
    setup.fs = fs;
  });

  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setup.cwd = resolve(__dirname, `../../example/${manager}`);

      const locations = await findLocations();
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

describe('Set version of local', () => {
  afterEach(() => {
    setup.fs = fs;
  });

  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setup.cwd = resolve(__dirname, `../../example/${manager}`);

      const locations = await findLocations();
      const registry = await createRegistry(locations);
      const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

      setup.fs = {
        writeFile,
        readFile: fs.readFile,
      };

      // make changes
      await setVersionOf({
        name: '@example/core',
        version: '2.0.0',
        registry,
      });

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

describe('Bump version', () => {
  afterEach(() => {
    setup.fs = fs;
  });

  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setup.cwd = resolve(__dirname, `../../example/${manager}`);

      const locations = await findLocations();
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

describe('Bump version of local', () => {
  afterEach(() => {
    setup.fs = fs;
  });

  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setup.cwd = resolve(__dirname, `../../example/${manager}`);

      const locations = await findLocations();
      const registry = await createRegistry(locations);
      const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

      setup.fs = {
        writeFile,
        readFile: fs.readFile,
      };

      // make changes
      await bumpVersionOf({
        name: '@example/core',
        type: 'major',
        registry,
      });

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
