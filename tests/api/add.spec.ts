import { resolve } from 'path';
import setup from '../../src/internal/setup';
import { addDependency } from '../../src/api/add';
import { fs } from '../../src/internal/fs';
import { findLocations } from '../../src/internal/manager';
import { createRegistry } from '../../src/internal/registry';

describe('Set version', () => {
  afterEach(() => {
    setup.fs = fs;
  });

  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      const cwd = resolve(__dirname, `../../example/${manager}`);
      setup.cwd = cwd;

      const writeFile = jest.fn().mockResolvedValue(Promise.resolve());

      setup.fs = {
        writeFile,
        readFile: fs.readFile,
      };

      const locations = await findLocations();
      const registry = await createRegistry(locations);

      // make changes
      await addDependency({
        name: 'prettier',
        version: '1.15.0',
        parent: `${manager}-example`,
        type: 'dev',
        registry,
      });

      expect(writeFile).toHaveBeenCalledTimes(1);
      expect(JSON.parse(writeFile.mock.calls[0][1])).toMatchObject({
        devDependencies: {
          prettier: '1.15.0',
        },
      });
    });
  });
});
