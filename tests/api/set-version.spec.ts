import { resolve } from 'path';

import { setCWD } from '../../src/consts';
import { scan } from '../../src/scanner';
import { setVersionOf, bumpVersionOf } from '../../src/api/set-version';
import { checkIntegrity, hasIntegrity } from '../../src/api/integrity';
import { readPackage } from '../../src/file';

describe('Set version', () => {
  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setCWD(resolve(__dirname, `../../example/${manager}`));
      const locations = await scan();

      // make changes
      await setVersionOf('graphql', '14.0.3');

      expect(hasIntegrity(await checkIntegrity('graphql'))).toEqual(true);
      const pkgs = await Promise.all(locations.map(readPackage));
      expect(
        pkgs.every(pkg => pkg.data.dependencies!.graphql === '14.0.3'),
      ).toEqual(true);

      // revert changes
      await setVersionOf('graphql', '14.0.2');
    });
  });
});

describe('Bump version', () => {
  ['lerna', 'yarn'].forEach(manager => {
    test(manager, async () => {
      setCWD(resolve(__dirname, `../../example/${manager}`));
      const locations = await scan();

      // bump
      await bumpVersionOf('graphql', 'minor');

      expect(hasIntegrity(await checkIntegrity('graphql'))).toEqual(true);

      const pkgs = await Promise.all(locations.map(readPackage));
      expect(
        pkgs.every(pkg => pkg.data.dependencies!.graphql === '14.1.0'),
      ).toEqual(true);

      // revert changes
      await setVersionOf('graphql', '14.0.2');
    });
  });
});
