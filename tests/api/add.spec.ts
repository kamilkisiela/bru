import { resolve } from 'path';
const detectIndent = require('detect-indent');

import { setCWD } from '../../src/consts';
import { addDependency } from '../../src/api/add';
import { readPackage, writePackage } from '../../src/internal/file';
import { scan } from '../../src/internal/scanner';
import { createRegistry } from '../../src/internal/registry';

describe('Set version', () => {
  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      const cwd = resolve(__dirname, `../../example/${manager}`);
      setCWD(cwd);

      const locations = await scan();
      const registry = await createRegistry(locations);

      // make changes
      await addDependency({
        name: 'prettier',
        version: '1.15.0',
        parent: `${manager}-example`,
        type: 'dev',
        registry,
      });

      const pkg = await readPackage(cwd);
      const { indent } = detectIndent(pkg.raw);

      expect(pkg.data.devDependencies!.prettier).toEqual('1.15.0');

      delete pkg.data.devDependencies;

      // revert changes
      await writePackage({
        location: cwd,
        indent,
        data: pkg.data,
      });
    });
  });
});
