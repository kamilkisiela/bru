import { resolve } from 'path';

import { setCWD } from '../../src/consts';
import { scan } from '../../src/scanner';
import { createRegistry } from '../../src/registry';
import { setVersionOf, bumpVersionOf } from '../../src/api/set-version';
import { checkIntegrity, hasIntegrity } from '../../src/api/integrity';
import { readPackage } from '../../src/file';

describe('Set version', () => {
  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setCWD(resolve(__dirname, `../../example/${manager}`));
      const locations = await scan();
      const registry = await createRegistry(locations);

      // make changes
      await setVersionOf({
        name: 'graphql',
        version: '14.0.3',
        registry,
      });

      const freshRegistry = await createRegistry(locations);

      expect(
        hasIntegrity(
          await checkIntegrity({
            name: 'graphql',
            registry: freshRegistry,
          }),
        ),
      ).toEqual(true);
      const pkgs = await Promise.all(locations.map(readPackage));
      expect(
        pkgs.every(pkg => pkg.data.dependencies!.graphql === '14.0.3'),
      ).toEqual(true);

      // revert changes
      await setVersionOf({
        name: 'graphql',
        version: '14.0.2',
        registry: freshRegistry,
      });
    });
  });
});

describe('Bump version', () => {
  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setCWD(resolve(__dirname, `../../example/${manager}`));
      const locations = await scan();
      const registry = await createRegistry(locations);

      // bump
      await bumpVersionOf({
        name: 'graphql',
        type: 'minor',
        registry,
      });

      const freshRegistry = await createRegistry(locations);

      expect(
        hasIntegrity(
          await checkIntegrity({
            name: 'graphql',
            registry: freshRegistry,
          }),
        ),
      ).toEqual(true);

      const pkgs = await Promise.all(locations.map(readPackage));
      expect(
        pkgs.every(pkg => pkg.data.dependencies!.graphql === '14.1.0'),
      ).toEqual(true);

      // revert changes
      await setVersionOf({
        name: 'graphql',
        version: '14.0.2',
        registry: freshRegistry,
      });
    });
  });
});
