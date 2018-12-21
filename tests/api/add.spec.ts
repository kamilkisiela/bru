import { resolve } from 'path';
const detectIndent = require('detect-indent');

import { setCWD } from '../../src/consts';
import { addDependency } from '../../src/api/add';
import { readPackage, writePackage } from '../../src/file';

describe('Set version', () => {
  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      const cwd = resolve(__dirname, `../../example/${manager}`);
      setCWD(cwd);

      // make changes
      await addDependency({
        name: 'prettier',
        version: '1.15.0',
        parent: `${manager}-example`,
        type: 'dev',
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
